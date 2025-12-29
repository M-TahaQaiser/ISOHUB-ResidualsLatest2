import { Router } from "express";
import { db } from "../db";
import { users, assignments, monthlyData, merchants } from "@shared/schema";
import { eq, and, sum, count, sql } from "drizzle-orm";

const router = Router();

// Get agent-specific metrics for filtered dashboard
router.get("/agent/:agentId/metrics", async (req, res) => {
  try {
    const { agentId } = req.params;

    // Get agent's assigned merchants
    const agentAssignments = await db
      .select({ merchantId: assignments.merchantId })
      .from(assignments)
      .where(eq(assignments.agentId, agentId));

    const merchantIds = agentAssignments.map(a => a.merchantId);

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

    // Get current month's data for agent's merchants
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const currentMonthData = await db
      .select({
        revenue: sum(monthlyData.revenue),
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
        revenue: sum(monthlyData.revenue)
      })
      .from(monthlyData)
      .where(
        and(
          sql`${monthlyData.merchantId} = ANY(${merchantIds})`,
          eq(monthlyData.month, prevMonthStr)
        )
      );

    // Calculate metrics
    const currentRevenue = Number(currentMonthData[0]?.revenue || 0);
    const previousRevenue = Number(previousMonthData[0]?.revenue || 0);
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    // Get recent reports for agent
    const recentReports = await db
      .select({
        name: merchants.businessName,
        amount: monthlyData.revenue,
        month: monthlyData.month
      })
      .from(monthlyData)
      .innerJoin(merchants, eq(monthlyData.merchantId, merchants.mid))
      .where(sql`${monthlyData.merchantId} = ANY(${merchantIds})`)
      .orderBy(sql`${monthlyData.month} DESC`)
      .limit(5);

    // Mock some additional metrics (in real app these would come from actual data)
    const metrics = {
      totalRevenue: currentRevenue,
      revenueChange: Number(revenueChange.toFixed(2)),
      activeLeads: merchantIds.length,
      newLeads: Math.floor(merchantIds.length * 0.2), // 20% are "new"
      conversionRate: merchantIds.length > 0 ? 75 : 0, // Mock conversion rate
      conversions: Math.floor(merchantIds.length * 0.75),
      pendingApps: Math.floor(merchantIds.length * 0.1),
      approvedLeads: Math.floor(merchantIds.length * 0.8),
      pendingLeads: Math.floor(merchantIds.length * 0.15),
      attentionNeeded: Math.floor(merchantIds.length * 0.05),
      recentReports: recentReports.map(report => ({
        name: report.name,
        amount: Number(report.amount)
      }))
    };

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching agent metrics:", error);
    res.status(500).json({ error: "Failed to fetch agent metrics" });
  }
});

// Get filtered dashboard data based on user role
router.get("/dashboard/filtered/:userId/:role", async (req, res) => {
  try {
    const { userId, role } = req.params;

    if (role === 'Agent') {
      // For agents, redirect to agent metrics
      return res.redirect(`/api/agent/${userId}/metrics`);
    }

    // For admins and other roles, return organization-wide data
    const totalRevenue = await db
      .select({ total: sum(monthlyData.revenue) })
      .from(monthlyData);

    const totalAgents = await db
      .select({ count: count(users.id) })
      .from(users)
      .where(eq(users.role, 'Agent'));

    const organizationMetrics = {
      totalRevenue: Number(totalRevenue[0]?.total || 0),
      totalAgents: Number(totalAgents[0]?.count || 0),
      totalMerchants: 0, // Would be calculated from actual data
      totalProcessors: 7, // Current processor count
    };

    res.json(organizationMetrics);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;