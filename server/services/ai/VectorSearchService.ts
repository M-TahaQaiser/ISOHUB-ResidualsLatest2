import OpenAI from 'openai';
import fetch from 'cross-fetch';
import { db } from '../../db';
import { aiKnowledgeBase } from '../../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

interface SearchResult {
  id: number;
  question: string;
  answer: string;
  category: string;
  score: number;
  keywords?: string[];
}

export class VectorSearchService {
  private openai: OpenAI | null = null;
  private embeddingsCache: Map<string, number[]> = new Map();

  constructor() {
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    // Use Replit AI Integrations for OpenAI access
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        ...(baseURL && { baseURL }),
        fetch,
      });
    }
  }

  // Generate embeddings for a text
  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cached = this.embeddingsCache.get(text);
    if (cached) return cached;

    // For Replit AI integrations, embeddings might not be supported
    // Always use fallback for now to avoid errors
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    if (!this.openai || baseURL) {
      // Fallback to keyword-based search if no OpenAI or using Replit proxy
      return this.generateFallbackEmbedding(text);
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
      });

      const embedding = response.data[0].embedding;
      
      // Cache the embedding
      if (this.embeddingsCache.size > 1000) {
        // Clear cache if it gets too large
        this.embeddingsCache.clear();
      }
      this.embeddingsCache.set(text, embedding);
      
      return embedding;
    } catch (error: any) {
      // Log only if it's not an expected error
      if (!error?.message?.includes('INVALID_ENDPOINT')) {
        console.error('Error generating embedding, using fallback:', error?.message || error);
      }
      return this.generateFallbackEmbedding(text);
    }
  }

  // Fallback embedding using keyword extraction
  private generateFallbackEmbedding(text: string): number[] {
    // Simple keyword-based vector (not actual embeddings)
    const keywords = text.toLowerCase().split(/\W+/);
    const vector = new Array(384).fill(0); // Mock 384-dimensional vector
    
    // Generate deterministic pseudo-embeddings based on keywords
    keywords.forEach((keyword, idx) => {
      const hash = this.hashString(keyword);
      const position = hash % vector.length;
      vector[position] = 1;
    });
    
    return vector;
  }

  // Simple string hash for fallback
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // Search knowledge base with semantic search
  async searchKnowledgeBase(
    query: string,
    organizationId: string,
    limit: number = 5,
    category?: string
  ): Promise<SearchResult[]> {
    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Fetch knowledge base entries
    const conditions = [
      eq(aiKnowledgeBase.organizationId, organizationId),
      eq(aiKnowledgeBase.isActive, true),
    ];
    
    if (category) {
      conditions.push(eq(aiKnowledgeBase.category, category));
    }
    
    const entries = await db
      .select()
      .from(aiKnowledgeBase)
      .where(and(...conditions));
    
    // Calculate similarity scores
    const scoredResults: SearchResult[] = [];
    
    for (const entry of entries) {
      let score = 0;
      
      // If we have embeddings, use vector similarity
      if (entry.embeddings && Array.isArray(entry.embeddings)) {
        score = this.cosineSimilarity(queryEmbedding, entry.embeddings as number[]);
      } else {
        // Fallback to keyword matching
        score = this.keywordSimilarity(query, entry.question + ' ' + entry.answer, entry.keywords);
      }
      
      scoredResults.push({
        id: entry.id,
        question: entry.question,
        answer: entry.answer,
        category: entry.category,
        score,
        keywords: entry.keywords || undefined,
      });
    }
    
    // Sort by score and return top results
    scoredResults.sort((a, b) => b.score - a.score);
    
    // Update usage counts for top results
    const topResults = scoredResults.slice(0, limit);
    for (const result of topResults) {
      await db
        .update(aiKnowledgeBase)
        .set({ 
          usageCount: sql`${aiKnowledgeBase.usageCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(aiKnowledgeBase.id, result.id));
    }
    
    return topResults;
  }

  // Keyword-based similarity scoring
  private keywordSimilarity(query: string, content: string, keywords?: string[] | null): number {
    const queryWords = query.toLowerCase().split(/\W+/);
    const contentWords = content.toLowerCase().split(/\W+/);
    const keywordList = keywords || [];
    
    let score = 0;
    
    // Check for exact keyword matches
    for (const keyword of keywordList) {
      if (query.toLowerCase().includes(keyword.toLowerCase())) {
        score += 2; // Higher weight for keyword matches
      }
    }
    
    // Check for word matches
    for (const queryWord of queryWords) {
      if (queryWord.length < 3) continue; // Skip short words
      
      if (contentWords.includes(queryWord)) {
        score += 1;
      }
      
      // Partial matches
      for (const contentWord of contentWords) {
        if (contentWord.includes(queryWord) || queryWord.includes(contentWord)) {
          score += 0.5;
        }
      }
    }
    
    // Normalize score
    return Math.min(score / Math.max(queryWords.length, 1), 1);
  }

  // Update embeddings for all knowledge base entries
  async updateKnowledgeBaseEmbeddings(organizationId: string) {
    const entries = await db
      .select()
      .from(aiKnowledgeBase)
      .where(eq(aiKnowledgeBase.organizationId, organizationId));
    
    let updated = 0;
    
    for (const entry of entries) {
      try {
        // Generate embedding for question + answer
        const text = `${entry.question} ${entry.answer}`;
        const embedding = await this.generateEmbedding(text);
        
        // Update database with embedding
        await db
          .update(aiKnowledgeBase)
          .set({ 
            embeddings: embedding,
            updatedAt: new Date(),
          })
          .where(eq(aiKnowledgeBase.id, entry.id));
        
        updated++;
        
        // Add delay to avoid rate limiting
        if (updated % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error updating embedding for entry ${entry.id}:`, error);
      }
    }
    
    console.log(`Updated embeddings for ${updated} entries`);
    return updated;
  }

  // Search with query expansion
  async searchWithExpansion(
    query: string,
    organizationId: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    // Expand query with related terms
    const expandedQueries = this.expandQuery(query);
    
    // Search for each expanded query
    const allResults = new Map<number, SearchResult>();
    
    for (const expandedQuery of expandedQueries) {
      const results = await this.searchKnowledgeBase(expandedQuery, organizationId, limit * 2);
      
      for (const result of results) {
        const existing = allResults.get(result.id);
        if (!existing || result.score > existing.score) {
          allResults.set(result.id, result);
        }
      }
    }
    
    // Sort and return top results
    const finalResults = Array.from(allResults.values());
    finalResults.sort((a, b) => b.score - a.score);
    
    return finalResults.slice(0, limit);
  }

  // Query expansion for better search
  private expandQuery(query: string): string[] {
    const expansions = [query];
    
    // Common merchant services synonyms
    const synonyms: { [key: string]: string[] } = {
      'residual': ['commission', 'revenue share', 'split'],
      'merchant': ['client', 'business', 'account'],
      'processor': ['gateway', 'acquirer', 'ISO'],
      'rate': ['pricing', 'cost', 'fee'],
      'chargeback': ['dispute', 'reversal', 'claim'],
      'underwriting': ['approval', 'risk assessment', 'boarding'],
      'PCI': ['compliance', 'security', 'DSS'],
      'terminal': ['POS', 'reader', 'device'],
    };
    
    // Add synonym expansions
    const words = query.toLowerCase().split(/\W+/);
    for (const word of words) {
      if (synonyms[word]) {
        for (const synonym of synonyms[word]) {
          expansions.push(query.replace(new RegExp(word, 'gi'), synonym));
        }
      }
    }
    
    return Array.from(new Set(expansions)); // Remove duplicates
  }
}

// Export singleton instance
export const vectorSearchService = new VectorSearchService();