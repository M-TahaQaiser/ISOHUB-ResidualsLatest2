/**
 * Multi-Tenant API Routes
 *
 * RESTful endpoints for multi-tenant operations using the new mt_* schema.
 * All routes enforce tenant isolation via middleware and service layer.
 */

import { Router } from 'express';
import {
  authenticateToken,
  authenticateWithTenantContext,
  requireRole,
  requireAgencyAccess,
  requireSubaccountAccess,
  AuthenticatedRequest,
  getTenantContext,
  canAccessAgencyData,
  auditAction
} from '../middleware/auth';
import { MultiTenantService, TenantContext } from '../services/multiTenantService';

const router = Router();

// Helper to build tenant context from request
function buildTenantContext(req: AuthenticatedRequest): TenantContext {
  return {
    agencyId: req.user!.agencyId!.toString(),
    subaccountId: req.user?.subaccountId || (req.query.subaccountId as string) || null,
    userId: req.user!.id
  };
}

// ===========================================
// AGENCY ROUTES (SuperAdmin only)
// ===========================================

// GET /api/mt/agencies - List all agencies
router.get('/agencies', authenticateToken, requireRole('superadmin'), async (req: AuthenticatedRequest, res) => {
  try {
    const agencies = await MultiTenantService.getAllAgencies();
    res.json({ success: true, data: agencies });
  } catch (error: any) {
    console.error('Error fetching agencies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/mt/agencies/:id - Get agency by ID
router.get('/agencies/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check access
    if (!canAccessAgencyData(req.user, id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const agency = await MultiTenantService.getAgencyById(id);
    if (!agency) {
      return res.status(404).json({ success: false, error: 'Agency not found' });
    }

    res.json({ success: true, data: agency });
  } catch (error: any) {
    console.error('Error fetching agency:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/mt/agencies - Create agency with admin user
router.post('/agencies', authenticateToken, requireRole(['superadmin', 'SuperAdmin']), auditAction('create', 'agency'), async (req: AuthenticatedRequest, res) => {
  try {
    const { agency, adminUser, tempPassword } = await MultiTenantService.createAgency(req.body);

    // Return agency data without exposing admin password in response
    // tempPassword should be sent via email or shown once to superadmin
    res.status(201).json({
      success: true,
      data: {
        ...agency,
        adminUser: adminUser ? {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role,
        } : undefined,
        // Only show temp password in response for SuperAdmin to copy
        tempCredentials: adminUser ? {
          username: adminUser.username,
          tempPassword: tempPassword,
        } : undefined,
      }
    });
  } catch (error: any) {
    console.error('Error creating agency:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/mt/agencies/:id - Update agency
router.patch('/agencies/:id', authenticateToken, requireRole(['superadmin', 'admin']), auditAction('update', 'agency'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    if (!canAccessAgencyData(req.user, id)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const agency = await MultiTenantService.updateAgency(id, req.body);
    res.json({ success: true, data: agency });
  } catch (error: any) {
    console.error('Error updating agency:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// SUBACCOUNT ROUTES (Tenant-scoped)
// ===========================================

// GET /api/mt/subaccounts - List subaccounts for current agency
router.get('/subaccounts', ...authenticateWithTenantContext, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const subaccounts = await MultiTenantService.getSubaccounts(ctx);
    res.json({ success: true, data: subaccounts });
  } catch (error: any) {
    console.error('Error fetching subaccounts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/mt/subaccounts/:id - Get subaccount by ID
router.get('/subaccounts/:id', ...authenticateWithTenantContext, requireSubaccountAccess, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const subaccount = await MultiTenantService.getSubaccountById(ctx, req.params.id);

    if (!subaccount) {
      return res.status(404).json({ success: false, error: 'Subaccount not found' });
    }

    res.json({ success: true, data: subaccount });
  } catch (error: any) {
    console.error('Error fetching subaccount:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/mt/subaccounts - Create subaccount
router.post('/subaccounts', ...authenticateWithTenantContext, requireRole(['superadmin', 'admin', 'Admin']), auditAction('create', 'subaccount'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const subaccount = await MultiTenantService.createSubaccount(ctx, req.body);
    res.status(201).json({ success: true, data: subaccount });
  } catch (error: any) {
    console.error('Error creating subaccount:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// USER ROUTES (Tenant-scoped)
// ===========================================

// GET /api/mt/users - List users for current tenant
router.get('/users', ...authenticateWithTenantContext, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const users = await MultiTenantService.getUsers(ctx);

    // Remove sensitive fields
    const sanitizedUsers = users.map(u => ({ ...u, passwordHash: undefined }));
    res.json({ success: true, data: sanitizedUsers });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/mt/users/:id - Get user by ID
router.get('/users/:id', ...authenticateWithTenantContext, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const user = await MultiTenantService.getUserById(ctx, req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Remove sensitive fields
    res.json({ success: true, data: { ...user, passwordHash: undefined } });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/mt/users - Create user
router.post('/users', ...authenticateWithTenantContext, requireRole(['superadmin', 'admin', 'Admin']), auditAction('create', 'user'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const user = await MultiTenantService.createUser(ctx, req.body);

    // Remove sensitive fields
    res.status(201).json({ success: true, data: { ...user, passwordHash: undefined } });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// PROCESSOR ROUTES (Tenant-scoped)
// ===========================================

// GET /api/mt/processors - List processors
router.get('/processors', ...authenticateWithTenantContext, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const processors = await MultiTenantService.getProcessors(ctx);
    res.json({ success: true, data: processors });
  } catch (error: any) {
    console.error('Error fetching processors:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/mt/processors/:id - Get processor by ID
router.get('/processors/:id', ...authenticateWithTenantContext, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const processor = await MultiTenantService.getProcessorById(ctx, req.params.id);

    if (!processor) {
      return res.status(404).json({ success: false, error: 'Processor not found' });
    }

    res.json({ success: true, data: processor });
  } catch (error: any) {
    console.error('Error fetching processor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/mt/processors - Create processor
router.post('/processors', ...authenticateWithTenantContext, requireRole(['superadmin', 'admin', 'Admin']), auditAction('create', 'processor'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const processor = await MultiTenantService.createProcessor(ctx, req.body);
    res.status(201).json({ success: true, data: processor });
  } catch (error: any) {
    console.error('Error creating processor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// MERCHANT ROUTES (Tenant-scoped)
// ===========================================

// GET /api/mt/merchants - List merchants
router.get('/merchants', ...authenticateWithTenantContext, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const options = {
      processorId: req.query.processorId as string,
      status: req.query.status as string
    };

    const merchants = await MultiTenantService.getMerchants(ctx, options);
    res.json({ success: true, data: merchants });
  } catch (error: any) {
    console.error('Error fetching merchants:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/mt/merchants/:id - Get merchant by ID
router.get('/merchants/:id', ...authenticateWithTenantContext, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const merchant = await MultiTenantService.getMerchantById(ctx, req.params.id);

    if (!merchant) {
      return res.status(404).json({ success: false, error: 'Merchant not found' });
    }

    res.json({ success: true, data: merchant });
  } catch (error: any) {
    console.error('Error fetching merchant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/mt/merchants - Create merchant
router.post('/merchants', ...authenticateWithTenantContext, auditAction('create', 'merchant'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const merchant = await MultiTenantService.createMerchant(ctx, req.body);
    res.status(201).json({ success: true, data: merchant });
  } catch (error: any) {
    console.error('Error creating merchant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/mt/merchants/:id - Update merchant
router.patch('/merchants/:id', ...authenticateWithTenantContext, auditAction('update', 'merchant'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const merchant = await MultiTenantService.updateMerchant(ctx, req.params.id, req.body);
    res.json({ success: true, data: merchant });
  } catch (error: any) {
    console.error('Error updating merchant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// MONTHLY DATA ROUTES (Tenant-scoped)
// ===========================================

// GET /api/mt/monthly-data - List monthly data
router.get('/monthly-data', ...authenticateWithTenantContext, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const options = {
      merchantId: req.query.merchantId as string,
      processorId: req.query.processorId as string,
      month: req.query.month ? parseInt(req.query.month as string) : undefined,
      year: req.query.year ? parseInt(req.query.year as string) : undefined
    };

    const data = await MultiTenantService.getMonthlyData(ctx, options);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching monthly data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/mt/monthly-data - Create monthly data record
router.post('/monthly-data', ...authenticateWithTenantContext, auditAction('create', 'monthly_data'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const data = await MultiTenantService.createMonthlyData(ctx, req.body);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating monthly data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// AUDIT LOG ROUTES (Tenant-scoped)
// ===========================================

// GET /api/mt/audit-logs - Get audit logs
router.get('/audit-logs', ...authenticateWithTenantContext, requireRole(['superadmin', 'admin', 'Admin']), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const options = {
      resourceType: req.query.resourceType as string,
      resourceId: req.query.resourceId as string,
      action: req.query.action as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100
    };

    const logs = await MultiTenantService.getAuditLogs(ctx, options);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// DASHBOARD ROUTES (Tenant-scoped)
// ===========================================

// GET /api/mt/dashboard/stats - Get dashboard statistics
router.get('/dashboard/stats', ...authenticateWithTenantContext, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.agencyId) {
      return res.status(400).json({ success: false, error: 'Agency context required' });
    }

    const ctx = buildTenantContext(req);
    const stats = await MultiTenantService.getDashboardStats(ctx);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
