import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SecurityService } from '../services/securityService';
import { StepUpAuthService } from '../services/StepUpAuthService';
import { db, setTenantContext } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

// Enhanced interface with multi-tenant support
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
    agencyId?: number;
    subaccountId?: string | null;  // NEW: Subaccount context
    permissions?: string[];
  };
  tenantContext?: {
    agencyId: string;
    subaccountId?: string | null;
  };
}

// Middleware to verify JWT token
export const authenticateToken = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = SecurityService.verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Support both 'id' and 'userId' from JWT (legacy compatibility)
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(403).json({ error: 'Invalid token payload' });
    }

    // Check if account is locked
    const isLocked = await SecurityService.isAccountLocked(userId);
    if (isLocked) {
      return res.status(423).json({ error: 'Account is temporarily locked' });
    }

    // Fetch fresh user data
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email || '',
      role: user.role,
      agencyId: user.agencyId || undefined,
      permissions: user.permissions as string[] || []
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to check user roles
export const requireRole = (roles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Middleware for SuperAdmin-only routes
export const requireSuperAdmin = requireRole('superadmin');

// Middleware for Admin+ roles
export const requireAdmin = requireRole(['superadmin', 'admin']);

// Middleware for Manager+ roles
export const requireManager = requireRole(['superadmin', 'admin', 'manager']);

// Middleware to check permissions
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.permissions?.includes(permission)) {
      return res.status(403).json({ error: `Permission '${permission}' required` });
    }

    next();
  };
};

// Middleware to ensure user belongs to agency (multi-tenancy)
export const requireAgencyAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // SECURITY FIX: Get agencyId from JWT token ONLY, never from request params/body/query
  const agencyIdFromRequest = req.params.agencyId || req.body.agencyId || req.query.agencyId;
  const userAgencyId = req.user.agencyId?.toString();
  
  // SuperAdmin can access all agencies
  if (req.user.role === 'superadmin') {
    return next();
  }

  // Regular users can only access their own agency from JWT token
  // Ignore any client-provided agencyId to prevent IDOR attacks
  if (!userAgencyId) {
    return res.status(403).json({ error: 'User is not assigned to any agency' });
  }

  if (agencyIdFromRequest && agencyIdFromRequest !== userAgencyId) {
    console.warn(`[SECURITY] IDOR attempt detected: User ${req.user.id} tried to access agency ${agencyIdFromRequest} but belongs to ${userAgencyId}`);
    return res.status(403).json({ error: 'Access denied to this agency' });
  }

  next();
};

// Rate limiting middleware
export const rateLimit = (
  limit: number = 60, 
  windowMs: number = 60000, 
  message: string = 'Too many requests'
) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const identifier = req.user?.id.toString() || req.ip || 'anonymous';
    const endpoint = req.route?.path || req.path;

    try {
      const rateLimitResult = await SecurityService.checkRateLimit(
        identifier, 
        endpoint, 
        limit, 
        windowMs
      );

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
      res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime.getTime());

      if (!rateLimitResult.allowed) {
        return res.status(429).json({ 
          error: message,
          retryAfter: rateLimitResult.resetTime 
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Don't block request if rate limiting fails
      next();
    }
  };
};

// Audit middleware for sensitive actions
export const auditAction = (action: string, resourceType: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log successful actions (status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        SecurityService.auditAction(
          req.user.id,
          req.user.agencyId || null,
          action,
          resourceType,
          req.params.id || undefined,
          {
            request: {
              method: req.method,
              path: req.path,
              body: req.body,
              query: req.query
            },
            response: data
          },
          req.ip,
          req.headers['user-agent']
        ).catch(error => {
          console.error('Audit logging error:', error);
        });
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continue without user
  }

  try {
    const decoded = SecurityService.verifyToken(token);
    if (decoded) {
      const [user] = await db.select().from(users).where(eq(users.id, decoded.id));
      if (user && !(await SecurityService.isAccountLocked(decoded.id))) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email || '',
          role: user.role,
          agencyId: user.agencyId || undefined,
          permissions: user.permissions as string[] || []
        };
      }
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
  }

  next();
};

// ===========================================
// MULTI-TENANT CONTEXT MIDDLEWARE
// ===========================================

// Middleware to set database tenant context for RLS policies
export const setTenantContextMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.agencyId) {
    return next();
  }

  try {
    const agencyId = req.user.agencyId.toString();
    const subaccountId = req.user.subaccountId || req.query.subaccountId as string || null;

    // Set tenant context for RLS policies
    await setTenantContext(agencyId, subaccountId);

    // Store context in request for downstream use
    req.tenantContext = {
      agencyId,
      subaccountId
    };

    next();
  } catch (error) {
    console.error('Failed to set tenant context:', error);
    return res.status(500).json({ error: 'Failed to establish tenant context' });
  }
};

// Middleware to ensure user can access specific subaccount
export const requireSubaccountAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const subaccountId = req.params.subaccountId || req.body.subaccountId || req.query.subaccountId;

  if (!subaccountId) {
    return next(); // No subaccount specified, proceed
  }

  // SuperAdmin can access all subaccounts
  if (req.user.role === 'superadmin') {
    return next();
  }

  // Agency admin can access all subaccounts in their agency
  if (req.user.role === 'admin' || req.user.role === 'Admin') {
    return next();
  }

  // Regular users can only access their assigned subaccount
  if (req.user.subaccountId && req.user.subaccountId !== subaccountId) {
    return res.status(403).json({ error: 'Access denied to this subaccount' });
  }

  next();
};

