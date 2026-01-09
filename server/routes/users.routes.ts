import express from 'express';
import { db } from '../db';
import { users, agencies } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { EmailService } from '../services/EmailService';
import { AuthService } from '../services/AuthService';
import crypto from 'crypto';
import { authenticateToken, requireRole, requireReauth, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const emailService = new EmailService();

// Generate secure temporary password
function generateTempPassword(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper to check if user can access the target agency
function canAccessAgency(requestingUser: AuthenticatedRequest['user'], targetAgencyId: number | null): boolean {
  if (!requestingUser) return false;
  // SuperAdmin can access all agencies
  if (requestingUser.role === 'SuperAdmin') return true;
  // Admin can access their own agency
  if (!targetAgencyId) return true; // No agency restriction
  return requestingUser.agencyId === targetAgencyId;
}

// Create new user - Requires Admin role
router.post('/', authenticateToken, requireRole(['SuperAdmin', 'Admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      role = 'Users/Reps',
      agencyId,
      organizationId,
      isActive = true
    } = req.body;

    // SECURITY: Enforce tenant isolation
    // Non-SuperAdmin users can only create users in their own agency
    const targetAgencyId = agencyId || req.user?.agencyId;
    const targetOrgId = organizationId || req.user?.organizationId || 'org-default';

    if (!canAccessAgency(req.user, targetAgencyId)) {
      return res.status(403).json({ error: 'Cannot create users in other agencies' });
    }

    // Validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        error: 'firstName, lastName, and email are required' 
      });
    }

    // Check if email already exists
    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Generate username from email
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Check if username already exists, append number if needed
    let finalUsername = username;
    let counter = 1;
    while (true) {
      const [existingUsername] = await db.select()
        .from(users)
        .where(eq(users.username, finalUsername))
        .limit(1);
      
      if (!existingUsername) break;
      finalUsername = `${username}${counter}`;
      counter++;
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await AuthService.hashPassword(tempPassword);

    // Create user
    const [newUser] = await db.insert(users)
      .values({
        username: finalUsername,
        password: hashedPassword,
        email,
        firstName,
        lastName,
        role: role as any,
        organizationId: targetOrgId,
        agencyId: targetAgencyId,
        isActive,
        mfaEnabled: false,
        failedLoginAttempts: 0,
        isTemporaryPassword: true, // Flag to force password change on first login
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Get agency info for email context
    let agencyName = 'ISOHub';
    if (agencyId) {
      try {
        const [agency] = await db.select()
          .from(agencies)
          .where(eq(agencies.id, agencyId))
          .limit(1);
        if (agency) {
          agencyName = agency.companyName;
        }
      } catch (error) {
        console.warn('Could not fetch agency info for email:', error);
      }
    }

    // Send welcome email with credentials
    try {
      await emailService.sendUserWelcomeEmail({
        email,
        firstName,
        lastName,
        username: finalUsername,
        tempPassword,
        agencyName,
        role
      });
      console.log(`✅ Welcome email sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail user creation if email fails
    }

    // Remove sensitive data from response
    const { password: _, ...safeUser } = newUser;

    res.status(201).json({
      message: 'User created successfully',
      user: safeUser,
      emailSent: true,
      tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined // Only show in dev
    });

  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get all users - Requires authentication, filtered by tenant
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { agencyId, organizationId, role, isActive } = req.query;

    // SECURITY: Build base query with tenant isolation
    const conditions: any[] = [];

    // SuperAdmin can see all users, others only see their agency
    if (req.user?.role !== 'SuperAdmin') {
      if (req.user?.agencyId) {
        conditions.push(eq(users.agencyId, req.user.agencyId));
      }
    } else if (agencyId) {
      // SuperAdmin can filter by specific agency
      conditions.push(eq(users.agencyId, parseInt(agencyId as string)));
    }

    // Apply additional filters
    if (organizationId) {
      conditions.push(eq(users.organizationId, organizationId as string));
    }
    if (role) {
      conditions.push(eq(users.role, role as any));
    }
    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive === 'true'));
    }

    let query = db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      agencyId: users.agencyId,
      organizationId: users.organizationId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      mfaEnabled: users.mfaEnabled,
      isTemporaryPassword: users.isTemporaryPassword
    }).from(users);

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allUsers = await query;

    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID - Requires authentication with tenant check
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Build query with tenant isolation
    const conditions: any[] = [eq(users.id, userId)];

    // Non-SuperAdmin can only see users in their agency
    if (req.user?.role !== 'SuperAdmin' && req.user?.agencyId) {
      conditions.push(eq(users.agencyId, req.user.agencyId));
    }

    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      agencyId: users.agencyId,
      organizationId: users.organizationId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      mfaEnabled: users.mfaEnabled,
      isTemporaryPassword: users.isTemporaryPassword
    })
    .from(users)
    .where(and(...conditions))
    .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user - Requires Admin role with tenant check
// SECURITY: Step-up auth required when modifying user accounts
router.patch('/:id', authenticateToken, requireRole(['SuperAdmin', 'Admin']), requireReauth(), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // SECURITY: First verify the user belongs to the same agency
    const conditions: any[] = [eq(users.id, userId)];
    if (req.user?.role !== 'SuperAdmin' && req.user?.agencyId) {
      conditions.push(eq(users.agencyId, req.user.agencyId));
    }

    const [existingUser] = await db.select().from(users).where(and(...conditions)).limit(1);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { firstName, lastName, email, role, isActive, agencyId } = req.body;

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // SECURITY: Only SuperAdmin can change agency assignment
    if (agencyId !== undefined && req.user?.role === 'SuperAdmin') {
      updateData.agencyId = agencyId;
    }

    updateData.updatedAt = new Date();

    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data from response
    const { password: _, mfaSecret: __, ...safeUser } = updatedUser;

    res.json({
      message: 'User updated successfully',
      user: safeUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Reset user password - Requires Admin role with tenant check
// SECURITY: Step-up auth required for password resets (high-risk action)
router.post('/:id/reset-password', authenticateToken, requireRole(['SuperAdmin', 'Admin']), requireReauth(), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // SECURITY: Build query with tenant isolation
    const conditions: any[] = [eq(users.id, userId)];
    if (req.user?.role !== 'SuperAdmin' && req.user?.agencyId) {
      conditions.push(eq(users.agencyId, req.user.agencyId));
    }

    const [user] = await db.select()
      .from(users)
      .where(and(...conditions))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await AuthService.hashPassword(tempPassword);

    // Update user password
    await db.update(users)
      .set({
        password: hashedPassword,
        isTemporaryPassword: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, req.params.id));

    // Get agency info for email context
    let agencyName = 'ISOHub';
    if (user.agencyId) {
      try {
        const [agency] = await db.select()
          .from(agencies)
          .where(eq(agencies.id, user.agencyId))
          .limit(1);
        if (agency) {
          agencyName = agency.companyName;
        }
      } catch (error) {
        console.warn('Could not fetch agency info for email:', error);
      }
    }

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        tempPassword,
        agencyName
      });
      console.log(`✅ Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    res.json({
      message: 'Password reset successfully',
      emailSent: true,
      tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined // Only show in dev
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Delete user (soft delete - set inactive) - Requires Admin role with tenant check
// SECURITY: Step-up auth required for user deletion (destructive action)
router.delete('/:id', authenticateToken, requireRole(['SuperAdmin', 'Admin']), requireReauth(), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // SECURITY: First verify the user belongs to the same agency
    const conditions: any[] = [eq(users.id, userId)];
    if (req.user?.role !== 'SuperAdmin' && req.user?.agencyId) {
      conditions.push(eq(users.agencyId, req.user.agencyId));
    }

    const [existingUser] = await db.select().from(users).where(and(...conditions)).limit(1);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [updatedUser] = await db.update(users)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// Bulk operations - Requires Admin role with tenant isolation
router.post('/bulk/create', authenticateToken, requireRole(['SuperAdmin', 'Admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { users: userList, agencyId, organizationId } = req.body;

    // SECURITY: Enforce tenant isolation
    const targetAgencyId = agencyId || req.user?.agencyId;
    const targetOrgId = organizationId || req.user?.organizationId || 'org-default';

    if (!canAccessAgency(req.user, targetAgencyId)) {
      return res.status(403).json({ error: 'Cannot create users in other agencies' });
    }

    if (!Array.isArray(userList) || userList.length === 0) {
      return res.status(400).json({ error: 'Users array is required' });
    }

    const results = [];
    const errors = [];

    for (const userData of userList) {
      try {
        const { firstName, lastName, email, role = 'Users/Reps' } = userData;

        // Check if email already exists
        const [existingUser] = await db.select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          errors.push({ email, error: 'Email already exists' });
          continue;
        }

        // Generate username from email
        const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        
        let finalUsername = username;
        let counter = 1;
        while (true) {
          const [existingUsername] = await db.select()
            .from(users)
            .where(eq(users.username, finalUsername))
            .limit(1);
          
          if (!existingUsername) break;
          finalUsername = `${username}${counter}`;
          counter++;
        }

        const tempPassword = generateTempPassword();
        const hashedPassword = await AuthService.hashPassword(tempPassword);

        // Create user
        const [newUser] = await db.insert(users)
          .values({
            username: finalUsername,
            password: hashedPassword,
            email,
            firstName,
            lastName,
            role: role as any,
            organizationId: targetOrgId,
            agencyId: targetAgencyId,
            isActive: true,
            mfaEnabled: false,
            failedLoginAttempts: 0,
            isTemporaryPassword: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        // Send welcome email (don't fail if email fails)
        try {
          await emailService.sendUserWelcomeEmail({
            email,
            firstName,
            lastName,
            username: finalUsername,
            tempPassword,
            agencyName: 'ISOHub',
            role
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
        }

        results.push({
          id: newUser.id,
          email,
          username: finalUsername,
          success: true
        });

      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
        errors.push({ 
          email: userData.email, 
          error: error.message || 'Creation failed' 
        });
      }
    }

    res.json({
      message: `Bulk user creation completed`,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Bulk user creation error:', error);
    res.status(500).json({ error: 'Failed to create users' });
  }
});

export default router;