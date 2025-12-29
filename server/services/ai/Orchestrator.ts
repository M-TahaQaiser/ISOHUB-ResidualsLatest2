import { ToolRegistry, ToolContext, ToolResult } from "./ToolRegistry";
import { ToolDispatcher, ToolCall, ToolExecutionResult } from "./ToolDispatcher";
import { MemoryStore } from "./MemoryStore";

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  toolName?: string;
  toolParams?: Record<string, any>;
  condition?: (context: WorkflowContext) => boolean;
  onComplete?: (result: ToolResult, context: WorkflowContext) => void;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  onComplete?: (context: WorkflowContext) => Promise<string>;
}

export interface WorkflowContext {
  organizationId: string;
  agencyId?: number;
  userId?: number;
  chatId?: number;
  stepResults: Record<string, ToolResult>;
  variables: Record<string, any>;
  currentStepIndex: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

const activeWorkflows: Map<string, WorkflowContext> = new Map();

export const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  {
    id: "merchant_analysis",
    name: "Merchant Analysis",
    description: "Analyze a merchant's performance including revenue trends and commission assignments",
    steps: [
      {
        id: "lookup",
        name: "Find Merchant",
        description: "Look up merchant by name or MID",
        toolName: "lookup_merchant"
      },
      {
        id: "revenue",
        name: "Get Revenue Data",
        description: "Retrieve revenue history",
        toolName: "get_merchant_revenue",
        condition: (ctx) => ctx.stepResults.lookup?.success === true
      },
      {
        id: "assignments",
        name: "Get Assignments",
        description: "Retrieve role assignments",
        toolName: "get_agent_assignments",
        condition: (ctx) => ctx.stepResults.lookup?.success === true
      }
    ],
    onComplete: async (context) => {
      const merchant = context.stepResults.lookup?.data?.[0];
      const revenue = context.stepResults.revenue?.data;
      
      if (!merchant) {
        return "Could not find the requested merchant.";
      }

      let summary = `## Merchant Analysis: ${merchant.legalName || merchant.dba}\n\n`;
      summary += `**MID:** ${merchant.mid}\n`;
      summary += `**Status:** ${merchant.status || "Unknown"}\n`;
      summary += `**Current Processor:** ${merchant.currentProcessor || "Not assigned"}\n\n`;

      if (revenue) {
        summary += `### Revenue Summary\n`;
        summary += `- **Total Revenue:** $${revenue.totalRevenue?.toLocaleString() || 0}\n`;
        summary += `- **Months Tracked:** ${revenue.monthCount || 0}\n\n`;
      }

      return summary;
    }
  },
  {
    id: "portfolio_overview",
    name: "Portfolio Overview",
    description: "Get a comprehensive overview of the merchant portfolio",
    steps: [
      {
        id: "summary",
        name: "Get Portfolio Summary",
        description: "Retrieve portfolio statistics",
        toolName: "get_portfolio_summary"
      },
      {
        id: "user_info",
        name: "Get User Context",
        description: "Get current user information",
        toolName: "get_current_user_info"
      }
    ],
    onComplete: async (context) => {
      const summary = context.stepResults.summary?.data;
      const user = context.stepResults.user_info?.data;

      let report = `## Portfolio Overview\n\n`;
      
      if (user) {
        report += `*Prepared for: ${user.firstName} ${user.lastName}*\n\n`;
      }

      if (summary) {
        report += `### Key Metrics\n`;
        report += `- **Total Merchants:** ${summary.totalMerchants?.toLocaleString() || 0}\n\n`;

        if (summary.processorBreakdown?.length > 0) {
          report += `### By Processor\n`;
          for (const proc of summary.processorBreakdown) {
            report += `- **${proc.processor}:** ${proc.merchantCount} merchants, $${proc.revenue?.toLocaleString() || 0} revenue\n`;
          }
        }
      }

      return report;
    }
  }
];

export class Orchestrator {
  private static workflows: Map<string, WorkflowDefinition> = new Map();

  static initialize() {
    for (const workflow of WORKFLOW_DEFINITIONS) {
      this.workflows.set(workflow.id, workflow);
    }
    console.log(`[Orchestrator] Initialized with ${this.workflows.size} workflows`);
  }

  static getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  static getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  static async startWorkflow(
    workflowId: string,
    initialParams: Record<string, any>,
    toolContext: ToolContext
  ): Promise<{ workflowKey: string; context: WorkflowContext }> {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowId}`);
    }

    const workflowKey = `${workflowId}-${Date.now()}`;
    const context: WorkflowContext = {
      organizationId: toolContext.organizationId,
      agencyId: toolContext.agencyId,
      userId: toolContext.userId,
      chatId: toolContext.chatId,
      stepResults: {},
      variables: initialParams,
      currentStepIndex: 0,
      status: "pending",
      startedAt: new Date()
    };

    activeWorkflows.set(workflowKey, context);

    return { workflowKey, context };
  }

  static async executeWorkflow(
    workflowKey: string,
    toolContext: ToolContext
  ): Promise<{ success: boolean; result?: string; error?: string }> {
    const context = activeWorkflows.get(workflowKey);
    if (!context) {
      return { success: false, error: "Workflow not found" };
    }

    const workflowId = workflowKey.split("-")[0];
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      return { success: false, error: "Workflow definition not found" };
    }

    context.status = "in_progress";

    try {
      for (let i = context.currentStepIndex; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        context.currentStepIndex = i;

        if (step.condition && !step.condition(context)) {
          console.log(`[Orchestrator] Skipping step ${step.id} - condition not met`);
          continue;
        }

        if (step.toolName) {
          const params = {
            ...context.variables,
            ...step.toolParams
          };

          const toolCall: ToolCall = {
            id: `${workflowKey}-${step.id}`,
            name: step.toolName,
            input: params
          };

          const result = await ToolDispatcher.executeToolCall(toolCall, toolContext);
          context.stepResults[step.id] = result.result;

          if (step.onComplete) {
            step.onComplete(result.result, context);
          }
        }
      }

      context.status = "completed";
      context.completedAt = new Date();

      let finalResult: string | undefined;
      if (workflow.onComplete) {
        finalResult = await workflow.onComplete(context);
      }

      await MemoryStore.storeMemory(
        context.organizationId,
        "insight",
        `workflow_${workflowId}`,
        `Completed ${workflow.name} workflow`,
        { userId: context.userId, metadata: { workflowKey } }
      );

      return { success: true, result: finalResult };
    } catch (error) {
      context.status = "failed";
      context.error = String(error);
      return { success: false, error: String(error) };
    }
  }

  static getWorkflowStatus(workflowKey: string): WorkflowContext | undefined {
    return activeWorkflows.get(workflowKey);
  }

  static cleanupOldWorkflows(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    for (const [key, context] of activeWorkflows.entries()) {
      if (now - context.startedAt.getTime() > maxAgeMs) {
        activeWorkflows.delete(key);
      }
    }
  }
}

Orchestrator.initialize();
