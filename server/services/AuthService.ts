import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

  // Hash password with salt
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate secure random password
  static generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each required category
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[crypto.randomInt(26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[crypto.randomInt(26)]; // Lowercase
    password += '0123456789'[crypto.randomInt(10)]; // Number
    password += '!@#$%^&*'[crypto.randomInt(8)]; // Special character
    
    // Fill remaining length
    for (let i = 4; i < length; i++) {
      password += charset[crypto.randomInt(charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Check if account is locked
  static async isAccountLocked(userId: number): Promise<boolean> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return false;

    if (user.lockedUntil && new Date() < user.lockedUntil) {
      return true;
    }

    // Clear expired lockout
    if (user.lockedUntil && new Date() >= user.lockedUntil) {
      await db.update(users)
        .set({ 
          lockedUntil: null, 
          failedLoginAttempts: 0 
        })
        .where(eq(users.id, userId));
    }

    return false;
  }

  // Handle failed login attempt
  static async handleFailedLogin(userId: number): Promise<void> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return;

    const attempts = (user.failedLoginAttempts || 0) + 1;
    const updateData: any = { failedLoginAttempts: attempts };

    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + this.LOCKOUT_TIME);
    }

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));
  }

  // Handle successful login
  static async handleSuccessfulLogin(userId: number): Promise<void> {
    await db.update(users)
      .set({ 
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Generate JWT token
  static generateJWT(payload: any): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return jwt.sign(payload, secret, { 
      expiresIn: '24h',
      issuer: 'isohub',
      audience: 'isohub-client'
    });
  }

  // Verify JWT token
  static verifyJWT(token: string): any {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return jwt.verify(token, secret);
  }

  // Generate MFA secret
  static generateMFASecret(username: string): { secret: string; qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: `ISOHub (${username})`,
      issuer: 'ISOHub',
      length: 32
    });

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url || ''
    };
  }

  // Verify MFA token
  static verifyMFAToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps for clock drift
    });
  }

  // Encrypt sensitive data
  static encryptSensitiveData(data: string): string {
    const algorithm = 'aes-256-gcm';
    const secretKey = process.env.ENCRYPTION_KEY;
    if (!secretKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    const keyBuffer = Buffer.from(secretKey);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  // Decrypt sensitive data
  static decryptSensitiveData(encryptedData: string): string {
    const algorithm = 'aes-256-gcm';
    const secretKey = process.env.ENCRYPTION_KEY;
    if (!secretKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    const keyBuffer = Buffer.from(secretKey);
    
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Validate authentication tag length for GCM (must be 16 bytes for AES-256-GCM)
    if (authTag.length !== 16) {
      throw new Error('Invalid authentication tag length for AES-256-GCM');
    }
    
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Validate password strength (PCI DSS 4.0 compliant - 12+ characters)
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long (PCI DSS 4.0 requirement)');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain repeated characters');
    }

    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Password cannot contain common words');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}