import { Router } from 'express';
import { db } from '../db';
import { prospects, agencies, users } from '../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { createProspectSchema } from '../../shared/schema';
import { z } from 'zod';
import crypto from 'crypto';
import { AuthService } from '../services/AuthService';
import { authenticateToken, requireRole } from '../middleware/auth';
import { emailService } from '../services/EmailService';

const router = Router();

// Apply authentication to all routes - SuperAdmin or Admin only
router.use(authenticateToken);
router.use(requireRole(['SuperAdmin', 'Admin', 'superadmin', 'admin']));

// Generate unique prospect ID
function generateProspectId(): string {
  return `PROS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

// Generate onboarding token
function generateOnboardingToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// GET /api/prospects - List all prospects
router.get('/', async (req, res) => {
  try {
    const allProspects = await db.select()
      .from(prospects)
      .orderBy(desc(prospects.createdAt));
    
    res.json({ prospects: allProspects });
  } catch (error) {
    console.error('Error fetching prospects:', error);
    res.status(500).json({ error: 'Failed to fetch prospects' });
  }
});

// GET /api/prospects/:id - Get single prospect
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [prospect] = await db.select()
      .from(prospects)
      .where(eq(prospects.prospectId, id))
      .limit(1);
    
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    res.json({ prospect });
  } catch (error) {
    console.error('Error fetching prospect:', error);
    res.status(500).json({ error: 'Failed to fetch prospect' });
  }
});

// POST /api/prospects - Create new prospect
router.post('/', async (req, res) => {
  try {
    const validatedData = createProspectSchema.parse(req.body);
    
    const prospectId = generateProspectId();
    
    const [newProspect] = await db.insert(prospects)
      .values({
        ...validatedData,
        prospectId,
        status: 'new',
      })
      .returning();
    
    res.status(201).json({ 
      message: 'Prospect created successfully',
      prospect: newProspect 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error creating prospect:', error);
    res.status(500).json({ error: 'Failed to create prospect' });
  }
});

// PUT /api/prospects/:id - Update prospect
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const [updated] = await db.update(prospects)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(prospects.prospectId, id))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    res.json({ 
      message: 'Prospect updated successfully',
      prospect: updated 
    });
  } catch (error) {
    console.error('Error updating prospect:', error);
    res.status(500).json({ error: 'Failed to update prospect' });
  }
});

// POST /api/prospects/:id/send-invoice - Mark invoice as sent
router.post('/:id/send-invoice', async (req, res) => {
  try {
    const { id } = req.params;
    const { invoiceLink } = req.body;
    
    const [updated] = await db.update(prospects)
      .set({
        invoiceLink,
        invoiceSentAt: new Date(),
        status: 'invoice_sent',
        updatedAt: new Date(),
      })
      .where(eq(prospects.prospectId, id))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    res.json({ 
      message: 'Invoice link saved',
      prospect: updated 
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({ error: 'Failed to save invoice link' });
  }
});

// POST /api/prospects/:id/toggle-payment - Toggle paid/active status
router.post('/:id/toggle-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { isPaid, isActive } = req.body;
    
    // Get current prospect
    const [current] = await db.select()
      .from(prospects)
      .where(eq(prospects.prospectId, id))
      .limit(1);
    
    if (!current) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    // Handle isPaid toggle
    if (isPaid !== undefined) {
      updateData.isPaid = isPaid;
      if (isPaid && !current.isPaid) {
        updateData.paidAt = new Date();
        updateData.status = 'paid';
      }
    }
    
    // Handle isActive toggle (the kill switch)
    if (isActive !== undefined) {
      updateData.isActive = isActive;
      
      // If activating, generate onboarding token
      if (isActive && !current.onboardingToken) {
        updateData.onboardingToken = generateOnboardingToken();
        updateData.onboardingTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        updateData.status = 'onboarding';
      }
    }
    
    const [updated] = await db.update(prospects)
      .set(updateData)
      .where(eq(prospects.prospectId, id))
      .returning();
    
    res.json({ 
      message: 'Payment status updated',
      prospect: updated,
      onboardingLink: updated.onboardingToken 
        ? `/onboarding?token=${updated.onboardingToken}` 
        : null
    });
  } catch (error) {
    console.error('Error toggling payment:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// POST /api/prospects/:id/send-welcome - Send welcome email
router.post('/:id/send-welcome', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [prospect] = await db.select()
      .from(prospects)
      .where(eq(prospects.prospectId, id))
      .limit(1);
    
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    if (!prospect.isActive) {
      return res.status(400).json({ error: 'Prospect must be active to send welcome email' });
    }
    
    // Generate token if not exists
    let token = prospect.onboardingToken;
    if (!token) {
      token = generateOnboardingToken();
      await db.update(prospects)
        .set({
          onboardingToken: token,
          onboardingTokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .where(eq(prospects.prospectId, id));
    }
    
    // TODO: Send actual email via EmailService
    // For now, just mark as sent
    const [updated] = await db.update(prospects)
      .set({
        welcomeEmailSent: true,
        welcomeEmailSentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(prospects.prospectId, id))
      .returning();
    
    const onboardingLink = `${process.env.BASE_URL || 'https://isohub.io'}/onboarding?token=${token}`;
    
    res.json({ 
      message: 'Welcome email sent (simulated)',
      prospect: updated,
      onboardingLink
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

// POST /api/prospects/:id/convert - Convert prospect to agency
router.post('/:id/convert', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [prospect] = await db.select()
      .from(prospects)
      .where(eq(prospects.prospectId, id))
      .limit(1);
    
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    if (!prospect.isPaid || !prospect.isActive) {
      return res.status(400).json({ error: 'Prospect must be paid and active to convert' });
    }
    
    if (prospect.convertedToAgencyId) {
      return res.status(400).json({ error: 'Prospect already converted' });
    }
    
    // Create new agency from prospect data
    const adminUsername = prospect.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await AuthService.hashPassword(tempPassword);
    
    const [newAgency] = await db.insert(agencies)
      .values({
        companyName: prospect.companyName,
        contactName: `${prospect.contactFirstName} ${prospect.contactLastName}`,
        email: prospect.email,
        phone: prospect.phone,
        adminUsername,
        tempPassword: hashedPassword,
        status: 'setup',
      })
      .returning();
    
    // Update prospect with conversion
    const [updated] = await db.update(prospects)
      .set({
        convertedToAgencyId: newAgency.id,
        convertedAt: new Date(),
        status: 'converted',
        updatedAt: new Date(),
      })
      .where(eq(prospects.prospectId, id))
      .returning();
    
    res.json({ 
      message: 'Prospect converted to agency successfully',
      prospect: updated,
      agency: newAgency,
      credentials: {
        username: adminUsername,
        tempPassword // Only shown once
      }
    });
  } catch (error) {
    console.error('Error converting prospect:', error);
    res.status(500).json({ error: 'Failed to convert prospect' });
  }
});

// POST /api/prospects/:id/activate - Mark as paid and start onboarding (combined action)
router.post('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [prospect] = await db.select()
      .from(prospects)
      .where(eq(prospects.prospectId, id))
      .limit(1);
    
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    if (prospect.isPaid && prospect.isActive && prospect.welcomeEmailSent) {
      return res.status(400).json({ error: 'Prospect already activated' });
    }
    
    // Generate onboarding token
    const onboardingToken = generateOnboardingToken();
    const onboardingTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Update prospect with all activation data
    // Status flow: new → pending_activation (after payment) → onboarding (after email click) → converted (after wizard complete)
    const [updated] = await db.update(prospects)
      .set({
        isPaid: true,
        paidAt: new Date(),
        isActive: true,
        onboardingToken,
        onboardingTokenExpiry,
        welcomeEmailSent: true,
        welcomeEmailSentAt: new Date(),
        status: 'pending_activation', // User needs to click email link to start onboarding
        updatedAt: new Date(),
      })
      .where(eq(prospects.prospectId, id))
      .returning();
    
    const baseUrl = process.env.BASE_URL || 'https://isohub.io';
    const onboardingLink = `${baseUrl}/onboarding?token=${onboardingToken}`;
    
    // Send actual welcome email via EmailService with onboardingLink
    const emailSent = await emailService.sendProspectOnboardingEmail({
      email: prospect.email,
      contactName: `${prospect.contactFirstName} ${prospect.contactLastName}`.trim(),
      companyName: prospect.companyName,
      onboardingLink,
    });
    
    console.log(`[PROSPECTS] Onboarding email to ${prospect.email}: ${emailSent ? 'sent' : 'failed/skipped'}`);
    
    res.json({ 
      message: emailSent ? 'Prospect activated and welcome email sent' : 'Prospect activated (email service not configured)',
      prospect: updated,
      onboardingLink,
      emailSent
    });
  } catch (error) {
    console.error('Error activating prospect:', error);
    res.status(500).json({ error: 'Failed to activate prospect' });
  }
});

// POST /api/prospects/:id/resend-email - Resend welcome email to prospect
router.post('/:id/resend-email', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [prospect] = await db.select()
      .from(prospects)
      .where(eq(prospects.prospectId, id))
      .limit(1);
    
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    if (prospect.status !== 'pending_activation' && prospect.status !== 'onboarding') {
      return res.status(400).json({ error: 'Can only resend email for prospects in activation or onboarding status' });
    }
    
    // Generate a new token for security
    const onboardingToken = generateOnboardingToken();
    const onboardingTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Update prospect with new token
    const [updated] = await db.update(prospects)
      .set({
        onboardingToken,
        onboardingTokenExpiry,
        welcomeEmailSentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(prospects.prospectId, id))
      .returning();
    
    const baseUrl = process.env.BASE_URL || 'https://isohub.io';
    const onboardingLink = `${baseUrl}/onboarding?token=${onboardingToken}`;
    
    // Send actual welcome email via EmailService with onboardingLink
    const emailSent = await emailService.sendProspectOnboardingEmail({
      email: prospect.email,
      contactName: `${prospect.contactFirstName} ${prospect.contactLastName}`.trim(),
      companyName: prospect.companyName,
      onboardingLink,
    });
    
    console.log(`[PROSPECTS] Resend onboarding email to ${prospect.email}: ${emailSent ? 'sent' : 'failed/skipped'}`);
    
    res.json({ 
      message: emailSent ? 'Welcome email resent successfully' : 'Email service not configured - copy the onboarding link below',
      prospect: updated,
      onboardingLink,
      emailSent
    });
  } catch (error) {
    console.error('Error resending welcome email:', error);
    res.status(500).json({ error: 'Failed to resend welcome email' });
  }
});

// DELETE /api/prospects/:id - Delete prospect
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [deleted] = await db.delete(prospects)
      .where(eq(prospects.prospectId, id))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    res.json({ message: 'Prospect deleted successfully' });
  } catch (error) {
    console.error('Error deleting prospect:', error);
    res.status(500).json({ error: 'Failed to delete prospect' });
  }
});

// Create a separate public router for token validation (no auth required)
export const publicProspectRouter = Router();

// POST /api/prospects/validate-token - Validate onboarding token (public - called when user clicks email link)
publicProspectRouter.post('/validate-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    const [prospect] = await db.select()
      .from(prospects)
      .where(eq(prospects.onboardingToken, token))
      .limit(1);
    
    if (!prospect) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }
    
    // Check if token is expired
    if (prospect.onboardingTokenExpiry && new Date(prospect.onboardingTokenExpiry) < new Date()) {
      return res.status(400).json({ error: 'Token has expired' });
    }
    
    // If status is still pending_activation, transition to onboarding
    if (prospect.status === 'pending_activation') {
      await db.update(prospects)
        .set({
          status: 'onboarding',
          updatedAt: new Date(),
        })
        .where(eq(prospects.onboardingToken, token));
    }
    
    res.json({ 
      success: true,
      prospect: {
        companyName: prospect.companyName,
        contactFirstName: prospect.contactFirstName,
        contactLastName: prospect.contactLastName,
        email: prospect.email,
        prospectId: prospect.prospectId,
        status: 'onboarding',
      }
    });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ error: 'Failed to validate token' });
  }
});

// POST /api/prospects/complete-onboarding - Mark onboarding as complete (called when wizard finishes)
publicProspectRouter.post('/complete-onboarding', async (req, res) => {
  try {
    const { token, organizationId } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    const [prospect] = await db.select()
      .from(prospects)
      .where(eq(prospects.onboardingToken, token))
      .limit(1);
    
    if (!prospect) {
      return res.status(404).json({ error: 'Invalid token' });
    }
    
    // Update prospect to converted status and link to organization
    const [updated] = await db.update(prospects)
      .set({
        status: 'converted',
        convertedToAgencyId: organizationId || null,
        updatedAt: new Date(),
      })
      .where(eq(prospects.onboardingToken, token))
      .returning();
    
    res.json({ 
      success: true,
      message: 'Onboarding completed successfully',
      prospect: updated
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

export default router;
