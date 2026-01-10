import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const router = Router();

// Validation schema for login
const loginSchema = z.object({
  password: z.string().min(1, 'Password is required').max(128, 'Password too long')
});

// Cache for hashed password (computed once on first login attempt)
let cachedPasswordHash: string | null = null;

/**
 * Get or create hashed password for comparison
 * SECURITY: We hash the env password on-demand and cache it
 * This allows the env to store plaintext but we compare securely
 */
async function getHashedPassword(): Promise<string | null> {
  const businessOwnerPassword = process.env.BUSINESS_OWNER_PASSWORD;
  if (!businessOwnerPassword) {
    return null;
  }

  // If we have a pre-hashed password in env (starts with $2b$), use it directly
  if (businessOwnerPassword.startsWith('$2b$') || businessOwnerPassword.startsWith('$2a$')) {
    return businessOwnerPassword;
  }

  // Otherwise, hash it and cache for future comparisons
  if (!cachedPasswordHash) {
    cachedPasswordHash = await bcrypt.hash(businessOwnerPassword, 12);
  }
  return cachedPasswordHash;
}

// Business Owner login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validationResult.error.errors
      });
    }

    const { password } = validationResult.data;

    // Get hashed password for comparison
    const hashedPassword = await getHashedPassword();
    if (!hashedPassword) {
      console.error('BUSINESS_OWNER_PASSWORD not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // SECURITY FIX: Use bcrypt for secure password comparison
    // This prevents timing attacks and properly handles hashed passwords
    const isValid = await bcrypt.compare(password, hashedPassword);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({ error: 'Session error' });
      }

      // Set session data
      req.session.businessOwnerId = 'business-owner';
      req.session.loginTime = Date.now();

      // Save session explicitly
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
          return res.status(500).json({ error: 'Session save error' });
        }

        res.json({ 
          success: true,
          message: 'Authentication successful'
        });
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Business Owner logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  if (!req.session.businessOwnerId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Destroy session and clear cookie
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).json({ error: 'Logout error' });
    }

    // Explicitly clear the session cookie
    res.clearCookie('isohub.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV?.toLowerCase() === 'production',
      sameSite: 'strict',
    });

    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check authentication status
router.get('/status', (req: Request, res: Response) => {
  if (req.session.businessOwnerId) {
    // Check if session has expired (24 hours)
    const loginTime = req.session.loginTime || 0;
    const now = Date.now();
    const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

    if (hoursSinceLogin > 24) {
      // Session expired
      req.session.destroy(() => {
        res.json({ authenticated: false, expired: true });
      });
      return;
    }

    res.json({ 
      authenticated: true,
      loginTime: req.session.loginTime 
    });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
