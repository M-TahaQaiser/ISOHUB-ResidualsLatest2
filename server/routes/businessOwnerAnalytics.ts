import { Router, Request, Response } from 'express';
import { db } from '../db';
import { merchants, masterDataset, midRoleAssignments, users } from '../../shared/schema';
import { sql, eq, and, gte } from 'drizzle-orm';

const router = Router();

// Middleware to protect Business Owner routes
const requireBusinessOwner = (req: Request, res: Response, next: Function) => {
  if (!req.session.businessOwnerId) {
    return res.status(401).json({ error: 'Business Owner authentication required' });
  }

  // Check session expiry (24 hours)
  const loginTime = req.session.loginTime || 0;
  const now = Date.now();
  const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

  if (hoursSinceLogin > 24) {
    req.session.destroy(() => {
      res.status(401).json({ error: 'Session expired' });
    });
    return;
  }

  next();
};

// Apply middleware to all routes
router.use(requireBusinessOwner);

// Business Owner Analytics Dashboard
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    // Calculate total revenue from master dataset
    const revenueResult = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${masterDataset.totalRevenue} AS DECIMAL)), 0)`,
      })
      .from(masterDataset);

    const totalRevenue = Number(revenueResult[0]?.totalRevenue || 0);

    // Count total merchants
    const merchantCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(merchants);

    const totalMerchants = Number(merchantCount[0]?.count || 0);

    // Count active accounts (merchants with recent data)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const activeResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${masterDataset.mid})` })
      .from(masterDataset)
      .where(gte(masterDataset.month, threeMonthsAgo.toISOString().slice(0, 7)));

    const activeAccounts = Number(activeResult[0]?.count || 0);

    // Count total users (agents)
    const userCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users);

    const totalUsers = Number(userCount[0]?.count || 0);

    // Revenue trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trends = await db
      .select({
        month: masterDataset.month,
        revenue: sql<number>`COALESCE(SUM(CAST(${masterDataset.totalRevenue} AS DECIMAL)), 0)`,
        merchantCount: sql<number>`COUNT(DISTINCT ${masterDataset.mid})`,
      })
      .from(masterDataset)
      .where(gte(masterDataset.month, sixMonthsAgo.toISOString().slice(0, 7)))
      .groupBy(masterDataset.month)
      .orderBy(masterDataset.month);

    // Market share by processor
    const processorShare = await db
      .select({
        processor: masterDataset.processor,
        revenue: sql<number>`COALESCE(SUM(CAST(${masterDataset.totalRevenue} AS DECIMAL)), 0)`,
        merchantCount: sql<number>`COUNT(DISTINCT ${masterDataset.mid})`,
      })
      .from(masterDataset)
      .where(sql`${masterDataset.processor} IS NOT NULL`)
      .groupBy(masterDataset.processor)
      .orderBy(sql`SUM(CAST(${masterDataset.totalRevenue} AS DECIMAL)) DESC`)
      .limit(10);

    // Top performing merchants
    const topMerchants = await db
      .select({
        mid: masterDataset.mid,
        merchantName: masterDataset.merchantName,
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${masterDataset.totalRevenue} AS DECIMAL)), 0)`,
        processor: masterDataset.processor,
      })
      .from(masterDataset)
      .groupBy(masterDataset.mid, masterDataset.merchantName, masterDataset.processor)
      .orderBy(sql`SUM(CAST(${masterDataset.totalRevenue} AS DECIMAL)) DESC`)
      .limit(10);

    // Role assignments summary
    const roleAssignmentCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(midRoleAssignments);

    const totalAssignments = Number(roleAssignmentCount[0]?.count || 0);

    res.json({
      metrics: {
        totalRevenue,
        totalMerchants,
        activeAccounts,
        totalUsers,
        totalAssignments,
      },
      trends: trends.map(t => ({
        month: t.month,
        revenue: Number(t.revenue),
        merchantCount: Number(t.merchantCount),
      })),
      processorShare: processorShare.map(p => ({
        processor: p.processor || 'Unknown',
        revenue: Number(p.revenue),
        merchantCount: Number(p.merchantCount),
        percentOfTotal: totalRevenue > 0 ? (Number(p.revenue) / totalRevenue) * 100 : 0,
      })),
      topMerchants: topMerchants.map(m => ({
        mid: m.mid,
        merchantName: m.merchantName,
        totalRevenue: Number(m.totalRevenue),
        processor: m.processor || 'Unknown',
        percentOfTotal: totalRevenue > 0 ? (Number(m.totalRevenue) / totalRevenue) * 100 : 0,
      })),
    });
  } catch (error) {
    console.error('Business Owner Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
