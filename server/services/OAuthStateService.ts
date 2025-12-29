import crypto from 'crypto';
import { db } from '../db';
import { eq, lt, and } from 'drizzle-orm';
import { oauthStates } from '@shared/schema';

/**
 * OAuth State Management Service
 * Generates and validates cryptographically secure state parameters for OAuth flows
 * Prevents CSRF attacks, cross-tenant token injection, and replay attacks
 */
export class OAuthStateService {
  private readonly STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  
  /**
   * Get HMAC secret from environment
   */
  private getHmacSecret(): string {
    const secret = process.env.OAUTH_STATE_SECRET || process.env.OAUTH_ENCRYPTION_KEY;
    if (!secret) {
      throw new Error('OAUTH_STATE_SECRET or OAUTH_ENCRYPTION_KEY environment variable not set');
    }
    return secret;
  }

  /**
   * Generate cryptographically secure state parameter
   * Format: base64(nonce:agencyId:userId:expiry:signature)
   * Stores state server-side for one-time-use validation
   */
  async generateState(agencyId: number, userId: number): Promise<string> {
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + this.STATE_EXPIRY_MS;
    const expiresAt = new Date(expiry);
    
    // Store state server-side for validation
    await db.insert(oauthStates).values({
      nonce,
      agencyId,
      userId,
      expiresAt,
      consumed: false
    });
    
    // Create payload
    const payload = `${nonce}:${agencyId}:${userId}:${expiry}`;
    
    // Sign payload with HMAC-SHA256
    const signature = crypto
      .createHmac('sha256', this.getHmacSecret())
      .update(payload)
      .digest('hex');
    
    // Combine payload and signature
    const stateData = `${payload}:${signature}`;
    
    // Encode as base64
    return Buffer.from(stateData).toString('base64');
  }

  /**
   * Validate and parse state parameter
   * Returns parsed data if valid and unconsumed, throws error otherwise
   * Marks state as consumed to prevent replay attacks
   */
  async validateState(state: string): Promise<{
    nonce: string;
    agencyId: number;
    userId: number;
    expiry: number;
  }> {
    try {
      // Decode from base64
      const stateData = Buffer.from(state, 'base64').toString();
      
      // Parse components
      const parts = stateData.split(':');
      if (parts.length !== 5) {
        throw new Error('Invalid state format');
      }
      
      const [nonce, agencyIdStr, userIdStr, expiryStr, signature] = parts;
      
      // Verify signature
      const payload = `${nonce}:${agencyIdStr}:${userIdStr}:${expiryStr}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.getHmacSecret())
        .update(payload)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        throw new Error('Invalid state signature - possible CSRF attack');
      }
      
      // Check expiry
      const expiry = parseInt(expiryStr);
      if (Date.now() > expiry) {
        throw new Error('State parameter expired');
      }
      
      // Parse IDs
      const agencyId = parseInt(agencyIdStr);
      const userId = parseInt(userIdStr);
      
      if (isNaN(agencyId) || isNaN(userId)) {
        throw new Error('Invalid agency or user ID in state');
      }
      
      // Atomically mark state as consumed (prevents race condition)
      // Update only if not consumed, and check if exactly one row was updated
      const result = await db
        .update(oauthStates)
        .set({ consumed: true })
        .where(and(
          eq(oauthStates.nonce, nonce),
          eq(oauthStates.consumed, false)
        ))
        .returning();
      
      if (result.length === 0) {
        throw new Error('State not found or already consumed - possible replay attack');
      }
      
      const storedState = result[0];
      
      // Verify agency and user IDs match stored values
      if (storedState.agencyId !== agencyId || storedState.userId !== userId) {
        throw new Error('State data mismatch - possible tampering');
      }
      
      return {
        nonce,
        agencyId,
        userId,
        expiry
      };
    } catch (error) {
      console.error('State validation error:', error);
      throw new Error('Invalid or tampered state parameter');
    }
  }

  /**
   * Clean up expired OAuth states
   * Should be called periodically (e.g., via cron job)
   */
  async cleanupExpiredStates(): Promise<number> {
    const result = await db
      .delete(oauthStates)
      .where(lt(oauthStates.expiresAt, new Date()));
    
    return result.rowCount || 0;
  }

  /**
   * Validate state and verify agency/user match
   * Additional protection against cross-tenant attacks
   */
  async validateStateWithContext(
    state: string, 
    expectedAgencyId: number, 
    expectedUserId: number
  ): Promise<boolean> {
    const parsed = await this.validateState(state);
    
    // Verify agency and user IDs match
    if (parsed.agencyId !== expectedAgencyId) {
      console.error('Agency ID mismatch in OAuth state', {
        expected: expectedAgencyId,
        received: parsed.agencyId
      });
      return false;
    }
    
    if (parsed.userId !== expectedUserId) {
      console.error('User ID mismatch in OAuth state', {
        expected: expectedUserId,
        received: parsed.userId
      });
      return false;
    }
    
    return true;
  }
}

export const oauthStateService = new OAuthStateService();
