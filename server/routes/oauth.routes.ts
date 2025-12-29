import { Router, type Request } from 'express';
import { oauthService } from '../services/OAuthService';
import { oauthStateService } from '../services/OAuthStateService';
import { authenticateToken } from '../middleware/auth';
import axios from 'axios';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Extend Express Request to include user
interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
    agencyId?: number;
    permissions?: string[];
  };
}

const router = Router();

/**
 * Dropbox OAuth Configuration
 * Documentation: https://www.dropbox.com/developers/documentation/http/documentation#oauth2-authorize
 */
const DROPBOX_CONFIG = {
  authUrl: 'https://www.dropbox.com/oauth2/authorize',
  tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
  clientId: process.env.DROPBOX_CLIENT_ID || '',
  clientSecret: process.env.DROPBOX_CLIENT_SECRET || '',
  redirectUri: process.env.DROPBOX_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/api/oauth/dropbox/callback`,
};

/**
 * OneDrive/Microsoft OAuth Configuration
 * Documentation: https://learn.microsoft.com/en-us/onedrive/developer/rest-api/getting-started/graph-oauth
 */
const ONEDRIVE_CONFIG = {
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  clientId: process.env.ONEDRIVE_CLIENT_ID || '',
  clientSecret: process.env.ONEDRIVE_CLIENT_SECRET || '',
  redirectUri: process.env.ONEDRIVE_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/api/oauth/onedrive/callback`,
  scope: 'offline_access files.readwrite.all',
};

/**
 * Google Drive OAuth Configuration
 * Documentation: https://developers.google.com/identity/protocols/oauth2/web-server
 */
