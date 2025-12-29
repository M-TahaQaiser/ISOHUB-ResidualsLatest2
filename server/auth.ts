// Authentication utilities for migrated MongoDB users
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// SECURITY: JWT_SECRET must be set - no fallback allowed
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is required. Set it before starting the server.');
  }
  if (secret.length < 32) {
    throw new Error('CRITICAL: JWT_SECRET must be at least 32 characters long for security.');
  }
  return secret;
};

// Token payload interface for type safety
interface TokenPayload {
  userId: number | string;
  username: string;
  email?: string;
  role: string;
  agencyId?: number | null;
  organizationId?: string | null;
  permissions?: string[];
}

/**
 * Generate JWT token with proper user context
 * SECURITY: Token includes actual user data, not hardcoded values
 */
export function generateToken(userData: {
  id: number | string;
  username: string;
  email?: string;
  role?: string;
  agencyId?: number | null;
  organizationId?: string | null;
  permissions?: string[];
}): string {
  const payload: TokenPayload = {
    userId: userData.id,
    username: userData.username,
    email: userData.email,
    role: userData.role || 'user',
    agencyId: userData.agencyId || null,
    organizationId: userData.organizationId || null,
    permissions: userData.permissions || [],
  };

  return jwt.sign(payload, getJWTSecret(), { expiresIn: '7d' });
}

/**
 * Verify JWT token
 * Returns decoded payload or throws error
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12); // Using 12 rounds for better security
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a short-lived token for password reset
 */
export function generatePasswordResetToken(userId: number | string): string {
  return jwt.sign(
    { userId, purpose: 'password-reset' },
    getJWTSecret(),
    { expiresIn: '1h' }
  );
}

/**
 * Verify password reset token
 */
export function verifyPasswordResetToken(token: string): { userId: number | string } {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as { userId: number | string; purpose: string };
    if (decoded.purpose !== 'password-reset') {
      throw new Error('Invalid token purpose');
    }
    return { userId: decoded.userId };
  } catch (error) {
    throw new Error('Invalid or expired password reset token');
  }
}
