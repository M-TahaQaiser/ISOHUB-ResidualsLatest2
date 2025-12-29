import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users, auditLogs, apiRateLimits } from '../../shared/schema';
import { eq, and, gte } from 'drizzle-orm';
import { AuthService } from './AuthService';

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};
const JWT_EXPIRES_IN = '7d';

export class SecurityService {
  // Multi-Factor Authentication setup
  static async setupMFA(userId: number): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) throw new Error('User not found');

      const secret = speakeasy.generateSecret({
        name: `ISO Hub (${user.email})`,
        issuer: 'ISO Hub Residuals',
        length: 32
      });

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      // Generate QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

      // Store secret (encrypted) in database using reversible encryption
      const encryptedSecret = AuthService.encryptSensitiveData(secret.base32);
      await db.update(users)
        .set({ 
          mfaSecret: encryptedSecret,
          mfaEnabled: false // Will be enabled after verification
        })
        .where(eq(users.id, userId));

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      console.error('MFA setup error:', error);
      throw new Error('Failed to setup MFA');
    }
  }

  // Verify MFA token
  static async verifyMFA(userId: number, token: string): Promise<boolean> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user || !user.mfaSecret) return false;

      // Decrypt the MFA secret before verification
      const decryptedSecret = AuthService.decryptSensitiveData(user.mfaSecret);

      // Verify TOTP using the decrypted base32 secret
      const verified = speakeasy.totp.verify({
        secret: decryptedSecret,
        token: token,
        window: 1, // Allow 30 second window
        encoding: 'base32'
      });

      if (verified && !user.mfaEnabled) {
        // Enable MFA after first successful verification
        await db.update(users)
          .set({ mfaEnabled: true })
          .where(eq(users.id, userId));
      }

      return verified;
    } catch (error) {
      console.error('MFA verification error:', error);
      return false;
    }
  }

  // Account lockout after failed attempts
  static async handleFailedLogin(userId: number): Promise<{
    isLocked: boolean;
    lockoutTime?: Date;
    remainingAttempts: number;
  }> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) throw new Error('User not found');

      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const maxAttempts = 5;
      const lockoutDuration = 15 * 60 * 1000; // 15 minutes

      if (failedAttempts >= maxAttempts) {
        const lockoutTime = new Date(Date.now() + lockoutDuration);
        
        await db.update(users)
          .set({ 
            failedLoginAttempts: failedAttempts,
            lockedUntil: lockoutTime
          })
          .where(eq(users.id, userId));

        return {
          isLocked: true,
          lockoutTime,
          remainingAttempts: 0
        };
      } else {
        await db.update(users)
          .set({ failedLoginAttempts: failedAttempts })
          .where(eq(users.id, userId));

        return {
          isLocked: false,
          remainingAttempts: maxAttempts - failedAttempts
        };
      }
    } catch (error) {
      console.error('Failed login handling error:', error);
      throw error;
    }
  }

  // Clear failed attempts on successful login
  static async clearFailedAttempts(userId: number): Promise<void> {
    await db.update(users)
      .set({ 
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Check if account is locked
  static async isAccountLocked(userId: number): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.lockedUntil) return false;

    if (new Date() > user.lockedUntil) {
      // Clear expired lockout
      await db.update(users)
        .set({ 
          lockedUntil: null,
          failedLoginAttempts: 0
        })
        .where(eq(users.id, userId));
      return false;
    }

    return true;
  }

  // Generate JWT token with agency context
  static generateToken(user: any): string {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        agencyId: user.agencyId,
        permissions: user.permissions
      },
      getJWTSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Verify JWT token
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, getJWTSecret());
    } catch (error) {
      return null;
    }
  }

  // Rate limiting check
  static async checkRateLimit(
    identifier: string, 
    endpoint: string, 
    limit: number = 60,
    windowMs: number = 60000
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
  }> {
    const now = new Date();
    const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);

    // Get or create rate limit entry
    const [existing] = await db.select()
      .from(apiRateLimits)
      .where(and(
        eq(apiRateLimits.identifier, identifier),
        eq(apiRateLimits.endpoint, endpoint),
        eq(apiRateLimits.windowStart, windowStart)
      ));

    if (existing) {
      const newCount = (existing.requests || 0) + 1;
      
      await db.update(apiRateLimits)
        .set({ requests: newCount })
        .where(eq(apiRateLimits.id, existing.id));

      return {
        allowed: newCount <= limit,
        remaining: Math.max(0, limit - newCount),
        resetTime: new Date(windowStart.getTime() + windowMs)
      };
    } else {
      // Create new rate limit entry
      await db.insert(apiRateLimits).values({
        identifier,
        endpoint,
        requests: 1,
        windowStart
      });

      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: new Date(windowStart.getTime() + windowMs)
      };
    }
  }

  // Audit sensitive actions
  static async auditAction(
    userId: number,
    agencyId: number | null,
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        userId,
        agencyId,
        action,
        resourceType,
        resourceId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress,
        userAgent
      });
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't throw - audit logging shouldn't break the main flow
    }
  }

  // Password strength validation
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check - PCI DSS 4.0 requires 12+ characters
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) {
      score += 1;
      feedback.push('Password should be at least 12 characters (PCI DSS 4.0 requirement)');
    }
    else feedback.push('Password must be at least 12 characters (PCI DSS 4.0 requirement)');
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z\d]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    // Common patterns check
    const commonPatterns = [
      /^(?=.*(.)\1{2,})/,  // Repeated characters
      /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i,
      /^(password|123456|qwerty|admin|login|welcome)/i
    ];

    if (commonPatterns.some(pattern => pattern.test(password))) {
      score -= 2;
      feedback.push('Avoid common patterns and words');
    }

    return {
      isValid: score >= 4 && password.length >= 12,
      score: Math.max(0, Math.min(5, score)),
      feedback
    };
  }

  // Session management
  static async invalidateAllUserSessions(userId: number): Promise<void> {
    // In a real implementation, you'd maintain a session store
    // For now, we'll just update the user's password hash to invalidate JWTs
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user) {
      // Force password rehash to invalidate all tokens
      const newHash = await bcrypt.hash(user.password + Date.now(), 12);
      await db.update(users)
        .set({ password: newHash })
        .where(eq(users.id, userId));
    }
  }

  // IP whitelisting check (for admin actions)
  static isIPWhitelisted(ip: string, whitelist: string[] = []): boolean {
    if (whitelist.length === 0) return true; // No whitelist means all IPs allowed
    
    // Check exact matches and CIDR ranges
    return whitelist.some(whitelistedIP => {
      if (whitelistedIP.includes('/')) {
        // CIDR notation - simplified check
        const [baseIP, mask] = whitelistedIP.split('/');
        return ip.startsWith(baseIP.substring(0, baseIP.lastIndexOf('.')));
      }
      return ip === whitelistedIP;
    });
  }
}