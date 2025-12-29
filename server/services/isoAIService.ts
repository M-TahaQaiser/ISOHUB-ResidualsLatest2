import { db } from "../db";
import { 
  organizations, 
  agents, 
  merchants, 
  reports, 
  commissions, 
  teams, 
  activities,
  type Agent,
  type Merchant,
  type Report,
  type Commission,
  type Organization,
  type InsertAgent,
  type InsertMerchant,
  type InsertReport,
  type InsertCommission,
  type InsertActivity
} from "../../shared/iso-ai-schema";
import { eq, and, desc, sql } from "drizzle-orm";

export class ISOAIService {
  // Organization methods
  static async getOrganization(id: string): Promise<Organization | null> {
    try {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
      return org || null;
    } catch (error) {
      console.error("Error fetching organization:", error);
      return null;
    }
  }

  static async ensureOrganization(id: string, name: string): Promise<Organization> {
    try {
      let org = await this.getOrganization(id);
      
      if (!org) {
        const [newOrg] = await db.insert(organizations).values({
          id,
          name,
          type: "iso",
          isActive: true,
        }).returning();
        org = newOrg;
      }
      
      return org;
    } catch (error) {
      console.error("Error ensuring organization:", error);
      throw error;
    }
  }

  // Agent methods
  static async getAgents(organizationId: string): Promise<Agent[]> {
    try {
      return await db.select()
        .from(agents)
        .where(and(
          eq(agents.organizationId, organizationId),
          eq(agents.isActive, true)
        ))
        .orderBy(agents.firstName, agents.lastName);
    } catch (error) {
      console.error("Error fetching agents:", error);
      return [];
    }
  }

  static async getAgent(id: string): Promise<Agent | null> {
    try {
      const [agent] = await db.select().from(agents).where(eq(agents.id, id));
      return agent || null;
    } catch (error) {
      console.error("Error fetching agent:", error);
      return null;
    }
  }

  static async createAgent(agentData: InsertAgent): Promise<Agent> {
    try {
      const [agent] = await db.insert(agents).values({
        id: agentData.id || `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...agentData,
      }).returning();

      // Log activity
      await this.logActivity({
        organizationId: agent.organizationId,
        agentId: agent.id,
        type: "agent_created",
        description: `Agent ${agent.firstName} ${agent.lastName} was created`,
        entityType: "agent",
        entityId: agent.id,
      });

      return agent;
    } catch (error) {
      console.error("Error creating agent:", error);
      throw error;
    }
  }

  static async updateAgent(id: string, updates: Partial<InsertAgent>): Promise<Agent> {
    try {
      const [agent] = await db.update(agents)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(agents.id, id))
        .returning();

      if (!agent) {
        throw new Error("Agent not found");
      }

      // Log activity
      await this.logActivity({
        organizationId: agent.organizationId,
        agentId: id,
        type: "agent_updated",
        description: `Agent ${agent.firstName} ${agent.lastName} was updated`,
        entityType: "agent",
        entityId: id,
        metadata: { updates },
      });

      return agent;
    } catch (error) {
      console.error("Error updating agent:", error);
      throw error;
    }
  }

  static async deleteAgent(id: string): Promise<void> {
    try {
      const agent = await this.getAgent(id);
      if (!agent) {
        throw new Error("Agent not found");
      }

      await db.update(agents)
        .set({ 
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(agents.id, id));

      // Log activity
      await this.logActivity({
        organizationId: agent.organizationId,
        agentId: id,
        type: "agent_deleted",
        description: `Agent ${agent.firstName} ${agent.lastName} was deactivated`,
        entityType: "agent",
        entityId: id,
      });
    } catch (error) {
      console.error("Error deleting agent:", error);
      throw error;
    }
  }

  // Merchant methods
  static async getMerchants(organizationId: string, agentId?: string): Promise<Merchant[]> {
    try {
      const conditions = [eq(merchants.organizationId, organizationId)];
      if (agentId) {
        conditions.push(eq(merchants.agentId, agentId));
      }

      return await db.select()
        .from(merchants)
        .where(and(...conditions))
        .orderBy(merchants.businessName);
    } catch (error) {
      console.error("Error fetching merchants:", error);
      return [];
    }
  }

  static async createMerchant(merchantData: InsertMerchant): Promise<Merchant> {
    try {
      const [merchant] = await db.insert(merchants).values({
        id: merchantData.id || `merchant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...merchantData,
      }).returning();

      // Log activity
      await this.logActivity({
        organizationId: merchant.organizationId,
        agentId: merchant.agentId,
        type: "merchant_created",
        description: `Merchant ${merchant.businessName} was created`,
        entityType: "merchant",
        entityId: merchant.id,
      });

      return merchant;
    } catch (error) {
      console.error("Error creating merchant:", error);
      throw error;
    }
  }

