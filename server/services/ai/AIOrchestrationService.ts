import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../../db';
import { aiChatSessions, aiModelConfigs } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface ModelResponse {
  content: string;
  model: string;
  tokens: number;
  responseTime: number;
}

interface TenantContext {
  organizationId: string;
  userId?: number;
  sessionId: string;
  customPrompts?: string[];
}

export class AIOrchestrationService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private modelConfigs: Map<string, any> = new Map();

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Initialize OpenAI with Replit AI Integrations
    const openaiApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const openaiBaseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    
    if (openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: openaiApiKey,
        ...(openaiBaseURL && { baseURL: openaiBaseURL }),
      });
      console.log('OpenAI client initialized with Replit AI Integrations');
    }

    // Initialize Anthropic if API key exists
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      console.log('Anthropic client initialized');
    }
  }

  // Get tenant-specific model configuration
  private async getModelConfig(organizationId: string) {
    const cached = this.modelConfigs.get(organizationId);
    if (cached) return cached;

    const [config] = await db
      .select()
      .from(aiModelConfigs)
      .where(eq(aiModelConfigs.organizationId, organizationId))
      .limit(1);

    if (config) {
      this.modelConfigs.set(organizationId, config);
      return config;
    }

    // Return default configuration
    const defaultConfig = {
      primaryModel: 'claude-3-5-sonnet-20241022',
      secondaryModel: 'gpt-4o-mini',
      fallbackModel: 'gpt-3.5-turbo',
      maxTokens: 4000,
      temperature: 0.7,
      documentProcessingEnabled: true,
      chatEnabled: true,
      knowledgeBaseEnabled: true,
    };

    return defaultConfig;
  }

  // Process query with multi-model orchestration
  async processQuery(
    query: string,
    context: TenantContext,
    messages: ChatMessage[] = []
  ): Promise<ModelResponse> {
    const config = await this.getModelConfig(context.organizationId);
    const startTime = Date.now();
    
    // Try OpenAI first if available (Replit AI Integrations)
    if (this.openai) {
      try {
        // Try GPT-4o first
        return await this.processOpenAI(query, messages, config, startTime, 'gpt-4o');
      } catch (error) {
        console.error('GPT-4o failed, trying GPT-4o-mini:', error);
        try {
          // Fallback to GPT-4o-mini
          return await this.processOpenAI(query, messages, config, startTime, 'gpt-4o-mini');
        } catch (error2) {
          console.error('GPT-4o-mini also failed:', error2);
        }
      }
    }
    
    // Try Claude if OpenAI failed and we have valid API key
    if (this.anthropic) {
      try {
        return await this.processClaude(query, messages, config, startTime);
      } catch (error) {
        console.error('Claude model failed:', error);
      }
    }

    // If all models fail, return error response
    return {
      content: 'I apologize, but I\'m currently experiencing technical difficulties. Please try again in a moment.',
      model: 'error',
      tokens: 0,
      responseTime: Date.now() - startTime,
    };
  }

  // Process with Claude models
  private async processClaude(
    query: string,
    messages: ChatMessage[],
    config: any,
    startTime: number
  ): Promise<ModelResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    // Build conversation history
    const claudeMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Add current query
    claudeMessages.push({ role: 'user', content: query });

    // System prompt for merchant services context
    const systemPrompt = `You are an AI assistant for ISO Hub, a comprehensive merchant services platform. You help independent sales agents with payment processing, residual tracking, and business intelligence. ${config.customPrompts?.join(' ') || ''}

Key expertise areas:
- Merchant account underwriting and approvals
- Payment processor integrations (First Data, TSYS, Clearent, etc.)
- Commission structures and residual calculations
- Compliance (PCI DSS, AML/KYC, Regulation E)
- Sales techniques and competitive analysis
- Equipment and POS systems
- Fraud prevention and chargeback management

Provide accurate, actionable advice using industry terminology. Be professional but conversational.`;

    const response = await this.anthropic.messages.create({
      model: config.primaryModel,
      max_tokens: config.maxTokens || 4000,
      temperature: parseFloat(config.temperature) || 0.7,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const content = response.content[0]?.type === 'text' 
      ? response.content[0].text 
      : 'Unable to generate response';

    return {
      content,
      model: config.primaryModel,
      tokens: response.usage?.input_tokens + response.usage?.output_tokens || 0,
      responseTime: Date.now() - startTime,
    };
  }

  // Process with OpenAI models
  private async processOpenAI(
    query: string,
    messages: ChatMessage[],
    config: any,
    startTime: number,
    model: string
  ): Promise<ModelResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    // Build conversation with system prompt
    const openaiMessages: any[] = [
      {
        role: 'system',
        content: `You are an AI assistant for ISO Hub, a comprehensive merchant services platform. You help independent sales agents with payment processing, residual tracking, and business intelligence. ${config.customPrompts?.join(' ') || ''}

Key expertise areas:
- Merchant account underwriting and approvals
- Payment processor integrations
- Commission structures and residual calculations
- Compliance and regulations
- Sales techniques
- Equipment and POS systems
- Fraud prevention

Provide accurate, actionable advice. Be professional but conversational.`,
      },
    ];

    // Add conversation history
    messages.forEach(msg => {
      openaiMessages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Add current query
    openaiMessages.push({ role: 'user', content: query });

    const response = await this.openai.chat.completions.create({
      model,
      messages: openaiMessages,
      max_tokens: config.maxTokens || 4000,
      temperature: parseFloat(config.temperature) || 0.7,
    });

    const content = response.choices[0]?.message?.content || 'Unable to generate response';

    return {
      content,
      model,
      tokens: response.usage?.total_tokens || 0,
      responseTime: Date.now() - startTime,
    };
  }

  // Save chat session to database
  async saveChatSession(
    context: TenantContext,
    messages: ChatMessage[],
    modelUsed: string,
    totalTokens: number,
    responseTime: number
  ) {
    try {
      await db.insert(aiChatSessions).values({
        organizationId: context.organizationId,
        userId: context.userId || null,
        sessionId: context.sessionId,
        messages: messages,
        modelUsed,
        totalTokens,
        responseTime,
        metadata: {
          timestamp: new Date().toISOString(),
          customPrompts: context.customPrompts,
        },
      });
    } catch (error) {
      console.error('Error saving chat session:', error);
    }
  }

  // Process document with Claude 4 Sonnet (direct analysis, no OCR)
  async analyzeDocument(
    documentContent: string,
    documentType: string,
    organizationId: string
  ): Promise<any> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized for document analysis');
    }

    const systemPrompt = `You are an expert document analyst for merchant services. Analyze this ${documentType} document and extract all relevant information for payment processing, merchant accounts, and financial data.

Extract and structure:
1. Merchant information (name, MID, DBA, addresses)
2. Financial data (volumes, rates, fees, transactions)
3. Processing details (processor, account numbers, batch info)
4. Commission/residual information
5. Important dates and terms
6. Any compliance or risk indicators

Provide a structured JSON response with extracted data.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        temperature: 0.1, // Low temperature for accuracy
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: documentContent,
          },
        ],
      });

      const content = response.content[0]?.type === 'text' 
        ? response.content[0].text 
        : '{}';

      // Try to parse as JSON
      try {
        return JSON.parse(content);
      } catch {
        // If not valid JSON, return as structured object
        return {
          rawAnalysis: content,
          documentType,
          processedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Document analysis error:', error);
      throw error;
    }
  }

  // Check if AI services are available
  isAvailable(): { openai: boolean; anthropic: boolean } {
    return {
      openai: !!this.openai,
      anthropic: !!this.anthropic,
    };
  }

  // Get usage statistics for an organization
  async getUsageStats(organizationId: string) {
    const config = await this.getModelConfig(organizationId);
    
    return {
      monthlyLimit: config.monthlyTokenLimit || null,
      currentUsage: config.currentMonthUsage || 0,
      percentageUsed: config.monthlyTokenLimit 
        ? (config.currentMonthUsage / config.monthlyTokenLimit) * 100 
        : 0,
      modelsEnabled: {
        primary: config.primaryModel,
        secondary: config.secondaryModel,
        fallback: config.fallbackModel,
      },
      featuresEnabled: {
        chat: config.chatEnabled,
        documents: config.documentProcessingEnabled,
        knowledgeBase: config.knowledgeBaseEnabled,
      },
    };
  }
}

// Export singleton instance
export const aiOrchestrationService = new AIOrchestrationService();