const GOOGLE_DRIVE_CONFIG = {
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  clientId: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/api/oauth/google-drive/callback`,
  scope: 'https://www.googleapis.com/auth/drive.file',
};

// ==================== DROPBOX OAUTH ====================

/**
 * Initiate Dropbox OAuth flow
 * GET /api/oauth/dropbox/authorize
 */
router.get('/dropbox/authorize', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    
    if (!user?.agencyId) {
      return res.status(403).json({ error: 'No agency context available' });
    }
    
    if (!DROPBOX_CONFIG.clientId) {
      return res.status(500).json({ error: 'Dropbox OAuth not configured' });
    }
    
    // Generate cryptographically secure state with HMAC signature
    const state = await oauthStateService.generateState(user.agencyId, user.id);
    
    const authUrl = new URL(DROPBOX_CONFIG.authUrl);
    authUrl.searchParams.set('client_id', DROPBOX_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', DROPBOX_CONFIG.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('token_access_type', 'offline'); // Request refresh token
    authUrl.searchParams.set('state', state);
    
    res.redirect(authUrl.toString());
  } catch (error) {
    console.error('Dropbox authorize error:', error);
    res.status(500).json({ error: 'Failed to initiate Dropbox authorization' });
  }
});

/**
 * Dropbox OAuth callback
 * GET /api/oauth/dropbox/callback
 */
router.get('/dropbox/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;
    
    if (oauthError) {
      console.error('Dropbox OAuth error:', oauthError);
      return res.redirect(`/settings/integrations?error=${oauthError}`);
    }
    
    if (!code || !state) {
      console.error('Missing OAuth parameters');
      return res.redirect('/settings/integrations?error=missing_parameters');
    }
    
    // Validate state parameter (prevents CSRF and cross-tenant attacks)
    let stateData;
    try {
      stateData = await oauthStateService.validateState(state as string);
    } catch (error) {
      console.error('State validation failed:', error);
      return res.redirect('/settings/integrations?error=invalid_state');
    }
    
    const { agencyId, userId } = stateData;

    // SECURITY FIX: Verify userId belongs to agencyId before storing credentials
    // This prevents cross-tenant credential injection attacks
    try {
      const { db } = await import('../db');
      const { users } = await import('../../shared/schema');
      const { eq, and } = await import('drizzle-orm');

      const [user] = await db.select()
        .from(users)
        .where(and(
          eq(users.id, userId),
          eq(users.agencyId, agencyId)
        ))
        .limit(1);

      if (!user) {
        console.error(`[SECURITY] OAuth credential injection attempt: userId ${userId} does not belong to agencyId ${agencyId}`);
        return res.redirect('/settings/integrations?error=unauthorized_user');
      }
    } catch (verifyError) {
      console.error('User-agency verification failed:', verifyError);
      return res.redirect('/settings/integrations?error=verification_failed');
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(DROPBOX_CONFIG.tokenUrl, new URLSearchParams({
      code: code as string,
      grant_type: 'authorization_code',
      client_id: DROPBOX_CONFIG.clientId,
      client_secret: DROPBOX_CONFIG.clientSecret,
      redirect_uri: DROPBOX_CONFIG.redirectUri,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Calculate expiration time
    const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;
    
    // Store encrypted credentials
    await oauthService.storeCredentials({
      agencyId,
      provider: 'dropbox',
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresAt,
      scope: null,
    });
    
    res.redirect('/settings/integrations?success=dropbox');
  } catch (error) {
    console.error('Dropbox callback error:', error);
    res.redirect('/settings/integrations?error=token_exchange_failed');
  }
});

/**
 * Refresh Dropbox access token
 */
async function refreshDropboxToken(agencyId: number): Promise<string> {
  const credentials = await oauthService.getCredentials(agencyId, 'dropbox');
  
  if (!credentials?.refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const tokenResponse = await axios.post(DROPBOX_CONFIG.tokenUrl, new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: credentials.refreshToken,
    client_id: DROPBOX_CONFIG.clientId,
    client_secret: DROPBOX_CONFIG.clientSecret,
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  const { access_token, expires_in } = tokenResponse.data;
  const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;
  
  await oauthService.updateAccessToken({
    agencyId,
    provider: 'dropbox',
    accessToken: access_token,
    expiresAt,
  });
  
  return access_token;
}

// ==================== ONEDRIVE OAUTH ====================

/**
 * Initiate OneDrive OAuth flow
 * GET /api/oauth/onedrive/authorize
 */
router.get('/onedrive/authorize', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    
    if (!user?.agencyId) {
      return res.status(403).json({ error: 'No agency context available' });
    }
    
    if (!ONEDRIVE_CONFIG.clientId) {
      return res.status(500).json({ error: 'OneDrive OAuth not configured' });
    }
    
    const state = await oauthStateService.generateState(user.agencyId, user.id);
    
    const authUrl = new URL(ONEDRIVE_CONFIG.authUrl);
    authUrl.searchParams.set('client_id', ONEDRIVE_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', ONEDRIVE_CONFIG.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', ONEDRIVE_CONFIG.scope);
    authUrl.searchParams.set('state', state);
    
    res.redirect(authUrl.toString());
  } catch (error) {
    console.error('OneDrive authorize error:', error);
    res.status(500).json({ error: 'Failed to initiate OneDrive authorization' });
  }
});

/**
 * OneDrive OAuth callback
 * GET /api/oauth/onedrive/callback
 */
router.get('/onedrive/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;
    
    if (oauthError) {
      console.error('OneDrive OAuth error:', oauthError);
      return res.redirect(`/settings/integrations?error=${oauthError}`);
    }
    
    if (!code || !state) {
      console.error('Missing OAuth parameters');
      return res.redirect('/settings/integrations?error=missing_parameters');
    }
    
    // Validate state parameter
    let stateData;
    try {
      stateData = await oauthStateService.validateState(state as string);
    } catch (error) {
      console.error('State validation failed:', error);
      return res.redirect('/settings/integrations?error=invalid_state');
    }
    
    const { agencyId, userId } = stateData;

    // SECURITY FIX: Verify userId belongs to agencyId
    try {
      const { db } = await import('../db');
      const { users } = await import('../../shared/schema');
      const { eq, and } = await import('drizzle-orm');

      const [user] = await db.select()
        .from(users)
        .where(and(
          eq(users.id, userId),
          eq(users.agencyId, agencyId)
        ))
        .limit(1);

      if (!user) {
        console.error(`[SECURITY] OAuth credential injection attempt: userId ${userId} does not belong to agencyId ${agencyId}`);
        return res.redirect('/settings/integrations?error=unauthorized_user');
      }
    } catch (verifyError) {
      console.error('User-agency verification failed:', verifyError);
      return res.redirect('/settings/integrations?error=verification_failed');
    }

    const tokenResponse = await axios.post(ONEDRIVE_CONFIG.tokenUrl, new URLSearchParams({
      code: code as string,
      grant_type: 'authorization_code',
      client_id: ONEDRIVE_CONFIG.clientId,
      client_secret: ONEDRIVE_CONFIG.clientSecret,
      redirect_uri: ONEDRIVE_CONFIG.redirectUri,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;
    const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;
    
    await oauthService.storeCredentials({
      agencyId,
      provider: 'onedrive',
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresAt,
      scope: scope || null,
    });
    
    res.redirect('/settings/integrations?success=onedrive');
  } catch (error) {
    console.error('OneDrive callback error:', error);
    res.redirect('/settings/integrations?error=token_exchange_failed');
  }
});

/**
 * Refresh OneDrive access token
 */
async function refreshOneDriveToken(agencyId: number): Promise<string> {
  const credentials = await oauthService.getCredentials(agencyId, 'onedrive');
  
  if (!credentials?.refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const tokenResponse = await axios.post(ONEDRIVE_CONFIG.tokenUrl, new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: credentials.refreshToken,
    client_id: ONEDRIVE_CONFIG.clientId,
    client_secret: ONEDRIVE_CONFIG.clientSecret,
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  const { access_token, expires_in } = tokenResponse.data;
  const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;
  
  await oauthService.updateAccessToken({
    agencyId,
    provider: 'onedrive',
    accessToken: access_token,
    expiresAt,
  });
  
  return access_token;
}

// ==================== GOOGLE DRIVE OAUTH ====================

/**
 * Initiate Google Drive OAuth flow
 * GET /api/oauth/google-drive/authorize
 */
router.get('/google-drive/authorize', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    
    if (!user?.agencyId) {
      return res.status(403).json({ error: 'No agency context available' });
    }
    
    if (!GOOGLE_DRIVE_CONFIG.clientId) {
      return res.status(500).json({ error: 'Google Drive OAuth not configured' });
    }
    
    const state = await oauthStateService.generateState(user.agencyId, user.id);
    
    const authUrl = new URL(GOOGLE_DRIVE_CONFIG.authUrl);
    authUrl.searchParams.set('client_id', GOOGLE_DRIVE_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', GOOGLE_DRIVE_CONFIG.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GOOGLE_DRIVE_CONFIG.scope);
    authUrl.searchParams.set('access_type', 'offline'); // Request refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent screen to get refresh token
    authUrl.searchParams.set('state', state);
    
    res.redirect(authUrl.toString());
  } catch (error) {
    console.error('Google Drive authorize error:', error);
    res.status(500).json({ error: 'Failed to initiate Google Drive authorization' });
  }
});

/**
 * Google Drive OAuth callback
 * GET /api/oauth/google-drive/callback
 */
router.get('/google-drive/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;
    
    if (oauthError) {
      console.error('Google Drive OAuth error:', oauthError);
      return res.redirect(`/settings/integrations?error=${oauthError}`);
    }
    
    if (!code || !state) {
      console.error('Missing OAuth parameters');
      return res.redirect('/settings/integrations?error=missing_parameters');
    }
    
    // Validate state parameter
    let stateData;
    try {
      stateData = await oauthStateService.validateState(state as string);
    } catch (error) {
      console.error('State validation failed:', error);
      return res.redirect('/settings/integrations?error=invalid_state');
    }
    
    const { agencyId, userId } = stateData;

    // SECURITY FIX: Verify userId belongs to agencyId
    try {
      const { db } = await import('../db');
      const { users } = await import('../../shared/schema');
      const { eq, and } = await import('drizzle-orm');

      const [user] = await db.select()
        .from(users)
        .where(and(
          eq(users.id, userId),
          eq(users.agencyId, agencyId)
        ))
        .limit(1);

      if (!user) {
        console.error(`[SECURITY] OAuth credential injection attempt: userId ${userId} does not belong to agencyId ${agencyId}`);
        return res.redirect('/settings/integrations?error=unauthorized_user');
      }
    } catch (verifyError) {
      console.error('User-agency verification failed:', verifyError);
      return res.redirect('/settings/integrations?error=verification_failed');
    }

    const tokenResponse = await axios.post(GOOGLE_DRIVE_CONFIG.tokenUrl, {
      code: code as string,
      grant_type: 'authorization_code',
      client_id: GOOGLE_DRIVE_CONFIG.clientId,
      client_secret: GOOGLE_DRIVE_CONFIG.clientSecret,
      redirect_uri: GOOGLE_DRIVE_CONFIG.redirectUri,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;
    const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;
    
    await oauthService.storeCredentials({
      agencyId,
      provider: 'google_drive',
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresAt,
      scope: scope || null,
    });
    
    res.redirect('/settings/integrations?success=google_drive');
  } catch (error) {
    console.error('Google Drive callback error:', error);
    res.redirect('/settings/integrations?error=token_exchange_failed');
  }
});

/**
 * Refresh Google Drive access token
 */
async function refreshGoogleDriveToken(agencyId: number): Promise<string> {
  const credentials = await oauthService.getCredentials(agencyId, 'google_drive');
  
  if (!credentials?.refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const tokenResponse = await axios.post(GOOGLE_DRIVE_CONFIG.tokenUrl, {
    grant_type: 'refresh_token',
    refresh_token: credentials.refreshToken,
    client_id: GOOGLE_DRIVE_CONFIG.clientId,
    client_secret: GOOGLE_DRIVE_CONFIG.clientSecret,
  }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const { access_token, expires_in } = tokenResponse.data;
  const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;
  
  await oauthService.updateAccessToken({
    agencyId,
    provider: 'google_drive',
    accessToken: access_token,
    expiresAt,
  });
  
  return access_token;
}

// ==================== MANAGEMENT ENDPOINTS ====================

/**
 * Get OAuth connection status for current agency
 * GET /api/oauth/status
 */
router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    
    if (!user?.agencyId) {
      return res.status(403).json({ error: 'No agency context available' });
    }
    
    const connections = await oauthService.getAgencyConnections(user.agencyId);
    
    // Add configured status for each provider
    const status = {
      dropbox: {
        configured: !!DROPBOX_CONFIG.clientId,
        connected: connections.find(c => c.provider === 'dropbox')?.connected || false,
        expiresAt: connections.find(c => c.provider === 'dropbox')?.expiresAt || null,
      },
      onedrive: {
        configured: !!ONEDRIVE_CONFIG.clientId,
        connected: connections.find(c => c.provider === 'onedrive')?.connected || false,
        expiresAt: connections.find(c => c.provider === 'onedrive')?.expiresAt || null,
      },
      google_drive: {
        configured: !!GOOGLE_DRIVE_CONFIG.clientId,
        connected: connections.find(c => c.provider === 'google_drive')?.connected || false,
        expiresAt: connections.find(c => c.provider === 'google_drive')?.expiresAt || null,
      },
    };
    
    res.json(status);
  } catch (error) {
    console.error('OAuth status error:', error);
    res.status(500).json({ error: 'Failed to get OAuth status' });
  }
});

/**
 * Revoke OAuth connection
 * DELETE /api/oauth/:provider
 */
router.delete('/:provider', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const { provider } = req.params;
    
    if (!user?.agencyId) {
      return res.status(403).json({ error: 'No agency context available' });
    }
    
    if (!['dropbox', 'onedrive', 'google_drive'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }
    
    await oauthService.revokeCredentials(user.agencyId, provider as any);
    
    res.json({ success: true, message: `${provider} connection revoked` });
  } catch (error) {
    console.error('OAuth revoke error:', error);
    res.status(500).json({ error: 'Failed to revoke connection' });
  }
});

// Export refresh functions for use in other services
export { refreshDropboxToken, refreshOneDriveToken, refreshGoogleDriveToken };

export default router;
