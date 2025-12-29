/**
 * Conversation Memory Management Service
 * Handles context window management, conversation summarization,
 * and long-term memory for AI conversations
 */

import { db } from '../../db';
import { aiChatSessions } from '../../../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  importance?: number;
}

interface ConversationSummary {
  summary: string;
  keyTopics: string[];
  lastUpdated: Date;
  messageCount: number;
}

interface MemoryConfig {
  maxMessages: number;          // Max messages to keep in context
  maxTokens: number;            // Max tokens for context window
  summaryThreshold: number;     // Summarize after this many messages
  importanceDecay: number;      // Decay factor for older messages
}

/**
 * Manages conversation memory and context optimization
 */
export class ConversationMemoryService {
  private config: MemoryConfig = {
    maxMessages: 50,
    maxTokens: 8000,
    summaryThreshold: 20,
    importanceDecay: 0.95,
  };

  // Simple token estimator (avg 4 chars per token)
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get optimized context for a conversation
   * Balances recent messages with summarized history
   */
  async getOptimizedContext(
    sessionId: string,
    organizationId: string,
    maxTokens?: number
  ): Promise<Message[]> {
    const tokenLimit = maxTokens || this.config.maxTokens;

    // Get recent messages
    const recentMessages = await this.getRecentMessages(sessionId, organizationId, 10);
    const recentTokens = this.estimateTokens(
      recentMessages.map((m) => m.content).join('')
    );

    // If recent messages fit within limit, check if we need summary
    if (recentTokens < tokenLimit * 0.5) {
      // Get older messages
      const olderMessages = await this.getOlderMessages(sessionId, organizationId, 10, 30);

      if (olderMessages.length > this.config.summaryThreshold) {
        // Generate and prepend summary
        const summary = await this.summarizeMessages(olderMessages);
        return [
          {
            role: 'system',
            content: `Previous conversation summary: ${summary.summary}\nKey topics discussed: ${summary.keyTopics.join(', ')}`,
          },
          ...recentMessages,
        ];
      }

      // Otherwise include older messages directly
      return [...olderMessages, ...recentMessages];
    }

    // Trim to fit token limit
    return this.trimToTokenLimit(recentMessages, tokenLimit);
  }

  /**
   * Get recent messages from conversation
   */
  private async getRecentMessages(
    sessionId: string,
    organizationId: string,
    limit: number
  ): Promise<Message[]> {
    try {
      const sessions = await db
        .select()
        .from(aiChatSessions)
        .where(
          and(
            eq(aiChatSessions.sessionId, sessionId),
            eq(aiChatSessions.organizationId, organizationId)
          )
        )
        .orderBy(desc(aiChatSessions.createdAt))
        .limit(1);

      if (sessions.length === 0) return [];

      const messages = sessions[0].messages as Message[] || [];
      return messages.slice(-limit);
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return [];
    }
  }

  /**
   * Get older messages (beyond recent window)
   */
  private async getOlderMessages(
    sessionId: string,
    organizationId: string,
    skip: number,
    limit: number
  ): Promise<Message[]> {
    try {
      const sessions = await db
        .select()
        .from(aiChatSessions)
        .where(
          and(
            eq(aiChatSessions.sessionId, sessionId),
            eq(aiChatSessions.organizationId, organizationId)
          )
        )
        .limit(1);

      if (sessions.length === 0) return [];

      const messages = sessions[0].messages as Message[] || [];
      const startIdx = Math.max(0, messages.length - skip - limit);
      const endIdx = messages.length - skip;

      return messages.slice(startIdx, endIdx);
    } catch (error) {
      console.error('Error getting older messages:', error);
      return [];
    }
  }

  /**
   * Summarize a set of messages
   */
  async summarizeMessages(messages: Message[]): Promise<ConversationSummary> {
    if (messages.length === 0) {
      return {
        summary: '',
        keyTopics: [],
        lastUpdated: new Date(),
        messageCount: 0,
      };
    }

    // Extract key topics using simple keyword extraction
    const keyTopics = this.extractKeyTopics(messages);

    // Generate summary (simplified - in production use AI)
    const userMessages = messages.filter((m) => m.role === 'user');
    const assistantMessages = messages.filter((m) => m.role === 'assistant');

    const summary = `The user asked ${userMessages.length} questions about: ${keyTopics.slice(0, 3).join(', ')}. ` +
      `Key discussions included topics like ${keyTopics.slice(3, 6).join(', ') || 'general inquiries'}.`;

    return {
      summary,
      keyTopics,
      lastUpdated: new Date(),
      messageCount: messages.length,
    };
  }

