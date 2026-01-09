import { Router } from 'express';
import { db, mtSchema } from '../db';
import { agencies, users, emailTracking } from '@shared/schema';
import { organizations } from '@shared/onboarding-schema';
import { eq, and, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { AuthService } from '../services/AuthService';
import multer from 'multer';
import { emailService } from '../services/EmailService';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Generate random password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Helper: Check if user can access agency
function canAccessAgency(user: AuthenticatedRequest['user'], targetAgencyId: number): boolean {
  if (!user) return false;
  if (user.role === 'SuperAdmin') return true;
  return user.agencyId === targetAgencyId;
}

// Create agency with admin user - Requires SuperAdmin
router.post('/', authenticateToken, requireRole(['SuperAdmin']), upload.single('logo'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      companyName,
      contactName,
      email,
      phone,
      website,
      industry,
      isWhitelabel,
      primaryColor,
      secondaryColor,
      accentColor,
      description,
    } = req.body;

    // Validate required fields
    if (!companyName || !contactName || !email) {
      return res.status(400).json({
        error: 'Missing required fields: companyName, contactName, and email are required'
      });
    }

    // Generate admin username and temp password
    const adminUsername = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_admin';
    const tempPassword = AuthService.generateSecurePassword(16);
    const hashedPassword = await AuthService.hashPassword(tempPassword);

    // Handle logo upload
    let logoUrl = null;
    if (req.file) {
      logoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    // Create agency
    const [agency] = await db.insert(agencies).values({
      companyName,
      contactName,
      email,
      phone,
      website,
      industry,
      isWhitelabel: isWhitelabel === 'true',
      primaryColor: primaryColor || '#FFD700',
      secondaryColor: secondaryColor || '#000000',
      accentColor: accentColor || '#FFFFFF',
      logoUrl,
      description,
      status: 'setup',
      adminUsername,
      tempPassword, // SECURITY NOTE: Consider not storing this at all
      welcomeEmailSent: false,
      passwordEmailSent: false,
      emailDeliveryTracking: {},
    }).returning();

    // Create admin user account in legacy users table
    await db.insert(users).values({
      username: adminUsername,
      password: await bcrypt.hash(tempPassword, 10),
      email: email,
      firstName: contactName.split(' ')[0],
      lastName: contactName.split(' ').slice(1).join(' ') || '',
      role: "Admin",
      agencyId: agency.id,
      isTemporaryPassword: true,
    });

    // Also create in mt_* tables for multi-tenant RLS support
    const mtAgencyId = uuidv4();
    try {
      await db.insert(mtSchema.mtAgencies).values({
        id: mtAgencyId,
        name: companyName,
        slug: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        email,
        phone,
        website,
        logoUrl,
        primaryColor: primaryColor || '#FFD700',
        secondaryColor: secondaryColor || '#000000',
        accentColor: accentColor || '#FFFFFF',
        status: 'trial',
        isActive: true,
      });

      // Create admin user in mt_users
      await db.insert(mtSchema.mtUsers).values({
        id: uuidv4(),
        agencyId: mtAgencyId,
        username: adminUsername,
        email,
        passwordHash: hashedPassword,
        firstName: contactName.split(' ')[0],
        lastName: contactName.split(' ').slice(1).join(' ') || '',
        role: 'agency_owner',
        isTemporaryPassword: true,
        isActive: true,
      });
    } catch (mtError) {
      console.error('Warning: Failed to create mt_* records (may already exist):', mtError);
      // Continue - legacy tables are the source of truth for now
    }

    // Also create entry in organizations table for OrganizationSelector dropdown
    const organizationId = `org-${crypto.randomBytes(8).toString('hex')}`;
    const activationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    try {
      await db.insert(organizations).values({
        organizationId,
        name: companyName,
        website: website || null,
        adminContactName: contactName,
        adminContactEmail: email,
        adminContactPhone: phone || null,
        industry: industry || null,
        agencyId: agency.id,
        status: 'setup',
        activationToken,
        tokenExpiry,
      });
      console.log(`[Agencies] Created organization ${organizationId} linked to agency ${agency.id}`);
    } catch (orgError) {
      console.error('Warning: Failed to create organization record:', orgError);
      // Continue - agency creation is the primary action
    }

    // Send welcome email
    const welcomeEmailSent = await emailService.sendWelcomeEmail(
      agency.id,
      email,
      companyName,
      contactName,
      adminUsername
    );

    // Send password email (separate for security)
    const passwordEmailSent = await emailService.sendPasswordEmail(
      agency.id,
      email,
      contactName,
      adminUsername,
      tempPassword
    );

    // Update agency with email status
    await db.update(agencies)
      .set({
        welcomeEmailSent,
        passwordEmailSent,
        status: welcomeEmailSent && passwordEmailSent ? 'active' : 'setup',
        updatedAt: new Date(),
      })
      .where(eq(agencies.id, agency.id));

    res.json({
      ...agency,
      welcomeEmailSent,
      passwordEmailSent,
      tempPassword: undefined, // Never return temp password
    });
  } catch (error) {
    console.error('Error creating agency:', error);
    res.status(500).json({ error: 'Failed to create agency' });
  }
});