// Combined middleware: authenticate + set tenant context
export const authenticateWithTenantContext = [
  authenticateToken,
  setTenantContextMiddleware
];

// Helper to get current tenant context from request
export function getTenantContext(req: AuthenticatedRequest): { agencyId: number | null; subaccountId: string | null } {
  return {
    agencyId: req.user?.agencyId || null,
    subaccountId: req.user?.subaccountId || null
  };
}

// Helper to validate that user can access a specific agency's data
export function canAccessAgencyData(user: AuthenticatedRequest['user'], targetAgencyId: number | string | null): boolean {
  if (!user) return false;
  if (user.role === 'superadmin' || user.role === 'SuperAdmin') return true;
  if (!targetAgencyId) return false;
  return user.agencyId?.toString() === targetAgencyId?.toString();
}

// ===========================================
// MANDATORY MFA ENFORCEMENT (GLBA/PCI DSS 4.0)
// ===========================================

// Roles that require MFA for compliance
const MFA_REQUIRED_ROLES = [
  'SuperAdmin',
  'Admin',
  'Manager',
  'Team Leaders'
];

// Paths that handle sensitive data requiring MFA
const SENSITIVE_PATHS = [
  '/api/merchants',
  '/api/reports',
  '/api/analytics',
  '/api/commissions',
  '/api/residuals',
  '/api/users',
  '/api/agencies'
];

/**
 * Middleware to enforce MFA for users accessing sensitive data
 * PCI DSS 4.0 requires MFA for all access to cardholder data environment
 * GLBA requires MFA for access to nonpublic personal information
 */
export const requireMFA = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if this role requires MFA
  const roleRequiresMFA = MFA_REQUIRED_ROLES.some(
    role => role.toLowerCase() === req.user!.role.toLowerCase()
  );

  // Check if this path handles sensitive data
  const pathRequiresMFA = SENSITIVE_PATHS.some(
    path => req.path.startsWith(path)
  );

  // If MFA is required but not enabled
  if ((roleRequiresMFA || pathRequiresMFA)) {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    
    if (!user?.mfaEnabled) {
      return res.status(403).json({
        error: 'MFA required',
        code: 'MFA_REQUIRED',
        message: 'Two-factor authentication is required to access this resource. Please enable MFA in your security settings.',
        setupUrl: '/settings/security'
      });
    }
  }

  next();
};

/**
 * Check if user has MFA enabled (for conditional UI display)
 */
export const checkMFAStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user) {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    (req as any).mfaEnabled = user?.mfaEnabled || false;
  }
  next();
};

/**
 * Get MFA requirement status for a user
 */
export function getMFARequirement(role: string): {
  required: boolean;
  reason: string;
} {
  const roleRequiresMFA = MFA_REQUIRED_ROLES.some(
    r => r.toLowerCase() === role.toLowerCase()
  );

  if (roleRequiresMFA) {
    return {
      required: true,
      reason: `Role "${role}" requires MFA for GLBA/PCI DSS 4.0 compliance`
    };
  }

  return {
    required: false,
    reason: 'MFA is optional but recommended for enhanced security'
  };
}

// ===========================================
// STEP-UP RE-AUTHENTICATION MIDDLEWARE
// ===========================================

/**
 * Middleware to require step-up re-authentication for sensitive operations
 * Used for routes that handle PII (SSN, bank statements, etc.)
 * User must provide a valid short-lived reauth token in headers
 * 
 * SECURITY: Tokens are consumed (single-use) by default to prevent replay attacks.
 * Set reuseToken: true only for read-only operations where replay is acceptable.
 */
export const requireReauth = (options?: { reuseToken?: boolean }) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const reauthToken = req.headers['x-reauth-token'] as string;

    if (!reauthToken) {
      return res.status(428).json({ 
        error: 'Step-up authentication required',
        code: 'REAUTH_REQUIRED',
        message: 'This action requires you to verify your identity. Please re-enter your password or use your authenticator app.',
        reauthEndpoint: '/api/security/reauth'
      });
    }

    // Validate the reauth token
    const validation = StepUpAuthService.validateReauthToken(
      reauthToken, 
      req.user?.id
    );

    if (!validation.valid) {
      return res.status(401).json({
        error: 'Invalid or expired security token',
        code: 'REAUTH_INVALID',
        message: validation.error || 'Please verify your identity again.',
        reauthEndpoint: '/api/security/reauth'
      });
    }

    // SECURITY: Consume token by default (single-use) to prevent replay attacks
    // Only skip consumption if explicitly set for read-only operations
    if (!options?.reuseToken) {
      StepUpAuthService.consumeReauthToken(reauthToken);
    }

    // Attach reauth info to request for logging
    (req as any).reauthMethod = validation.method;
    (req as any).reauthValidatedAt = new Date();

    next();
  };
};

/**
 * Optional reauth - doesn't fail if no token, but validates if present
 * Useful for routes that can work without reauth but have enhanced features with it
 */
export const optionalReauth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const reauthToken = req.headers['x-reauth-token'] as string;

  if (reauthToken && req.user) {
    const validation = StepUpAuthService.validateReauthToken(reauthToken, req.user.id);
    if (validation.valid) {
      (req as any).reauthValidated = true;
      (req as any).reauthMethod = validation.method;
    }
  }

  next();
};