/**
 * Hybrid Search Service
 * Combines vector similarity search with BM25 keyword search
 * for improved retrieval accuracy
 */

import { db } from '../../db';
import { aiKnowledgeBase } from '../../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

interface SearchResult {
  id: number;
  question: string;
  answer: string;
  category: string;
  score: number;
  matchType: 'vector' | 'keyword' | 'hybrid';
}

interface BM25Params {
  k1: number; // Term frequency saturation (default 1.2-2.0)
  b: number;  // Document length normalization (default 0.75)
}

/**
 * Hybrid Search Service combining dense and sparse retrieval
 */
export class HybridSearchService {
  private bm25Params: BM25Params = { k1: 1.5, b: 0.75 };
  private avgDocLength: number = 100; // Average document length in tokens

  // Synonym expansion for domain-specific terms
  private synonyms: Record<string, string[]> = {
    'residual': ['commission', 'revenue share', 'split', 'recurring income', 'passive income'],
    'merchant': ['client', 'business', 'account', 'customer', 'store'],
    'processor': ['gateway', 'acquirer', 'ISO', 'payment provider', 'acquiring bank'],
    'rate': ['pricing', 'cost', 'fee', 'percentage', 'margin'],
    'chargeback': ['dispute', 'reversal', 'claim', 'retrieval', 'cb'],
    'underwriting': ['approval', 'risk assessment', 'vetting', 'boarding'],
    'pci': ['compliance', 'security', 'dss', 'data security'],
    'terminal': ['pos', 'reader', 'device', 'machine', 'hardware'],
    'interchange': ['ic', 'card network fees', 'association fees', 'passthrough'],
    'volume': ['processing', 'sales', 'transactions', 'throughput'],
    'mid': ['merchant id', 'account number', 'merchant identifier'],
    'dba': ['doing business as', 'trade name', 'business name'],
    'emv': ['chip', 'smart card', 'contact', 'dip'],
    'nfc': ['tap', 'contactless', 'apple pay', 'google pay', 'mobile wallet'],
  };

