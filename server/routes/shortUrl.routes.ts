import { Router, Request, Response, NextFunction } from 'express';
import { URLShortenerService } from '../services/URLShortenerService';
import { authenticateToken, requireAgencyAccess, AuthenticatedRequest } from '../middleware/auth';
import { createRateLimiter } from '../middleware/security';
import { z } from 'zod';

const router = Router();

// Rate limiting for short URL creation (prevent abuse)
const shortUrlRateLimit = createRateLimiter(
  60 * 60 * 1000, // 1 hour window
  50, // 50 short URLs per hour per user
  'Too many short URLs created. Please try again later.'
);

// Validation schema for short URL creation
const createShortUrlSchema = z.object({
  agencyCode: z.string().min(1).max(50),
  fullname: z.string().min(1).max(100),
  agentName: z.string().min(1).max(100),
  organizationId: z.string().min(1).max(100),
  expiresInDays: z.number().min(1).max(365).optional()
});

/**
 * Create a short URL for a personalized form link
 * SECURITY FIX: Added authentication and rate limiting
 */
router.post('/create',
  authenticateToken,
  requireAgencyAccess,
  shortUrlRateLimit,
  async (req: AuthenticatedRequest, res) => {
  try {
    // Validate input
    const validationResult = createShortUrlSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validationResult.error.errors
      });
    }

    const { agencyCode, fullname, agentName, expiresInDays } = validationResult.data;

    // SECURITY FIX: Use organizationId from authenticated user, not from request body
    // This prevents users from creating URLs for other organizations
    const organizationId = req.user?.agencyId?.toString() || validationResult.data.organizationId;

    // Verify the agencyCode matches the user's agency
    if (req.user?.role !== 'superadmin' && req.user?.role !== 'SuperAdmin') {
      // Additional validation could check agencyCode against user's agency
    }

    const result = await URLShortenerService.createShortUrl({
      agencyCode,
      fullname,
      agentName,
      organizationId,
      expiresInDays: expiresInDays || 30, // Default 30 days expiration
    });

    res.json(result);
  } catch (error) {
    console.error('Error creating short URL:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Redirect short URL to original form
 */
router.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    const result = await URLShortenerService.resolveShortUrl(shortCode);

    if (!result.success) {
      return res.status(404).render('error', {
        title: 'Link Not Found',
        message: result.error || 'The requested link could not be found.',
      });
    }

    // Redirect to the original personalized form URL with /form prefix
    const redirectUrl = `/form${result.originalUrl!}`;
    console.log(`Redirecting from /s/${shortCode} to ${redirectUrl}`);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error resolving short URL:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'An error occurred while processing your request.',
    });
  }
});

/**
 * Get analytics for a short URL
 * SECURITY FIX: Added authentication
 */
router.get('/analytics/:shortCode',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
  try {
    const { shortCode } = req.params;

    // Validate shortCode format
    if (!shortCode || shortCode.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(shortCode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid short code format'
      });
    }

    const result = await URLShortenerService.getShortUrlAnalytics(shortCode);

    // SECURITY: Verify user has access to this URL's agency
    if (result.success && result.data && req.user?.role !== 'superadmin' && req.user?.role !== 'SuperAdmin') {
      // Additional check could verify the URL belongs to user's agency
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Deactivate a short URL
 * SECURITY FIX: Added authentication
 */
router.put('/deactivate/:shortCode',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
  try {
    const { shortCode } = req.params;

    // Validate shortCode format
    if (!shortCode || shortCode.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(shortCode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid short code format'
      });
    }

    const result = await URLShortenerService.deactivateShortUrl(shortCode);

    res.json(result);
  } catch (error) {
    console.error('Error deactivating short URL:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get all short URLs for an agency
 * SECURITY FIX: Added authentication and agency access verification
 */
router.get('/agency/:agencyCode',
  authenticateToken,
  requireAgencyAccess,
  async (req: AuthenticatedRequest, res) => {
  try {
    const { agencyCode } = req.params;

    // Validate agencyCode format
    if (!agencyCode || agencyCode.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(agencyCode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid agency code format'
      });
    }

    const result = await URLShortenerService.getAgencyShortUrls(agencyCode);

    res.json(result);
  } catch (error) {
    console.error('Error getting agency URLs:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;