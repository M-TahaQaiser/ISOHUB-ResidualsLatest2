import { Router, Request, Response } from "express";
import { db } from "../db";
import { monthlyData } from "@shared/schema";
import { sql, desc, and, gte, lte, eq } from "drizzle-orm";
import { TenancyService } from "../services/tenancyService";

const router = Router();

// Helper function to validate and resolve organization for multi-tenant security
async function validateAndResolveOrganization(req: Request, res: Response): Promise<number | null> {
  const organizationId = req.query.organizationId as string | undefined;
  
  if (!organizationId) {
    res.status(400).json({ error: "organizationId is required" });
    return null;
  }
  
  const agencyId = await TenancyService.resolveAgencyId(organizationId);
  if (agencyId === null) {
    res.status(404).json({ error: "Organization not found or not mapped to an agency" });
    return null;
  }
  
  return agencyId;
}

// Get revenue trends over time (REQUIRES organization filtering for security)
router.get("/trends", async (req, res) => {
  try {
    const { timeRange = "6m", startDate, endDate, organizationId } = req.query;
    
    // Require organizationId for multi-tenant security
    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: "organizationId is required" });
    }
    
    // Resolve organizationId to agencyId
    const agencyId = await TenancyService.resolveAgencyId(organizationId);
    if (agencyId === null) {
      return res.status(404).json({ error: "Organization not found or not mapped to an agency" });
    }
    
    // Calculate months back based on time range
    let monthsBack = 6;
    if (timeRange === "7d") monthsBack = 1;  // Show current month for 7d
    else if (timeRange === "30d") monthsBack = 2;  // Show last 2 months for 30d
    else if (timeRange === "3m") monthsBack = 3;
    else if (timeRange === "6m") monthsBack = 6;
    else if (timeRange === "1y") monthsBack = 12;

    // Calculate date range using UTC to avoid timezone issues
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    
    const startMonth = startDate 
      ? String(startDate)
      : (() => {
          // Calculate start month going back monthsBack from current
          const startDate = new Date(Date.UTC(currentYear, currentMonth - monthsBack + 1, 1));
          return startDate.toISOString().slice(0, 7);
        })();
        
    const endMonth = endDate
      ? String(endDate)
      : `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    // Build where conditions with mandatory agency filter
    const whereConditions = [
      gte(monthlyData.month, startMonth),
      lte(monthlyData.month, endMonth),
      eq(monthlyData.agencyId, agencyId) // Always filter by agency for security
    ];

    // Query revenue trends grouped by month
    const trends = await db
      .select({
        month: monthlyData.month,
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${monthlyData.salesAmount} AS DECIMAL)), 0)`.as('totalRevenue'),
        totalNet: sql<number>`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`.as('totalNet'),
        totalTransactions: sql<number>`COALESCE(SUM(${monthlyData.transactions}), 0)`.as('totalTransactions'),
        merchantCount: sql<number>`COUNT(DISTINCT ${monthlyData.merchantId})`.as('merchantCount'),
      })
      .from(monthlyData)
      .where(and(...whereConditions))
      .groupBy(monthlyData.month)
      .orderBy(monthlyData.month);

    res.json({ 
      trends,
      timeRange,
      startMonth,
      endMonth,
      agencyId // Include for debugging
    });
  } catch (error) {
    console.error("Error fetching revenue trends:", error);
    res.status(500).json({ error: "Failed to fetch revenue trends" });
  }
});

