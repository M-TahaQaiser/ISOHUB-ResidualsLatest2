import { Router } from 'express';
import { onboardingService } from '../services/OnboardingService';
import { createOrganizationSchema, activateUserSchema, onboardingStepSchema } from '@shared/onboarding-schema';
import { z } from 'zod';

const router = Router();

/**
 * GET /api/onboarding/organizations
 * List all organizations
 */
router.get('/organizations', async (req, res) => {
  try {
    const allOrganizations = await onboardingService.getAllOrganizations();
    res.json(allOrganizations);
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations',
    });
  }
});

/**
 * POST /api/onboarding/organizations/test-data
 * Add test organizations for development
 */
router.post('/organizations/test-data', async (req, res) => {
  try {
    const testOrgs = [
      {
        name: 'Acme Payment Solutions',
        website: 'https://acmepayments.com',
        adminContactName: 'John Smith',
        adminContactEmail: 'john@acmepayments.com',
        adminContactPhone: '555-0100',
        industry: 'Financial Services',
      },
      {
        name: 'Global Merchant Services',
        website: 'https://globalmerchant.io',
        adminContactName: 'Sarah Johnson',
        adminContactEmail: 'sarah@globalmerchant.io',
        adminContactPhone: '555-0200',
        industry: 'E-commerce',
      },
      {
        name: 'TechPay Industries',
        website: 'https://techpay.tech',
        adminContactName: 'Mike Davis',
        adminContactEmail: 'mike@techpay.tech',
        adminContactPhone: '555-0300',
        industry: 'Technology',
      },
    ];

    const createdOrgs = [];
    for (const orgData of testOrgs) {
      const result = await onboardingService.createOrganization({
        ...orgData,
        skipEmail: true, // Skip sending emails for test data
      });
      createdOrgs.push(result.organization);
    }

    res.json({
      success: true,
      message: `Created ${createdOrgs.length} test organizations`,
      organizations: createdOrgs,
    });
  } catch (error) {
    console.error('Create test organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test organizations',
    });
  }
});

/**
 * POST /api/onboarding/organizations
 * Create new organization (Admin only)
 */
router.post('/organizations', async (req, res) => {
  try {
    const validatedData = createOrganizationSchema.parse(req.body);
    
    const result = await onboardingService.createOrganization({
      name: validatedData.name,
      website: validatedData.website || undefined,
      adminContactName: validatedData.adminContactName,
      adminContactEmail: validatedData.adminContactEmail,
      adminContactPhone: validatedData.adminContactPhone || undefined,
      industry: validatedData.industry || undefined,
    });

    res.status(201).json({
      success: true,
      organizationId: result.organization.organizationId,
      activationLink: result.activationLink,
      message: 'Organization created successfully. Welcome email sent.',
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create organization',
    });
  }
});

/**
 * GET /api/onboarding/organizations/:organizationId
 * Get single organization details
 */
router.get('/organizations/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const organization = await onboardingService.getOrganization(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Disable browser caching to ensure fresh data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(organization);
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization',
    });
  }
});

/**
 * PUT /api/onboarding/organizations/:organizationId
 * Update organization details
 */
router.put('/organizations/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const updateData = req.body;

    const updated = await onboardingService.updateOrganization(organizationId, updateData);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    res.json({
      success: true,
      organization: updated,
      message: 'Organization updated successfully',
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization',
    });
  }
});

/**
 * POST /api/onboarding/activate
 * Activate user account with token
 */
router.post('/activate', async (req, res) => {
  try {
    const validatedData = activateUserSchema.parse(req.body);
    
    const result = await onboardingService.activateUser(
      validatedData.token,
      validatedData.password
    );

    res.json({
      success: result.success,
      organizationId: result.organizationId,
      redirectUrl: result.redirectUrl,
      message: 'Account activated successfully',
    });
  } catch (error) {
    console.error('User activation error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to activate account',
    });
  }
});

/**
 * GET /api/onboarding/progress/:organizationId
 * Get onboarding progress for organization
 */
router.get('/progress/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const progress = await onboardingService.getOnboardingProgress(organizationId);
    const organization = await onboardingService.getOrganization(organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    res.json({
      success: true,
      organization,
      progress,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding progress',
    });
  }
});

/**
 * PUT /api/onboarding/progress/:organizationId/step
 * Update onboarding step progress
 */
router.put('/progress/:organizationId/step', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const validatedData = onboardingStepSchema.parse(req.body);
    
    const progress = await onboardingService.updateOnboardingStep(
      organizationId,
      validatedData.step,
      validatedData.data
    );

    res.json({
      success: true,
      progress,
      message: `Step ${validatedData.step} completed successfully`,
    });
  } catch (error) {
    console.error('Update step error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update onboarding step',
    });
  }
});

/**
 * POST /api/onboarding/vendors/:organizationId
 * Select vendors during onboarding
 */
router.post('/vendors/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { vendorSelections } = req.body;

    if (!Array.isArray(vendorSelections)) {
      return res.status(400).json({
        success: false,
        message: 'vendorSelections must be an array',
      });
    }

    await onboardingService.selectVendors(organizationId, vendorSelections);

    res.json({
      success: true,
      message: 'Vendors selected successfully',
    });
  } catch (error) {
    console.error('Select vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select vendors',
    });
  }
});

/**
 * POST /api/onboarding/documents/:organizationId
 * Setup document integration
 */
router.post('/documents/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { provider, integrationData } = req.body;

    await onboardingService.setupDocumentIntegration(
      organizationId,
      provider,
      integrationData
    );

    res.json({
      success: true,
      message: `${provider} integration setup successfully`,
    });
  } catch (error) {
    console.error('Document integration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup document integration',
    });
  }
});

/**
 * POST /api/onboarding/tour/:organizationId
 * Initialize dashboard tour
 */
router.post('/tour/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { userId, tourType } = req.body;

    await onboardingService.initializeDashboardTour(
      organizationId,
      userId,
      tourType
    );

    res.json({
      success: true,
      message: 'Dashboard tour initialized',
    });
  } catch (error) {
    console.error('Tour initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize dashboard tour',
    });
  }
});

/**
 * POST /api/onboarding/business-profile/:organizationId
 * Generate AI business profile
 */
router.post('/business-profile/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const businessData = req.body;

    // Validate required fields
    const requiredFields = ['idealClients', 'targetAudience', 'offers', 'strengths', 'challenges', 'purchaseMotivations'];
    for (const field of requiredFields) {
      if (!businessData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    const profile = await onboardingService.generateBusinessProfile(businessData);

    res.json({
      success: true,
      profile,
      message: 'Business profile generated successfully',
    });
  } catch (error) {
    console.error('Business profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate business profile',
    });
  }
});

/**
 * GET /api/onboarding/vendors/:organizationId
 * Get organization's selected vendors
 */
router.get('/vendors/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const vendors = await onboardingService.getOrganizationVendors(organizationId);

    res.json({
      success: true,
      vendors,
    });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get organization vendors',
    });
  }
});

export default router;