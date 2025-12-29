import { db } from "../../db";
import { merchants, monthlyData, midRoleAssignments, users, masterDataset } from "../../../shared/schema";
import { eq, and, sql, desc, like, ilike, or } from "drizzle-orm";

export interface ToolParameter {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required?: boolean;
  enum?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  execute: (params: Record<string, any>, context: ToolContext) => Promise<ToolResult>;
  requiresAuth?: boolean;
  auditLog?: boolean;
}

export interface ToolContext {
  organizationId: string;
  agencyId?: number;
  userId?: number;
  chatId?: number;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  confidence?: number;
}

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    name: "lookup_merchant",
    description: "Search for merchant information by name, MID, or DBA. Returns merchant details including status and current processor.",
    parameters: {
      query: { type: "string", description: "Merchant name, MID, or DBA to search for", required: true },
      limit: { type: "number", description: "Maximum number of results to return (default 5)" }
    },
    requiresAuth: true,
    auditLog: true,
    execute: async (params, context) => {
      try {
        const searchQuery = `%${params.query}%`;
        const limit = params.limit || 5;

        const results = await db.select()
          .from(merchants)
          .where(and(
            eq(merchants.agencyId, context.agencyId || 0),
            or(
              ilike(merchants.legalName, searchQuery),
              ilike(merchants.mid, searchQuery),
              ilike(merchants.dba, searchQuery)
            )
          ))
          .limit(limit);

        return {
          success: true,
          data: results.map(m => ({
            mid: m.mid,
            legalName: m.legalName,
            dba: m.dba,
            status: m.status,
            currentProcessor: m.currentProcessor,
            partnerName: m.partnerName
          })),
          confidence: results.length > 0 ? 0.95 : 0.7
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },

  {
    name: "get_merchant_revenue",
    description: "Get revenue and financial data for a specific merchant over a time period using the master dataset.",
    parameters: {
      mid: { type: "string", description: "Merchant ID (MID)", required: true },
      limit: { type: "number", description: "Number of months to retrieve (default 12)" }
    },
    requiresAuth: true,
    auditLog: true,
    execute: async (params, context) => {
      try {
        const results = await db.select()
          .from(masterDataset)
          .where(and(
            eq(masterDataset.agencyId, context.agencyId || 0),
            eq(masterDataset.mid, params.mid)
          ))
          .orderBy(desc(masterDataset.month))
          .limit(params.limit || 12);

        const summary = {
          totalRevenue: results.reduce((sum, r) => sum + Number(r.totalRevenue || 0), 0),
          monthCount: results.length,
          processor: results[0]?.processor || "Unknown",
          monthlyData: results.map(r => ({
            month: r.month,
            revenue: Number(r.totalRevenue || 0),
            processor: r.processor
          }))
        };

        return {
          success: true,
          data: summary,
          confidence: results.length > 0 ? 0.95 : 0.5
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },

  {
    name: "get_agent_assignments",
    description: "Get merchant assignments for an agent/rep, including their commission percentages.",
    parameters: {
      agentName: { type: "string", description: "Name of the agent/rep to look up", required: true }
    },
    requiresAuth: true,
    auditLog: true,
    execute: async (params, context) => {
      try {
        const searchName = `%${params.agentName}%`;
        
        const assignments = await db.select({
          mid: midRoleAssignments.mid,
          merchantName: midRoleAssignments.merchantName,
          rep: midRoleAssignments.rep,
          repPercentage: midRoleAssignments.repPercentage,
          partner: midRoleAssignments.partner,
          partnerPercentage: midRoleAssignments.partnerPercentage,
          salesManager: midRoleAssignments.salesManager,
          salesManagerPercentage: midRoleAssignments.salesManagerPercentage,
          assignmentStatus: midRoleAssignments.assignmentStatus
        })
        .from(midRoleAssignments)
        .where(and(
          eq(midRoleAssignments.agencyId, context.agencyId || 0),
          or(
            ilike(midRoleAssignments.rep, searchName),
            ilike(midRoleAssignments.partner, searchName),
            ilike(midRoleAssignments.salesManager, searchName)
          )
        ))
        .limit(50);

        return {
          success: true,
          data: {
            agentName: params.agentName,
            assignmentCount: assignments.length,
            assignments
          },
          confidence: assignments.length > 0 ? 0.9 : 0.6
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },

  {
    name: "get_portfolio_summary",
    description: "Get a summary of the organization's merchant portfolio including total merchants and processor distribution.",
    parameters: {
      timeRange: { type: "string", description: "Time range: 'current_month', 'last_3_months', 'last_6_months', 'ytd'", enum: ["current_month", "last_3_months", "last_6_months", "ytd"] }
    },
    requiresAuth: true,
    execute: async (params, context) => {
      try {
        const merchantCount = await db.select({ count: sql<number>`count(*)` })
          .from(merchants)
          .where(eq(merchants.agencyId, context.agencyId || 0));

        const processorBreakdown = await db.select({
          processor: masterDataset.processor,
          totalRevenue: sql<number>`sum(${masterDataset.totalRevenue}::numeric)`,
          merchantCount: sql<number>`count(distinct ${masterDataset.mid})`
        })
        .from(masterDataset)
        .where(eq(masterDataset.agencyId, context.agencyId || 0))
        .groupBy(masterDataset.processor);

        return {
          success: true,
          data: {
            totalMerchants: merchantCount[0]?.count || 0,
            processorBreakdown: processorBreakdown.map(p => ({
              processor: p.processor,
              revenue: Number(p.totalRevenue || 0),
              merchantCount: p.merchantCount
            })),
            timeRange: params.timeRange || "current_month"
          },
          confidence: 0.95
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },

  {
    name: "search_knowledge_base",
    description: "Search the ISO Hub knowledge base for information about payment processing, residuals, or platform features.",
    parameters: {
      query: { type: "string", description: "Search query for knowledge base", required: true }
    },
    execute: async (params, context) => {
      try {
        const { ClaudeService } = await import("../ClaudeService");
        const results = await ClaudeService.searchKnowledgeBase(params.query, context.organizationId);
        
        return {
          success: true,
          data: results || "No relevant knowledge base entries found.",
          confidence: results ? 0.85 : 0.5
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },

  {
    name: "calculate_commission",
    description: "Calculate commission amounts based on revenue and role percentages.",
    parameters: {
      revenue: { type: "number", description: "Total revenue amount", required: true },
      netPercentage: { type: "number", description: "Net percentage (basis points or percentage)", required: true },
      rolePercentage: { type: "number", description: "Role split percentage (0-100)", required: true }
    },
    execute: async (params) => {
      try {
        const net = params.revenue * (params.netPercentage / 100);
        const commission = net * (params.rolePercentage / 100);

        return {
          success: true,
          data: {
            revenue: params.revenue,
            netAmount: Number(net.toFixed(2)),
            commission: Number(commission.toFixed(2)),
            formula: `$${params.revenue.toLocaleString()} × ${params.netPercentage}% × ${params.rolePercentage}% = $${commission.toFixed(2)}`
          },
          confidence: 1.0
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },

  {
    name: "get_current_user_info",
    description: "Get information about the current user including their role and permissions.",
    parameters: {},
    requiresAuth: true,
    execute: async (params, context) => {
      try {
        if (!context.userId) {
          return { success: false, error: "User not authenticated" };
        }

        const [user] = await db.select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
          firstName: users.firstName,
          lastName: users.lastName
        })
        .from(users)
        .where(eq(users.id, context.userId));

        return {
          success: true,
          data: user,
          confidence: 1.0
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },

  {
    name: "get_processor_list",
    description: "Get a list of available payment processors in the system.",
    parameters: {},
    execute: async (params, context) => {
      try {
        const { processors } = await import("../../../shared/schema");
        const processorList = await db.select({
          id: processors.id,
          name: processors.name,
          displayName: processors.displayName
        })
        .from(processors)
        .limit(50);

        return {
          success: true,
          data: processorList,
          confidence: 1.0
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },

  {
    name: "get_envelope_status",
    description: "Check the status of an ISO-Sign envelope for electronic signatures.",
    parameters: {
      envelopeId: { type: "string", description: "The envelope ID to check", required: true }
    },
    requiresAuth: true,
    auditLog: true,
    execute: async (params, context) => {
      try {
        const { isoSignEnvelopes, isoSignRecipients } = await import("../../../shared/schema");
        
        const [envelope] = await db.select()
          .from(isoSignEnvelopes)
          .where(and(
            eq(isoSignEnvelopes.id, params.envelopeId),
            eq(isoSignEnvelopes.organizationId, context.organizationId)
          ));

        if (!envelope) {
          return { success: false, error: "Envelope not found" };
        }

        const recipients = await db.select()
          .from(isoSignRecipients)
          .where(eq(isoSignRecipients.envelopeId, params.envelopeId));

        return {
          success: true,
          data: {
            id: envelope.id,
            status: envelope.status,
            subject: envelope.subject,
            createdAt: envelope.createdAt,
            expiresAt: envelope.expiresAt,
            recipients: recipients.map(r => ({
              name: r.name,
              email: r.email,
              status: r.status,
              signedAt: r.signedAt
            }))
          },
          confidence: 0.95
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },

  {
    name: "list_pending_signatures",
    description: "List envelopes pending signature for the current user or organization.",
    parameters: {
      status: { type: "string", description: "Filter by status: 'pending', 'sent', 'completed'", enum: ["pending", "sent", "completed", "all"] }
    },
    requiresAuth: true,
    execute: async (params, context) => {
      try {
        const { isoSignEnvelopes } = await import("../../../shared/schema");
        
        let query = db.select({
          id: isoSignEnvelopes.id,
          subject: isoSignEnvelopes.subject,
          status: isoSignEnvelopes.status,
          createdAt: isoSignEnvelopes.createdAt,
          expiresAt: isoSignEnvelopes.expiresAt
        })
        .from(isoSignEnvelopes)
        .where(eq(isoSignEnvelopes.organizationId, context.organizationId))
        .orderBy(desc(isoSignEnvelopes.createdAt))
        .limit(20);

        const envelopes = await query;
        const filtered = params.status && params.status !== "all" 
          ? envelopes.filter(e => e.status === params.status)
          : envelopes;

        return {
          success: true,
          data: {
            total: filtered.length,
            envelopes: filtered
          },
          confidence: 0.95
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },

  {
    name: "get_onboarding_progress",
    description: "Get the current onboarding progress for an agency including completed steps.",
    parameters: {
      agencyId: { type: "number", description: "Agency ID to check progress for" }
    },
    requiresAuth: true,
    execute: async (params, context) => {
      try {
        const { agencies } = await import("../../../shared/schema");
        const agencyIdToUse = params.agencyId || context.agencyId;

        if (!agencyIdToUse) {
          return { success: false, error: "No agency ID provided" };
        }

        const [agency] = await db.select()
          .from(agencies)
          .where(eq(agencies.id, agencyIdToUse));

        if (!agency) {
          return { success: false, error: "Agency not found" };
        }

        const steps = [
          { step: 1, name: "Instance Setup", field: "instancePreferences" },
          { step: 2, name: "Company Information", field: "companyInfo" },
          { step: 3, name: "Organization Chart", field: "teamStructure" },
          { step: 4, name: "Business Profile", field: "businessProfile" },
          { step: 5, name: "Vendor Selection", field: "vendors" },
          { step: 6, name: "Processor Report Setup", field: "processorMappings" },
          { step: 7, name: "Document Hub", field: "documentConfig" },
          { step: 8, name: "Dashboard Tour", field: "tourCompleted" }
        ];

        const progress = steps.map(s => ({
          ...s,
          completed: !!(agency as any)[s.field]
        }));

        const completedCount = progress.filter(s => s.completed).length;

        return {
          success: true,
          data: {
            agencyId: agencyIdToUse,
            agencyName: agency.name,
            completedSteps: completedCount,
            totalSteps: 8,
            percentComplete: Math.round((completedCount / 8) * 100),
            steps: progress
          },
          confidence: 0.95
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },

  {
    name: "get_next_onboarding_step",
    description: "Get details about the next incomplete onboarding step and what's needed.",
    parameters: {},
    requiresAuth: true,
    execute: async (params, context) => {
      try {
        const stepGuidance: Record<number, { description: string; requirements: string[] }> = {
          1: {
            description: "Set up your workspace preferences and terminology",
            requirements: ["Choose your preferred term for 'merchant'", "Set currency format", "Configure timezone"]
          },
          2: {
            description: "Enter your company details and contact information",
            requirements: ["Company legal name", "Business address", "Primary contact email", "Phone number"]
          },
          3: {
            description: "Define your team structure with roles and permissions",
            requirements: ["Add team members", "Assign roles", "Set up reporting hierarchy"]
          },
          4: {
            description: "Complete your business profile for personalized insights",
            requirements: ["Business type", "Years in operation", "Target markets", "Monthly volume estimates"]
          },
          5: {
            description: "Select your payment processors and partners",
            requirements: ["Choose active processors", "Add gateway partners", "Configure hardware vendors"]
          },
          6: {
            description: "Map your processor report columns to system fields",
            requirements: ["Upload sample report", "Map column headers", "Verify data extraction"]
          },
          7: {
            description: "Configure your document storage and integration",
            requirements: ["Choose storage provider", "Set up folder structure", "Configure access permissions"]
          },
          8: {
            description: "Take a tour of your new workspace",
            requirements: ["Review dashboard features", "Explore key functions", "Complete tutorial"]
          }
        };

        return {
          success: true,
          data: {
            message: "To get personalized next steps, use get_onboarding_progress first to see which step needs attention.",
            allSteps: stepGuidance
          },
          confidence: 0.8
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  }
];

export class ToolRegistry {
  private static tools: Map<string, ToolDefinition> = new Map();

  static initialize() {
    for (const tool of AVAILABLE_TOOLS) {
      this.tools.set(tool.name, tool);
    }
    console.log(`[ToolRegistry] Initialized with ${this.tools.size} tools`);
  }

  static getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  static getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  static getToolsForAnthropic(): any[] {
    return this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: "object",
        properties: Object.fromEntries(
          Object.entries(tool.parameters).map(([key, param]) => [
            key,
            {
              type: param.type,
              description: param.description,
              ...(param.enum ? { enum: param.enum } : {})
            }
          ])
        ),
        required: Object.entries(tool.parameters)
          .filter(([_, param]) => param.required)
          .map(([key]) => key)
      }
    }));
  }
}

ToolRegistry.initialize();