// Get top performing processors (REQUIRES organization filtering for security)
router.get("/top-processors", async (req, res) => {
  try {
    const { month, limit = 5, organizationId } = req.query;
    const currentMonth = month ? String(month) : new Date().toISOString().slice(0, 7);

    // Require organizationId for multi-tenant security
    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: "organizationId is required" });
    }
    
    // Resolve organizationId to agencyId
    const agencyId = await TenancyService.resolveAgencyId(organizationId);
    if (agencyId === null) {
      return res.status(404).json({ error: "Organization not found or not mapped to an agency" });
    }

    const topProcessors = await db
      .select({
        processorId: monthlyData.processorId,
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${monthlyData.salesAmount} AS DECIMAL)), 0)`.as('totalRevenue'),
        totalNet: sql<number>`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`.as('totalNet'),
        merchantCount: sql<number>`COUNT(DISTINCT ${monthlyData.merchantId})`.as('merchantCount'),
      })
      .from(monthlyData)
      .where(and(
        sql`${monthlyData.month} = ${currentMonth}`,
        eq(monthlyData.agencyId, agencyId)
      ))
      .groupBy(monthlyData.processorId)
      .orderBy(desc(sql`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`))
      .limit(Number(limit));

    res.json({ topProcessors, month: currentMonth, agencyId });
  } catch (error) {
    console.error("Error fetching top processors:", error);
    res.status(500).json({ error: "Failed to fetch top processors" });
  }
});

// Get performance comparison (YoY, MoM) - REQUIRES organization filtering for security
router.get("/comparison", async (req, res) => {
  try {
    const { organizationId } = req.query;
    
    // Require organizationId for multi-tenant security
    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: "organizationId is required" });
    }
    
    // Resolve organizationId to agencyId
    const agencyId = await TenancyService.resolveAgencyId(organizationId);
    if (agencyId === null) {
      return res.status(404).json({ error: "Organization not found or not mapped to an agency" });
    }
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [year, month] = currentMonth.split('-');
    
    const lastMonth = month === '01' 
      ? `${Number(year) - 1}-12`
      : `${year}-${String(Number(month) - 1).padStart(2, '0')}`;
    
    const lastYear = `${Number(year) - 1}-${month}`;

    // Build agency filter condition (always includes agency filter)
    const buildWhereConditions = (monthValue: string) => and(
      sql`${monthlyData.month} = ${monthValue}`,
      eq(monthlyData.agencyId, agencyId)
    );

    const [current, previous, yearAgo] = await Promise.all([
      db.select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${monthlyData.salesAmount} AS DECIMAL)), 0)`,
        totalNet: sql<number>`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`,
        totalTransactions: sql<number>`COALESCE(SUM(${monthlyData.transactions}), 0)`,
      })
      .from(monthlyData)
      .where(buildWhereConditions(currentMonth)),
      
      db.select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${monthlyData.salesAmount} AS DECIMAL)), 0)`,
        totalNet: sql<number>`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`,
        totalTransactions: sql<number>`COALESCE(SUM(${monthlyData.transactions}), 0)`,
      })
      .from(monthlyData)
      .where(buildWhereConditions(lastMonth)),
      
      db.select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${monthlyData.salesAmount} AS DECIMAL)), 0)`,
        totalNet: sql<number>`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`,
        totalTransactions: sql<number>`COALESCE(SUM(${monthlyData.transactions}), 0)`,
      })
      .from(monthlyData)
      .where(buildWhereConditions(lastYear))
    ]);

    const currentData = current[0] || { totalRevenue: 0, totalNet: 0, totalTransactions: 0 };
    const previousData = previous[0] || { totalRevenue: 0, totalNet: 0, totalTransactions: 0 };
    const yearAgoData = yearAgo[0] || { totalRevenue: 0, totalNet: 0, totalTransactions: 0 };

    const momChange = previousData.totalNet > 0
      ? ((currentData.totalNet - previousData.totalNet) / previousData.totalNet) * 100
      : 0;

    const yoyChange = yearAgoData.totalNet > 0
      ? ((currentData.totalNet - yearAgoData.totalNet) / yearAgoData.totalNet) * 100
      : 0;

    res.json({
      current: currentData,
      previous: previousData,
      yearAgo: yearAgoData,
      momChange: Math.round(momChange * 10) / 10,
      yoyChange: Math.round(yoyChange * 10) / 10,
      currentMonth,
      lastMonth,
      lastYear,
      agencyId
    });
  } catch (error) {
    console.error("Error fetching comparison data:", error);
    res.status(500).json({ error: "Failed to fetch comparison data" });
  }
});

