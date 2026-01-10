import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Environment-based secrets management
class SecretsManager {
  private secrets: Map<string, string> = new Map();
  private encryptionKey: string;
  
  constructor() {
    // Initialize encryption key from environment or generate one
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
    this.loadSecrets();
  }
  
  private generateEncryptionKey(): string {
    // In production, this should come from a secure key management service
    const key = crypto.randomBytes(32).toString('hex');
    console.warn('[SECRETS] Generated new encryption key. In production, use a secure key management service.');
    return key;
  }
  
  private loadSecrets() {
    // Load critical secrets with validation
    const requiredSecrets = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'ANTHROPIC_API_KEY'
    ];
    
    const optionalSecrets = [
      'SENDGRID_API_KEY',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'REDIS_URL',
      'SENTRY_DSN'
    ];
    
    // Check required secrets
    for (const secret of requiredSecrets) {
      const value = process.env[secret];
      if (!value) {
        throw new Error(`Required secret ${secret} is not set`);
      }
      this.secrets.set(secret, value);
    }
    
    // Load optional secrets
    for (const secret of optionalSecrets) {
      const value = process.env[secret];
      if (value) {
        this.secrets.set(secret, value);
      }
    }
    
    console.log(`[SECRETS] Loaded ${this.secrets.size} secrets successfully`);
  }
  
  // Get secret with fallback
  public getSecret(key: string, fallback?: string): string {
    const value = this.secrets.get(key);
    if (!value && !fallback) {
      throw new Error(`Secret ${key} not found and no fallback provided`);
    }
    return value || fallback!;
  }
  
  // Check if secret exists
  public hasSecret(key: string): boolean {
    return this.secrets.has(key);
  }
  
  // Encrypt sensitive data
  public encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }
  
  // Decrypt sensitive data
  public decrypt(encryptedData: string): string {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  
  // Validate secret format
  public validateSecretFormat(key: string, value: string): boolean {
    const validators: Record<string, RegExp> = {
      'DATABASE_URL': /^postgres(ql)?:\/\/.+/,
      'ANTHROPIC_API_KEY': /^sk-ant-api\d{2}-[A-Za-z0-9_-]{95}$/,
      'SENDGRID_API_KEY': /^SG\..+/,
      'SESSION_SECRET': /.{32,}/, // At least 32 characters
    };
    
    const validator = validators[key];
    if (validator) {
      return validator.test(value);
    }
    
    return true; // No specific validation for this key
  }
  
  // Audit secrets (don't log actual values)
  public auditSecrets(): void {
    console.log('[SECRETS AUDIT] Starting secrets audit...');
    
    for (const [key] of this.secrets) {
      const value = this.secrets.get(key)!;
      const isValid = this.validateSecretFormat(key, value);
      const hasMinLength = value.length >= 8;
      
      console.log(`[SECRETS AUDIT] ${key}: ${isValid ? '✓' : '✗'} format, ${hasMinLength ? '✓' : '✗'} length`);
    }
  }
  
  // Rotate secrets (placeholder for production implementation)
  public rotateSecret(key: string, newValue: string): void {
    if (!this.validateSecretFormat(key, newValue)) {
      throw new Error(`New value for ${key} does not match expected format`);
    }
    
    console.log(`[SECRETS] Rotating secret: ${key}`);
    this.secrets.set(key, newValue);
    
    // In production, this would:
    // 1. Update the secret in the key management service
    // 2. Notify dependent services
    // 3. Update environment variables
    // 4. Trigger application restart if needed
  }
}

// Export singleton instance
export const secretsManager = new SecretsManager();

// Convenience functions
export const getSecret = (key: string, fallback?: string) => secretsManager.getSecret(key, fallback);
export const hasSecret = (key: string) => secretsManager.hasSecret(key);
export const auditSecrets = () => secretsManager.auditSecrets();

// Initialize secrets audit on startup
if (process.env.NODE_ENV?.toLowerCase() === 'production') {
  auditSecrets();
}