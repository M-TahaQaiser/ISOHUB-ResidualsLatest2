import { Router } from 'express';
import { db } from '../db';
import { merchants, processors, users } from '../../shared/schema';
import { ilike, or, sql } from 'drizzle-orm';

const router = Router();

// Global search endpoint
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.json({
        merchants: [],
        processors: [],
        users: []
      });
    }

    const searchQuery = q.trim();
    
    if (searchQuery.length < 2) {
      return res.json({
        merchants: [],
        processors: [],
        users: []
      });
    }

    // Search merchants by MID or business name
    const merchantResults = await db
      .select({
        id: merchants.id,
        mid: merchants.mid,
        legalName: merchants.legalName,
        dba: merchants.dba,
        branchId: merchants.branchId,
        currentProcessor: merchants.currentProcessor,
        status: merchants.status
      })
      .from(merchants)
      .where(
        or(
          ilike(merchants.mid, `%${searchQuery}%`),
          ilike(merchants.legalName, `%${searchQuery}%`),
          ilike(merchants.dba, `%${searchQuery}%`),
          ilike(merchants.branchId, `%${searchQuery}%`)
        )
      )
      .limit(10);

    // Search processors by name
    const processorResults = await db
      .select({
        id: processors.id,
        name: processors.name,
        isActive: processors.isActive
      })
      .from(processors)
      .where(ilike(processors.name, `%${searchQuery}%`))
      .limit(10);

    // Search users (agents/partners) by username, name, or email
    const userResults = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        repName: users.repName,
        isActive: users.isActive
      })
      .from(users)
      .where(
        or(
          ilike(users.username, `%${searchQuery}%`),
          ilike(users.firstName, `%${searchQuery}%`),
          ilike(users.lastName, `%${searchQuery}%`),
          ilike(users.email, `%${searchQuery}%`),
          ilike(users.repName, `%${searchQuery}%`)
        )
      )
      .limit(10);

    // Calculate relevance scores (simple fuzzy matching)
    const calculateScore = (text: string | null, query: string): number => {
      if (!text) return 0;
      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      
      // Exact match gets highest score
      if (lowerText === lowerQuery) return 100;
      
      // Starts with query gets high score
      if (lowerText.startsWith(lowerQuery)) return 80;
      
      // Contains query gets medium score
      if (lowerText.includes(lowerQuery)) return 60;
      
      // Fuzzy match: calculate similarity
      let matches = 0;
      for (const char of lowerQuery) {
        if (lowerText.includes(char)) matches++;
      }
      return (matches / lowerQuery.length) * 40;
    };

    // Sort results by relevance
    const sortedMerchants = merchantResults
      .map(m => ({
        ...m,
        score: Math.max(
          calculateScore(m.mid, searchQuery),
          calculateScore(m.legalName, searchQuery),
          calculateScore(m.dba, searchQuery),
          calculateScore(m.branchId, searchQuery)
        )
      }))
      .sort((a, b) => b.score - a.score);

    const sortedProcessors = processorResults
      .map(p => ({
        ...p,
        score: calculateScore(p.name, searchQuery)
      }))
      .sort((a, b) => b.score - a.score);

    const sortedUsers = userResults
      .map(u => ({
        ...u,
        score: Math.max(
          calculateScore(u.username, searchQuery),
          calculateScore(u.firstName, searchQuery),
          calculateScore(u.lastName, searchQuery),
          calculateScore(u.email, searchQuery),
          calculateScore(u.repName, searchQuery)
        )
      }))
      .sort((a, b) => b.score - a.score);

    res.json({
      merchants: sortedMerchants.slice(0, 5),
      processors: sortedProcessors.slice(0, 5),
      users: sortedUsers.slice(0, 5)
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

export default router;
