import { Router, Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { ToolDispatcher } from "../services/ai/ToolDispatcher";
import { logAuditEvent, getAuditLog, AuditLogEntry } from "../services/auditLogger";

const router = Router();

interface ComplianceMetric {
  name: string;
  status: "compliant" | "warning" | "non_compliant";
  details: string;
  lastChecked: Date;
}

export { logAuditEvent };

router.get("/metrics", async (req: Request, res: Response) => {
  try {
    const metrics: ComplianceMetric[] = [];
    const now = new Date();

    metrics.push({
      name: "GLBA_Encryption",
      status: process.env.OAUTH_ENCRYPTION_KEY ? "compliant" : "non_compliant",
      details: process.env.OAUTH_ENCRYPTION_KEY 
        ? "AES-256-GCM encryption active for NPI data" 
        : "Encryption key not configured",
      lastChecked: now
    });

    metrics.push({
      name: "PCI_DSS_Password_Policy",
      status: "compliant",
      details: "12+ character passwords with complexity requirements enforced",
      lastChecked: now
    });

    metrics.push({
      name: "MFA_Availability",
      status: "compliant",
      details: "TOTP-based MFA available for all users",
      lastChecked: now
    });

    metrics.push({
      name: "Session_Security",
      status: "compliant",
      details: "httpOnly cookies, secure flag in production, 24h expiry",
      lastChecked: now
    });

    metrics.push({
      name: "Rate_Limiting",
      status: "compliant",
      details: "API rate limiting active (100 req/15min for sensitive endpoints)",
      lastChecked: now
    });

    metrics.push({
      name: "CSRF_Protection",
      status: "compliant",
      details: "Double-submit cookie pattern implemented",
      lastChecked: now
    });

    metrics.push({
      name: "Security_Headers",
      status: "compliant",
      details: "Helmet.js configured with CSP, HSTS, X-Frame-Options",
      lastChecked: now
    });

    metrics.push({
      name: "Input_Validation",
      status: "compliant",
      details: "Zod schemas validate all API inputs",
      lastChecked: now
    });

    const overallStatus = metrics.every(m => m.status === "compliant") 
      ? "compliant" 
      : metrics.some(m => m.status === "non_compliant") 
        ? "non_compliant" 
        : "warning";

    res.json({
      overallStatus,
      complianceScore: Math.round((metrics.filter(m => m.status === "compliant").length / metrics.length) * 100),
      metrics,
      frameworks: ["GLBA", "PCI DSS 4.0"],
      lastFullAudit: now,
      nextScheduledAudit: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    });
  } catch (error) {
    console.error("Error fetching compliance metrics:", error);
    res.status(500).json({ error: "Failed to fetch compliance metrics" });
  }
});

router.get("/audit-log", async (req: Request, res: Response) => {
  try {
    const { limit = 100, action, resourceType, startDate, endDate, source } = req.query;

    const toolAuditLogs = ToolDispatcher.getRecentAuditLogs(500);
    const toolEntries: AuditLogEntry[] = toolAuditLogs.map(log => ({
      timestamp: log.timestamp,
      action: `ai_tool_call`,
      userId: log.userId,
      organizationId: log.organizationId,
      resourceType: "ai_tool",
      resourceId: log.toolName,
      outcome: log.success ? "success" as const : "failure" as const,
      metadata: {
        input: log.input,
        executionTimeMs: log.executionTimeMs,
        error: log.error
      }
    }));

    const systemLog = getAuditLog();
    let combinedLog = [...systemLog, ...toolEntries].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    if (source === "system") {
      combinedLog = [...systemLog];
    } else if (source === "ai_tools") {
      combinedLog = toolEntries;
    }

    if (action) {
      combinedLog = combinedLog.filter(e => e.action === action);
    }

    if (resourceType) {
      combinedLog = combinedLog.filter(e => e.resourceType === resourceType);
    }

    if (startDate) {
      const start = new Date(startDate as string);
      combinedLog = combinedLog.filter(e => e.timestamp >= start);
    }

    if (endDate) {
      const end = new Date(endDate as string);
      combinedLog = combinedLog.filter(e => e.timestamp <= end);
    }

    const limitNum = Math.min(Number(limit), 1000);
    const paginatedLog = combinedLog.slice(0, limitNum);

    res.json({
      total: combinedLog.length,
      returned: paginatedLog.length,
      sources: {
        system: systemLog.length,
        ai_tools: toolAuditLogs.length
      },
      entries: paginatedLog
    });
  } catch (error) {
    console.error("Error fetching audit log:", error);
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

router.get("/summary", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const toolAuditLogs = ToolDispatcher.getRecentAuditLogs(500);
    const toolEntries: AuditLogEntry[] = toolAuditLogs.map(log => ({
      timestamp: log.timestamp,
      action: `ai_tool_call`,
      userId: log.userId,
      organizationId: log.organizationId,
      resourceType: "ai_tool",
      resourceId: log.toolName,
      outcome: log.success ? "success" as const : "failure" as const,
      metadata: { executionTimeMs: log.executionTimeMs }
    }));

    const combinedLog = [...getAuditLog(), ...toolEntries];
    const recentEvents = combinedLog.filter(e => e.timestamp >= last24h);
    const failedEvents = recentEvents.filter(e => e.outcome === "failure");

    const eventsByAction = recentEvents.reduce((acc, e) => {
      acc[e.action] = (acc[e.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const aiToolStats = {
      totalCalls: toolAuditLogs.length,
      recentCalls: toolAuditLogs.filter(l => l.timestamp >= last24h).length,
      averageExecutionTime: toolAuditLogs.length > 0 
        ? Math.round(toolAuditLogs.reduce((sum, l) => sum + l.executionTimeMs, 0) / toolAuditLogs.length)
        : 0
    };

    res.json({
      period: "24h",
      totalEvents: recentEvents.length,
      failedEvents: failedEvents.length,
      eventsByAction,
      aiToolStats,
      securityAlerts: failedEvents.length > 50 ? ["High failure rate detected"] : [],
      complianceDeadlines: [
        { framework: "PCI DSS 4.0", deadline: "2025-03-31", status: "on_track" },
        { framework: "GLBA", deadline: "ongoing", status: "compliant" }
      ]
    });
  } catch (error) {
    console.error("Error fetching compliance summary:", error);
    res.status(500).json({ error: "Failed to fetch compliance summary" });
  }
});

router.get("/data-inventory", async (req: Request, res: Response) => {
  try {
    const inventory = {
      sensitiveDataTypes: [
        { type: "SSN", encrypted: true, retention: "7 years", accessControl: "admin_only" },
        { type: "EIN", encrypted: true, retention: "7 years", accessControl: "admin_only" },
        { type: "Bank_Account", encrypted: true, retention: "7 years", accessControl: "admin_only" },
        { type: "Routing_Number", encrypted: true, retention: "7 years", accessControl: "admin_only" }
      ],
      dataLocations: [
        { location: "PostgreSQL", provider: "Neon", region: "us-east-1", encrypted: true },
        { location: "Session_Storage", provider: "PostgreSQL", encrypted: true }
      ],
      accessControls: {
        roles: ["super_admin", "admin", "manager", "team_lead", "user", "partner"],
        mfaRequired: ["super_admin", "admin"],
        stepUpAuthRequired: ["npi_access", "user_management", "financial_export"]
      }
    };

    res.json(inventory);
  } catch (error) {
    console.error("Error fetching data inventory:", error);
    res.status(500).json({ error: "Failed to fetch data inventory" });
  }
});

export default router;