// Get comprehensive monthly metrics with retention/attrition calculations (REQUIRES organization)
router.get("/metrics", async (req, res) => {
  try {
    const agencyId = await validateAndResolveOrganization(req, res);
    if (agencyId === null) return; // Response already sent
    
    const { startMonth, endMonth, processor } = req.query;

    // Get all available months for this agency
    const allMonthsResult = await db
      .select({ month: monthlyData.month })
      .from(monthlyData)
      .where(eq(monthlyData.agencyId, agencyId))
      .groupBy(monthlyData.month)
      .orderBy(monthlyData.month);
    
    const allMonths = allMonthsResult.map(r => r.month);

    // Filter months based on query params
    let filteredMonths = allMonths;
    if (startMonth && endMonth) {
      const startIdx = allMonths.indexOf(String(startMonth));
      const endIdx = allMonths.indexOf(String(endMonth));
      if (startIdx !== -1 && endIdx !== -1) {
        filteredMonths = allMonths.slice(
          Math.min(startIdx, endIdx),
          Math.max(startIdx, endIdx) + 1
        );
      }
    }

    const metrics = [];

    for (let i = 0; i < filteredMonths.length; i++) {
      const month = filteredMonths[i];
      const previousMonth = i > 0 ? filteredMonths[i - 1] : null;

      // Get current month stats (filtered by agency)
      const [currentStats] = await db
        .select({
          totalRevenue: sql<number>`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`,
          totalVolume: sql<number>`COALESCE(SUM(CAST(${monthlyData.salesAmount} AS DECIMAL)), 0)`,
          totalTransactions: sql<number>`COALESCE(SUM(${monthlyData.transactions}), 0)`,
          totalAccounts: sql<number>`COUNT(DISTINCT ${monthlyData.merchantId})`,
        })
        .from(monthlyData)
        .where(and(sql`${monthlyData.month} = ${month}`, eq(monthlyData.agencyId, agencyId)));

      // Get current month merchants (filtered by agency)
      const currentMerchants = await db
        .select({ merchantId: monthlyData.merchantId })
        .from(monthlyData)
        .where(and(sql`${monthlyData.month} = ${month}`, eq(monthlyData.agencyId, agencyId)))
        .groupBy(monthlyData.merchantId);
      
      const currentMerchantSet = new Set(currentMerchants.map(m => m.merchantId));

      // Get previous month data for retention calculation
      let previousMerchantSet = new Set<number>();
      let previousRevenue = 0;
      
      if (previousMonth) {
        const previousMerchants = await db
          .select({ merchantId: monthlyData.merchantId })
          .from(monthlyData)
          .where(and(sql`${monthlyData.month} = ${previousMonth}`, eq(monthlyData.agencyId, agencyId)))
          .groupBy(monthlyData.merchantId);
        
        previousMerchantSet = new Set(previousMerchants.map(m => m.merchantId));

        const [prevStats] = await db
          .select({
            totalRevenue: sql<number>`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`,
          })
          .from(monthlyData)
          .where(and(sql`${monthlyData.month} = ${previousMonth}`, eq(monthlyData.agencyId, agencyId)));
        
        previousRevenue = Number(prevStats?.totalRevenue || 0);
      }

      // Calculate retention metrics
      let retainedAccounts = 0;
      let lostAccounts = 0;
      let newAccounts = 0;

      if (previousMerchantSet.size > 0) {
        previousMerchantSet.forEach(mid => {
          if (currentMerchantSet.has(mid)) {
            retainedAccounts++;
          } else {
            lostAccounts++;
          }
        });
        currentMerchantSet.forEach(mid => {
          if (!previousMerchantSet.has(mid)) {
            newAccounts++;
          }
        });
      } else {
        newAccounts = currentMerchantSet.size;
      }

      const totalRevenue = Number(currentStats?.totalRevenue || 0);
      const totalAccounts = Number(currentStats?.totalAccounts || 0);

      const retentionRate = previousMerchantSet.size > 0
        ? (retainedAccounts / previousMerchantSet.size) * 100
        : 100;

      const attritionRate = previousMerchantSet.size > 0
        ? (lostAccounts / previousMerchantSet.size) * 100
        : 0;

      const momRevenueChange = previousMonth ? totalRevenue - previousRevenue : null;
      const momRevenueChangePercent = previousMonth && previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : null;

      // Get processor breakdown for this month (filtered by agency)
      const processorBreakdown = await db
        .select({
          processorId: monthlyData.processorId,
          revenue: sql<number>`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`,
          accounts: sql<number>`COUNT(DISTINCT ${monthlyData.merchantId})`,
        })
        .from(monthlyData)
        .where(and(sql`${monthlyData.month} = ${month}`, eq(monthlyData.agencyId, agencyId)))
        .groupBy(monthlyData.processorId)
        .orderBy(desc(sql`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`));

      metrics.push({
        month,
        totalRevenue,
        totalVolume: Number(currentStats?.totalVolume || 0),
        totalTransactions: Number(currentStats?.totalTransactions || 0),
        totalAccounts,
        retentionRate: Math.round(retentionRate * 10) / 10,
        attritionRate: Math.round(attritionRate * 10) / 10,
        revenuePerAccount: totalAccounts > 0 ? Math.round((totalRevenue / totalAccounts) * 100) / 100 : 0,
        momRevenueChange,
        momRevenueChangePercent: momRevenueChangePercent !== null 
          ? Math.round(momRevenueChangePercent * 10) / 10 
          : null,
        retainedAccounts,
        newAccounts,
        lostAccounts,
        netAccountGrowth: newAccounts - lostAccounts,
        processorBreakdown: processorBreakdown.map(p => ({
          processorId: p.processorId,
          revenue: Number(p.revenue),
          accounts: Number(p.accounts),
          percentOfTotal: totalRevenue > 0 
            ? Math.round((Number(p.revenue) / totalRevenue) * 1000) / 10 
            : 0,
        })),
      });
    }

    // Aggregate metrics
    const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;
    const aggregated = latestMetric ? {
      totalRevenue: metrics.reduce((sum, m) => sum + m.totalRevenue, 0),
      totalAccounts: latestMetric.totalAccounts,
      avgRetentionRate: Math.round((metrics.reduce((sum, m) => sum + m.retentionRate, 0) / metrics.length) * 10) / 10,
      avgAttritionRate: Math.round((metrics.reduce((sum, m) => sum + m.attritionRate, 0) / metrics.length) * 10) / 10,
      totalNewAccounts: metrics.reduce((sum, m) => sum + m.newAccounts, 0),
      totalLostAccounts: metrics.reduce((sum, m) => sum + m.lostAccounts, 0),
      netAccountGrowth: metrics.reduce((sum, m) => sum + m.netAccountGrowth, 0),
    } : null;

    res.json({
      success: true,
      allMonths,
      filteredMonths,
      metrics,
      aggregated,
      summary: {
        monthsIncluded: filteredMonths.length,
        startMonth: filteredMonths[0] || null,
        endMonth: filteredMonths[filteredMonths.length - 1] || null,
      }
    });
  } catch (error) {
    console.error("Error fetching comprehensive metrics:", error);
    res.status(500).json({ error: "Failed to fetch comprehensive metrics" });
  }
});

