import crypto from 'crypto';
import { db } from '../db';
import { agencyOAuthCredentials, type AgencyOAuthCredential } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * OAuth Service for managing cloud storage provider credentials
 * Provides AES-256 encryption for token storage and automatic refresh tracking
 */
export class OAuthService {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 16;
  private readonly AUTH_TAG_LENGTH = 16;
  
  /**
   * Get encryption key from environment (32 bytes for AES-256)
   */
  private getEncryptionKey(): Buffer {
    const key = process.env.OAUTH_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('OAUTH_ENCRYPTION_KEY environment variable not set');
    }
    
    // Ensure key is exactly 32 bytes
    const keyBuffer = Buffer.from(key, 'base64');
    if (keyBuffer.length !== 32) {
      throw new Error('OAUTH_ENCRYPTION_KEY must be 32 bytes (base64 encoded)');
    }
    
    return keyBuffer;
  }

  /**
   * Encrypt a token using AES-256-GCM
   */
  private encrypt(plaintext: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const authTag = cipher.getAuthTag();
      
      // Format: iv:authTag:encrypted
      const combined = `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
      return combined;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * Decrypt a token using AES-256-GCM
   */
  private decrypt(ciphertext: string): string {
    try {
      const key = this.getEncryptionKey();
      
      // Parse format: iv:authTag:encrypted
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted token format');
      }
      
      const [ivBase64, authTagBase64, encrypted] = parts;
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');
      
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error: any) {
      console.error('[OAuthService] Decryption error:', {
        message: error.message,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
      throw new Error(`Failed to decrypt token: ${error.message || 'Unknown encryption error'}`);
    }
  }

  /**
   * Store OAuth credentials for an agency
   */
  async storeCredentials(params: {
    agencyId: number;
    provider: 'dropbox' | 'onedrive' | 'google_drive';
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
    scope: string | null;
  }): Promise<AgencyOAuthCredential> {
    const { agencyId, provider, accessToken, refreshToken, expiresAt, scope } = params;
    
    // Encrypt tokens before storing
    const encryptedAccessToken = this.encrypt(accessToken);
    const encryptedRefreshToken = refreshToken ? this.encrypt(refreshToken) : null;
    
    // Check if credentials already exist
    const existing = await db
      .select()
      .from(agencyOAuthCredentials)
      .where(and(
        eq(agencyOAuthCredentials.agencyId, agencyId),
        eq(agencyOAuthCredentials.provider, provider)
      ));
    
    if (existing.length > 0) {
      // Update existing credentials
      const [updated] = await db
        .update(agencyOAuthCredentials)
        .set({
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          scope,
          lastRefreshed: new Date()
        })
        .where(eq(agencyOAuthCredentials.id, existing[0].id))
        .returning();
      
      return updated;
    } else {
      // Insert new credentials
      const [created] = await db
        .insert(agencyOAuthCredentials)
        .values({
          agencyId,
          provider,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          scope,
          lastRefreshed: new Date()
        })
        .returning();
      
      return created;
    }
  }

  /**
   * Get decrypted OAuth credentials for an agency
   */
  async getCredentials(
    agencyId: number, 
    provider: 'dropbox' | 'onedrive' | 'google_drive'
  ): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
    scope: string | null;
  } | null> {
    const [credential] = await db
      .select()
      .from(agencyOAuthCredentials)
      .where(and(
        eq(agencyOAuthCredentials.agencyId, agencyId),
        eq(agencyOAuthCredentials.provider, provider)
      ));
    
    if (!credential) {
      return null;
    }
    
    // Decrypt tokens before returning
    const accessToken = credential.accessToken ? this.decrypt(credential.accessToken) : '';
    let refreshToken: string | null = null;
    if (credential.refreshToken) {
      refreshToken = this.decrypt(credential.refreshToken);
    }
    
    return {
      accessToken,
      refreshToken,
      expiresAt: credential.expiresAt,
      scope: credential.scope
    };
  }

  /**
   * Check if credentials exist and are valid for an agency
   */
  async hasValidCredentials(
    agencyId: number,
    provider: 'dropbox' | 'onedrive' | 'google_drive'
  ): Promise<boolean> {
    const credentials = await this.getCredentials(agencyId, provider);
    
    if (!credentials) {
      return false;
    }
    
    // Check if token is expired
    if (credentials.expiresAt && credentials.expiresAt < new Date()) {
      return false;
    }
    
    return true;
  }

  /**
   * Revoke OAuth credentials for an agency
   */
  async revokeCredentials(
    agencyId: number,
    provider: 'dropbox' | 'onedrive' | 'google_drive'
  ): Promise<void> {
    await db
      .delete(agencyOAuthCredentials)
      .where(and(
        eq(agencyOAuthCredentials.agencyId, agencyId),
        eq(agencyOAuthCredentials.provider, provider)
      ));
  }

  /**
   * Update access token after refresh
   */
  async updateAccessToken(params: {
    agencyId: number;
    provider: 'dropbox' | 'onedrive' | 'google_drive';
    accessToken: string;
    expiresAt: Date | null;
  }): Promise<void> {
    const { agencyId, provider, accessToken, expiresAt } = params;
    
    const encryptedAccessToken = this.encrypt(accessToken);
    
    await db
      .update(agencyOAuthCredentials)
      .set({
        accessToken: encryptedAccessToken,
        expiresAt,
        lastRefreshed: new Date()
      })
      .where(and(
        eq(agencyOAuthCredentials.agencyId, agencyId),
        eq(agencyOAuthCredentials.provider, provider)
      ));
  }

  /**
   * Get all OAuth connections for an agency
   */
  async getAgencyConnections(agencyId: number): Promise<{
    provider: string;
    connected: boolean;
    expiresAt: Date | null;
    scope: string | null;
  }[]> {
    const credentials = await db
      .select({
        provider: agencyOAuthCredentials.provider,
        expiresAt: agencyOAuthCredentials.expiresAt,
        scope: agencyOAuthCredentials.scope
      })
      .from(agencyOAuthCredentials)
      .where(eq(agencyOAuthCredentials.agencyId, agencyId));
    
    return credentials.map(cred => ({
      provider: cred.provider,
      connected: true,
      expiresAt: cred.expiresAt,
      scope: cred.scope
    }));
  }
}

export const oauthService = new OAuthService();
