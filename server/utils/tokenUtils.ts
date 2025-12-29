import jwt from 'jsonwebtoken';

const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is required. Set it in your .env file or environment.');
  }
  return secret;
};

const JWT_SECRET: string = getJWTSecret();
const TOKEN_EXPIRY = '24h';

/**
 * Generate a JWT token for a user
 */
export function generateUserToken(userId: number, username: string, agencyId?: number): string {
  return jwt.sign(
    {
      userId,
      username,
      agencyId,
      type: 'user'
    },
    JWT_SECRET,
    {
      expiresIn: TOKEN_EXPIRY,
      issuer: 'isohub',
      audience: 'isohub-client'
    }
  );
}

/**
 * Generate a JWT token with custom payload
 */
export function generateToken(payload: Record<string, any>, expiresIn: string | number = TOKEN_EXPIRY): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    issuer: 'isohub',
    audience: 'isohub-client'
  });
}

/**
 * Generate a short-lived token (for password reset, email verification, etc.)
 */
export function generateShortLivedToken(payload: Record<string, any>, expiresIn: string | number = '1h'): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    issuer: 'isohub',
    audience: 'isohub-client'
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): Record<string, any> | null {
  try {
    return jwt.verify(token, JWT_SECRET) as Record<string, any>;
  } catch (error) {
    return null;
  }
}

/**
 * Decode a token without verification (for debugging)
 */
export function decodeToken(token: string): Record<string, any> | null {
  try {
    return jwt.decode(token) as Record<string, any>;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return Math.floor(Date.now() / 1000) > decoded.exp;
}