  /**
   * Extract key topics from messages
   */
  private extractKeyTopics(messages: Message[]): string[] {
    const text = messages.map((m) => m.content).join(' ').toLowerCase();

    // Domain-specific keywords to look for
    const domainKeywords = [
      'residual', 'commission', 'merchant', 'processor', 'gateway',
      'chargeback', 'dispute', 'pci', 'compliance', 'interchange',
      'rate', 'pricing', 'terminal', 'pos', 'emv', 'nfc',
      'underwriting', 'approval', 'risk', 'boarding', 'split',
      'tsys', 'first data', 'clearent', 'shift4', 'clover',
      'volume', 'transaction', 'batch', 'settlement', 'funding',
    ];

    const found: string[] = [];
    domainKeywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        found.push(keyword);
      }
    });

    return found.slice(0, 10);
  }

  /**
   * Trim messages to fit token limit
   */
  private trimToTokenLimit(messages: Message[], maxTokens: number): Message[] {
    const result: Message[] = [];
    let tokenCount = 0;

    // Start from most recent
    for (let i = messages.length - 1; i >= 0; i--) {
      const msgTokens = this.estimateTokens(messages[i].content);
      if (tokenCount + msgTokens > maxTokens) break;

      result.unshift(messages[i]);
      tokenCount += msgTokens;
    }

    return result;
  }

  /**
   * Score message importance
   */
  private scoreImportance(message: Message, index: number, total: number): number {
    let score = 1.0;

    // Recency bonus
    score *= Math.pow(this.config.importanceDecay, total - index - 1);

    // Content-based scoring
    const content = message.content.toLowerCase();

    // Questions are important
    if (content.includes('?')) score *= 1.3;

    // Domain keywords boost importance
    const keywords = ['merchant', 'commission', 'residual', 'processor', 'compliance'];
    keywords.forEach((kw) => {
      if (content.includes(kw)) score *= 1.1;
    });

    // Longer messages might be more important
    if (message.content.length > 500) score *= 1.2;

    return score;
  }

  /**
   * Select messages by importance within token budget
   */
  async selectByImportance(
    sessionId: string,
    organizationId: string,
    maxTokens: number
  ): Promise<Message[]> {
    const sessions = await db
      .select()
      .from(aiChatSessions)
      .where(
        and(
          eq(aiChatSessions.sessionId, sessionId),
          eq(aiChatSessions.organizationId, organizationId)
        )
      )
      .limit(1);

    if (sessions.length === 0) return [];

    const messages = sessions[0].messages as Message[] || [];

    // Score each message
    const scored = messages.map((msg, idx) => ({
      message: msg,
      importance: this.scoreImportance(msg, idx, messages.length),
    }));

    // Sort by importance
    scored.sort((a, b) => b.importance - a.importance);

    // Select within token budget
    const selected: typeof scored = [];
    let tokenCount = 0;

    for (const item of scored) {
      const msgTokens = this.estimateTokens(item.message.content);
      if (tokenCount + msgTokens > maxTokens) continue;

      selected.push(item);
      tokenCount += msgTokens;
    }

    // Restore chronological order
    selected.sort((a, b) => {
      const aIdx = messages.indexOf(a.message);
      const bIdx = messages.indexOf(b.message);
      return aIdx - bIdx;
    });

    return selected.map((s) => s.message);
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(
    sessionId: string,
    organizationId: string
  ): Promise<{
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    estimatedTokens: number;
    keyTopics: string[];
  }> {
    const sessions = await db
      .select()
      .from(aiChatSessions)
      .where(
        and(
          eq(aiChatSessions.sessionId, sessionId),
          eq(aiChatSessions.organizationId, organizationId)
        )
      )
      .limit(1);

    if (sessions.length === 0) {
      return {
        totalMessages: 0,
        userMessages: 0,
        assistantMessages: 0,
        estimatedTokens: 0,
        keyTopics: [],
      };
    }

    const messages = sessions[0].messages as Message[] || [];
    const userMessages = messages.filter((m) => m.role === 'user');
    const assistantMessages = messages.filter((m) => m.role === 'assistant');
    const totalText = messages.map((m) => m.content).join('');

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      estimatedTokens: this.estimateTokens(totalText),
      keyTopics: this.extractKeyTopics(messages),
    };
  }
}

export const conversationMemoryService = new ConversationMemoryService();
