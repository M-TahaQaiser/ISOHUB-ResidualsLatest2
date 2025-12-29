import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db";
import { 
  aiChats, 
  aiMessages, 
  aiFlowSessions,
  aiMessageAttachments,
  aiSearchAnalytics,
  aiKnowledgeBase,
  type AiChat,
  type AiMessage,
  type AiFlowSession,
  type AiMessageAttachment
} from "@shared/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { ToolRegistry, ToolContext as ToolCtx } from "./ai/ToolRegistry";
import { ToolDispatcher, ToolCall } from "./ai/ToolDispatcher";
import { MemoryStore } from "./ai/MemoryStore";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface StreamChunk {
  type: "content_block_delta" | "message_start" | "message_stop" | "error";
  text?: string;
  error?: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface MessageContent {
  type: "text" | "image";
  text?: string;
  image?: {
    type: "base64";
    media_type: string;
    data: string;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string | MessageContent[];
}

const ISO_AI_SYSTEM_PROMPT = `You are **ISO-AI**, the expert AI assistant for ISO Hub, a comprehensive merchant services residual tracking platform. You specialize in payment processing, merchant services, and helping ISOs (Independent Sales Organizations) manage their business effectively.

## Your Core Capabilities

### 1. Payment Processing Expertise
- Deep knowledge of payment processors (Payment Advisors, Clearent, Global Payments TSYS, Merchant Lynx, Micamp, First Data, Shift4)
- Understanding of merchant accounts, interchange fees, basis points, and residual calculations
- Expertise in PCI compliance, chargebacks, and fraud prevention

### 2. ISO Hub Platform Expert
- Guide users through the 4-step residuals workflow: Upload → Compile → Assign → Audit
- Explain commission structures and role assignments (Agent, Partner, Sales Manager, Company, Association)
- Help with file uploads, processor mappings, and data validation
- Navigate the Monthly Audit system for error correction

### 3. Business Consultant
- Provide strategic advice for growing merchant portfolios
- Analyze revenue trends and recommend optimization strategies
- Help craft proposals and marketing materials for merchant acquisition

## Communication Style
- Be friendly yet professional, like a knowledgeable colleague
- Use clear, jargon-free explanations unless speaking with payment industry professionals
- Provide actionable advice with specific steps when possible
- When uncertain, acknowledge limitations rather than guessing
- Format responses with markdown for readability when helpful

## ISO Hub Context
- This platform tracks residual payments for merchant services companies
- Users upload processor files, assign commissions, and generate reports
- Common roles: SuperAdmin, Admin, Manager, Team Leaders, Users/Reps, Partners
- The system uses NET revenue (what the ISO receives after processor fees) for commission calculations

## Important Guidelines
- Never share or request sensitive data like API keys, passwords, or personal financial information
- For technical issues, provide guidance and suggest contacting support if needed
- When analyzing uploaded images, describe what you see and provide relevant insights
- If asked about features not available, suggest alternatives or explain the platform's capabilities

You have access to the ISO Hub knowledge base and can help with any questions about merchant services, residuals, or the platform itself.`;

export class ClaudeService {
  /**
   * Create a new chat session
   */
  static async createChat(userId: number, organizationId: string = "org-86f76df1", title?: string): Promise<AiChat> {
    const [chat] = await db.insert(aiChats).values({
      userId,
      organizationId,
      title: title || "New Chat",
      isActive: true,
    }).returning();
    return chat;
  }

  /**
   * Get all chats for a user
   */
  static async getUserChats(userId: number, organizationId: string = "org-86f76df1"): Promise<AiChat[]> {
    return await db.select()
      .from(aiChats)
      .where(and(
        eq(aiChats.userId, userId),
        eq(aiChats.organizationId, organizationId),
        eq(aiChats.isActive, true)
      ))
      .orderBy(desc(aiChats.lastMessageAt));
  }

  /**
   * Get messages for a chat
   */
  static async getChatMessages(chatId: number): Promise<AiMessage[]> {
    return await db.select()
      .from(aiMessages)
      .where(eq(aiMessages.chatId, chatId))
      .orderBy(asc(aiMessages.createdAt));
  }

  /**
   * Update chat title
   */
  static async updateChatTitle(chatId: number, title: string): Promise<AiChat | null> {
    const [chat] = await db.update(aiChats)
      .set({ title, updatedAt: new Date() })
      .where(eq(aiChats.id, chatId))
      .returning();
    return chat || null;
  }

  /**
   * Delete a chat (soft delete)
   */
  static async deleteChat(chatId: number, userId: number, reason?: string): Promise<boolean> {
    const [chat] = await db.update(aiChats)
      .set({ 
        isActive: false, 
        deletedAt: new Date(),
        deletedBy: userId,
        deletedReason: reason || "User deleted"
      })
      .where(eq(aiChats.id, chatId))
      .returning();
    return !!chat;
  }

  /**
   * Search knowledge base for relevant context
   */
  static async searchKnowledgeBase(query: string, organizationId: string = "org-86f76df1"): Promise<string> {
    const results = await db.select()
      .from(aiKnowledgeBase)
      .where(and(
        eq(aiKnowledgeBase.organizationId, organizationId),
        eq(aiKnowledgeBase.isActive, true)
      ))
      .limit(5);

    if (results.length === 0) return "";

    // Simple keyword matching for now - could be enhanced with embeddings
    const queryLower = query.toLowerCase();
    const relevantResults = results.filter(item => {
      const questionLower = item.question.toLowerCase();
      const answerLower = item.answer.toLowerCase();
      const keywords = item.keywords || [];
      
      return queryLower.split(" ").some(word => 
        questionLower.includes(word) || 
        answerLower.includes(word) ||
        keywords.some(k => k.toLowerCase().includes(word))
      );
    });

    if (relevantResults.length === 0) return "";

    return "\n\n## Relevant Knowledge Base Information:\n" + 
      relevantResults.map(r => `**Q:** ${r.question}\n**A:** ${r.answer}`).join("\n\n");
  }

  /**
   * Build conversation history for Claude
   */
  private static async buildConversationHistory(chatId: number): Promise<ChatMessage[]> {
    const messages = await this.getChatMessages(chatId);
    
    return messages.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }));
  }

  /**
   * Send a message and stream the response
   */
  static async *streamMessage(
    chatId: number,
    userMessage: string,
    images?: { type: string; data: string }[],
    organizationId: string = "org-86f76df1"
  ): AsyncGenerator<StreamChunk> {
    try {
      // Save user message
      const userMsgContent: MessageContent[] = [{ type: "text", text: userMessage }];
      
      // Add images if provided
      if (images && images.length > 0) {
        for (const img of images) {
          userMsgContent.push({
            type: "image",
            image: {
              type: "base64",
              media_type: img.type,
              data: img.data
            }
          });
        }
      }

      const [userMsgRecord] = await db.insert(aiMessages).values({
        chatId,
        role: "user",
        content: userMessage,
        sourceType: "user_input"
      }).returning();

      // Save image attachments if present
      if (images && images.length > 0) {
        for (const img of images) {
          await db.insert(aiMessageAttachments).values({
            messageId: userMsgRecord.id,
            fileType: img.type,
            filePath: "base64_inline",
            fileSizeBytes: img.data.length,
            base64Data: img.data
          });
        }
      }

      // Build conversation history
      const history = await this.buildConversationHistory(chatId);
      
      // Get relevant knowledge base context
      const kbContext = await this.searchKnowledgeBase(userMessage, organizationId);

      // Prepare messages for Claude
      const systemPromptWithContext = ISO_AI_SYSTEM_PROMPT + kbContext;
      
      // Build message content for the current request
      const currentMessageContent: Anthropic.MessageCreateParams["messages"][0]["content"] = [];
      
      if (userMessage) {
        currentMessageContent.push({ type: "text", text: userMessage });
      }
      
      if (images && images.length > 0) {
        for (const img of images) {
          currentMessageContent.push({
            type: "image",
            source: {
              type: "base64",
              media_type: img.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: img.data
            }
          });
        }
      }

      // Build complete message array (history minus the latest user message we just added)
      const messagesForApi: Anthropic.MessageCreateParams["messages"] = [];
      
      // Add history up to but not including the current message
      const historyWithoutCurrent = history.slice(0, -1);
      for (const msg of historyWithoutCurrent) {
        messagesForApi.push({
          role: msg.role,
          content: msg.content as string
        });
      }

      // Add current user message with potential images
      messagesForApi.push({
        role: "user",
        content: currentMessageContent.length === 1 && currentMessageContent[0].type === "text"
          ? currentMessageContent[0].text
          : currentMessageContent
      });

      // Stream response from Claude
      let fullResponse = "";
      let inputTokens = 0;
      let outputTokens = 0;

      const stream = await anthropic.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPromptWithContext,
        messages: messagesForApi
      });

      for await (const event of stream) {
        if (event.type === "message_start" && event.message?.usage) {
          inputTokens = event.message.usage.input_tokens;
        } else if (event.type === "content_block_delta") {
          const delta = event.delta as { type: string; text?: string };
          if (delta.type === "text_delta" && delta.text) {
            fullResponse += delta.text;
            yield {
              type: "content_block_delta",
              text: delta.text
            };
          }
        } else if (event.type === "message_delta") {
          const usage = (event as any).usage;
          if (usage?.output_tokens) {
            outputTokens = usage.output_tokens;
          }
        }
      }

      // Save assistant response
      const estimatedCost = ((inputTokens * 0.003) + (outputTokens * 0.015)) / 1000;
      
      await db.insert(aiMessages).values({
        chatId,
        role: "assistant",
        content: fullResponse,
        sourceType: kbContext ? "knowledge_base" : "ai_generated",
        inputTokens,
        outputTokens,
        estimatedCost: estimatedCost.toFixed(6)
      });

      // Update chat's last message timestamp and generate title if first message
      const chatMessages = await this.getChatMessages(chatId);
      if (chatMessages.length <= 2) {
        // Auto-generate title from first user message
        const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
        await this.updateChatTitle(chatId, title);
      }
      
      await db.update(aiChats)
        .set({ lastMessageAt: new Date(), updatedAt: new Date() })
        .where(eq(aiChats.id, chatId));

      // Track analytics
      await db.insert(aiSearchAnalytics).values({
        userId: null,
        organizationId,
        question: userMessage,
        sourceUsed: kbContext ? "knowledge_base" : "ai_generated",
        responseTimeMs: 0,
        resultCount: 1
      });

      yield {
        type: "message_stop",
        inputTokens,
        outputTokens
      };
    } catch (error) {
      console.error("Claude streaming error:", error);
      yield {
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  /**
   * Send a message without streaming (for simple use cases)
   */
  static async sendMessage(
    chatId: number,
    userMessage: string,
    images?: { type: string; data: string }[],
    organizationId: string = "org-86f76df1"
  ): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
    let fullContent = "";
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of this.streamMessage(chatId, userMessage, images, organizationId)) {
      if (chunk.type === "content_block_delta" && chunk.text) {
        fullContent += chunk.text;
      } else if (chunk.type === "message_stop") {
        inputTokens = chunk.inputTokens || 0;
        outputTokens = chunk.outputTokens || 0;
      } else if (chunk.type === "error") {
        throw new Error(chunk.error);
      }
    }

    return { content: fullContent, inputTokens, outputTokens };
  }

  /**
   * Generate a chat title based on the conversation
   */
  static async generateChatTitle(chatId: number): Promise<string> {
    const messages = await this.getChatMessages(chatId);
    if (messages.length === 0) return "New Chat";

    const firstUserMessage = messages.find(m => m.role === "user");
    if (!firstUserMessage) return "New Chat";

    // Use Claude to generate a concise title
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 50,
        messages: [{
          role: "user",
          content: `Generate a very short (3-6 words) descriptive title for a conversation that starts with this message. Only respond with the title, nothing else:\n\n"${firstUserMessage.content.slice(0, 200)}"`
        }]
      });

      const title = (response.content[0] as any).text?.trim() || firstUserMessage.content.slice(0, 50);
      await this.updateChatTitle(chatId, title);
      return title;
    } catch (error) {
      console.error("Error generating title:", error);
      return firstUserMessage.content.slice(0, 50) + "...";
    }
  }

  /**
   * Analyze an image using Claude's vision capabilities
   */
  static async analyzeImage(
    imageBase64: string,
    imageType: string,
    prompt: string = "What do you see in this image? Please provide a detailed description."
  ): Promise<string> {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64
              }
            },
            {
              type: "text",
              text: prompt
            }
          ]
        }]
      });

      return (response.content[0] as any).text || "Unable to analyze image";
    } catch (error) {
      console.error("Image analysis error:", error);
      throw error;
    }
  }

  /**
   * Get or create a flow session for a chat
   */
  static async getFlowSession(chatId: number, flowId: string): Promise<AiFlowSession | null> {
    const [session] = await db.select()
      .from(aiFlowSessions)
      .where(and(
        eq(aiFlowSessions.chatId, chatId),
        eq(aiFlowSessions.flowId, flowId)
      ));
    return session || null;
  }

  /**
   * Create or update a flow session
   */
  static async upsertFlowSession(
    chatId: number,
    flowId: string,
    updates: Partial<{
      activeStepIndex: number;
      answeredKeys: Record<string, string>;
      status: string;
      followUpDepth: number;
      conversationHistory: any[];
    }>
  ): Promise<AiFlowSession> {
    const existing = await this.getFlowSession(chatId, flowId);
    
    if (existing) {
      const [updated] = await db.update(aiFlowSessions)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(aiFlowSessions.id, existing.id))
        .returning();
      return updated;
    }

    const [session] = await db.insert(aiFlowSessions).values({
      chatId,
      flowId,
      activeStepIndex: updates.activeStepIndex || 0,
      answeredKeys: updates.answeredKeys || {},
      status: updates.status || "question",
      followUpDepth: updates.followUpDepth || 0,
      conversationHistory: updates.conversationHistory || []
    }).returning();
    
    return session;
  }

  /**
   * Enhanced streaming with tool support and confidence scoring
   */
  static async *streamMessageWithTools(
    chatId: number,
    userMessage: string,
    toolContext: ToolCtx,
    images?: { type: string; data: string }[],
    organizationId: string = "org-86f76df1"
  ): AsyncGenerator<StreamChunk & { toolCalls?: any[]; confidence?: number }> {
    try {
      const [userMsgRecord] = await db.insert(aiMessages).values({
        chatId,
        role: "user",
        content: userMessage,
        sourceType: "user_input"
      }).returning();

      if (images && images.length > 0) {
        for (const img of images) {
          await db.insert(aiMessageAttachments).values({
            messageId: userMsgRecord.id,
            fileType: img.type,
            filePath: "base64_inline",
            fileSizeBytes: img.data.length,
            base64Data: img.data
          });
        }
      }

      const history = await this.buildConversationHistory(chatId);
      const kbContext = await this.searchKnowledgeBase(userMessage, organizationId);
      const memoryContext = await MemoryStore.getContextForPrompt(organizationId, toolContext.userId);

      const systemPrompt = `${ISO_AI_SYSTEM_PROMPT}${kbContext}${memoryContext}

## Available Tools
You have access to tools that can help you answer questions with real data from ISO Hub:
- lookup_merchant: Search for merchant information
- get_merchant_revenue: Get revenue data for a specific merchant
- get_agent_assignments: Get merchant assignments for an agent
- get_portfolio_summary: Get portfolio overview
- search_knowledge_base: Search ISO Hub documentation
- calculate_commission: Calculate commission amounts
- get_current_user_info: Get current user details
- get_processor_list: Get available processors

When appropriate, use tools to provide accurate, data-driven answers.`;

      const currentMessageContent: any[] = [];
      if (userMessage) {
        currentMessageContent.push({ type: "text", text: userMessage });
      }
      
      if (images && images.length > 0) {
        for (const img of images) {
          currentMessageContent.push({
            type: "image",
            source: {
              type: "base64",
              media_type: img.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: img.data
            }
          });
        }
      }

      const messagesForApi: Anthropic.MessageCreateParams["messages"] = [];
      const historyWithoutCurrent = history.slice(0, -1);
      for (const msg of historyWithoutCurrent) {
        messagesForApi.push({
          role: msg.role,
          content: msg.content as string
        });
      }

      messagesForApi.push({
        role: "user",
        content: currentMessageContent.length === 1 && currentMessageContent[0].type === "text"
          ? currentMessageContent[0].text
          : currentMessageContent
      });

      const tools = ToolRegistry.getToolsForAnthropic();

      let fullResponse = "";
      let inputTokens = 0;
      let outputTokens = 0;
      const toolCallsExecuted: any[] = [];
      let overallConfidence = 0.8;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: messagesForApi,
        tools: tools.length > 0 ? tools : undefined
      });

      inputTokens = response.usage?.input_tokens || 0;
      outputTokens = response.usage?.output_tokens || 0;

      for (const block of response.content) {
        if (block.type === "text") {
          fullResponse += block.text;
          yield {
            type: "content_block_delta",
            text: block.text
          };
        } else if (block.type === "tool_use") {
          const toolCall: ToolCall = {
            id: block.id,
            name: block.name,
            input: block.input as Record<string, any>
          };

          yield {
            type: "content_block_delta",
            text: `\n*Looking up ${block.name.replace(/_/g, " ")}...*\n`
          };

          const result = await ToolDispatcher.executeToolCall(toolCall, toolContext);
          toolCallsExecuted.push({
            name: block.name,
            input: block.input,
            result: result.result
          });

          if (result.result.confidence) {
            overallConfidence = Math.min(overallConfidence, result.result.confidence);
          }

          const toolResultMessages: Anthropic.MessageCreateParams["messages"] = [
            ...messagesForApi,
            {
              role: "assistant",
              content: response.content
            },
            {
              role: "user",
              content: [{
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify(result.result.data || result.result.error)
              }]
            }
          ];

          const followUpResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: systemPrompt,
            messages: toolResultMessages
          });

          outputTokens += followUpResponse.usage?.output_tokens || 0;

          for (const followUpBlock of followUpResponse.content) {
            if (followUpBlock.type === "text") {
              fullResponse += followUpBlock.text;
              yield {
                type: "content_block_delta",
                text: followUpBlock.text
              };
            }
          }
        }
      }

      const estimatedCost = ((inputTokens * 0.003) + (outputTokens * 0.015)) / 1000;
      
      await db.insert(aiMessages).values({
        chatId,
        role: "assistant",
        content: fullResponse,
        sourceType: toolCallsExecuted.length > 0 ? "tool_generated" : (kbContext ? "knowledge_base" : "ai_generated"),
        inputTokens,
        outputTokens,
        estimatedCost: estimatedCost.toFixed(6)
      });

      await MemoryStore.extractAndStoreFacts(organizationId, userMessage, toolContext.userId);

      const chatMessages = await this.getChatMessages(chatId);
      if (chatMessages.length <= 2) {
        const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
        await this.updateChatTitle(chatId, title);
      }
      
      await db.update(aiChats)
        .set({ lastMessageAt: new Date(), updatedAt: new Date() })
        .where(eq(aiChats.id, chatId));

      yield {
        type: "message_stop",
        inputTokens,
        outputTokens,
        toolCalls: toolCallsExecuted,
        confidence: overallConfidence
      };
    } catch (error) {
      console.error("Claude streaming with tools error:", error);
      yield {
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}
