import { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { db } from '../db';
import { users, agencies } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { authRateLimit, validateInput, emailValidation, passwordValidation, usernameValidation } from '../middleware/security';
import { z } from 'zod';
import { logAuditEvent } from '../services/auditLogger';

const router = Router();

// Test endpoint
router.post('/test-login', async (req, res) => {
  console.log('TEST LOGIN ENDPOINT HIT');
  console.log('Request body:', req.body);
  res.json({ message: 'Test endpoint working' });
});

// Input validation schema for login
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(255),
  password: z.string().min(1, 'Password is required').max(1000),
});

// Login endpoint with security, rate limiting, and input validation
router.post('/login', 
  authRateLimit,
  validateInput(loginSchema),
  async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log('Login attempt for username:', username);

      // Find user by username
      const [user] = await db.select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (!user) {
        console.log('User not found:', username);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log('User found:', user.username, 'Account active:', user.isActive);

      // Check if account is locked
      if (await AuthService.isAccountLocked(user.id)) {
        console.log('Account is locked for user:', username);
        return res.status(423).json({ 
          error: 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.' 
        });
      }

      // Verify password
      console.log('Verifying password for user:', username);
      const isValidPassword = await AuthService.verifyPassword(password, user.password);
      console.log('Password verification result:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('Password invalid for user:', username);
        await AuthService.handleFailedLogin(user.id);
        
        // Log failed authentication attempt
        logAuditEvent({
          action: "user_login_failed",
          userId: user.id,
          organizationId: user.organizationId ? parseInt(user.organizationId, 10) || undefined : undefined,
          resourceType: "authentication",
          resourceId: username,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.get("User-Agent"),
          outcome: "failure",
          metadata: { reason: "invalid_password" }
        });
        
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      // Handle successful login
      await AuthService.handleSuccessfulLogin(user.id);

      // Generate JWT token
      const token = AuthService.generateJWT({
        userId: user.id,
        username: user.username,
        role: user.role,
        organizationId: user.organizationId,
        agencyId: user.agencyId
      });

      // Log successful authentication
      logAuditEvent({
        action: "user_login",
        userId: user.id,
        organizationId: user.organizationId ? parseInt(user.organizationId, 10) || undefined : undefined,
        resourceType: "authentication",
        resourceId: user.username,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("User-Agent"),
        outcome: "success"
      });

      // Remove sensitive data from response
      const { password: _, mfaSecret: __, ...safeUser } = user;

      res.json({
        message: 'Login successful',
        token,
        user: safeUser
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Register endpoint with security
router.post('/register',
  validateInput(z.object({
    username: usernameValidation,
    password: passwordValidation,
    email: emailValidation
  })),
  async (req, res) => {
    try {
      const { username, password, email, firstName, lastName, role = 'Users/Reps' } = req.body;

      // Check password strength
      const passwordValidation = AuthService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors
        });
      }

      // Check if username already exists
      const [existingUser] = await db.select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await AuthService.hashPassword(password);

      // Create user - SECURITY FIX: Don't allow client to set role or agencyId
      // These must be set by administrators during onboarding, not by users on registration
      const [newUser] = await db.insert(users)
        .values({
          username,
          password: hashedPassword,
          email,
          firstName,
          lastName,
          role: 'Users/Reps', // Fixed role for new registrations, admins can promote later
          isActive: true,
          mfaEnabled: false,
          failedLoginAttempts: 0
        })
        .returning();

      // Remove sensitive data from response
      const { password: _, mfaSecret: __, ...safeUser } = newUser;

      res.status(201).json({
        message: 'User created successfully',
        user: safeUser
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Change password endpoint
router.post('/change-password',
  validateInput(passwordValidation),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = AuthService.verifyJWT(token);
      
      // Get current user
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isCurrentPasswordValid = await AuthService.verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Validate new password strength
      const passwordValidation = AuthService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          error: 'New password does not meet security requirements',
          details: passwordValidation.errors
        });
      }

      // Hash new password
      const hashedNewPassword = await AuthService.hashPassword(newPassword);

      // Update password
      await db.update(users)
        .set({ 
          password: hashedNewPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      res.json({ message: 'Password changed successfully' });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Setup MFA endpoint
router.post('/setup-mfa', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = AuthService.verifyJWT(token);
    
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate MFA secret
    const mfaSetup = AuthService.generateMFASecret(user.username);

    // Store encrypted secret
    const encryptedSecret = AuthService.encryptSensitiveData(mfaSetup.secret);

    await db.update(users)
      .set({ 
        mfaSecret: encryptedSecret,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    res.json({
      qrCode: mfaSetup.qrCode,
      secret: mfaSetup.secret // Only return during setup
    });

  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify MFA and enable
router.post('/verify-mfa', async (req, res) => {
  try {
    const { token: mfaToken } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = AuthService.verifyJWT(token);
    
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user || !user.mfaSecret) {
      return res.status(400).json({ error: 'MFA not set up' });
    }

    // Decrypt secret
    const decryptedSecret = AuthService.decryptSensitiveData(user.mfaSecret);

    // Verify MFA token
    const isValidMFA = AuthService.verifyMFAToken(decryptedSecret, mfaToken);

    if (!isValidMFA) {
      return res.status(400).json({ error: 'Invalid MFA token' });
    }

    // Enable MFA
    await db.update(users)
      .set({ 
        mfaEnabled: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    res.json({ message: 'MFA enabled successfully' });

  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request password reset (self-service)
router.post('/forgot-password', 
  async (req, res) => {
    try {
      const { email } = req.body;

      // Find user by email
      const [user] = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      // Always return success to prevent email enumeration
      const successResponse = { 
        message: 'If an account with that email exists, you will receive a password reset email shortly.' 
      };

      if (!user) {
        return res.json(successResponse);
      }

      // Check if account is active
      if (!user.isActive) {
        return res.json(successResponse);
      }

      // Generate new temporary password
      const tempPassword = AuthService.generateSecurePassword();
      const hashedPassword = await AuthService.hashPassword(tempPassword);

      // Update user password
      await db.update(users)
        .set({
          password: hashedPassword,
          isTemporaryPassword: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

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

      // Import email service
      const { EmailService } = await import('../services/emailService');
      const emailService = new EmailService();

      // Send password reset email
      try {
        await emailService.sendPasswordResetEmail({
          email: user.email!,
          firstName: user.firstName!,
          lastName: user.lastName!,
          username: user.username,
          tempPassword,
          agencyName
        });
        console.log(`✅ Password reset email sent to ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }

      res.json(successResponse);

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;