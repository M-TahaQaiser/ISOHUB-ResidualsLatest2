/**
 * Advanced AI Agent Architecture
 * Implements intelligent agent with tool calling, memory management,
 * and chain-of-thought reasoning for ISO Hub
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { db } from '../../db';
import { aiChatSessions, aiKnowledgeBase, merchants, monthlyData } from '../../../shared/schema';
import { eq, and, like, desc, sql } from 'drizzle-orm';

// Types for AI Agent
interface AgentTool {
  name: string;
  description: string;
  inputSchema: object;
  handler: (input: any, context: AgentContext) => Promise<any>;
}

interface AgentContext {
  organizationId: string;
  userId?: number;
  sessionId: string;
  conversationHistory: Message[];
}

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolName?: string;
  toolCallId?: string;
}

interface AgentResponse {
  content: string;
  toolsUsed: string[];
  reasoning: string[];
  confidence: number;
  model: string;
  tokens: number;
  processingTime: number;
}

interface ThinkingStep {
  step: number;
  thought: string;
  action?: string;
  observation?: string;
}

/**
 * Advanced AI Agent for ISO Hub
 * Implements ReAct (Reasoning + Acting) pattern with tool use
 */
export class AdvancedAIAgent {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;
  private tools: Map<string, AgentTool> = new Map();
  private maxIterations = 5;

  constructor() {
    this.initializeClients();
    this.registerTools();
  }

  private initializeClients() {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }

    if (openaiKey) {
      this.openai = new OpenAI({
        apiKey: openaiKey,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
    }
  }

  /**
   * Register all available tools for the agent
   */
  private registerTools() {
    // Merchant Search Tool
    this.tools.set('search_merchants', {
      name: 'search_merchants',
      description: 'Search for merchants by name, MID, or status. Use this to find merchant information.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (name or MID)' },
          status: { type: 'string', enum: ['active', 'inactive', 'pending', 'suspended'], description: 'Filter by status' },
          limit: { type: 'number', description: 'Maximum results to return (default 10)' },
        },
        required: ['query'],
      },
      handler: this.searchMerchants.bind(this),
    });

    // Knowledge Base Search Tool
    this.tools.set('search_knowledge', {
      name: 'search_knowledge',
      description: 'Search the knowledge base for answers to questions about payment processing, compliance, and ISO operations.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The question to search for' },
          category: { type: 'string', description: 'Category to filter (commission, compliance, pricing, etc.)' },
        },
        required: ['query'],
      },
      handler: this.searchKnowledge.bind(this),
    });

    // Commission Calculator Tool
    this.tools.set('calculate_commission', {
      name: 'calculate_commission',
      description: 'Calculate commission/residual amounts based on volume, rate, and split percentages.',
      inputSchema: {
        type: 'object',
        properties: {
          volume: { type: 'number', description: 'Processing volume in dollars' },
          basisPoints: { type: 'number', description: 'Basis points (e.g., 10 = 0.1%)' },
          splitPercentage: { type: 'number', description: 'Agent split percentage (0-100)' },
        },
        required: ['volume', 'basisPoints', 'splitPercentage'],
      },
      handler: this.calculateCommission.bind(this),
    });

    // Get Merchant Statistics Tool
    this.tools.set('get_merchant_stats', {
      name: 'get_merchant_stats',
      description: 'Get statistics and metrics for merchants in the organization.',
      inputSchema: {
        type: 'object',
        properties: {
          period: { type: 'string', description: 'Time period (e.g., "2024-01", "last_month", "ytd")' },
        },
        required: [],
      },
      handler: this.getMerchantStats.bind(this),
    });

    // Compare Processors Tool
    this.tools.set('compare_processors', {
      name: 'compare_processors',
      description: 'Compare different payment processors based on features, rates, and use cases.',
      inputSchema: {
        type: 'object',
        properties: {
          processors: { type: 'array', items: { type: 'string' }, description: 'List of processor names to compare' },
          criteria: { type: 'array', items: { type: 'string' }, description: 'Comparison criteria (e.g., rates, features, support)' },
        },
        required: ['processors'],
      },
      handler: this.compareProcessors.bind(this),
    });

    // Get Current Date/Time Tool (for time-sensitive queries)
    this.tools.set('get_current_date', {
      name: 'get_current_date',
      description: 'Get the current date and time.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      handler: async () => ({
        date: new Date().toISOString(),
        formatted: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      }),
    });
  }

  /**
   * Tool: Search Merchants
   */
  private async searchMerchants(input: { query: string; status?: string; limit?: number }, context: AgentContext) {
    try {
      const limit = input.limit || 10;
      const conditions = [];

      if (input.query) {
        conditions.push(
          sql`(${merchants.dba} ILIKE ${'%' + input.query + '%'} OR ${merchants.mid} ILIKE ${'%' + input.query + '%'})`
        );
      }

      if (input.status) {
        conditions.push(eq(merchants.status, input.status));
      }

      const results = await db
        .select({
          mid: merchants.mid,
          dba: merchants.dba,
          status: merchants.status,
        })
        .from(merchants)
        .where(and(...conditions))
        .limit(limit);

      return {
        found: results.length,
        merchants: results,
      };
    } catch (error) {
      return { error: 'Failed to search merchants', details: (error as Error).message };
    }
  }

  /**
   * Tool: Search Knowledge Base
   */
  private async searchKnowledge(input: { query: string; category?: string }, context: AgentContext) {
    try {
      const conditions = [
        eq(aiKnowledgeBase.organizationId, context.organizationId),
        eq(aiKnowledgeBase.isActive, true),
      ];

      if (input.category) {
        conditions.push(eq(aiKnowledgeBase.category, input.category));
      }

      // Simple keyword search (enhanced search is in VectorSearchService)
      const results = await db
        .select({
          category: aiKnowledgeBase.category,
          question: aiKnowledgeBase.question,
          answer: aiKnowledgeBase.answer,
        })
        .from(aiKnowledgeBase)
        .where(and(...conditions))
        .limit(5);

      // Filter by keyword relevance
      const keywords = input.query.toLowerCase().split(/\s+/);
      const relevantResults = results.filter((r) => {
        const text = `${r.question} ${r.answer}`.toLowerCase();
        return keywords.some((k) => text.includes(k));
      });

      return {
        found: relevantResults.length,
        results: relevantResults.slice(0, 3),
      };
    } catch (error) {
      return { error: 'Failed to search knowledge base', details: (error as Error).message };
    }
  }

  /**
   * Tool: Calculate Commission
   */
  private async calculateCommission(
    input: { volume: number; basisPoints: number; splitPercentage: number },
    context: AgentContext
  ) {
    const { volume, basisPoints, splitPercentage } = input;

    // Calculate gross residual
    const grossResidual = volume * (basisPoints / 10000);

    // Calculate agent's share
    const agentShare = grossResidual * (splitPercentage / 100);

    // Calculate annual projection
    const annualProjection = agentShare * 12;

    return {
      inputVolume: `$${volume.toLocaleString()}`,
      basisPoints,
      splitPercentage: `${splitPercentage}%`,
      calculations: {
        grossResidual: `$${grossResidual.toFixed(2)}`,
        agentShare: `$${agentShare.toFixed(2)}`,
        annualProjection: `$${annualProjection.toFixed(2)}`,
      },
      formula: `$${volume.toLocaleString()} × ${basisPoints} BPS × ${splitPercentage}% = $${agentShare.toFixed(2)}`,
    };
  }

  /**
   * Tool: Get Merchant Statistics
   */
  private async getMerchantStats(input: { period?: string }, context: AgentContext) {
    try {
      // Get counts by status
      const stats = await db
        .select({
          status: merchants.status,
          count: sql<number>`count(*)::int`,
        })
        .from(merchants)
        .groupBy(merchants.status);

      const statusCounts: Record<string, number> = {};
      stats.forEach((s) => {
        statusCounts[s.status || 'unknown'] = s.count;
      });

      const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

      return {
        totalMerchants: total,
        byStatus: statusCounts,
        period: input.period || 'all-time',
      };
    } catch (error) {
      return { error: 'Failed to get merchant stats', details: (error as Error).message };
    }
  }

  /**
   * Tool: Compare Processors
   */
  private async compareProcessors(
    input: { processors: string[]; criteria?: string[] },
    context: AgentContext
  ) {
    // Static processor information (would be from database in production)
    const processorInfo: Record<string, any> = {
      'TSYS': {
        name: 'TSYS (Global Payments)',
        type: 'Full-service processor',
        bestFor: 'Large merchants, enterprise accounts',
        avgSetupTime: '5-10 business days',
        features: ['Advanced reporting', '24/7 support', 'Custom integrations'],
      },
      'First Data': {
        name: 'First Data (Fiserv)',
        type: 'Full-service processor',
        bestFor: 'Mid-market merchants',
        avgSetupTime: '3-5 business days',
        features: ['Clover POS', 'E-commerce solutions', 'Mobile payments'],
      },
      'Clearent': {
        name: 'Clearent',
        type: 'ISO-focused processor',
        bestFor: 'ISO partners, small-medium merchants',
        avgSetupTime: '1-2 business days',
        features: ['Fast approvals', 'Competitive splits', 'Agent portal'],
      },
      'Shift4': {
        name: 'Shift4',
        type: 'Technology-focused processor',
        bestFor: 'Hospitality, restaurants',
        avgSetupTime: '2-3 business days',
        features: ['POS integration', 'QR pay', 'Tab management'],
      },
    };

    const comparison = input.processors.map((p) => {
      const info = processorInfo[p] || processorInfo[p.toUpperCase()] || {
        name: p,
        note: 'Limited information available',
      };
      return { processor: p, ...info };
    });

    return {
      processors: input.processors,
      comparison,
      recommendation: comparison.length > 0
        ? `Based on common use cases, ${comparison[0].processor} is typically best for ${comparison[0].bestFor || 'general processing'}.`
        : 'Unable to compare - processor information not found.',
    };
  }

  /**
   * Execute the agent with ReAct pattern
   */
  async execute(
    query: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const thinkingSteps: ThinkingStep[] = [];
    const toolsUsed: string[] = [];
    let totalTokens = 0;

    // Build system prompt with tool descriptions
    const toolDescriptions = Array.from(this.tools.values())
      .map((t) => `- ${t.name}: ${t.description}`)
      .join('\n');

    const systemPrompt = `You are ISO-AI, an expert AI assistant for ISO Hub, a comprehensive merchant services residual tracking platform.

You have access to the following tools:
${toolDescriptions}

When answering questions:
1. Think step-by-step about what information you need
2. Use tools to gather relevant data when appropriate
3. Synthesize the information into a helpful response
4. Be specific and actionable in your advice

Your expertise includes:
- Payment processing and merchant services
- Residual/commission calculations and splits
- Processor relationships and comparisons
- PCI compliance and regulations
- Underwriting and risk assessment
- ISO operations and best practices

Always be professional, accurate, and helpful.`;

    try {
      // Use Anthropic Claude with tool use
      if (this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          tools: Array.from(this.tools.values()).map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.inputSchema as any,
          })),
          messages: [
            ...context.conversationHistory.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            { role: 'user', content: query },
          ],
        });

        // Handle tool use
        let finalResponse = '';
        for (const block of response.content) {
          if (block.type === 'text') {
            finalResponse += block.text;
          } else if (block.type === 'tool_use') {
            const tool = this.tools.get(block.name);
            if (tool) {
              toolsUsed.push(block.name);
              thinkingSteps.push({
                step: thinkingSteps.length + 1,
                thought: `Using tool: ${block.name}`,
                action: JSON.stringify(block.input),
              });

              const toolResult = await tool.handler(block.input, context);
              thinkingSteps[thinkingSteps.length - 1].observation = JSON.stringify(toolResult);

              // Continue conversation with tool result
              const followUp = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2048,
                system: systemPrompt,
                messages: [
                  { role: 'user', content: query },
                  { role: 'assistant', content: response.content as any },
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'tool_result',
                        tool_use_id: block.id,
                        content: JSON.stringify(toolResult),
                      },
                    ],
                  },
                ],
              });

              totalTokens += followUp.usage?.input_tokens || 0;
              totalTokens += followUp.usage?.output_tokens || 0;

              for (const fb of followUp.content) {
                if (fb.type === 'text') {
                  finalResponse = fb.text;
                }
              }
            }
          }
        }

        totalTokens += response.usage?.input_tokens || 0;
        totalTokens += response.usage?.output_tokens || 0;

        return {
          content: finalResponse || 'I apologize, but I was unable to generate a response.',
          toolsUsed,
          reasoning: thinkingSteps.map((s) => s.thought),
          confidence: toolsUsed.length > 0 ? 0.9 : 0.7,
          model: 'claude-sonnet-4',
          tokens: totalTokens,
          processingTime: Date.now() - startTime,
        };
      }

      // Fallback to OpenAI
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            ...context.conversationHistory.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            { role: 'user', content: query },
          ],
          max_tokens: 2048,
        });

        return {
          content: response.choices[0]?.message?.content || 'Unable to generate response.',
          toolsUsed: [],
          reasoning: ['Direct response without tool use'],
          confidence: 0.7,
          model: 'gpt-4o',
          tokens: response.usage?.total_tokens || 0,
          processingTime: Date.now() - startTime,
        };
      }

      throw new Error('No AI provider available');
    } catch (error) {
      console.error('Agent execution error:', error);
      return {
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        toolsUsed,
        reasoning: thinkingSteps.map((s) => s.thought),
        confidence: 0,
        model: 'error',
        tokens: totalTokens,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check if the agent is available
   */
  isAvailable(): boolean {
    return !!(this.anthropic || this.openai);
  }

  /**
   * Get list of available tools
   */
  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }
}

// Export singleton instance
export const advancedAIAgent = new AdvancedAIAgent();
