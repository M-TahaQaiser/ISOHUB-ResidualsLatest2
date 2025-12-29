import { db } from '../../db';
import { 
  aiDocuments, 
  aiDocumentChunks, 
  aiDocumentSearchLogs,
  type AiDocument,
  type AiDocumentChunk,
  type InsertAiDocument,
  type InsertAiDocumentChunk,
  type AiDocumentWithChunks,
  DOCUMENT_APPROVAL_STATUS,
  DOCUMENT_VISIBILITY_ROLES
} from '@shared/schema';
import { eq, and, desc, asc, sql, ilike, or } from 'drizzle-orm';
import { vectorSearchService } from './VectorSearchService';

interface DocumentSearchResult extends AiDocumentWithChunks {
  relevanceScore: number;
  matchedContent?: string;
}

interface UploadDocumentInput {
  organizationId: string;
  title: string;
  content: string;
  fileData?: string;
  filePath?: string;
  fileType?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  visibleToRole?: 'public' | 'rep' | 'admin';
  uploadedBy?: number;
  metadata?: Record<string, unknown>;
}

interface DocumentFilter {
  organizationId: string;
  approvalStatus?: string;
  visibleToRole?: string;
  isActive?: boolean;
  uploadedBy?: number;
  search?: string;
}

export class DocumentCenterService {
  private readonly CHUNK_SIZE = 1000; // Characters per chunk
  private readonly CHUNK_OVERLAP = 200; // Overlap between chunks

  async createDocument(input: UploadDocumentInput): Promise<AiDocument> {
    const [document] = await db.insert(aiDocuments).values({
      organizationId: input.organizationId,
      title: input.title,
      content: input.content,
      fileData: input.fileData,
      filePath: input.filePath,
      fileType: input.fileType,
      fileSizeBytes: input.fileSizeBytes,
      mimeType: input.mimeType,
      visibleToRole: input.visibleToRole || 'public',
      uploadedBy: input.uploadedBy,
      metadata: input.metadata || {},
      approvalStatus: 'pending',
      isActive: true,
    }).returning();

    if (input.content && input.content.length > 0) {
      await this.createChunks(document.id, input.organizationId, input.content);
    }

    return document;
  }

