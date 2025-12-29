import { Router } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

const getBaseUrl = () => {
  const domains = process.env.REPLIT_DOMAINS?.split(',')[0];
  return domains ? `https://${domains}` : 'http://localhost:5000';
};

const GOOGLE_SSO_CONFIG = {
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  clientId: process.env.GOOGLE_SSO_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_SSO_CLIENT_SECRET || '',
  get redirectUri() {
    return `${getBaseUrl()}/api/sso/google/callback`;
  },
  scope: 'openid email profile',
};

const MICROSOFT_SSO_CONFIG = {
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
  clientId: process.env.MICROSOFT_SSO_CLIENT_ID || '',
  clientSecret: process.env.MICROSOFT_SSO_CLIENT_SECRET || '',
  get redirectUri() {
    return `${getBaseUrl()}/api/sso/microsoft/callback`;
  },
  scope: 'openid email profile User.Read',
};

const pendingStates = new Map<string, { timestamp: number; returnUrl?: string }>();

setInterval(() => {
  const now = Date.now();
  const entries = Array.from(pendingStates.entries());
  for (const [state, data] of entries) {
    if (now - data.timestamp > 10 * 60 * 1000) {
      pendingStates.delete(state);
    }
  }
}, 60000);

function generateState(returnUrl?: string): string {
  const state = crypto.randomBytes(32).toString('hex');
  pendingStates.set(state, { timestamp: Date.now(), returnUrl });
  return state;
}

function validateState(state: string): { valid: boolean; returnUrl?: string } {
  const data = pendingStates.get(state);
  if (!data) {
    return { valid: false };
  }
  pendingStates.delete(state);
  if (Date.now() - data.timestamp > 10 * 60 * 1000) {
    return { valid: false };
  }
  return { valid: true, returnUrl: data.returnUrl };
}

async function findOrCreateUser(email: string, firstName?: string, lastName?: string, profileImageUrl?: string): Promise<typeof users.$inferSelect> {
  const normalizedEmail = email.toLowerCase().trim();
  
  let [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail));
  
  if (existingUser) {
    if (firstName || lastName || profileImageUrl) {
      const updateData: any = {};
      if (firstName && !existingUser.firstName) updateData.firstName = firstName;
      if (lastName && !existingUser.lastName) updateData.lastName = lastName;
      if (profileImageUrl && !existingUser.profilePictureUrl) updateData.profilePictureUrl = profileImageUrl;
      
      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, existingUser.id));
        [existingUser] = await db.select().from(users).where(eq(users.id, existingUser.id));
      }
    }
    return existingUser;
  }
  
  const username = normalizedEmail.split('@')[0] + '_' + crypto.randomBytes(4).toString('hex');
  
  const [newUser] = await db.insert(users).values({
    username,
    email: normalizedEmail,
    firstName: firstName || null,
    lastName: lastName || null,
    profilePictureUrl: profileImageUrl || null,
    role: 'Users/Reps',
    isActive: true,
    password: 'SSO_USER_NO_PASSWORD',
    mfaEnabled: false,
  }).returning();
  
  return newUser;
}

function generateJwtToken(user: typeof users.$inferSelect): string {
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId,
      organization: user.organizationId || 'org-default',
    },
    jwtSecret,
    { expiresIn: '24h' }
  );
}

