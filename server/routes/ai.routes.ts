import { Router, Response } from 'express';
import { aiOrchestrationService } from '../services/ai/AIOrchestrationService';
import { vectorSearchService } from '../services/ai/VectorSearchService';
import { chatTrainingService } from '../services/ai/ChatTrainingService';
import { KnowledgeBaseSeeder } from '../services/ai/KnowledgeBaseSeeder';
import { db } from '../db';
import { aiKnowledgeBase, aiChatSessions, aiDocumentAnalysis, users } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { createRateLimiter, validateInput } from '../middleware/security';
import { aiChatMessageSchema, aiKnowledgeBaseEntrySchema, aiTrainingCorrectionSchema, documentAnalysisSchema } from '../validation/schemas';

const router = Router();

// AI-specific rate limiters
// SECURITY FIX: Add rate limiting to prevent abuse and control costs
const aiChatRateLimit = createRateLimiter(
  60 * 1000, // 1 minute window
  20, // 20 requests per minute per user
  'AI chat rate limit exceeded. Please wait before sending more messages.'
);

const aiDocumentRateLimit = createRateLimiter(
  60 * 60 * 1000, // 1 hour window
  10, // 10 document analyses per hour
  'Document analysis rate limit exceeded. Please try again later.'
);

const aiKnowledgeRateLimit = createRateLimiter(
  60 * 1000, // 1 minute window
  30, // 30 knowledge queries per minute
  'Knowledge base rate limit exceeded.'
);

const aiTrainingRateLimit = createRateLimiter(
  60 * 60 * 1000, // 1 hour window
  20, // 20 training corrections per hour
  'Training submission rate limit exceeded.'
);

// Chat endpoint - Process user queries with AI
router.post('/chat',
  authenticateToken,
  aiChatRateLimit,
  validateInput(aiChatMessageSchema),
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query, sessionId, messages = [] } = req.body;
    const userId = req.user?.id;
    // SECURITY: Use actual user's organizationId, not hardcoded value
    const organizationId = req.user?.organizationId || 'default';

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const currentSessionId = sessionId || uuidv4();

    // Search knowledge base for relevant context
    const knowledgeResults = await vectorSearchService.searchWithExpansion(
      query,
      organizationId,
      3
    );

    // Build context from knowledge base
    let context = '';
    if (knowledgeResults.length > 0) {
      context = '\n\nRelevant information from knowledge base:\n';
      knowledgeResults.forEach(result => {
        context += `Q: ${result.question}\nA: ${result.answer}\n\n`;
      });
    }

    // Process with AI orchestration
    const response = await aiOrchestrationService.processQuery(
      query + context,
      {
        organizationId,
        userId,
        sessionId: currentSessionId,
      },
      messages
    );

    // Save chat session
    const allMessages = [
      ...messages,
      { role: 'user' as const, content: query, timestamp: new Date() },
      { role: 'assistant' as const, content: response.content, timestamp: new Date() },
    ];

    await aiOrchestrationService.saveChatSession(
      { organizationId, userId, sessionId: currentSessionId },
      allMessages,
      response.model,
      response.tokens,
      response.responseTime
    );

    res.json({
      response: response.content,
      sessionId: currentSessionId,
      model: response.model,
      tokens: response.tokens,
      responseTime: response.responseTime,
      knowledgeUsed: knowledgeResults.length,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Knowledge base search endpoint
router.get('/knowledge/search',
  authenticateToken,
  aiKnowledgeRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, category, limit = 5 } = req.query;
    const organizationId = req.user?.organizationId || 'default';

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const results = await vectorSearchService.searchKnowledgeBase(
      q,
      organizationId,
      Number(limit),
      category as string
    );

    res.json({ results });
  } catch (error) {
    console.error('Knowledge search error:', error);
    res.status(500).json({ error: 'Failed to search knowledge base' });
  }
});

// Get knowledge base entries
router.get('/knowledge', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId || 'default';
    const { category, isActive = true } = req.query;

    const conditions = [
      eq(aiKnowledgeBase.organizationId, organizationId),
    ];

    if (isActive !== undefined) {
      conditions.push(eq(aiKnowledgeBase.isActive, isActive === 'true'));
    }

    if (category) {
      conditions.push(eq(aiKnowledgeBase.category, category as string));
    }

    const entries = await db
      .select()
      .from(aiKnowledgeBase)
      .where(and(...conditions))
      .orderBy(desc(aiKnowledgeBase.usageCount));

    res.json({ entries });
  } catch (error) {
    console.error('Knowledge fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

// Add knowledge base entry
router.post('/knowledge', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, question, answer, keywords } = req.body;
    const organizationId = req.user?.organizationId || 'default';

    if (!category || !question || !answer) {
      return res.status(400).json({ 
        error: 'Category, question, and answer are required' 
      });
    }

    // Generate embedding for the new entry
    const embedding = await vectorSearchService.generateEmbedding(question + ' ' + answer);

    const [entry] = await db.insert(aiKnowledgeBase).values({
      organizationId,
      category,
      question,
      answer,
      keywords: keywords || [],
      embeddings: embedding,
      source: 'manual',
      isActive: true,
    }).returning();

    res.json({ entry });
  } catch (error) {
    console.error('Knowledge add error:', error);
    res.status(500).json({ error: 'Failed to add knowledge base entry' });
  }
});