// Get single month metrics (REQUIRES organization)
router.get("/metrics/:month", async (req, res) => {
  try {
    const agencyId = await validateAndResolveOrganization(req, res);
    if (agencyId === null) return;
    
    const { month } = req.params;

    // Get all months to find previous (filtered by agency)
    const allMonthsResult = await db
      .select({ month: monthlyData.month })
      .from(monthlyData)
      .where(eq(monthlyData.agencyId, agencyId))
      .groupBy(monthlyData.month)
      .orderBy(monthlyData.month);
    
    const allMonths = allMonthsResult.map(r => r.month);
    const monthIndex = allMonths.indexOf(month);
    const previousMonth = monthIndex > 0 ? allMonths[monthIndex - 1] : null;

    // Get current month stats (filtered by agency)
    const [currentStats] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`,
        totalVolume: sql<number>`COALESCE(SUM(CAST(${monthlyData.salesAmount} AS DECIMAL)), 0)`,
        totalTransactions: sql<number>`COALESCE(SUM(${monthlyData.transactions}), 0)`,
        totalAccounts: sql<number>`COUNT(DISTINCT ${monthlyData.merchantId})`,
      })
      .from(monthlyData)
      .where(and(sql`${monthlyData.month} = ${month}`, eq(monthlyData.agencyId, agencyId)));

    const totalRevenue = Number(currentStats?.totalRevenue || 0);
    const totalAccounts = Number(currentStats?.totalAccounts || 0);

    // Get merchants for retention calc (filtered by agency)
    const currentMerchants = await db
      .select({ merchantId: monthlyData.merchantId })
      .from(monthlyData)
      .where(and(sql`${monthlyData.month} = ${month}`, eq(monthlyData.agencyId, agencyId)))
      .groupBy(monthlyData.merchantId);
    
    const currentMerchantSet = new Set(currentMerchants.map(m => m.merchantId));

    let previousMerchantSet = new Set<number>();
    let previousRevenue = 0;
    
    if (previousMonth) {
      const previousMerchants = await db
        .select({ merchantId: monthlyData.merchantId })
        .from(monthlyData)
        .where(and(sql`${monthlyData.month} = ${previousMonth}`, eq(monthlyData.agencyId, agencyId)))
        .groupBy(monthlyData.merchantId);
      
      previousMerchantSet = new Set(previousMerchants.map(m => m.merchantId));

      const [prevStats] = await db
        .select({
          totalRevenue: sql<number>`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`,
        })
        .from(monthlyData)
        .where(and(sql`${monthlyData.month} = ${previousMonth}`, eq(monthlyData.agencyId, agencyId)));
      
      previousRevenue = Number(prevStats?.totalRevenue || 0);
    }

    let retainedAccounts = 0;
    let lostAccounts = 0;
    let newAccounts = 0;

    if (previousMerchantSet.size > 0) {
      previousMerchantSet.forEach(mid => {
        if (currentMerchantSet.has(mid)) retainedAccounts++;
        else lostAccounts++;
      });
      currentMerchantSet.forEach(mid => {
        if (!previousMerchantSet.has(mid)) newAccounts++;
      });
    } else {
      newAccounts = currentMerchantSet.size;
    }

    const retentionRate = previousMerchantSet.size > 0
      ? (retainedAccounts / previousMerchantSet.size) * 100
      : 100;

    const attritionRate = previousMerchantSet.size > 0
      ? (lostAccounts / previousMerchantSet.size) * 100
      : 0;

    const momRevenueChange = previousMonth ? totalRevenue - previousRevenue : null;
    const momRevenueChangePercent = previousMonth && previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : null;

    // Get processor breakdown (filtered by agency)
    const processorBreakdown = await db
      .select({
        processorId: monthlyData.processorId,
        revenue: sql<number>`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`,
        accounts: sql<number>`COUNT(DISTINCT ${monthlyData.merchantId})`,
      })
      .from(monthlyData)
      .where(and(sql`${monthlyData.month} = ${month}`, eq(monthlyData.agencyId, agencyId)))
      .groupBy(monthlyData.processorId)
      .orderBy(desc(sql`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`));

    res.json({
      success: true,
      month,
      previousMonth,
      metrics: {
        month,
        totalRevenue,
        totalVolume: Number(currentStats?.totalVolume || 0),
        totalTransactions: Number(currentStats?.totalTransactions || 0),
        totalAccounts,
        retentionRate: Math.round(retentionRate * 10) / 10,
        attritionRate: Math.round(attritionRate * 10) / 10,
        revenuePerAccount: totalAccounts > 0 ? Math.round((totalRevenue / totalAccounts) * 100) / 100 : 0,
        momRevenueChange,
        momRevenueChangePercent: momRevenueChangePercent !== null 
          ? Math.round(momRevenueChangePercent * 10) / 10 
          : null,
        retainedAccounts,
        newAccounts,
        lostAccounts,
        netAccountGrowth: newAccounts - lostAccounts,
        processorBreakdown: processorBreakdown.map(p => ({
          processorId: p.processorId,
          revenue: Number(p.revenue),
          accounts: Number(p.accounts),
          percentOfTotal: totalRevenue > 0 
            ? Math.round((Number(p.revenue) / totalRevenue) * 1000) / 10 
            : 0,
        })),
      }
    });
  } catch (error) {
    console.error("Error fetching month metrics:", error);
    res.status(500).json({ error: "Failed to fetch month metrics" });
  }
});

// Get top merchants by revenue for a month (REQUIRES organization)
router.get("/top-merchants/:month", async (req, res) => {
  try {
    const agencyId = await validateAndResolveOrganization(req, res);
    if (agencyId === null) return;
    
    const { month } = req.params;
    const { limit = '10' } = req.query;

    const topMerchants = await db.execute(sql`
      SELECT 
        m.id,
        m.mid,
        m.dba,
        m.legal_name,
        p.name as processor,
        COALESCE(SUM(CAST(md.net AS DECIMAL)), 0) as revenue,
        COALESCE(SUM(CAST(md.sales_amount AS DECIMAL)), 0) as volume,
        COALESCE(SUM(md.transactions), 0) as transactions
      FROM monthly_data md
      JOIN merchants m ON md.merchant_id = m.id
      JOIN processors p ON md.processor_id = p.id
      WHERE md.month = ${month} AND md.agency_id = ${agencyId}
      GROUP BY m.id, m.mid, m.dba, m.legal_name, p.name
      ORDER BY revenue DESC
      LIMIT ${parseInt(limit as string)}
    `);

    res.json({
      success: true,
      month,
      topMerchants: topMerchants.rows.map((row: any) => ({
        merchantId: row.id,
        mid: row.mid,
        name: row.dba || row.legal_name || row.mid,
        processor: row.processor,
        revenue: Number(row.revenue || 0),
        volume: Number(row.volume || 0),
        transactions: Number(row.transactions || 0),
      }))
    });
  } catch (error) {
    console.error("Error fetching top merchants:", error);
    res.status(500).json({ error: "Failed to fetch top merchants" });
  }
});

// Get top gainers and losers (merchants with biggest revenue changes) (REQUIRES organization)
router.get("/gainers-losers", async (req, res) => {
  try {
    const agencyId = await validateAndResolveOrganization(req, res);
    if (agencyId === null) return;
    
    const { limit = '5' } = req.query;
    
    // Get the two most recent months for this agency
    const allMonthsResult = await db
      .select({ month: monthlyData.month })
      .from(monthlyData)
      .where(eq(monthlyData.agencyId, agencyId))
      .groupBy(monthlyData.month)
      .orderBy(desc(monthlyData.month));
    
    const allMonths = allMonthsResult.map(r => r.month);
    if (allMonths.length < 2) {
      return res.json({ success: true, gainers: [], losers: [], message: "Need at least 2 months of data" });
    }
    
    const currentMonth = allMonths[0];
    const previousMonth = allMonths[1];
    
    // Get revenue by merchant for both months (filtered by agency)
    const merchantRevenue = await db.execute(sql`
      WITH current_month AS (
        SELECT 
          m.id,
          m.mid,
          m.dba,
          m.legal_name,
          COALESCE(SUM(CAST(md.net AS DECIMAL)), 0) as revenue
        FROM monthly_data md
        JOIN merchants m ON md.merchant_id = m.id
        WHERE md.month = ${currentMonth} AND md.agency_id = ${agencyId}
        GROUP BY m.id, m.mid, m.dba, m.legal_name
      ),
      previous_month AS (
        SELECT 
          m.id,
          COALESCE(SUM(CAST(md.net AS DECIMAL)), 0) as revenue
        FROM monthly_data md
        JOIN merchants m ON md.merchant_id = m.id
        WHERE md.month = ${previousMonth} AND md.agency_id = ${agencyId}
        GROUP BY m.id
      )
      SELECT 
        cm.id,
        cm.mid,
        cm.dba,
        cm.legal_name,
        COALESCE(pm.revenue, 0) as previous_revenue,
        cm.revenue as current_revenue,
        cm.revenue - COALESCE(pm.revenue, 0) as revenue_change,
        CASE 
          WHEN COALESCE(pm.revenue, 0) > 0 
          THEN ((cm.revenue - pm.revenue) / pm.revenue * 100)
          ELSE CASE WHEN cm.revenue > 0 THEN 100000 ELSE 0 END
        END as change_percent
      FROM current_month cm
      LEFT JOIN previous_month pm ON cm.id = pm.id
      ORDER BY revenue_change DESC
    `);

    const allMerchants = merchantRevenue.rows.map((row: any) => ({
      id: row.id,
      mid: row.mid,
      name: row.dba || row.legal_name || row.mid,
      previousRevenue: Number(row.previous_revenue || 0),
      currentRevenue: Number(row.current_revenue || 0),
      revenueChange: Number(row.revenue_change || 0),
      changePercent: Number(row.change_percent || 0),
    }));

    // Split into gainers (positive change) and losers (negative change)
    const gainers = allMerchants
      .filter(m => m.revenueChange > 0)
      .slice(0, parseInt(limit as string));
    
    const losers = allMerchants
      .filter(m => m.revenueChange < 0)
      .sort((a, b) => a.revenueChange - b.revenueChange)
      .slice(0, parseInt(limit as string));

    res.json({
      success: true,
      currentMonth,
      previousMonth,
      gainers,
      losers
    });
  } catch (error) {
    console.error("Error fetching gainers/losers:", error);
    res.status(500).json({ error: "Failed to fetch gainers and losers" });
  }
});

// Get branch/processor performance leaderboard (REQUIRES organization)
router.get("/branch-leaderboard", async (req, res) => {
  try {
    const agencyId = await validateAndResolveOrganization(req, res);
    if (agencyId === null) return;
    
    // Get the most recent month for this agency
    const [latestMonth] = await db
      .select({ month: monthlyData.month })
      .from(monthlyData)
      .where(eq(monthlyData.agencyId, agencyId))
      .orderBy(desc(monthlyData.month))
      .limit(1);
    
    if (!latestMonth) {
      return res.json({ success: true, branches: [], message: "No data available" });
    }

    const month = latestMonth.month;
    const [year, monthNum] = month.split('-');
    const previousMonth = monthNum === '01' 
      ? `${Number(year) - 1}-12`
      : `${year}-${String(Number(monthNum) - 1).padStart(2, '0')}`;

    // Get processor performance with retention calculation (filtered by agency)
    const processorStats = await db.execute(sql`
      WITH current_data AS (
        SELECT 
          p.id as processor_id,
          p.name as processor_name,
          COALESCE(SUM(CAST(md.net AS DECIMAL)), 0) as revenue,
          COUNT(DISTINCT md.merchant_id) as accounts
        FROM monthly_data md
        JOIN processors p ON md.processor_id = p.id
        WHERE md.month = ${month} AND md.agency_id = ${agencyId}
        GROUP BY p.id, p.name
      ),
      previous_merchants AS (
        SELECT 
          processor_id,
          merchant_id
        FROM monthly_data
        WHERE month = ${previousMonth} AND agency_id = ${agencyId}
      ),
      current_merchants AS (
        SELECT 
          processor_id,
          merchant_id
        FROM monthly_data
        WHERE month = ${month} AND agency_id = ${agencyId}
      ),
      retention_calc AS (
        SELECT 
          pm.processor_id,
          COUNT(pm.merchant_id) as prev_count,
          COUNT(CASE WHEN cm.merchant_id IS NOT NULL THEN 1 END) as retained_count
        FROM previous_merchants pm
        LEFT JOIN current_merchants cm 
          ON pm.processor_id = cm.processor_id 
          AND pm.merchant_id = cm.merchant_id
        GROUP BY pm.processor_id
      )
      SELECT 
        cd.processor_id,
        cd.processor_name,
        cd.revenue,
        cd.accounts,
        CASE WHEN cd.accounts > 0 THEN cd.revenue / cd.accounts ELSE 0 END as avg_per_account,
        COALESCE(
          CASE WHEN rc.prev_count > 0 
          THEN (rc.retained_count::float / rc.prev_count::float * 100) 
          ELSE 100 END, 
          100
        ) as retention_rate
      FROM current_data cd
      LEFT JOIN retention_calc rc ON cd.processor_id = rc.processor_id
      ORDER BY cd.revenue DESC
    `);

    const branches = processorStats.rows.map((row: any, index: number) => ({
      rank: index + 1,
      branchId: row.processor_id?.toString() || 'unknown',
      branchName: row.processor_name || `Processor ${row.processor_id}`,
      revenue: Number(row.revenue || 0),
      accounts: Number(row.accounts || 0),
      avgPerAccount: Number(row.avg_per_account || 0),
      retentionRate: Number(row.retention_rate || 100),
    }));

    res.json({
      success: true,
      month,
      subtitle: `Ranked by total revenue • ${month}`,
      branches
    });
  } catch (error) {
    console.error("Error fetching branch leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch branch leaderboard" });
  }
});

// Get revenue concentration data (top 10 merchants as % of total) (REQUIRES organization)
router.get("/concentration", async (req, res) => {
  try {
    const agencyId = await validateAndResolveOrganization(req, res);
    if (agencyId === null) return;
    
    // Get the most recent month for this agency
    const [latestMonth] = await db
      .select({ month: monthlyData.month })
      .from(monthlyData)
      .where(eq(monthlyData.agencyId, agencyId))
      .orderBy(desc(monthlyData.month))
      .limit(1);
    
    if (!latestMonth) {
      return res.json({ success: true, concentration: 0, riskLevel: 'LOW' });
    }

    const month = latestMonth.month;
    
    // Get total revenue for the month (filtered by agency)
    const [totalResult] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`,
      })
      .from(monthlyData)
      .where(and(sql`${monthlyData.month} = ${month}`, eq(monthlyData.agencyId, agencyId)));
    
    const totalRevenue = Number(totalResult?.totalRevenue || 0);
    
    if (totalRevenue === 0) {
      return res.json({ success: true, concentration: 0, riskLevel: 'LOW', month });
    }

    // Get top 10 merchants' revenue (filtered by agency)
    const top10 = await db
      .select({
        merchantRevenue: sql<number>`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`,
      })
      .from(monthlyData)
      .where(and(sql`${monthlyData.month} = ${month}`, eq(monthlyData.agencyId, agencyId)))
      .groupBy(monthlyData.merchantId)
      .orderBy(desc(sql`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`))
      .limit(10);
    
    const top10Revenue = top10.reduce((sum, m) => sum + Number(m.merchantRevenue || 0), 0);
    const concentration = (top10Revenue / totalRevenue) * 100;
    
    // Determine risk level based on concentration
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (concentration >= 80) riskLevel = 'HIGH';
    else if (concentration >= 60) riskLevel = 'MEDIUM';

    res.json({
      success: true,
      month,
      concentration: Math.round(concentration * 10) / 10,
      riskLevel,
      top10Revenue,
      totalRevenue,
    });
  } catch (error) {
    console.error("Error fetching concentration:", error);
    res.status(500).json({ error: "Failed to fetch concentration data" });
  }
});