  // Report methods
  static async getReports(organizationId: string, agentId?: string): Promise<Report[]> {
    try {
      const conditions = [eq(reports.organizationId, organizationId)];
      if (agentId) {
        conditions.push(eq(reports.agentId, agentId));
      }

      return await db.select()
        .from(reports)
        .where(and(...conditions))
        .orderBy(desc(reports.createdAt));
    } catch (error) {
      console.error("Error fetching reports:", error);
      return [];
    }
  }

  static async createReport(reportData: InsertReport): Promise<Report> {
    try {
      const [report] = await db.insert(reports).values({
        id: reportData.id || `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...reportData,
      }).returning();

      // Log activity
      await this.logActivity({
        organizationId: report.organizationId,
        agentId: report.agentId,
        type: "report_created",
        description: `${report.reportType} report was created`,
        entityType: "report",
        entityId: report.id,
      });

      return report;
    } catch (error) {
      console.error("Error creating report:", error);
      throw error;
    }
  }

  // Dashboard metrics
  static async getDashboardMetrics(organizationId: string): Promise<{
    totalAgents: number;
    totalMerchants: number;
    totalReports: number;
    approvedReports: number;
    pendingApprovals: number;
    monthlyCommissions: number;
  }> {
    try {
      const [agentCount] = await db.select({ count: sql<number>`count(*)` })
        .from(agents)
        .where(and(eq(agents.organizationId, organizationId), eq(agents.isActive, true)));

      const [merchantCount] = await db.select({ count: sql<number>`count(*)` })
        .from(merchants)
        .where(eq(merchants.organizationId, organizationId));

      const [reportCount] = await db.select({ count: sql<number>`count(*)` })
        .from(reports)
        .where(eq(reports.organizationId, organizationId));

      const [approvedCount] = await db.select({ count: sql<number>`count(*)` })
        .from(reports)
        .where(and(
          eq(reports.organizationId, organizationId),
          eq(reports.status, "approved")
        ));

      const [pendingCount] = await db.select({ count: sql<number>`count(*)` })
        .from(reports)
        .where(and(
          eq(reports.organizationId, organizationId),
          eq(reports.status, "pending")
        ));

      const currentMonth = new Date().toISOString().substr(0, 7); // YYYY-MM
      const [commissionsSum] = await db.select({ 
        total: sql<number>`coalesce(sum(amount), 0)` 
      })
        .from(commissions)
        .where(and(
          eq(commissions.organizationId, organizationId),
          eq(commissions.period, currentMonth)
        ));

      return {
        totalAgents: agentCount.count,
        totalMerchants: merchantCount.count,
        totalReports: reportCount.count,
        approvedReports: approvedCount.count,
        pendingApprovals: pendingCount.count,
        monthlyCommissions: commissionsSum.total,
      };
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      return {
        totalAgents: 0,
        totalMerchants: 0,
        totalReports: 0,
        approvedReports: 0,
        pendingApprovals: 0,
        monthlyCommissions: 0,
      };
    }
  }

  static async getTopAgents(organizationId: string, limit: number = 5): Promise<Agent[]> {
    try {
      // Get agents with their merchant counts
      const topAgents = await db.select({
        agent: agents,
        merchantCount: sql<number>`count(${merchants.id})`,
      })
        .from(agents)
        .leftJoin(merchants, eq(agents.id, merchants.agentId))
        .where(and(
          eq(agents.organizationId, organizationId),
          eq(agents.isActive, true)
        ))
        .groupBy(agents.id)
        .orderBy(desc(sql`count(${merchants.id})`))
        .limit(limit);

      return topAgents.map(result => ({
        ...result.agent,
        merchantCount: result.merchantCount,
      })) as Agent[];
    } catch (error) {
      console.error("Error fetching top agents:", error);
      return [];
    }
  }

  static async getRecentActivity(organizationId: string, limit: number = 10) {
    try {
      return await db.select()
        .from(activities)
        .where(eq(activities.organizationId, organizationId))
        .orderBy(desc(activities.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      return [];
    }
  }

  // Activity logging
  static async logActivity(activityData: InsertActivity): Promise<void> {
    try {
      await db.insert(activities).values({
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...activityData,
      });
    } catch (error) {
      console.error("Error logging activity:", error);
      // Don't throw - activity logging should not break main functionality
    }
  }

  // Initialize sample data
  static async initializeSampleData(organizationId: string): Promise<void> {
    try {
      // Ensure organization exists
      await this.ensureOrganization(organizationId, "Tracer Organization");

      // Check if agents already exist
      const existingAgents = await this.getAgents(organizationId);
      if (existingAgents.length > 0) {
        return; // Already initialized
      }

      // Create sample agents
      const sampleAgents = [
        {
          organizationId,
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          role: "Manager" as const,
        },
        {
          organizationId,
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@example.com",
          role: "Users/Reps" as const,
        },
        {
          organizationId,
          firstName: "Mike",
          lastName: "Johnson",
          email: "mike.johnson@example.com",
          role: "Team Leaders" as const,
        },
      ];

      for (const agentData of sampleAgents) {
        await this.createAgent(agentData);
      }

      console.log("ISO-AI sample data initialized");
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }
}