  /**
   * Perform hybrid search combining vector and keyword approaches
   */
  async hybridSearch(
    query: string,
    organizationId: string,
    limit: number = 5,
    category?: string
  ): Promise<SearchResult[]> {
    // Expand query with synonyms
    const expandedQuery = this.expandQueryWithSynonyms(query);

    // Run both searches in parallel
    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorSearch(query, organizationId, limit * 2, category),
      this.bm25Search(expandedQuery, organizationId, limit * 2, category),
    ]);

    // Combine using Reciprocal Rank Fusion
    const fusedResults = this.reciprocalRankFusion(
      vectorResults,
      keywordResults,
      { vectorWeight: 0.6, keywordWeight: 0.4 }
    );

    // Re-rank with cross-encoder simulation
    const reranked = this.crossEncoderRerank(query, fusedResults);

    return reranked.slice(0, limit);
  }

  /**
   * Vector-based semantic search
   */
  private async vectorSearch(
    query: string,
    organizationId: string,
    limit: number,
    category?: string
  ): Promise<SearchResult[]> {
    try {
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
        .where(and(...conditions))
        .limit(limit * 3);

      // Generate query embedding (simplified - in production use actual embeddings)
      const queryEmbedding = this.generateKeywordEmbedding(query);

      // Score each entry
      const scored = entries.map((entry) => {
        const entryEmbedding = entry.embeddings
          ? (Array.isArray(entry.embeddings) ? entry.embeddings : [])
          : this.generateKeywordEmbedding(entry.question + ' ' + entry.answer);

        const score = this.cosineSimilarity(queryEmbedding, entryEmbedding as number[]);

        return {
          id: entry.id,
          question: entry.question,
          answer: entry.answer,
          category: entry.category,
          score,
          matchType: 'vector' as const,
        };
      });

      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Vector search error:', error);
      return [];
    }
  }

  /**
   * BM25 keyword search
   */
  private async bm25Search(
    query: string,
    organizationId: string,
    limit: number,
    category?: string
  ): Promise<SearchResult[]> {
    try {
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

      // Tokenize query
      const queryTerms = this.tokenize(query);

      // Calculate BM25 scores
      const scored = entries.map((entry) => {
        const docText = `${entry.question} ${entry.answer}`;
        const score = this.calculateBM25Score(queryTerms, docText, entries.length);

        return {
          id: entry.id,
          question: entry.question,
          answer: entry.answer,
          category: entry.category,
          score,
          matchType: 'keyword' as const,
        };
      });

      return scored
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('BM25 search error:', error);
      return [];
    }
  }

  /**
   * Calculate BM25 score for a document
   */
  private calculateBM25Score(
    queryTerms: string[],
    document: string,
    totalDocs: number
  ): number {
    const { k1, b } = this.bm25Params;
    const docTokens = this.tokenize(document);
    const docLength = docTokens.length;

    // Term frequency in document
    const termFreq = new Map<string, number>();
    docTokens.forEach((token) => {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
    });

    let score = 0;

    for (const term of queryTerms) {
      const tf = termFreq.get(term) || 0;
      if (tf === 0) continue;

      // Simplified IDF calculation
      const docsWithTerm = Math.max(1, totalDocs * 0.1); // Assume 10% docs have term
      const idf = Math.log((totalDocs - docsWithTerm + 0.5) / (docsWithTerm + 0.5) + 1);

      // BM25 formula
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (docLength / this.avgDocLength));

      score += idf * (numerator / denominator);
    }

    return score;
  }

  /**
   * Reciprocal Rank Fusion to combine results
   */
  private reciprocalRankFusion(
    vectorResults: SearchResult[],
    keywordResults: SearchResult[],
    weights: { vectorWeight: number; keywordWeight: number }
  ): SearchResult[] {
    const k = 60; // RRF constant
    const scores = new Map<number, { result: SearchResult; score: number }>();

    // Score vector results
    vectorResults.forEach((result, rank) => {
      const rrf = weights.vectorWeight / (k + rank + 1);
      const existing = scores.get(result.id);
      if (existing) {
        existing.score += rrf;
        existing.result.matchType = 'hybrid';
      } else {
        scores.set(result.id, { result: { ...result, matchType: 'hybrid' }, score: rrf });
      }
    });

    // Score keyword results
    keywordResults.forEach((result, rank) => {
      const rrf = weights.keywordWeight / (k + rank + 1);
      const existing = scores.get(result.id);
      if (existing) {
        existing.score += rrf;
        existing.result.matchType = 'hybrid';
      } else {
        scores.set(result.id, { result: { ...result, matchType: 'hybrid' }, score: rrf });
      }
    });

    // Sort by combined score
    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .map(({ result, score }) => ({ ...result, score }));
  }

  /**
   * Cross-encoder re-ranking (simplified version)
   * In production, use actual cross-encoder model
   */
  private crossEncoderRerank(query: string, results: SearchResult[]): SearchResult[] {
    const queryTerms = new Set(this.tokenize(query));

    return results
      .map((result) => {
        const answerTerms = this.tokenize(result.answer);
        const questionTerms = this.tokenize(result.question);

        // Calculate relevance boost based on exact matches
        let boost = 0;

        // Question matches are most valuable
        questionTerms.forEach((term) => {
          if (queryTerms.has(term)) boost += 0.3;
        });

        // Answer matches add value
        answerTerms.forEach((term) => {
          if (queryTerms.has(term)) boost += 0.1;
        });

        // Check for phrase matches
        const queryLower = query.toLowerCase();
        if (result.question.toLowerCase().includes(queryLower)) boost += 0.5;
        if (result.answer.toLowerCase().includes(queryLower)) boost += 0.3;

        return {
          ...result,
          score: result.score * (1 + boost),
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Expand query with synonyms
   */
  private expandQueryWithSynonyms(query: string): string {
    const terms = this.tokenize(query);
    const expanded = new Set(terms);

    terms.forEach((term) => {
      const synonymList = this.synonyms[term];
      if (synonymList) {
        synonymList.forEach((syn) => expanded.add(syn));
      }

      // Also check if term is a synonym of something
      Object.entries(this.synonyms).forEach(([key, syns]) => {
        if (syns.includes(term)) {
          expanded.add(key);
        }
      });
    });

    return Array.from(expanded).join(' ');
  }

  /**
   * Generate keyword-based embedding (fallback)
   */
  private generateKeywordEmbedding(text: string): number[] {
    const vector = new Array(384).fill(0);
    const tokens = this.tokenize(text);

    tokens.forEach((token) => {
      const hash = this.hashString(token);
      const position = Math.abs(hash) % vector.length;
      vector[position] = 1;
    });

    // Normalize
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      return vector.map((v) => v / norm);
    }
    return vector;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

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

  /**
   * Tokenize text into terms
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2)
      .filter((t) => !this.isStopWord(t));
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'that', 'this', 'these', 'those', 'what', 'which', 'who', 'whom',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
      'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'it', 'its', 'my', 'your', 'his', 'her', 'their', 'our', 'we',
      'you', 'they', 'i', 'me', 'him', 'them', 'us',
    ]);
    return stopWords.has(word);
  }

  /**
   * Hash string to number
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

export const hybridSearchService = new HybridSearchService();
