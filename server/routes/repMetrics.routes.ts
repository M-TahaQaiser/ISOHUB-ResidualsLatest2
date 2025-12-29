import { Router } from "express";
import { db } from "../db";
import { users, assignments, monthlyData, merchants } from "@shared/schema";
import { eq, and, sum, count, sql } from "drizzle-orm";

const router = Router();

// Get rep-specific metrics for filtered dashboard
router.get("/rep/:repId/metrics", async (req, res) => {
  try {
    const { repId } = req.params;

    // Get rep's assigned merchants
    const repAssignments = await db
      .select({ merchantId: assignments.merchantId })
      .from(assignments)
      .where(eq(assignments.repId, repId));

    const merchantIds = repAssignments.map(a => a.merchantId);

    if (merchantIds.length === 0) {
      return res.json({
        totalRevenue: 0,
        revenueChange: 0,
        activeLeads: 0,
        newLeads: 0,
        conversionRate: 0,
        conversions: 0,
        pendingApps: 0,
        approvedLeads: 0,
        pendingLeads: 0,
        attentionNeeded: 0,
        recentReports: []
      });
    }

    // Get current month's data for rep's merchants
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const currentMonthData = await db
      .select({
        revenue: sum(monthlyData.monthlyRevenue),
        merchantCount: count(monthlyData.id)
      })
      .from(monthlyData)
      .where(
        and(
          sql`${monthlyData.merchantId} = ANY(${merchantIds})`,
          eq(monthlyData.month, currentMonth)
        )
      );

    // Get previous month's data for comparison
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const prevMonthStr = previousMonth.toISOString().slice(0, 7);
    
    const previousMonthData = await db
      .select({
        revenue: sum(monthlyData.monthlyRevenue)
      })
      .from(monthlyData)
      .where(
        and(
          sql`${monthlyData.merchantId} = ANY(${merchantIds})`,
          eq(monthlyData.month, prevMonthStr)
        )
      );

    // Calculate revenue change
    const currentRevenue = Number(currentMonthData[0]?.revenue || 0);
    const previousRevenue = Number(previousMonthData[0]?.revenue || 0);
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // Get recent reports for rep
    const recentReportsData = await db
      .select({
        merchantName: merchants.legalName,
        revenue: monthlyData.monthlyRevenue,
        month: monthlyData.month
      })
      .from(monthlyData)
      .innerJoin(merchants, eq(monthlyData.merchantId, merchants.id))
      .where(sql`${monthlyData.merchantId} = ANY(${merchantIds})`)
      .orderBy(sql`${monthlyData.month} DESC`)
      .limit(10);

    const recentReports = recentReportsData.map(report => ({
      merchantName: report.merchantName,
      revenue: report.revenue,
      month: report.month,
      status: 'completed'
    }));

    res.json({
      totalRevenue: currentRevenue,
      revenueChange: Math.round(revenueChange * 100) / 100,
      activeLeads: currentMonthData[0]?.merchantCount || 0,
      newLeads: 0, // This would need additional tracking
      conversionRate: 0, // This would need additional tracking
      conversions: 0, // This would need additional tracking
      pendingApps: 0, // This would need additional tracking
      approvedLeads: 0, // This would need additional tracking
      pendingLeads: 0, // This would need additional tracking
      attentionNeeded: 0, // This would need additional tracking
      recentReports
    });

  } catch (error) {
    console.error("Error fetching rep metrics:", error);
    res.status(500).json({ error: "Failed to fetch rep metrics" });
  }
});

// Get general dashboard metrics with role-based filtering
router.get("/dashboard/metrics", async (req, res) => {
  try {
    const { role, userId } = req.query;

    if (role === 'Rep') {
      // For reps, redirect to rep metrics
      return res.redirect(`/api/rep/${userId}/metrics`);
    }

    // Get total metrics for admin/manager roles
    const totalMerchants = await db
      .select({ count: count() })
      .from(merchants);

    const totalReps = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'Rep'));

    res.json({
      totalMerchants: Number(totalMerchants[0]?.count || 0),
      totalReps: Number(totalReps[0]?.count || 0),
      totalRevenue: 0, // This would need aggregation
      monthlyGrowth: 0, // This would need calculation
    });

  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ error: "Failed to fetch dashboard metrics" });
  }
});

export default router;