import { db } from '../db';
import { shortUrls } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class URLShortenerService {
  /**
   * Generate a unique short code
   */
  private static generateShortCode(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create a short URL for a personalized form link
   */
  static async createShortUrl(params: {
    agencyCode: string;
    fullname: string;
    agentName: string;
    organizationId: string;
    expiresInDays?: number;
  }): Promise<{ success: boolean; shortCode?: string; shortUrl?: string; error?: string }> {
    try {
      const originalUrl = `/${params.agencyCode}/${params.fullname}`;
      let shortCode = '';
      let attempts = 0;
      const maxAttempts = 5;

      // Generate unique short code
      while (attempts < maxAttempts) {
        shortCode = this.generateShortCode();
        
        // Check if code already exists
        const existing = await db
          .select()
          .from(shortUrls)
          .where(eq(shortUrls.shortCode, shortCode))
          .limit(1);
        
        if (existing.length === 0) {
          break;
        }
        attempts++;
      }

      if (attempts >= maxAttempts) {
        return { success: false, error: 'Failed to generate unique short code' };
      }

      // Set expiration if provided
      const expiresAt = params.expiresInDays 
        ? new Date(Date.now() + (params.expiresInDays * 24 * 60 * 60 * 1000))
        : null;

      // Create short URL record
      const [shortUrl] = await db
        .insert(shortUrls)
        .values({
          shortCode,
          originalUrl,
          agencyCode: params.agencyCode,
          agentName: params.agentName,
          organizationId: params.organizationId,
          expiresAt,
          clickCount: 0, // Initialize click count to 0
        })
        .returning();

      return {
        success: true,
        shortCode,
        shortUrl: `https://isohub.io/s/${shortCode}`,
      };
    } catch (error) {
      console.error('Error creating short URL:', error);
      return { success: false, error: 'Failed to create short URL' };
    }
  }

  /**
   * Resolve a short code to its original URL
   */
  static async resolveShortUrl(shortCode: string): Promise<{
    success: boolean;
    originalUrl?: string;
    agencyCode?: string;
    agentName?: string;
    error?: string;
  }> {
    try {
      const [shortUrl] = await db
        .select()
        .from(shortUrls)
        .where(eq(shortUrls.shortCode, shortCode))
        .limit(1);

      if (!shortUrl) {
        return { success: false, error: 'Short URL not found' };
      }

      if (!shortUrl.isActive) {
        return { success: false, error: 'Short URL has been deactivated' };
      }

      if (shortUrl.expiresAt && new Date() > shortUrl.expiresAt) {
        return { success: false, error: 'Short URL has expired' };
      }

      // Update click count and last accessed time
      await db
        .update(shortUrls)
        .set({
          clickCount: (shortUrl.clickCount || 0) + 1,
          lastAccessedAt: new Date(),
        })
        .where(eq(shortUrls.shortCode, shortCode));

      return {
        success: true,
        originalUrl: shortUrl.originalUrl,
        agencyCode: shortUrl.agencyCode,
        agentName: shortUrl.agentName,
      };
    } catch (error) {
      console.error('Error resolving short URL:', error);
      return { success: false, error: 'Failed to resolve short URL' };
    }
  }

  /**
   * Get analytics for a short URL
   */
  static async getShortUrlAnalytics(shortCode: string): Promise<{
    success: boolean;
    analytics?: {
      shortCode: string;
      originalUrl: string;
      agencyCode: string;
      agentName: string;
      clickCount: number;
      createdAt: Date;
      lastAccessedAt: Date | null;
      isActive: boolean;
    };
    error?: string;
  }> {
    try {
      const [shortUrl] = await db
        .select()
        .from(shortUrls)
        .where(eq(shortUrls.shortCode, shortCode))
        .limit(1);

      if (!shortUrl) {
        return { success: false, error: 'Short URL not found' };
      }

      return {
        success: true,
        analytics: {
          shortCode: shortUrl.shortCode,
          originalUrl: shortUrl.originalUrl,
          agencyCode: shortUrl.agencyCode,
          agentName: shortUrl.agentName,
          clickCount: shortUrl.clickCount || 0,
          createdAt: shortUrl.createdAt!,
          lastAccessedAt: shortUrl.lastAccessedAt,
          isActive: shortUrl.isActive || false,
        },
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return { success: false, error: 'Failed to get analytics' };
    }
  }

  /**
   * Deactivate a short URL
   */
  static async deactivateShortUrl(shortCode: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await db
        .update(shortUrls)
        .set({ isActive: false })
        .where(eq(shortUrls.shortCode, shortCode));

      return { success: true };
    } catch (error) {
      console.error('Error deactivating short URL:', error);
      return { success: false, error: 'Failed to deactivate short URL' };
    }
  }

  /**
   * Get all short URLs for an agency
   */
  static async getAgencyShortUrls(agencyCode: string): Promise<{
    success: boolean;
    shortUrls?: Array<{
      shortCode: string;
      originalUrl: string;
      agentName: string;
      clickCount: number;
      createdAt: Date;
      lastAccessedAt: Date | null;
      isActive: boolean;
    }>;
    error?: string;
  }> {
    try {
      const urls = await db
        .select()
        .from(shortUrls)
        .where(eq(shortUrls.agencyCode, agencyCode));

      return {
        success: true,
        shortUrls: urls.map(url => ({
          shortCode: url.shortCode,
          originalUrl: url.originalUrl,
          agentName: url.agentName,
          clickCount: url.clickCount || 0,
          createdAt: url.createdAt!,
          lastAccessedAt: url.lastAccessedAt,
          isActive: url.isActive || false,
        })),
      };
    } catch (error) {
      console.error('Error getting agency short URLs:', error);
      return { success: false, error: 'Failed to get agency short URLs' };
    }
  }
}