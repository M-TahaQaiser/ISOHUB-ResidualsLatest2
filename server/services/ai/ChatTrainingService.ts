import { db } from '../../db';
import { aiTrainingCorrections, aiKnowledgeBase, aiChatSessions } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

interface TrainingCorrection {
  chatSessionId: number;
  originalQuery: string;
  originalResponse: string;
  correctedResponse: string;
  correctionReason?: string;
}

interface TrainingPipeline {
  step: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description: string;
  timestamp: Date;
}

export class ChatTrainingService {
  // 4-step learning pipeline
  private pipeline: TrainingPipeline[] = [
    { step: 1, status: 'pending', description: 'Capture Original Response', timestamp: new Date() },
    { step: 2, status: 'pending', description: 'Admin Review & Correction', timestamp: new Date() },
    { step: 3, status: 'pending', description: 'Apply to Knowledge Base', timestamp: new Date() },
    { step: 4, status: 'pending', description: 'Validate & Confirm', timestamp: new Date() },
  ];

  // Submit a correction for review
  async submitCorrection(
    organizationId: string,
    adminId: number,
    correction: TrainingCorrection
  ): Promise<number> {
    try {
      // Step 1: Store the correction
      const [result] = await db.insert(aiTrainingCorrections).values({
        organizationId,
        chatSessionId: correction.chatSessionId,
        originalQuery: correction.originalQuery,
        originalResponse: correction.originalResponse,
        correctedResponse: correction.correctedResponse,
        adminId,
        correctionReason: correction.correctionReason,
        trainingStatus: 'pending',
        appliedToKnowledgeBase: false,
        metadata: {
          submittedAt: new Date().toISOString(),
          pipeline: this.pipeline,
        },
      }).returning();

      console.log(`Training correction ${result.id} submitted for review`);
      
      // Step 2: Process the correction
      await this.processCorrection(result.id, organizationId);
      
      return result.id;
    } catch (error) {
      console.error('Error submitting correction:', error);
      throw error;
    }
  }

  // Process correction through the pipeline
  private async processCorrection(correctionId: number, organizationId: string) {
    try {
      // Update status to processing
      await db.update(aiTrainingCorrections)
        .set({ trainingStatus: 'processing' })
        .where(eq(aiTrainingCorrections.id, correctionId));

      // Step 3: Apply to knowledge base
      const [correction] = await db
        .select()
        .from(aiTrainingCorrections)
        .where(eq(aiTrainingCorrections.id, correctionId))
        .limit(1);

      if (correction) {
        await this.applyToKnowledgeBase(correction, organizationId);
        
        // Step 4: Mark as applied
        await db.update(aiTrainingCorrections)
          .set({ 
            trainingStatus: 'applied',
            appliedToKnowledgeBase: true,
            appliedAt: new Date(),
          })
          .where(eq(aiTrainingCorrections.id, correctionId));
        
        console.log(`Training correction ${correctionId} successfully applied`);
      }
    } catch (error) {
      console.error('Error processing correction:', error);
      
      // Mark as failed
      await db.update(aiTrainingCorrections)
        .set({ 
          trainingStatus: 'failed',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        })
        .where(eq(aiTrainingCorrections.id, correctionId));
    }
  }

  // Apply correction to knowledge base
  private async applyToKnowledgeBase(correction: any, organizationId: string) {
    // Check if similar Q&A already exists
    const existingEntries = await db
      .select()
      .from(aiKnowledgeBase)
      .where(
        and(
          eq(aiKnowledgeBase.organizationId, organizationId),
          eq(aiKnowledgeBase.question, correction.originalQuery)
        )
      );

    if (existingEntries.length > 0) {
      // Update existing entry
      await db.update(aiKnowledgeBase)
        .set({
          answer: correction.correctedResponse,
          isCorrected: true,
          updatedAt: new Date(),
          metadata: {
            correctionId: correction.id,
            previousAnswer: existingEntries[0].answer,
            correctedBy: correction.adminId,
            correctedAt: new Date().toISOString(),
          },
        })
        .where(eq(aiKnowledgeBase.id, existingEntries[0].id));
      
      console.log(`Updated existing knowledge base entry ${existingEntries[0].id}`);
    } else {
      // Create new entry
      await db.insert(aiKnowledgeBase).values({
        organizationId,
        category: this.categorizeQuestion(correction.originalQuery),
        question: correction.originalQuery,
        answer: correction.correctedResponse,
        keywords: this.extractKeywords(correction.originalQuery),
        isCorrected: true,
        isActive: true,
        source: 'correction',
        metadata: {
          correctionId: correction.id,
          correctedBy: correction.adminId,
          correctedAt: new Date().toISOString(),
        },
      });
      
      console.log('Created new knowledge base entry from correction');
    }
  }

