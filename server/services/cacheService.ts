import { db } from '../db';
import { cacheEntries } from '../../shared/schema';
import { eq, lt, and } from 'drizzle-orm';
import { Request, Response, NextFunction } from 'express';

// Cache middleware factory for Express
export function cacheMiddleware(ttlSeconds: number = 300) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `api:${req.originalUrl}`;
    
    // Check memory cache
    const cached = CacheService.getFromMemory(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        CacheService.setInMemory(cacheKey, body, ttlSeconds * 1000);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

export class CacheService {
  // Sync memory cache methods for middleware
  static getFromMemory(key: string): any {
    const entry = this.memoryCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    return null;
  }

  static setInMemory(key: string, data: any, ttlMs: number): void {
    this.memoryCache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs
    });
  }

  private static memoryCache = new Map<string, { data: any; expiresAt: number }>();

  // Get cached data
  static async get(key: string, agencyId?: number): Promise<any> {
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
      return memoryEntry.data;
    }

    // Try database cache
    try {
      const query = agencyId 
        ? and(eq(cacheEntries.key, key), eq(cacheEntries.agencyId, agencyId))
        : eq(cacheEntries.key, key);

      const [entry] = await db.select()
        .from(cacheEntries)
        .where(query);

      if (entry) {
        if (!entry.expiresAt || entry.expiresAt > new Date()) {
          // Store in memory cache for faster access
          this.memoryCache.set(key, {
            data: entry.value,
            expiresAt: entry.expiresAt?.getTime() || Date.now() + 3600000
          });
          return entry.value;
        } else {
          // Remove expired entry
          await this.delete(key, agencyId);
        }
      }
    } catch (error) {
      console.error('Cache get error:', error);
    }

    return null;
  }

  // Set cached data
  static async set(
    key: string, 
    value: any, 
    ttlMs: number = 3600000, // 1 hour default
    agencyId?: number
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlMs);

    // Store in memory cache
    this.memoryCache.set(key, {
      data: value,
      expiresAt: expiresAt.getTime()
    });

    // Store in database cache
    try {
      await db.insert(cacheEntries).values({
        key,
        value: JSON.stringify(value),
        agencyId,
        expiresAt
      }).onConflictDoUpdate({
        target: cacheEntries.key,
        set: {
          value: JSON.stringify(value),
          expiresAt,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Delete cached data
  static async delete(key: string, agencyId?: number): Promise<void> {
    // Remove from memory cache
    this.memoryCache.delete(key);

    // Remove from database cache
    try {
      const query = agencyId 
        ? and(eq(cacheEntries.key, key), eq(cacheEntries.agencyId, agencyId))
        : eq(cacheEntries.key, key);

      await db.delete(cacheEntries).where(query);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // Clear all cache for agency
  static async clearAgencyCache(agencyId: number): Promise<void> {
    try {
      // Clear memory cache entries for this agency
      const entries = Array.from(this.memoryCache.entries());
      for (const [key, value] of entries) {
        if (key.startsWith(`agency:${agencyId}:`)) {
          this.memoryCache.delete(key);
        }
      }

      // Clear database cache
      await db.delete(cacheEntries)
        .where(eq(cacheEntries.agencyId, agencyId));
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Clean expired entries
  static async cleanExpired(): Promise<void> {
    try {
      const now = new Date();
      
      // Clean memory cache
      const entries = Array.from(this.memoryCache.entries());
      for (const [key, value] of entries) {
        if (value.expiresAt < Date.now()) {
          this.memoryCache.delete(key);
        }
      }

      // Clean database cache
      await db.delete(cacheEntries)
        .where(lt(cacheEntries.expiresAt, now));
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  // Cached wrapper for expensive operations
  static async cached<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = 3600000,
    agencyId?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get(key, agencyId);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();
    
    // Cache the result
    await this.set(key, data, ttlMs, agencyId);
    
    return data;
  }

  // Cache warm-up for common queries
  static async warmUpCache(agencyId?: number): Promise<void> {
    try {
      console.log('Warming up cache...');
      
      // Common queries to pre-cache
      const queries = [
        { 
          key: 'processors:active', 
          query: () => db.query.processors.findMany({ where: (processors, { eq }) => eq(processors.isActive, true) })
        },
        { 
          key: 'roles:active', 
          query: () => db.query.roles.findMany({ where: (roles, { eq }) => eq(roles.isActive, true) })
        }
      ];

      for (const { key, query } of queries) {
        try {
          const data = await query();
          const cacheKey = agencyId ? `agency:${agencyId}:${key}` : key;
          await this.set(cacheKey, data, 1800000, agencyId); // 30 minutes
        } catch (error) {
          console.error(`Failed to warm up cache for ${key}:`, error);
        }
      }

      console.log('Cache warm-up complete');
    } catch (error) {
      console.error('Cache warm-up error:', error);
    }
  }

  // Get cache statistics
  static async getStats(): Promise<{
    memoryEntries: number;
    databaseEntries: number;
    memorySize: number;
  }> {
    const memoryEntries = this.memoryCache.size;
    
    let memorySize = 0;
    const entries = Array.from(this.memoryCache.entries());
    for (const [key, value] of entries) {
      memorySize += JSON.stringify({ key, value }).length * 2; // Rough estimate
    }

    // Count database entries
    const dbEntries = await db.select({ key: cacheEntries.key }).from(cacheEntries);
    const databaseEntries = dbEntries.length;

    return {
      memoryEntries,
      databaseEntries,
      memorySize
    };
  }

  // Cache invalidation patterns
  static async invalidatePattern(pattern: string, agencyId?: number): Promise<void> {
    try {
      // Invalidate memory cache
      const keys = Array.from(this.memoryCache.keys());
      for (const key of keys) {
        if (key.includes(pattern)) {
          this.memoryCache.delete(key);
        }
      }

      // Invalidate database cache
      const entries = await db.select({ key: cacheEntries.key })
        .from(cacheEntries)
        .where(agencyId ? eq(cacheEntries.agencyId, agencyId) : undefined);

      for (const entry of entries) {
        if (entry.key.includes(pattern)) {
          await this.delete(entry.key, agencyId);
        }
      }
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
    }
  }
}