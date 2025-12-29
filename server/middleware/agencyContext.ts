import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Extended request with agency context helpers
 */
export interface AgencyContextRequest extends AuthenticatedRequest {
  agencyContext: {
    agencyId: number | null;
    isSuperAdmin: boolean;
    canAccessAllAgencies: boolean;
    getAgencyFilter: () => { agencyId: number } | {};
  };
}

/**
 * Middleware to attach agency context to all authenticated requests
 * This ensures proper multi-tenant data isolation
 */
export const attachAgencyContext = (
  req: AgencyContextRequest,
  res: Response,
  next: NextFunction
) => {
  // If no user, skip agency context (will be handled by auth middleware)
  if (!req.user) {
    return next();
  }

  const isSuperAdmin = req.user.role === 'SuperAdmin';
  const agencyId = req.user.agencyId || null;

  // Attach agency context helpers
  req.agencyContext = {
    agencyId,
    isSuperAdmin,
    canAccessAllAgencies: isSuperAdmin,
    
    /**
     * Returns a filter object for agency-scoped queries
     * SuperAdmins get empty filter (see all agencies)
     * Regular users get agencyId filter
     */
    getAgencyFilter: () => {
      if (isSuperAdmin) {
        return {}; // SuperAdmin can see all agencies
      }
      if (agencyId) {
        return { agencyId };
      }
      return {}; // Fallback for users without agency
    }
  };

  next();
};

/**
 * Middleware to enforce agency access on specific routes
 * Use this for routes that operate on agency-specific data
 */
export const requireAgencyContext = (
  req: AgencyContextRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.agencyContext) {
    return res.status(500).json({ error: 'Agency context not initialized' });
  }

  // SuperAdmins always have access
  if (req.agencyContext.isSuperAdmin) {
    return next();
  }

  // Regular users must have an agency
  if (!req.agencyContext.agencyId) {
    return res.status(403).json({ 
      error: 'User must be assigned to an agency to access this resource' 
    });
  }

  next();
};

/**
 * Helper to validate agency access for a specific agency ID
 * Use in route handlers to check if user can access a specific agency's data
 */
export const validateAgencyAccess = (
  req: AgencyContextRequest,
  targetAgencyId: number
): boolean => {
  if (!req.agencyContext) {
    return false;
  }

  // SuperAdmins can access any agency
  if (req.agencyContext.isSuperAdmin) {
    return true;
  }

  // Regular users can only access their own agency
  return req.agencyContext.agencyId === targetAgencyId;
};

/**
 * Middleware to extract and validate agency ID from route params
 * Automatically checks if user has access to the requested agency
 */
export const validateRouteAgencyAccess = (paramName: string = 'agencyId') => {
  return (req: AgencyContextRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.agencyContext) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const targetAgencyId = parseInt(req.params[paramName] || req.query[paramName] as string);
    
    if (isNaN(targetAgencyId)) {
      return res.status(400).json({ error: 'Invalid agency ID' });
    }

    if (!validateAgencyAccess(req, targetAgencyId)) {
      return res.status(403).json({ 
        error: 'Access denied to this agency\'s data' 
      });
    }

    next();
  };
};

/**
 * Helper function to build agency-scoped WHERE conditions for Drizzle queries
 * Example usage:
 * 
 * const filter = buildAgencyFilter(req, { month: '2025-05' });
 * db.select().from(monthlyData).where(and(...Object.values(filter)))
 */
export function buildAgencyFilter<T extends Record<string, any>>(
  req: AgencyContextRequest,
  additionalFilters: T = {} as T
): T & { agencyId?: number } {
  const agencyFilter = req.agencyContext?.getAgencyFilter() || {};
  return { ...agencyFilter, ...additionalFilters };
}
