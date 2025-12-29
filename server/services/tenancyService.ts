import { db } from "../db";
import { organizations } from "@shared/onboarding-schema";
import { eq, isNull } from "drizzle-orm";

interface TenancyResolution {
  organizationId: string;
  agencyId: number | null;
  organizationName: string | null;
}

const tenancyCache = new Map<string, TenancyResolution>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

export class TenancyService {
  /**
   * Resolve organizationId to agencyId for residuals data queries
   * Uses caching to avoid repeated database lookups
   */
  static async resolveAgencyId(organizationId: string): Promise<number | null> {
    if (!organizationId) {
      return null;
    }

    // Check cache first
    const cached = tenancyCache.get(organizationId);
    const cacheTime = cacheTimestamps.get(organizationId) || 0;
    
    if (cached && Date.now() - cacheTime < CACHE_TTL) {
      return cached.agencyId;
    }

    try {
      const [org] = await db
        .select({
          organizationId: organizations.organizationId,
          agencyId: organizations.agencyId,
          name: organizations.name,
        })
        .from(organizations)
        .where(eq(organizations.organizationId, organizationId))
        .limit(1);

      if (org) {
        const resolution: TenancyResolution = {
          organizationId: org.organizationId,
          agencyId: org.agencyId,
          organizationName: org.name,
        };
        tenancyCache.set(organizationId, resolution);
        cacheTimestamps.set(organizationId, Date.now());
        return org.agencyId;
      }

      return null;
    } catch (error) {
      console.error(`[TenancyService] Error resolving agencyId for ${organizationId}:`, error);
      return null;
    }
  }

  /**
   * Get full tenancy resolution including organization details
   */
  static async getFullResolution(organizationId: string): Promise<TenancyResolution | null> {
    if (!organizationId) {
      return null;
    }

    // Check cache first
    const cached = tenancyCache.get(organizationId);
    const cacheTime = cacheTimestamps.get(organizationId) || 0;
    
    if (cached && Date.now() - cacheTime < CACHE_TTL) {
      return cached;
    }

    try {
      const [org] = await db
        .select({
          organizationId: organizations.organizationId,
          agencyId: organizations.agencyId,
          name: organizations.name,
        })
        .from(organizations)
        .where(eq(organizations.organizationId, organizationId))
        .limit(1);

      if (org) {
        const resolution: TenancyResolution = {
          organizationId: org.organizationId,
          agencyId: org.agencyId,
          organizationName: org.name,
        };
        tenancyCache.set(organizationId, resolution);
        cacheTimestamps.set(organizationId, Date.now());
        return resolution;
      }

      return null;
    } catch (error) {
      console.error(`[TenancyService] Error getting full resolution for ${organizationId}:`, error);
      return null;
    }
  }

  /**
   * Update agency mapping for an organization
   */
  static async setAgencyMapping(organizationId: string, agencyId: number): Promise<boolean> {
    try {
      await db
        .update(organizations)
        .set({ agencyId })
        .where(eq(organizations.organizationId, organizationId));

      // Invalidate cache
      tenancyCache.delete(organizationId);
      cacheTimestamps.delete(organizationId);
      
      console.log(`[TenancyService] Set agency mapping: ${organizationId} -> ${agencyId}`);
      return true;
    } catch (error) {
      console.error(`[TenancyService] Error setting agency mapping:`, error);
      return false;
    }
  }

  /**
   * Clear tenancy cache (useful after bulk updates)
   */
  static clearCache(): void {
    tenancyCache.clear();
    cacheTimestamps.clear();
    console.log('[TenancyService] Cache cleared');
  }

  /**
   * Get all organizations without agency mappings (for backfill)
   */
  static async getUnmappedOrganizations(): Promise<Array<{ organizationId: string; name: string }>> {
    try {
      const unmapped = await db
        .select({
          organizationId: organizations.organizationId,
          name: organizations.name,
        })
        .from(organizations)
        .where(isNull(organizations.agencyId));

      return unmapped;
    } catch (error) {
      console.error('[TenancyService] Error getting unmapped organizations:', error);
      return [];
    }
  }
}

export default TenancyService;
