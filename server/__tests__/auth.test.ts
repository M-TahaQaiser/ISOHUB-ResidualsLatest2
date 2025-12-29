/**
 * Authentication and Authorization Tests
 * Tests for login, registration, JWT validation, MFA, and role-based access
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuthService } from '../services/AuthService';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  describe('Password Hashing', () => {
    it('should hash passwords securely', async () => {
      const password = 'TestPassword123!';
      const hash = await AuthService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
    });

    it('should verify correct passwords', async () => {
      const password = 'TestPassword123!';
      const hash = await AuthService.hashPassword(password);

      const isValid = await AuthService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'TestPassword123!';
      const hash = await AuthService.hashPassword(password);

      const isValid = await AuthService.verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });

    it('should use strong salt rounds', async () => {
      const password = 'TestPassword123!';
      const hash = await AuthService.hashPassword(password);

      // Extract salt rounds from hash
      const rounds = parseInt(hash.split('$')[2], 10);
      expect(rounds).toBeGreaterThanOrEqual(10); // Should be at least 10 rounds
    });
  });

  describe('Password Strength Validation', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const result = AuthService.validatePasswordStrength('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should require uppercase letters', () => {
      const result = AuthService.validatePasswordStrength('lowercase1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require lowercase letters', () => {
      const result = AuthService.validatePasswordStrength('UPPERCASE1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should require numbers', () => {
      const result = AuthService.validatePasswordStrength('NoNumbers!@');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should require special characters', () => {
      const result = AuthService.validatePasswordStrength('NoSpecial123');
      expect(result.isValid).toBe(false);
    });

    it('should reject common passwords', () => {
      const result = AuthService.validatePasswordStrength('Password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password cannot contain common words');
    });

    it('should accept strong passwords', () => {
      const result = AuthService.validatePasswordStrength('Str0ng$ecure!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('JWT Token Generation and Verification', () => {
    const testPayload = {
      userId: 1,
      username: 'testuser',
      role: 'Admin',
      agencyId: 1,
    };

    it('should generate valid JWT tokens', () => {
      const token = AuthService.generateJWT(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should verify valid tokens', () => {
      const token = AuthService.generateJWT(testPayload);
      const decoded = AuthService.verifyJWT(token);

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.username).toBe(testPayload.username);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should reject invalid tokens', () => {
      expect(() => {
        AuthService.verifyJWT('invalid.token.here');
      }).toThrow();
    });

    it('should reject tampered tokens', () => {
      const token = AuthService.generateJWT(testPayload);
      const parts = token.split('.');
      parts[1] = Buffer.from('{"userId":999}').toString('base64');
      const tamperedToken = parts.join('.');

      expect(() => {
        AuthService.verifyJWT(tamperedToken);
      }).toThrow();
    });

    it('should include standard JWT claims', () => {
      const token = AuthService.generateJWT(testPayload);
      const decoded = AuthService.verifyJWT(token);

      expect(decoded.iss).toBe('isohub'); // Issuer
      expect(decoded.aud).toBe('isohub-client'); // Audience
      expect(decoded.exp).toBeDefined(); // Expiration
      expect(decoded.iat).toBeDefined(); // Issued at
    });
  });

  describe('MFA Token Generation and Verification', () => {
    it('should generate MFA secrets', () => {
      const result = AuthService.generateMFASecret('testuser');

      expect(result.secret).toBeDefined();
      expect(result.secret).toHaveLength(32); // 32 character base32 secret
      expect(result.qrCode).toContain('otpauth://');
    });

    it('should verify valid TOTP tokens', () => {
      const { secret } = AuthService.generateMFASecret('testuser');

      // Generate a valid token using speakeasy
      const speakeasy = require('speakeasy');
      const token = speakeasy.totp({
        secret,
        encoding: 'base32',
      });

      const isValid = AuthService.verifyMFAToken(secret, token);
      expect(isValid).toBe(true);
    });

    it('should reject invalid TOTP tokens', () => {
      const { secret } = AuthService.generateMFASecret('testuser');

      const isValid = AuthService.verifyMFAToken(secret, '000000');
      expect(isValid).toBe(false);
    });
  });

  describe('Secure Password Generation', () => {
    it('should generate passwords of specified length', () => {
      const password = AuthService.generateSecurePassword(16);
      expect(password).toHaveLength(16);
    });

    it('should include all required character types', () => {
      const password = AuthService.generateSecurePassword(20);

      expect(/[A-Z]/.test(password)).toBe(true); // Uppercase
      expect(/[a-z]/.test(password)).toBe(true); // Lowercase
      expect(/[0-9]/.test(password)).toBe(true); // Number
      expect(/[!@#$%^&*]/.test(password)).toBe(true); // Special
    });

    it('should generate unique passwords', () => {
      const passwords = new Set();
      for (let i = 0; i < 100; i++) {
        passwords.add(AuthService.generateSecurePassword(16));
      }
      expect(passwords.size).toBe(100); // All should be unique
    });
  });

  describe('Data Encryption', () => {
    // Note: These tests require ENCRYPTION_KEY to be set
    const testData = 'sensitive-mfa-secret';

    it('should encrypt sensitive data', () => {
      const encrypted = AuthService.encryptSensitiveData(testData);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(testData);
      expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:encrypted format
    });

    it('should decrypt encrypted data correctly', () => {
      const encrypted = AuthService.encryptSensitiveData(testData);
      const decrypted = AuthService.decryptSensitiveData(encrypted);

      expect(decrypted).toBe(testData);
    });

    it('should produce different ciphertexts for same plaintext', () => {
      const encrypted1 = AuthService.encryptSensitiveData(testData);
      const encrypted2 = AuthService.encryptSensitiveData(testData);

      expect(encrypted1).not.toBe(encrypted2); // Due to random IV
    });

    it('should fail on tampered data', () => {
      const encrypted = AuthService.encryptSensitiveData(testData);
      const parts = encrypted.split(':');
      parts[2] = 'tampered' + parts[2];
      const tampered = parts.join(':');

      expect(() => {
        AuthService.decryptSensitiveData(tampered);
      }).toThrow();
    });
  });
});

describe('Authentication Middleware', () => {
  // Mock request/response objects
  const mockRequest = (overrides = {}) => ({
    headers: {},
    body: {},
    params: {},
    query: {},
    ...overrides,
  });

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should reject requests without authorization header', async () => {
      const { authenticateToken } = await import('../middleware/auth');
      const req = mockRequest();
      const res = mockResponse();

      await authenticateToken(req as any, res as any, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Access token required' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid tokens', async () => {
      const { authenticateToken } = await import('../middleware/auth');
      const req = mockRequest({
        headers: { authorization: 'Bearer invalid-token' },
      });
      const res = mockResponse();

      await authenticateToken(req as any, res as any, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow users with correct role', async () => {
      const { requireRole } = await import('../middleware/auth');
      const middleware = requireRole('Admin');

      const req = mockRequest({
        user: { id: 1, role: 'Admin' },
      });
      const res = mockResponse();

      middleware(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject users without required role', async () => {
      const { requireRole } = await import('../middleware/auth');
      const middleware = requireRole('SuperAdmin');

      const req = mockRequest({
        user: { id: 1, role: 'Users/Reps' },
      });
      const res = mockResponse();

      middleware(req as any, res as any, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept array of allowed roles', async () => {
      const { requireRole } = await import('../middleware/auth');
      const middleware = requireRole(['Admin', 'Manager']);

      const req = mockRequest({
        user: { id: 1, role: 'Manager' },
      });
      const res = mockResponse();

      middleware(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAgencyAccess (IDOR Prevention)', () => {
    it('should allow SuperAdmin to access any agency', async () => {
      const { requireAgencyAccess } = await import('../middleware/auth');

      const req = mockRequest({
        user: { id: 1, role: 'superadmin', agencyId: 1 },
        params: { agencyId: '999' }, // Different agency
      });
      const res = mockResponse();

      requireAgencyAccess(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should prevent IDOR attacks for regular users', async () => {
      const { requireAgencyAccess } = await import('../middleware/auth');

      const req = mockRequest({
        user: { id: 1, role: 'Admin', agencyId: 1 },
        params: { agencyId: '999' }, // Attempting to access different agency
      });
      const res = mockResponse();

      requireAgencyAccess(req as any, res as any, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Access denied to this agency' })
      );
    });

    it('should allow users to access their own agency', async () => {
      const { requireAgencyAccess } = await import('../middleware/auth');

      const req = mockRequest({
        user: { id: 1, role: 'Admin', agencyId: 1 },
        params: { agencyId: '1' }, // Same agency
      });
      const res = mockResponse();

      requireAgencyAccess(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});

describe('Security Middleware', () => {
  describe('Rate Limiting', () => {
    it('should limit requests appropriately', async () => {
      // This would require integration testing with actual rate limiter
      // For unit testing, we verify the configuration
      const { authRateLimit, apiRateLimit } = await import('../middleware/security');

      expect(authRateLimit).toBeDefined();
      expect(apiRateLimit).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should validate input against schema', async () => {
      const { validateInput } = await import('../middleware/security');
      const { z } = await import('zod');

      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      const middleware = validateInput(schema);
      const req = mockRequest({
        body: { email: 'invalid', password: '123' },
      });
      const res = mockResponse();

      middleware(req as any, res as any, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass valid input', async () => {
      const { validateInput } = await import('../middleware/security');
      const { z } = await import('zod');

      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      const middleware = validateInput(schema);
      const req = mockRequest({
        body: { email: 'test@example.com', password: 'ValidPass123!' },
      });
      const res = mockResponse();

      middleware(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('CSRF Protection', () => {
    it('should generate CSRF tokens', async () => {
      const { generateCSRFToken } = await import('../middleware/security');

      const req = mockRequest({ cookies: {} });
      const res = mockResponse();
      (res as any).cookie = jest.fn();
      (res as any).locals = {};

      generateCSRFToken(req as any, res as any, mockNext);

      expect((res as any).locals.csrfToken).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate CSRF tokens', async () => {
      const { validateCSRFToken } = await import('../middleware/security');

      const token = 'test-csrf-token-1234567890123456';
      const req = mockRequest({
        method: 'POST',
        cookies: { '_csrf': token },
        headers: { 'x-csrf-token': token },
      });
      const res = mockResponse();

      validateCSRFToken(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject mismatched CSRF tokens', async () => {
      const { validateCSRFToken } = await import('../middleware/security');

      const req = mockRequest({
        method: 'POST',
        cookies: { '_csrf': 'token1' },
        headers: { 'x-csrf-token': 'token2' },
      });
      const res = mockResponse();

      validateCSRFToken(req as any, res as any, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should skip CSRF for safe methods', async () => {
      const { validateCSRFToken } = await import('../middleware/security');

      const req = mockRequest({
        method: 'GET',
        cookies: {},
        headers: {},
      });
      const res = mockResponse();

      validateCSRFToken(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip CSRF for Bearer token auth', async () => {
      const { validateCSRFToken } = await import('../middleware/security');

      const req = mockRequest({
        method: 'POST',
        cookies: {},
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = mockResponse();

      validateCSRFToken(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});

// Helper functions
function mockRequest(overrides = {}) {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    cookies: {},
    method: 'GET',
    ...overrides,
  };
}

function mockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.locals = {};
  return res;
}