// Seed knowledge base
router.post('/knowledge/seed', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId || 'default';
    
    // Check if admin
    if (req.user?.role !== 'SuperAdmin' && req.user?.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const count = await KnowledgeBaseSeeder.seedForOrganization(organizationId);
    
    res.json({ 
      message: 'Knowledge base seeded successfully',
      entriesAdded: count,
      categories: KnowledgeBaseSeeder.getCategorySummary()
    });
  } catch (error) {
    console.error('Knowledge seed error:', error);
    res.status(500).json({ error: 'Failed to seed knowledge base' });
  }
});

// Document analysis endpoint
router.post('/document/analyze',
  authenticateToken,
  aiDocumentRateLimit,
  validateInput(documentAnalysisSchema),
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { documentId, documentName, documentType, content } = req.body;
    const organizationId = req.user?.organizationId || 'default';

    if (!documentId || !documentName || !content) {
      return res.status(400).json({ 
        error: 'Document ID, name, and content are required' 
      });
    }

    // Analyze document with AI
    const analysis = await aiOrchestrationService.analyzeDocument(
      content,
      documentType || 'unknown',
      organizationId
    );

    // Save analysis result
    await db.insert(aiDocumentAnalysis).values({
      organizationId,
      documentId,
      documentName,
      documentType,
      fileSize: content.length,
      analysisResult: analysis,
      modelUsed: 'claude-3-5-sonnet-20241022',
      processingTime: 0, // Will be calculated
      extractedEntities: analysis.entities || {},
      confidenceScore: '0.95',
      status: 'completed',
    });

    res.json({ analysis });
  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze document' });
  }
});

// Get chat sessions
router.get('/sessions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId || 'default';
    const userId = req.user?.id;

    const conditions = [
      eq(aiChatSessions.organizationId, organizationId),
    ];

    if (userId) {
      conditions.push(eq(aiChatSessions.userId, userId));
    }

    const sessions = await db
      .select()
      .from(aiChatSessions)
      .where(and(...conditions))
      .orderBy(desc(aiChatSessions.createdAt))
      .limit(20);

    res.json({ sessions });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

// Submit training correction
router.post('/training/correction',
  authenticateToken,
  aiTrainingRateLimit,
  validateInput(aiTrainingCorrectionSchema),
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      chatSessionId,
      originalQuery,
      originalResponse,
      correctedResponse,
      correctionReason
    } = req.body;
    
    const organizationId = req.user?.organizationId || 'default';
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // Check if admin
    if (req.user?.role !== 'SuperAdmin' && req.user?.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const correctionId = await chatTrainingService.submitCorrection(
      organizationId,
      adminId,
      {
        chatSessionId,
        originalQuery,
        originalResponse,
        correctedResponse,
        correctionReason,
      }
    );

    res.json({ 
      message: 'Correction submitted successfully',
      correctionId 
    });
  } catch (error) {
    console.error('Training correction error:', error);
    res.status(500).json({ error: 'Failed to submit correction' });
  }
});

// Get training corrections
router.get('/training/corrections', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId || 'default';
    const { status } = req.query;

    const corrections = await chatTrainingService.getCorrections(
      organizationId,
      status as string
    );

    res.json({ corrections });
  } catch (error) {
    console.error('Get corrections error:', error);
    res.status(500).json({ error: 'Failed to fetch corrections' });
  }
});

// Get training statistics
router.get('/training/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId || 'default';

    const stats = await chatTrainingService.getStatistics(organizationId);

    res.json({ stats });
  } catch (error) {
    console.error('Get training stats error:', error);
    res.status(500).json({ error: 'Failed to fetch training statistics' });
  }
});

// Get AI usage statistics
router.get('/usage', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId || 'default';

    const usage = await aiOrchestrationService.getUsageStats(organizationId);

    res.json({ usage });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to fetch usage statistics' });
  }
});

// Check AI availability
router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const availability = aiOrchestrationService.isAvailable();
    
    res.json({ 
      status: 'operational',
      services: availability,
      message: 'AI services are running'
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to check AI services status'
    });
  }
});

export default router;