  private async createChunks(documentId: number, organizationId: string, content: string): Promise<void> {
    const chunks = this.splitIntoChunks(content);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let embeddings: number[] | null = null;
      
      try {
        embeddings = await vectorSearchService.generateEmbedding(chunk);
      } catch (error) {
        console.error(`Error generating embedding for chunk ${i}:`, error);
      }

      await db.insert(aiDocumentChunks).values({
        documentId,
        organizationId,
        chunkIndex: i,
        content: chunk,
        embeddings: embeddings,
        metadata: { chunkSize: chunk.length },
      });
    }
  }

  private splitIntoChunks(content: string): string[] {
    const chunks: string[] = [];
    let position = 0;

    while (position < content.length) {
      const end = Math.min(position + this.CHUNK_SIZE, content.length);
      let chunkEnd = end;

      if (end < content.length) {
        const lastSentenceEnd = content.lastIndexOf('.', end);
        const lastNewline = content.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastSentenceEnd, lastNewline);
        
        if (breakPoint > position + this.CHUNK_SIZE / 2) {
          chunkEnd = breakPoint + 1;
        }
      }

      chunks.push(content.slice(position, chunkEnd).trim());
      position = chunkEnd - this.CHUNK_OVERLAP;
      if (position < 0) position = 0;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  async getDocuments(filter: DocumentFilter, limit = 50, offset = 0): Promise<AiDocument[]> {
    const conditions = [eq(aiDocuments.organizationId, filter.organizationId)];

    if (filter.approvalStatus) {
      conditions.push(eq(aiDocuments.approvalStatus, filter.approvalStatus));
    }
    if (filter.visibleToRole) {
      conditions.push(eq(aiDocuments.visibleToRole, filter.visibleToRole));
    }
    if (filter.isActive !== undefined) {
      conditions.push(eq(aiDocuments.isActive, filter.isActive));
    }
    if (filter.uploadedBy) {
      conditions.push(eq(aiDocuments.uploadedBy, filter.uploadedBy));
    }
    if (filter.search) {
      conditions.push(
        or(
          ilike(aiDocuments.title, `%${filter.search}%`),
          ilike(aiDocuments.content, `%${filter.search}%`)
        )!
      );
    }

    return db
      .select()
      .from(aiDocuments)
      .where(and(...conditions))
      .orderBy(desc(aiDocuments.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getDocumentById(id: number, organizationId: string): Promise<AiDocumentWithChunks | null> {
    const [document] = await db
      .select()
      .from(aiDocuments)
      .where(and(
        eq(aiDocuments.id, id),
        eq(aiDocuments.organizationId, organizationId)
      ));

    if (!document) return null;

    const chunks = await db
      .select()
      .from(aiDocumentChunks)
      .where(eq(aiDocumentChunks.documentId, id))
      .orderBy(asc(aiDocumentChunks.chunkIndex));

    return { ...document, chunks };
  }

  async updateDocument(id: number, organizationId: string, updates: Partial<InsertAiDocument>): Promise<AiDocument | null> {
    const [updated] = await db
      .update(aiDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(aiDocuments.id, id),
        eq(aiDocuments.organizationId, organizationId)
      ))
      .returning();

    return updated || null;
  }

  async deleteDocument(id: number, organizationId: string): Promise<boolean> {
    const result = await db
      .delete(aiDocuments)
      .where(and(
        eq(aiDocuments.id, id),
        eq(aiDocuments.organizationId, organizationId)
      ))
      .returning();

    return result.length > 0;
  }

  async approveDocument(id: number, organizationId: string, approvedBy: number): Promise<AiDocument | null> {
    return this.updateDocument(id, organizationId, {
      approvalStatus: 'approved',
      approvedBy,
      approvedAt: new Date(),
    } as Partial<InsertAiDocument>);
  }

  async rejectDocument(id: number, organizationId: string, approvedBy: number, reason: string): Promise<AiDocument | null> {
    return this.updateDocument(id, organizationId, {
      approvalStatus: 'rejected',
      approvedBy,
      approvedAt: new Date(),
      rejectionReason: reason,
    } as Partial<InsertAiDocument>);
  }

  async incrementViewCount(id: number): Promise<void> {
    await db
      .update(aiDocuments)
      .set({ viewCount: sql`${aiDocuments.viewCount} + 1` })
      .where(eq(aiDocuments.id, id));
  }

  async searchDocuments(
    query: string,
    organizationId: string,
    userRole: string = 'public',
    limit = 10
  ): Promise<DocumentSearchResult[]> {
    const startTime = Date.now();
    
    const roleHierarchy: { [key: string]: string[] } = {
      admin: ['public', 'rep', 'admin'],
      rep: ['public', 'rep'],
      public: ['public'],
    };
    const allowedRoles = roleHierarchy[userRole] || ['public'];

    const queryEmbedding = await vectorSearchService.generateEmbedding(query);

    const allChunks = await db
      .select()
      .from(aiDocumentChunks)
      .where(eq(aiDocumentChunks.organizationId, organizationId));

    const chunkScores: Map<number, { chunk: AiDocumentChunk; score: number }> = new Map();

    for (const chunk of allChunks) {
      if (chunk.embeddings && Array.isArray(chunk.embeddings)) {
        const score = this.cosineSimilarity(queryEmbedding, chunk.embeddings as number[]);
        
        const existing = chunkScores.get(chunk.documentId);
        if (!existing || score > existing.score) {
          chunkScores.set(chunk.documentId, { chunk, score });
        }
      }
    }

    const sortedResults = Array.from(chunkScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit * 2);

    const documentIds = sortedResults.map(([docId]) => docId);
    
    if (documentIds.length === 0) {
      return this.fallbackKeywordSearch(query, organizationId, allowedRoles, limit);
    }

    const documents = await db
      .select()
      .from(aiDocuments)
      .where(and(
        eq(aiDocuments.organizationId, organizationId),
        eq(aiDocuments.isActive, true),
        eq(aiDocuments.approvalStatus, 'approved'),
        sql`${aiDocuments.visibleToRole} IN (${sql.join(allowedRoles.map(r => sql`${r}`), sql`, `)})`
      ));

    const docMap = new Map(documents.map(d => [d.id, d]));

    const results: DocumentSearchResult[] = [];
    for (const [docId, { chunk, score }] of sortedResults) {
      const doc = docMap.get(docId);
      if (doc) {
        results.push({
          ...doc,
          matchedChunk: chunk,
          relevanceScore: score,
          matchedContent: chunk.content.substring(0, 200) + '...',
        });
      }
    }

    const responseTime = Date.now() - startTime;
    await this.logSearch(organizationId, null, query, results.length, results[0]?.id || null, results[0]?.relevanceScore || 0, responseTime, 'semantic');

    return results.slice(0, limit);
  }

  private async fallbackKeywordSearch(
    query: string,
    organizationId: string,
    allowedRoles: string[],
    limit: number
  ): Promise<DocumentSearchResult[]> {
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    const documents = await db
      .select()
      .from(aiDocuments)
      .where(and(
        eq(aiDocuments.organizationId, organizationId),
        eq(aiDocuments.isActive, true),
        eq(aiDocuments.approvalStatus, 'approved'),
        sql`${aiDocuments.visibleToRole} IN (${sql.join(allowedRoles.map(r => sql`${r}`), sql`, `)})`
      ));

    const scoredDocs = documents.map(doc => {
      const contentLower = (doc.title + ' ' + doc.content).toLowerCase();
      let score = 0;
      
      for (const keyword of keywords) {
        const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
        score += matches;
      }
      
      return { ...doc, relevanceScore: score / Math.max(keywords.length, 1) } as DocumentSearchResult;
    });

    return scoredDocs
      .filter(d => d.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

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

  private async logSearch(
    organizationId: string,
    userId: number | null,
    query: string,
    resultCount: number,
    topDocumentId: number | null,
    confidence: number,
    responseTimeMs: number,
    searchType: string
  ): Promise<void> {
    try {
      await db.insert(aiDocumentSearchLogs).values({
        organizationId,
        userId,
        query,
        resultCount,
        topDocumentId,
        confidence: confidence.toFixed(2),
        responseTimeMs,
        searchType,
      });
    } catch (error) {
      console.error('Error logging search:', error);
    }
  }

  async getDocumentStats(organizationId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byFileType: Record<string, number>;
  }> {
    const documents = await db
      .select()
      .from(aiDocuments)
      .where(eq(aiDocuments.organizationId, organizationId));

    const stats = {
      total: documents.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      byFileType: {} as Record<string, number>,
    };

    for (const doc of documents) {
      if (doc.approvalStatus === 'pending') stats.pending++;
      else if (doc.approvalStatus === 'approved') stats.approved++;
      else if (doc.approvalStatus === 'rejected') stats.rejected++;

      const fileType = doc.fileType || 'unknown';
      stats.byFileType[fileType] = (stats.byFileType[fileType] || 0) + 1;
    }

    return stats;
  }

  async regenerateEmbeddings(documentId: number, organizationId: string): Promise<number> {
    const document = await this.getDocumentById(documentId, organizationId);
    if (!document || !document.chunks) return 0;

    let updated = 0;
    for (const chunk of document.chunks) {
      try {
        const embedding = await vectorSearchService.generateEmbedding(chunk.content);
        await db
          .update(aiDocumentChunks)
          .set({ embeddings: embedding })
          .where(eq(aiDocumentChunks.id, chunk.id));
        updated++;
      } catch (error) {
        console.error(`Error regenerating embedding for chunk ${chunk.id}:`, error);
      }
    }

    return updated;
  }
}

export const documentCenterService = new DocumentCenterService();