  // Categorize question based on content
  private categorizeQuestion(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    const categoryKeywords = {
      'commission': ['commission', 'residual', 'split', 'percentage', 'bonus'],
      'underwriting': ['underwriting', 'approval', 'decline', 'risk', 'application'],
      'compliance': ['compliance', 'pci', 'regulation', 'law', 'rule'],
      'equipment': ['terminal', 'pos', 'equipment', 'hardware', 'device'],
      'pricing': ['rate', 'price', 'fee', 'cost', 'charge'],
      'fraud': ['fraud', 'chargeback', 'dispute', 'scam', 'theft'],
      'sales': ['prospect', 'lead', 'sell', 'close', 'pitch'],
      'support': ['support', 'help', 'issue', 'problem', 'error'],
      'verticals': ['industry', 'vertical', 'business type', 'merchant type'],
      'trends': ['future', 'trend', 'new', 'upcoming', 'technology'],
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerQuestion.includes(keyword)) {
          return category;
        }
      }
    }
    
    return 'general';
  }

  // Extract keywords from text
  private extractKeywords(text: string): string[] {
    // Remove common words
    const stopWordsList = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this', 'it', 'from', 'be', 'are', 'was', 'were', 'been'];
    const stopWords = new Set(stopWordsList);
    
    // Extract words
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
    
    // Get unique words
    const uniqueWords = Array.from(new Set(words));
    
    // Return top keywords
    return uniqueWords.slice(0, 10);
  }

  // Get all corrections for an organization
  async getCorrections(
    organizationId: string,
    status?: string
  ) {
    const conditions = [eq(aiTrainingCorrections.organizationId, organizationId)];
    
    if (status) {
      conditions.push(eq(aiTrainingCorrections.trainingStatus, status));
    }
    
    return await db
      .select()
      .from(aiTrainingCorrections)
      .where(and(...conditions))
      .orderBy(aiTrainingCorrections.createdAt);
  }

  // Get correction statistics
  async getStatistics(organizationId: string) {
    const corrections = await this.getCorrections(organizationId);
    
    const stats = {
      total: corrections.length,
      pending: corrections.filter(c => c.trainingStatus === 'pending').length,
      processing: corrections.filter(c => c.trainingStatus === 'processing').length,
      applied: corrections.filter(c => c.trainingStatus === 'applied').length,
      failed: corrections.filter(c => c.trainingStatus === 'failed').length,
      appliedToKnowledgeBase: corrections.filter(c => c.appliedToKnowledgeBase).length,
    };
    
    return stats;
  }

  // Review and approve a correction
  async approveCorrection(
    correctionId: number,
    adminId: number
  ): Promise<boolean> {
    try {
      const [correction] = await db
        .select()
        .from(aiTrainingCorrections)
        .where(eq(aiTrainingCorrections.id, correctionId))
        .limit(1);
      
      if (!correction) {
        throw new Error('Correction not found');
      }
      
      // Process the correction
      await this.processCorrection(correctionId, correction.organizationId);
      
      // Update metadata
      await db.update(aiTrainingCorrections)
        .set({
          metadata: {
            ...(correction.metadata as any || {}),
            approvedBy: adminId,
            approvedAt: new Date().toISOString(),
          },
        })
        .where(eq(aiTrainingCorrections.id, correctionId));
      
      return true;
    } catch (error) {
      console.error('Error approving correction:', error);
      return false;
    }
  }

  // Get chat sessions that need review
  async getChatSessionsForReview(
    organizationId: string,
    limit: number = 10
  ) {
    // Get recent chat sessions without corrections
    const recentSessions = await db
      .select()
      .from(aiChatSessions)
      .where(eq(aiChatSessions.organizationId, organizationId))
      .orderBy(aiChatSessions.createdAt)
      .limit(limit);
    
    // Check which ones have corrections
    const sessionsWithStatus = await Promise.all(
      recentSessions.map(async (session) => {
        const [correction] = await db
          .select()
          .from(aiTrainingCorrections)
          .where(eq(aiTrainingCorrections.chatSessionId, session.id))
          .limit(1);
        
        return {
          ...session,
          hasCorrectionCorrection: !!correction,
          correctionStatus: correction?.trainingStatus,
        };
      })
    );
    
    return sessionsWithStatus;
  }
}

// Export singleton instance
export const chatTrainingService = new ChatTrainingService();