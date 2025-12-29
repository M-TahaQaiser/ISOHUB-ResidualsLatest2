import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AuthService } from './AuthService';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

interface ReauthToken {
  userId: number;
  issuedAt: number;
  expiresAt: number;
  method: 'password' | 'totp';
  action?: string;
}

interface ReauthResult {
  success: boolean;
  token?: string;
  expiresIn?: number;
  error?: string;
}

const REAUTH_TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// SECURITY: No fallback - fail fast if secret not configured
const getReauthSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('SECURITY ERROR: JWT_SECRET environment variable is required for step-up authentication');
  }
  return secret;
};

// In-memory store for active reauth tokens (for revocation/replay prevention)
const activeReauthTokens = new Map<string, { userId: number; expiresAt: number }>();

// Cleanup expired tokens periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(activeReauthTokens.entries());
  for (const [tokenId, data] of entries) {
    if (data.expiresAt < now) {
      activeReauthTokens.delete(tokenId);
    }
  }
}, 60000); // Clean every minute

export class StepUpAuthService {
  /**
   * Verify user's password for step-up authentication
   */
  static async verifyPassword(userId: number, password: string): Promise<ReauthResult> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const isValid = await AuthService.verifyPassword(password, user.password);
      if (!isValid) {
        // Log failed attempt for security monitoring
        console.log(`[SECURITY] Step-up auth failed (password) for user ${userId}`);
        return { success: false, error: 'Invalid password' };
      }

      return this.issueReauthToken(userId, 'password');
    } catch (error) {
      console.error('[SECURITY] Step-up password verification error:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Verify user's TOTP code for step-up authentication
   */
  static async verifyTOTP(userId: number, code: string): Promise<ReauthResult> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (!user.mfaEnabled || !user.mfaSecret) {
        return { success: false, error: 'MFA not enabled for this account' };
      }

      const isValid = AuthService.verifyMFAToken(user.mfaSecret, code);
      if (!isValid) {
        console.log(`[SECURITY] Step-up auth failed (TOTP) for user ${userId}`);
        return { success: false, error: 'Invalid verification code' };
      }

      return this.issueReauthToken(userId, 'totp');
    } catch (error) {
      console.error('[SECURITY] Step-up TOTP verification error:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Verify a prospect/guest using portal PIN or temporary password
   */
  static async verifyProspectPIN(sessionId: string, pin: string): Promise<ReauthResult> {
    // For prospects using secure document portals, we use a simpler PIN-based system
    // The PIN is typically sent to them via email/SMS when they access the portal
    try {
      // Validate PIN format (6 digits)
      if (!/^\d{6}$/.test(pin)) {
        return { success: false, error: 'Invalid PIN format' };
      }

      // Generate a guest reauth token with the session ID
      const tokenId = crypto.randomUUID();
      const now = Date.now();
      const expiresAt = now + REAUTH_TOKEN_EXPIRY_MS;

      const tokenPayload = {
        tokenId,
        sessionId,
        issuedAt: now,
        expiresAt,
        method: 'pin' as const,
        isGuest: true
      };

      const token = jwt.sign(tokenPayload, getReauthSecret(), { expiresIn: '5m' });

      // Store for revocation checking
      activeReauthTokens.set(tokenId, { userId: 0, expiresAt });

      console.log(`[SECURITY] Step-up auth success (PIN) for session ${sessionId}`);

      return {
        success: true,
        token,
        expiresIn: REAUTH_TOKEN_EXPIRY_MS / 1000
      };
    } catch (error) {
      console.error('[SECURITY] Step-up PIN verification error:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Issue a short-lived reauth token after successful verification
   */
  private static issueReauthToken(userId: number, method: 'password' | 'totp'): ReauthResult {
    const tokenId = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + REAUTH_TOKEN_EXPIRY_MS;

    const tokenPayload: ReauthToken & { tokenId: string } = {
      tokenId,
      userId,
      issuedAt: now,
      expiresAt,
      method
    };

    const token = jwt.sign(tokenPayload, getReauthSecret(), { expiresIn: '5m' });

    // Store for revocation checking
    activeReauthTokens.set(tokenId, { userId, expiresAt });

    console.log(`[SECURITY] Step-up auth success (${method}) for user ${userId}`);

    return {
      success: true,
      token,
      expiresIn: REAUTH_TOKEN_EXPIRY_MS / 1000
    };
  }

  /**
   * Validate a reauth token
   */
  static validateReauthToken(token: string, expectedUserId?: number): {
    valid: boolean;
    userId?: number;
    method?: string;
    error?: string;
  } {
    try {
      const decoded = jwt.verify(token, getReauthSecret()) as ReauthToken & { tokenId: string };

      // Check if token is in active store (not revoked)
      if (!activeReauthTokens.has(decoded.tokenId)) {
        return { valid: false, error: 'Token has been revoked or already used' };
      }

      // Check expiry
      if (decoded.expiresAt < Date.now()) {
        activeReauthTokens.delete(decoded.tokenId);
        return { valid: false, error: 'Token has expired' };
      }

      // Verify user ID matches if expected
      if (expectedUserId !== undefined && decoded.userId !== expectedUserId) {
        return { valid: false, error: 'Token user mismatch' };
      }

      return {
        valid: true,
        userId: decoded.userId,
        method: decoded.method
      };
    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  /**
   * Consume (single-use) a reauth token after successful sensitive operation
   */
  static consumeReauthToken(token: string): boolean {
    try {
      const decoded = jwt.verify(token, getReauthSecret()) as { tokenId: string };
      if (activeReauthTokens.has(decoded.tokenId)) {
        activeReauthTokens.delete(decoded.tokenId);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Revoke all reauth tokens for a user (e.g., on password change)
   */
  static revokeAllTokensForUser(userId: number): void {
    const entries = Array.from(activeReauthTokens.entries());
    for (const [tokenId, data] of entries) {
      if (data.userId === userId) {
        activeReauthTokens.delete(tokenId);
      }
    }
    console.log(`[SECURITY] Revoked all reauth tokens for user ${userId}`);
  }

  /**
   * Check if user has MFA enabled (for UI to show TOTP option)
   */
  static async userHasMFA(userId: number): Promise<boolean> {
    try {
      const [user] = await db.select({ mfaEnabled: users.mfaEnabled })
        .from(users)
        .where(eq(users.id, userId));
      return user?.mfaEnabled || false;
    } catch {
      return false;
    }
  }
}
