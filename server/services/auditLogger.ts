export interface AuditLogEntry {
  timestamp: Date;
  action: string;
  userId?: number;
  organizationId?: number;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  outcome: "success" | "failure" | "error";
  metadata?: Record<string, unknown>;
}

const systemAuditLog: AuditLogEntry[] = [];
const MAX_AUDIT_LOG_SIZE = 10000;

export function logAuditEvent(entry: Omit<AuditLogEntry, "timestamp">) {
  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date()
  };
  
  systemAuditLog.unshift(logEntry);
  
  if (systemAuditLog.length > MAX_AUDIT_LOG_SIZE) {
    systemAuditLog.pop();
  }

  console.log(`[AUDIT] ${entry.action} - ${entry.resourceType}${entry.resourceId ? `:${entry.resourceId}` : ""} - ${entry.outcome}`);
}

export function getAuditLog(): AuditLogEntry[] {
  return systemAuditLog;
}

export function getAuditLogByAction(action: string): AuditLogEntry[] {
  return systemAuditLog.filter(entry => entry.action === action);
}

export function getRecentAuditEvents(count: number = 100): AuditLogEntry[] {
  return systemAuditLog.slice(0, count);
}