// Data Validation - Check for missing months per processor
router.get("/data-validation", async (req, res) => {
  try {
    const agencyId = await validateAndResolveOrganization(req, res);
    if (agencyId === null) return;

    // Get the last 12 months
    const months: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // Get data coverage per processor
    const coverage = await db
      .select({
        processorId: monthlyData.processorId,
        month: monthlyData.month,
        recordCount: sql<number>`COUNT(*)`.as('recordCount'),
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${monthlyData.net} AS DECIMAL)), 0)`.as('totalRevenue'),
      })
      .from(monthlyData)
      .where(and(
        eq(monthlyData.agencyId, agencyId),
        sql`${monthlyData.month} >= ${months[0]}`
      ))
      .groupBy(monthlyData.processorId, monthlyData.month)
      .orderBy(monthlyData.processorId, monthlyData.month);

    // Build processor -> months map
    const processorData: Record<number, { months: Record<string, { count: number; revenue: number }> }> = {};
    
    for (const row of coverage) {
      if (row.processorId === null) continue;
      if (!processorData[row.processorId]) {
        processorData[row.processorId] = { months: {} };
      }
      processorData[row.processorId].months[row.month] = {
        count: Number(row.recordCount),
        revenue: Number(row.totalRevenue),
      };
    }

    // Find missing months for each processor
    const validation = Object.entries(processorData).map(([processorId, data]) => {
      const missingMonths = months.filter(m => !data.months[m]);
      const presentMonths = months.filter(m => data.months[m]);
      return {
        processorId: Number(processorId),
        missingMonths,
        presentMonths,
        coverage: presentMonths.length / months.length * 100,
        hasGaps: missingMonths.length > 0,
      };
    });

    res.json({
      success: true,
      months,
      validation: validation.sort((a, b) => a.coverage - b.coverage),
      summary: {
        totalProcessors: validation.length,
        processorsWithGaps: validation.filter(v => v.hasGaps).length,
        avgCoverage: validation.reduce((sum, v) => sum + v.coverage, 0) / (validation.length || 1),
      },
    });
  } catch (error) {
    console.error("Error fetching data validation:", error);
    res.status(500).json({ error: "Failed to fetch data validation" });
  }
});

export default router;