// Get all agencies - SuperAdmin sees all, others see only their own
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    let allAgencies;

    if (req.user?.role === 'SuperAdmin') {
      // SuperAdmin can see all agencies
      allAgencies = await db.select().from(agencies);
    } else if (req.user?.agencyId) {
      // Other users can only see their own agency
      allAgencies = await db.select().from(agencies).where(eq(agencies.id, req.user.agencyId));
    } else {
      return res.status(403).json({ error: 'No agency access' });
    }

    // Remove sensitive data from response
    const safeAgencies = allAgencies.map(agency => ({
      ...agency,
      tempPassword: undefined,
      smtpPassword: undefined,
    }));

    res.json(safeAgencies);
  } catch (error) {
    console.error('Error fetching agencies:', error);
    res.status(500).json({ error: 'Failed to fetch agencies' });
  }
});

// Get all agencies list - SuperAdmin only
router.get('/list', authenticateToken, requireRole(['SuperAdmin']), async (req: AuthenticatedRequest, res) => {
  try {
    const allAgencies = await db.select().from(agencies);

    // Remove sensitive data from response
    const safeAgencies = allAgencies.map(agency => ({
      ...agency,
      tempPassword: undefined,
      smtpPassword: undefined,
    }));

    res.json(safeAgencies);
  } catch (error) {
    console.error('Error fetching agencies:', error);
    res.status(500).json({ error: 'Failed to fetch agencies' });
  }
});

// Get agency by ID - with tenant isolation
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid agency ID' });
    }

    // SECURITY: Enforce tenant isolation
    if (!canAccessAgency(req.user, id)) {
      return res.status(403).json({ error: 'Access denied to this agency' });
    }

    const [agency] = await db.select()
      .from(agencies)
      .where(eq(agencies.id, id));

    if (!agency) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    // Remove sensitive data
    const safeAgency = {
      ...agency,
      tempPassword: undefined,
      smtpPassword: undefined,
    };

    res.json(safeAgency);
  } catch (error) {
    console.error('Error fetching agency:', error);
    res.status(500).json({ error: 'Failed to fetch agency' });
  }
});

// Update agency - with tenant isolation
router.put('/:id', authenticateToken, requireRole(['SuperAdmin', 'Admin']), upload.single('logo'), async (req: AuthenticatedRequest, res) => {
  try {
    const agencyId = parseInt(req.params.id);
    if (isNaN(agencyId)) {
      return res.status(400).json({ error: 'Invalid agency ID' });
    }

    // SECURITY: Enforce tenant isolation
    if (!canAccessAgency(req.user, agencyId)) {
      return res.status(403).json({ error: 'Access denied to this agency' });
    }

    const updateData = { ...req.body };

    // SECURITY: Remove sensitive fields from bulk update
    delete updateData.tempPassword;
    delete updateData.adminUsername;
    delete updateData.id;

    // Handle logo upload
    if (req.file) {
      updateData.logoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    updateData.updatedAt = new Date();

    const [updatedAgency] = await db.update(agencies)
      .set(updateData)
      .where(eq(agencies.id, agencyId))
      .returning();

    if (!updatedAgency) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    // Remove sensitive data
    const safeAgency = {
      ...updatedAgency,
      tempPassword: undefined,
      smtpPassword: undefined,
    };

    res.json(safeAgency);
  } catch (error) {
    console.error('Error updating agency:', error);
    res.status(500).json({ error: 'Failed to update agency' });
  }
});

// Delete agency - No auth for demo
router.delete('/:id', async (req, res) => {
  try {
    const agencyId = parseInt(req.params.id);
    if (isNaN(agencyId)) {
      return res.status(400).json({ error: 'Invalid agency ID' });
    }

    // Delete related email tracking records first
    await db.delete(emailTracking).where(eq(emailTracking.agencyId, agencyId));

    // Delete from organizations table too (if linked)
    try {
      await db.execute(sql`DELETE FROM organizations WHERE agency_id = ${agencyId}`);
    } catch (e) {
      console.log('No linked organization record to delete');
    }

    // Delete agency
    const [deletedAgency] = await db.delete(agencies)
      .where(eq(agencies.id, agencyId))
      .returning();

    if (!deletedAgency) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    res.json({ success: true, message: 'Agency deleted successfully' });
  } catch (error) {
    console.error('Error deleting agency:', error);
    res.status(500).json({ error: 'Failed to delete agency' });
  }
});

// Get email tracking for agency - with tenant isolation
router.get('/:id/email-tracking', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const agencyId = parseInt(req.params.id);
    if (isNaN(agencyId)) {
      return res.status(400).json({ error: 'Invalid agency ID' });
    }

    // SECURITY: Enforce tenant isolation
    if (!canAccessAgency(req.user, agencyId)) {
      return res.status(403).json({ error: 'Access denied to this agency' });
    }

    const tracking = await db.select()
      .from(emailTracking)
      .where(eq(emailTracking.agencyId, agencyId));

    res.json(tracking);
  } catch (error) {
    console.error('Error fetching email tracking:', error);
    res.status(500).json({ error: 'Failed to fetch email tracking' });
  }
});

