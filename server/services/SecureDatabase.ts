import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Secure database configuration using node-postgres (works with Railway PostgreSQL)
const createSecurePool = (): pg.Pool => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const config: pg.PoolConfig = {
    connectionString: process.env.DATABASE_URL,
    
    // Connection pool settings for production
    max: 20, // Maximum number of connections
    min: 2,  // Minimum number of connections
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 5000, // 5 seconds
    
    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
    } : false,
  };

  return new Pool(config);
};

// Connection monitoring and health checks
class DatabaseHealthMonitor {
  private pool: pg.Pool;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private connectionCount = 0;
  private errorCount = 0;
  
  constructor(pool: pg.Pool) {
    this.pool = pool;
    this.startHealthCheck();
  }
  
  private startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const client = await this.pool.connect();
        await client.query('SELECT 1');
        client.release();
        
        // Reset error count on successful health check
        this.errorCount = 0;
      } catch (error) {
        this.errorCount++;
        console.error(`[DB HEALTH] Health check failed (${this.errorCount} consecutive failures):`, error);
        
        // Alert if too many consecutive failures
        if (this.errorCount >= 5) {
          console.error('[DB HEALTH] CRITICAL: Database connection issues detected');
        }
      }
    }, 30000); // Health check every 30 seconds
  }
  
  public getStats() {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      errorCount: this.errorCount
    };
  }
  
  public async gracefulShutdown() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    await this.pool.end();
  }
}

// Enhanced database service with security and monitoring
class SecureDatabaseService {
  private pool: pg.Pool;
  private db: ReturnType<typeof drizzle>;
  private healthMonitor: DatabaseHealthMonitor;
  private queryCount = 0;
  private slowQueryThreshold = 1000; // 1 second
  
  constructor() {
    this.pool = createSecurePool();
    this.db = drizzle(this.pool, { schema });
    this.healthMonitor = new DatabaseHealthMonitor(this.pool);
    
    // Set up graceful shutdown
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }
  
  // Wrapper for database queries with monitoring
  public async executeQuery<T>(
    queryFn: () => Promise<T>,
    queryName: string = 'unknown'
  ): Promise<T> {
    const startTime = Date.now();
    this.queryCount++;
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        console.warn(`[DB PERFORMANCE] Slow query detected: ${queryName} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      console.error(`[DB ERROR] Query failed: ${queryName}`, error);
      throw error;
    }
  }
  
  // Get database instance with monitoring
  public getDatabase() {
    return this.db;
  }
  
  // Get health statistics
  public getHealthStats() {
    return {
      ...this.healthMonitor.getStats(),
      totalQueries: this.queryCount,
      uptime: process.uptime()
    };
  }
  
  // Graceful shutdown
  private async gracefulShutdown() {
    console.log('[DB] Gracefully shutting down database connections...');
    await this.healthMonitor.gracefulShutdown();
    console.log('[DB] Database connections closed');
  }
}

// Create and export singleton instance
export const secureDb = new SecureDatabaseService();
export const db = secureDb.getDatabase();

// Health check endpoint data
export const getDatabaseHealth = () => secureDb.getHealthStats();

// Query wrapper for external use
export const executeSecureQuery = <T>(queryFn: () => Promise<T>, queryName?: string) => 
  secureDb.executeQuery(queryFn, queryName);
