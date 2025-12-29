import { db } from "../../db";
import { sql } from "drizzle-orm";

export interface MemoryEntry {
  id: string;
  organizationId: string;
  userId?: number;
  category: "fact" | "preference" | "context" | "insight";
  key: string;
  value: string;
  metadata?: Record<string, any>;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

const memoryCache: Map<string, MemoryEntry[]> = new Map();

export class MemoryStore {
  private static getOrgKey(organizationId: string): string {
    return `org:${organizationId}`;
  }

  private static getUserKey(organizationId: string, userId: number): string {
    return `user:${organizationId}:${userId}`;
  }

  static async storeMemory(
    organizationId: string,
    category: MemoryEntry["category"],
    key: string,
    value: string,
    options?: {
      userId?: number;
      metadata?: Record<string, any>;
      confidence?: number;
      expiresInHours?: number;
    }
  ): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      userId: options?.userId,
      category,
      key,
      value,
      metadata: options?.metadata,
      confidence: options?.confidence ?? 0.8,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: options?.expiresInHours 
        ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000)
        : undefined
    };

    const cacheKey = options?.userId 
      ? this.getUserKey(organizationId, options.userId)
      : this.getOrgKey(organizationId);

    const existing = memoryCache.get(cacheKey) || [];
    
    const existingIndex = existing.findIndex(m => m.key === key && m.category === category);
    if (existingIndex >= 0) {
      existing[existingIndex] = { ...entry, createdAt: existing[existingIndex].createdAt };
    } else {
      existing.push(entry);
    }

    if (existing.length > 100) {
      existing.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      existing.length = 100;
    }

    memoryCache.set(cacheKey, existing);

    console.log(`[MemoryStore] Stored ${category}:${key} for ${cacheKey}`);
    return entry;
  }

  static async getMemories(
    organizationId: string,
    options?: {
      userId?: number;
      category?: MemoryEntry["category"];
      key?: string;
      limit?: number;
    }
  ): Promise<MemoryEntry[]> {
    const now = new Date();
    const cacheKeys: string[] = [this.getOrgKey(organizationId)];
    
    if (options?.userId) {
      cacheKeys.push(this.getUserKey(organizationId, options.userId));
    }

    let allMemories: MemoryEntry[] = [];
    
    for (const cacheKey of cacheKeys) {
      const memories = memoryCache.get(cacheKey) || [];
      allMemories.push(...memories);
    }

    allMemories = allMemories.filter(m => !m.expiresAt || m.expiresAt > now);

    if (options?.category) {
      allMemories = allMemories.filter(m => m.category === options.category);
    }

    if (options?.key) {
      allMemories = allMemories.filter(m => m.key.includes(options.key));
    }

    allMemories.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return allMemories.slice(0, options?.limit || 50);
  }

  static async getContextForPrompt(
    organizationId: string,
    userId?: number
  ): Promise<string> {
    const memories = await this.getMemories(organizationId, { userId, limit: 20 });
    
    if (memories.length === 0) {
      return "";
    }

    const grouped: Record<string, MemoryEntry[]> = {};
    for (const memory of memories) {
      if (!grouped[memory.category]) {
        grouped[memory.category] = [];
      }
      grouped[memory.category].push(memory);
    }

    let context = "\n\n## Remembered Context:\n";

    if (grouped.fact) {
      context += "\n### Known Facts:\n";
      for (const fact of grouped.fact.slice(0, 5)) {
        context += `- ${fact.key}: ${fact.value}\n`;
      }
    }

    if (grouped.preference) {
      context += "\n### User Preferences:\n";
      for (const pref of grouped.preference.slice(0, 5)) {
        context += `- ${pref.key}: ${pref.value}\n`;
      }
    }

    if (grouped.insight) {
      context += "\n### Recent Insights:\n";
      for (const insight of grouped.insight.slice(0, 3)) {
        context += `- ${insight.value}\n`;
      }
    }

    return context;
  }

  static async extractAndStoreFacts(
    organizationId: string,
    conversationContent: string,
    userId?: number
  ): Promise<void> {
    const patterns = [
      { regex: /my name is (\w+)/i, category: "fact" as const, key: "user_name" },
      { regex: /I(?:'m| am) (?:an? )?(\w+(?:\s+\w+)?)/i, category: "fact" as const, key: "user_role" },
      { regex: /our company (?:is called |is |)(\w+(?:\s+\w+)*)/i, category: "fact" as const, key: "company_name" },
      { regex: /we use (\w+) (?:as our |for )processor/i, category: "fact" as const, key: "primary_processor" },
      { regex: /I prefer (\w+(?:\s+\w+)*)/i, category: "preference" as const, key: "general_preference" },
    ];

    for (const pattern of patterns) {
      const match = conversationContent.match(pattern.regex);
      if (match && match[1]) {
        await this.storeMemory(
          organizationId,
          pattern.category,
          pattern.key,
          match[1],
          { userId, confidence: 0.7 }
        );
      }
    }
  }

  static async deleteMemory(organizationId: string, memoryId: string): Promise<boolean> {
    const cacheKey = this.getOrgKey(organizationId);
    const memories = memoryCache.get(cacheKey) || [];
    const index = memories.findIndex(m => m.id === memoryId);
    
    if (index >= 0) {
      memories.splice(index, 1);
      memoryCache.set(cacheKey, memories);
      return true;
    }
    
    return false;
  }

  static async clearOrganizationMemory(organizationId: string): Promise<void> {
    memoryCache.delete(this.getOrgKey(organizationId));
    console.log(`[MemoryStore] Cleared memory for ${organizationId}`);
  }
}