// Update email tracking status (webhook endpoint - requires API key authentication)
router.post('/:id/email-tracking/:emailType/:status', async (req, res) => {
  try {
    // SECURITY: This should be protected by an API key or webhook signature
    const webhookSecret = req.headers['x-webhook-secret'];
    if (webhookSecret !== process.env.EMAIL_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    const agencyId = parseInt(req.params.id);
    const emailType = req.params.emailType;
    const status = req.params.status as 'delivered' | 'opened' | 'clicked' | 'bounced';

    await emailService.updateEmailTracking(agencyId, emailType, status);

    res.json({ message: 'Email tracking updated' });
  } catch (error) {
    console.error('Error updating email tracking:', error);
    res.status(500).json({ error: 'Failed to update email tracking' });
  }
});

// Exit impersonation mode - SuperAdmin only
router.post('/exit-impersonation', authenticateToken, requireRole(['SuperAdmin']), async (req: AuthenticatedRequest, res) => {
  try {
    // Log the exit for audit purposes
    console.log(`[AUDIT] SuperAdmin ${req.user?.username} exiting impersonation mode at ${new Date().toISOString()}`);
    
    res.json({ 
      success: true, 
      message: 'Impersonation session ended successfully' 
    });
  } catch (error) {
    console.error('Error exiting impersonation:', error);
    res.status(500).json({ error: 'Failed to exit impersonation' });
  }
});

// Generate unique agency code - SuperAdmin only
router.post('/generate-code', authenticateToken, requireRole(['SuperAdmin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { agencyName } = req.body;

    if (!agencyName) {
      return res.status(400).json({ error: 'Agency name is required' });
    }

    // Generate agency code from business name
    const businessInitials = agencyName
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 4);

    const year = new Date().getFullYear();
    const sequenceNumber = Math.floor(Math.random() * 999) + 1;
    const paddedSequence = sequenceNumber.toString().padStart(3, '0');

    const agencyCode = `${businessInitials}-${year}-${paddedSequence}`;

    res.json({
      success: true,
      agencyCode,
      businessInitials,
      year,
      sequenceNumber: paddedSequence
    });
  } catch (error) {
    console.error('Error generating agency code:', error);
    res.status(500).json({ error: 'Failed to generate agency code' });
  }
});

// Create new agency during onboarding - SuperAdmin only
router.post('/create', authenticateToken, requireRole(['SuperAdmin']), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      companyName,
      agencyCode,
      contactName,
      email,
      phone,
      website,
      industry,
      location,
      primaryColor,
      secondaryColor,
      accentColor,
      description
    } = req.body;

    if (!companyName || !email) {
      return res.status(400).json({ error: 'Company name and email are required' });
    }

    // Generate admin credentials
    const adminUsername = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_admin';
    const tempPassword = AuthService.generateSecurePassword(16);

    // Create agency in database
    const [newAgency] = await db.insert(agencies).values({
      companyName,
      contactName: contactName || '',
      email,
      phone,
      website,
      industry,
      primaryColor: primaryColor || '#FFD700',
      secondaryColor: secondaryColor || '#000000',
      accentColor: accentColor || '#FFFFFF',
      description,
      status: 'active',
      adminUsername,
    }).returning();

    const hashedPassword = await AuthService.hashPassword(tempPassword);

    // Create admin user
    await db.insert(users).values({
      username: adminUsername,
      password: hashedPassword,
      email,
      firstName: contactName?.split(' ')[0] || 'Admin',
      lastName: contactName?.split(' ').slice(1).join(' ') || '',
      role: 'Admin',
      agencyId: newAgency.id,
      isTemporaryPassword: true,
    });

    // Also create in mt_* tables for multi-tenant RLS support
    const mtAgencyId = uuidv4();
    try {
      await db.insert(mtSchema.mtAgencies).values({
        id: mtAgencyId,
        name: companyName,
        slug: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        email,
        phone,
        website,
        primaryColor: primaryColor || '#FFD700',
        secondaryColor: secondaryColor || '#000000',
        accentColor: accentColor || '#FFFFFF',
        status: 'active',
        isActive: true,
      });

      // Create admin user in mt_users
      await db.insert(mtSchema.mtUsers).values({
        id: uuidv4(),
        agencyId: mtAgencyId,
        username: adminUsername,
        email,
        passwordHash: hashedPassword,
        firstName: contactName?.split(' ')[0] || 'Admin',
        lastName: contactName?.split(' ').slice(1).join(' ') || '',
        role: 'agency_owner',
        isTemporaryPassword: true,
        isActive: true,
      });
    } catch (mtError) {
      console.error('Warning: Failed to create mt_* records (may already exist):', mtError);
    }

    res.json({
      success: true,
      agency: {
        ...newAgency,
        tempPassword: undefined,
      }
    });
  } catch (error) {
    console.error('Error creating agency:', error);
    res.status(500).json({ error: 'Failed to create agency' });
  }
});

export default router;
