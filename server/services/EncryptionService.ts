import crypto from 'crypto';

/**
 * EncryptionService - AES-256-GCM Encryption for Sensitive Data
 * 
 * GLBA & PCI DSS 4.0 Compliant Field-Level Encryption
 * 
 * Use Cases:
 * - SSN (Social Security Numbers)
 * - EIN (Employer Identification Numbers)
 * - Bank Account Numbers
 * - Routing Numbers
 * - Credit Card Numbers (if stored)
 * - API Keys and Secrets
 * 
 * Features:
 * - AES-256-GCM authenticated encryption
 * - Unique IV per encryption operation
 * - Authentication tag verification
 * - Additional Authenticated Data (AAD)
 */
export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  private static _sessionKey: string | null = null;

  private static getEncryptionKey(): Buffer {
    let key = process.env.ENCRYPTION_KEY;
    
    if (!key) {
      if (!this._sessionKey) {
        this._sessionKey = crypto.randomBytes(this.KEY_LENGTH).toString('hex');
        console.warn('⚠️ SECURITY: Using session-generated encryption key. Set ENCRYPTION_KEY env var for production.');
      }
      key = this._sessionKey;
    }
    
    return Buffer.from(key, 'hex');
  }

  static isKeyConfigured(): boolean {
    return !!process.env.ENCRYPTION_KEY;
  }

  // Encrypt sensitive data
  static encrypt(text: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
      cipher.setAAD(Buffer.from('isohub-additional-data'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Return iv:tag:encrypted
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data
  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      const [ivHex, tagHex, encrypted] = encryptedData.split(':');
      
      if (!ivHex || !tagHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      
      // Validate authentication tag length to prevent truncation attacks
      if (tag.length !== this.TAG_LENGTH) {
        throw new Error('Invalid authentication tag length');
      }
      
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv, { authTagLength: this.TAG_LENGTH });
      decipher.setAAD(Buffer.from('isohub-additional-data'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Encrypt SMTP credentials
  static encryptSMTPPassword(password: string): string {
    return this.encrypt(password);
  }

  // Decrypt SMTP credentials
  static decryptSMTPPassword(encryptedPassword: string): string {
    return this.decrypt(encryptedPassword);
  }

  // Hash and salt sensitive identifiers
  static hashSensitiveId(id: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(id, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  // Verify sensitive identifier
  static verifySensitiveId(id: string, hashedId: string): boolean {
    try {
      const [salt, hash] = hashedId.split(':');
      const verifyHash = crypto.pbkdf2Sync(id, salt, 100000, 64, 'sha512').toString('hex');
      return hash === verifyHash;
    } catch {
      return false;
    }
  }

  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate CSRF token
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // ==========================================
  // GLBA/PCI DSS 4.0 COMPLIANT PII ENCRYPTION
  // ==========================================

  /**
   * Encrypt SSN (Social Security Number)
   * Format: XXX-XX-XXXX
   * Returns encrypted string that can be stored in database
   */
  static encryptSSN(ssn: string): string {
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length !== 9) {
      throw new Error('Invalid SSN format - must be 9 digits');
    }
    return this.encrypt(cleaned);
  }

  /**
   * Decrypt SSN and optionally mask for display
   * @param masked - If true, returns XXX-XX-1234 format
   */
  static decryptSSN(encryptedSSN: string, masked: boolean = false): string {
    const decrypted = this.decrypt(encryptedSSN);
    if (masked) {
      return `XXX-XX-${decrypted.slice(-4)}`;
    }
    return `${decrypted.slice(0, 3)}-${decrypted.slice(3, 5)}-${decrypted.slice(5)}`;
  }

  /**
   * Encrypt EIN (Employer Identification Number)
   * Format: XX-XXXXXXX
   */
  static encryptEIN(ein: string): string {
    const cleaned = ein.replace(/\D/g, '');
    if (cleaned.length !== 9) {
      throw new Error('Invalid EIN format - must be 9 digits');
    }
    return this.encrypt(cleaned);
  }

  /**
   * Decrypt EIN and optionally mask for display
   */
  static decryptEIN(encryptedEIN: string, masked: boolean = false): string {
    const decrypted = this.decrypt(encryptedEIN);
    if (masked) {
      return `XX-XXXX${decrypted.slice(-3)}`;
    }
    return `${decrypted.slice(0, 2)}-${decrypted.slice(2)}`;
  }

  /**
   * Encrypt Bank Account Number
   * Supports account numbers of 4-17 digits
   */
  static encryptBankAccount(accountNumber: string): string {
    const cleaned = accountNumber.replace(/\D/g, '');
    if (cleaned.length < 4 || cleaned.length > 17) {
      throw new Error('Invalid bank account number - must be 4-17 digits');
    }
    return this.encrypt(cleaned);
  }

  /**
   * Decrypt Bank Account and optionally mask for display
   * @param masked - If true, returns ****1234 format
   */
  static decryptBankAccount(encryptedAccount: string, masked: boolean = false): string {
    const decrypted = this.decrypt(encryptedAccount);
    if (masked) {
      const lastFour = decrypted.slice(-4);
      return `****${lastFour}`;
    }
    return decrypted;
  }

  /**
   * Encrypt Routing Number (ABA)
   * Format: 9 digits
   */
  static encryptRoutingNumber(routingNumber: string): string {
    const cleaned = routingNumber.replace(/\D/g, '');
    if (cleaned.length !== 9) {
      throw new Error('Invalid routing number - must be 9 digits');
    }
    return this.encrypt(cleaned);
  }

  /**
   * Decrypt Routing Number
   */
  static decryptRoutingNumber(encryptedRouting: string): string {
    return this.decrypt(encryptedRouting);
  }

  /**
   * Check if a value appears to be encrypted (has our format)
   */
  static isEncrypted(value: string): boolean {
    if (!value) return false;
    const parts = value.split(':');
    return parts.length === 3 && 
           parts[0].length === 32 && // IV hex
           parts[1].length === 32 && // Tag hex
           parts[2].length > 0;      // Encrypted data
  }

  /**
   * Get security status for compliance reporting
   */
  static getSecurityStatus(): {
    algorithm: string;
    keyConfigured: boolean;
    keyLength: number;
    ivLength: number;
    tagLength: number;
    complianceLevel: string;
  } {
    return {
      algorithm: this.ALGORITHM,
      keyConfigured: this.isKeyConfigured(),
      keyLength: this.KEY_LENGTH * 8, // 256 bits
      ivLength: this.IV_LENGTH * 8,   // 128 bits
      tagLength: this.TAG_LENGTH * 8, // 128 bits
      complianceLevel: this.isKeyConfigured() ? 'GLBA/PCI-DSS-4.0' : 'Development Mode'
    };
  }
}