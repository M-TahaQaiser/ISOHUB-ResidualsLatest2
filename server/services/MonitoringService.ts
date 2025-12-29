import { Request, Response } from 'express';
import os from 'os';
import { getDatabaseHealth } from './SecureDatabase';

// Application metrics collection
class ApplicationMetrics {
  private startTime: number = Date.now();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private slowRequestCount: number = 0;
  private requestDurations: number[] = [];
  private maxRequestDurations: number = 1000; // Keep last 1000 requests
  
  // API endpoint metrics
  private endpointMetrics: Map<string, {
    count: number;
    totalDuration: number;
    errors: number;
    lastAccessed: number;
  }> = new Map();
  
  // Security event tracking
  private securityEvents: Array<{
    type: string;
    timestamp: number;
    ip: string;
    userAgent?: string;
    path: string;
  }> = [];
  
  public recordRequest(req: Request, duration: number, statusCode: number) {
    this.requestCount++;
    
    // Track request duration
    this.requestDurations.push(duration);
    if (this.requestDurations.length > this.maxRequestDurations) {
      this.requestDurations.shift();
    }
    
    // Track slow requests (>1000ms)
    if (duration > 1000) {
      this.slowRequestCount++;
    }
    
    // Track errors
    if (statusCode >= 400) {
      this.errorCount++;
    }
    
    // Track per-endpoint metrics
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    const existing = this.endpointMetrics.get(endpoint) || {
      count: 0,
      totalDuration: 0,
      errors: 0,
      lastAccessed: 0
    };
    
    existing.count++;
    existing.totalDuration += duration;
    existing.lastAccessed = Date.now();
    
    if (statusCode >= 400) {
      existing.errors++;
    }
    
    this.endpointMetrics.set(endpoint, existing);
  }
  
  public recordSecurityEvent(type: string, req: Request) {
    this.securityEvents.push({
      type,
      timestamp: Date.now(),
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    // Keep only last 100 security events
    if (this.securityEvents.length > 100) {
      this.securityEvents.shift();
    }
  }
  
  public getMetrics() {
    const uptime = Date.now() - this.startTime;
    const avgDuration = this.requestDurations.length > 0 
      ? this.requestDurations.reduce((a, b) => a + b, 0) / this.requestDurations.length 
      : 0;
    
    const p95Duration = this.requestDurations.length > 0
      ? this.requestDurations.sort((a, b) => a - b)[Math.floor(this.requestDurations.length * 0.95)]
      : 0;
    
    return {
      uptime,
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        slowRequests: this.slowRequestCount,
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
        avgDuration: Math.round(avgDuration),
        p95Duration: Math.round(p95Duration)
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        loadAverage: os.loadavg(),
        platform: os.platform(),
        nodeVersion: process.version
      },
      endpoints: Array.from(this.endpointMetrics.entries()).map(([endpoint, metrics]) => ({
        endpoint,
        count: metrics.count,
        avgDuration: Math.round(metrics.totalDuration / metrics.count),
        errorRate: (metrics.errors / metrics.count) * 100,
        lastAccessed: new Date(metrics.lastAccessed).toISOString()
      })).sort((a, b) => b.count - a.count),
      security: {
        recentEvents: this.securityEvents.slice(-10),
        totalEvents: this.securityEvents.length
      }
    };
  }
  
  public getHealthStatus() {
    const metrics = this.getMetrics();
    const dbHealth = getDatabaseHealth();
    
    // Determine health status based on key metrics
    const isHealthy = 
      metrics.requests.errorRate < 5 && // Error rate below 5%
      metrics.requests.p95Duration < 5000 && // P95 response time below 5s
      dbHealth.errorCount < 10 && // Database error count acceptable
      process.memoryUsage().heapUsed < (1024 * 1024 * 1024); // Memory usage below 1GB
    
    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        api: {
          status: metrics.requests.errorRate < 5 ? 'pass' : 'fail',
          errorRate: metrics.requests.errorRate,
          responseTime: metrics.requests.p95Duration
        },
        database: {
          status: dbHealth.errorCount < 10 ? 'pass' : 'fail',
          connections: dbHealth.totalConnections,
          errors: dbHealth.errorCount
        },
        memory: {
          status: process.memoryUsage().heapUsed < (1024 * 1024 * 1024) ? 'pass' : 'fail',
          usage: process.memoryUsage()
        }
      },
      metrics,
      database: dbHealth
    };
  }
}

// Singleton instance
export const appMetrics = new ApplicationMetrics();

// Middleware for request monitoring
export const monitoringMiddleware = (req: Request, res: Response, next: Function) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    appMetrics.recordRequest(req, duration, res.statusCode);
  });
  
  next();
};

// Security event recording
export const recordSecurityEvent = (type: string, req: Request) => {
  appMetrics.recordSecurityEvent(type, req);
};

// Health check endpoint handler
export const healthCheckHandler = (req: Request, res: Response) => {
  const health = appMetrics.getHealthStatus();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
};

// Metrics endpoint handler
export const metricsHandler = (req: Request, res: Response) => {
  const metrics = appMetrics.getMetrics();
  res.json(metrics);
};

// Alert system (basic implementation)
class AlertManager {
  private lastAlertTime: Map<string, number> = new Map();
  private alertCooldown = 5 * 60 * 1000; // 5 minutes between same alerts
  
  public checkAndAlert() {
    const health = appMetrics.getHealthStatus();
    
    // High error rate alert
    if (health.checks.api.errorRate > 10) {
      this.sendAlert('high_error_rate', `API error rate is ${health.checks.api.errorRate.toFixed(2)}%`);
    }
    
    // Slow response time alert
    if (health.checks.api.responseTime > 10000) {
      this.sendAlert('slow_response', `P95 response time is ${health.checks.api.responseTime}ms`);
    }
    
    // Database issues alert
    if (health.checks.database.errors > 20) {
      this.sendAlert('database_errors', `Database has ${health.checks.database.errors} errors`);
    }
    
    // Memory usage alert
    const memoryUsage = process.memoryUsage().heapUsed / (1024 * 1024 * 1024);
    if (memoryUsage > 1.5) {
      this.sendAlert('high_memory', `Memory usage is ${memoryUsage.toFixed(2)}GB`);
    }
  }
  
  private sendAlert(type: string, message: string) {
    const now = Date.now();
    const lastAlert = this.lastAlertTime.get(type) || 0;
    
    if (now - lastAlert > this.alertCooldown) {
      console.error(`[ALERT] ${type.toUpperCase()}: ${message}`);
      this.lastAlertTime.set(type, now);
      
      // In production, this would:
      // - Send to Slack/Discord
      // - Send email notifications
      // - Create PagerDuty incidents
      // - Log to external monitoring service
    }
  }
}

export const alertManager = new AlertManager();

// Start monitoring alerts (check every minute)
setInterval(() => {
  alertManager.checkAndAlert();
}, 60 * 1000);