router.get('/google', (req, res) => {
  if (!GOOGLE_SSO_CONFIG.clientId) {
    return res.status(500).json({ 
      error: 'Google SSO not configured',
      message: 'Please set GOOGLE_SSO_CLIENT_ID and GOOGLE_SSO_CLIENT_SECRET environment variables'
    });
  }
  
  const returnUrl = req.query.returnUrl as string;
  const state = generateState(returnUrl);
  
  const authUrl = new URL(GOOGLE_SSO_CONFIG.authUrl);
  authUrl.searchParams.set('client_id', GOOGLE_SSO_CONFIG.clientId);
  authUrl.searchParams.set('redirect_uri', GOOGLE_SSO_CONFIG.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', GOOGLE_SSO_CONFIG.scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'select_account');
  authUrl.searchParams.set('state', state);
  
  res.redirect(authUrl.toString());
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;
    
    if (oauthError) {
      console.error('Google SSO error:', oauthError);
      return res.redirect(`/login?error=google_auth_failed&message=${oauthError}`);
    }
    
    if (!code || !state) {
      return res.redirect('/login?error=missing_parameters');
    }
    
    const stateValidation = validateState(state as string);
    if (!stateValidation.valid) {
      return res.redirect('/login?error=invalid_state');
    }
    
    const tokenResponse = await axios.post(GOOGLE_SSO_CONFIG.tokenUrl, {
      code: code as string,
      client_id: GOOGLE_SSO_CONFIG.clientId,
      client_secret: GOOGLE_SSO_CONFIG.clientSecret,
      redirect_uri: GOOGLE_SSO_CONFIG.redirectUri,
      grant_type: 'authorization_code',
    });
    
    const { access_token } = tokenResponse.data;
    
    const userInfoResponse = await axios.get(GOOGLE_SSO_CONFIG.userInfoUrl, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const { email, given_name, family_name, picture } = userInfoResponse.data;
    
    if (!email) {
      return res.redirect('/login?error=no_email');
    }
    
    const user = await findOrCreateUser(email, given_name, family_name, picture);
    const token = generateJwtToken(user);
    
    const returnUrl = stateValidation.returnUrl || '/dashboard';
    res.redirect(`/sso-callback?token=${token}&username=${encodeURIComponent(user.username)}&organizationId=${user.organizationId || 'org-default'}&returnUrl=${encodeURIComponent(returnUrl)}`);
    
  } catch (error: any) {
    console.error('Google SSO callback error:', error.response?.data || error.message);
    res.redirect('/login?error=google_auth_failed');
  }
});

router.get('/microsoft', (req, res) => {
  if (!MICROSOFT_SSO_CONFIG.clientId) {
    return res.status(500).json({ 
      error: 'Microsoft SSO not configured',
      message: 'Please set MICROSOFT_SSO_CLIENT_ID and MICROSOFT_SSO_CLIENT_SECRET environment variables'
    });
  }
  
  const returnUrl = req.query.returnUrl as string;
  const state = generateState(returnUrl);
  
  const authUrl = new URL(MICROSOFT_SSO_CONFIG.authUrl);
  authUrl.searchParams.set('client_id', MICROSOFT_SSO_CONFIG.clientId);
  authUrl.searchParams.set('redirect_uri', MICROSOFT_SSO_CONFIG.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', MICROSOFT_SSO_CONFIG.scope);
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('prompt', 'select_account');
  authUrl.searchParams.set('state', state);
  
  res.redirect(authUrl.toString());
});

router.get('/microsoft/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError, error_description } = req.query;
    
    if (oauthError) {
      console.error('Microsoft SSO error:', oauthError, error_description);
      return res.redirect(`/login?error=microsoft_auth_failed&message=${oauthError}`);
    }
    
    if (!code || !state) {
      return res.redirect('/login?error=missing_parameters');
    }
    
    const stateValidation = validateState(state as string);
    if (!stateValidation.valid) {
      return res.redirect('/login?error=invalid_state');
    }
    
    const tokenResponse = await axios.post(MICROSOFT_SSO_CONFIG.tokenUrl, 
      new URLSearchParams({
        code: code as string,
        client_id: MICROSOFT_SSO_CONFIG.clientId,
        client_secret: MICROSOFT_SSO_CONFIG.clientSecret,
        redirect_uri: MICROSOFT_SSO_CONFIG.redirectUri,
        grant_type: 'authorization_code',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    
    const { access_token } = tokenResponse.data;
    
    const userInfoResponse = await axios.get(MICROSOFT_SSO_CONFIG.userInfoUrl, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const { mail, userPrincipalName, givenName, surname } = userInfoResponse.data;
    const email = mail || userPrincipalName;
    
    if (!email) {
      return res.redirect('/login?error=no_email');
    }
    
    const user = await findOrCreateUser(email, givenName, surname);
    const token = generateJwtToken(user);
    
    const returnUrl = stateValidation.returnUrl || '/dashboard';
    res.redirect(`/sso-callback?token=${token}&username=${encodeURIComponent(user.username)}&organizationId=${user.organizationId || 'org-default'}&returnUrl=${encodeURIComponent(returnUrl)}`);
    
  } catch (error: any) {
    console.error('Microsoft SSO callback error:', error.response?.data || error.message);
    res.redirect('/login?error=microsoft_auth_failed');
  }
});

router.get('/status', (req, res) => {
  res.json({
    google: {
      configured: !!GOOGLE_SSO_CONFIG.clientId,
      redirectUri: GOOGLE_SSO_CONFIG.redirectUri
    },
    microsoft: {
      configured: !!MICROSOFT_SSO_CONFIG.clientId,
      redirectUri: MICROSOFT_SSO_CONFIG.redirectUri
    }
  });
});

export default router;
