import { ToolRegistry, ToolContext, ToolResult, ToolDefinition } from "./ToolRegistry";
import { db } from "../../db";
import { sql } from "drizzle-orm";

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  result: ToolResult;
  executionTimeMs: number;
}

export interface AuditLogEntry {
  timestamp: Date;
  toolName: string;
  userId?: number;
  organizationId: string;
  input: Record<string, any>;
  success: boolean;
  executionTimeMs: number;
  error?: string;
}

const auditLogs: AuditLogEntry[] = [];

export class ToolDispatcher {
  static async executeToolCall(
    toolCall: ToolCall,
    context: ToolContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const tool = ToolRegistry.getTool(toolCall.name);

    if (!tool) {
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        result: {
          success: false,
          error: `Unknown tool: ${toolCall.name}`
        },
        executionTimeMs: Date.now() - startTime
      };
    }

    if (tool.requiresAuth && !context.userId) {
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        result: {
          success: false,
          error: "Authentication required for this tool"
        },
        executionTimeMs: Date.now() - startTime
      };
    }

    try {
      const result = await tool.execute(toolCall.input, context);
      const executionTimeMs = Date.now() - startTime;

      if (tool.auditLog) {
        await this.logToolExecution({
          timestamp: new Date(),
          toolName: toolCall.name,
          userId: context.userId,
          organizationId: context.organizationId,
          input: this.sanitizeInput(toolCall.input),
          success: result.success,
          executionTimeMs,
          error: result.error
        });
      }

      return {
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        result,
        executionTimeMs
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (tool.auditLog) {
        await this.logToolExecution({
          timestamp: new Date(),
          toolName: toolCall.name,
          userId: context.userId,
          organizationId: context.organizationId,
          input: this.sanitizeInput(toolCall.input),
          success: false,
          executionTimeMs,
          error: errorMessage
        });
      }

      return {
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        result: {
          success: false,
          error: errorMessage
        },
        executionTimeMs
      };
    }
  }

  static async executeMultipleToolCalls(
    toolCalls: ToolCall[],
    context: ToolContext
  ): Promise<ToolExecutionResult[]> {
    return Promise.all(
      toolCalls.map(toolCall => this.executeToolCall(toolCall, context))
    );
  }

  private static sanitizeInput(input: Record<string, any>): Record<string, any> {
    const sanitized = { ...input };
    const sensitiveFields = ["password", "token", "secret", "apiKey", "ssn", "ein"];
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = "[REDACTED]";
      }
    }
    
    return sanitized;
  }

  private static async logToolExecution(entry: AuditLogEntry): Promise<void> {
    auditLogs.push(entry);
    
    if (auditLogs.length > 1000) {
      auditLogs.shift();
    }

    console.log(`[AI Tool] ${entry.toolName} - ${entry.success ? "SUCCESS" : "FAILED"} (${entry.executionTimeMs}ms)`);
  }

  static getRecentAuditLogs(limit: number = 50): AuditLogEntry[] {
    return auditLogs.slice(-limit);
  }

  static formatToolResultForAI(result: ToolExecutionResult): string {
    if (!result.result.success) {
      return `Tool "${result.toolName}" failed: ${result.result.error}`;
    }

    const data = result.result.data;
    if (typeof data === "string") {
      return data;
    }

    return JSON.stringify(data, null, 2);
  }
}
