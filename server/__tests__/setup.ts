/**
 * Jest test setup file
 * Configures test environment, mocks, and global utilities
 */

import { jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-do-not-use-in-production';
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012'; // 32 bytes for AES-256
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/isohub_test';

// Mock external services
jest.mock('../services/emailService', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn().mockResolvedValue(true),
    testConnection: jest.fn().mockResolvedValue(true),
  })),
  emailService: {
    sendEmail: jest.fn().mockResolvedValue(true),
    testConnection: jest.fn().mockResolvedValue(true),
  }
}));

// Global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        generateTestToken: (payload?: object) => string;
        generateTestUser: (overrides?: object) => object;
        mockAuthenticatedRequest: (user?: object) => object;
      };
    }
  }
}

// Test utilities
import jwt from 'jsonwebtoken';

export const testUtils = {
  /**
   * Generate a valid JWT token for testing
   */
  generateTestToken: (payload: object = {}) => {
    const defaultPayload = {
      userId: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'Admin',
      agencyId: 1,
      organizationId: 'test-org-123',
      permissions: ['read', 'write'],
    };

    return jwt.sign(
      { ...defaultPayload, ...payload },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  },

  /**
   * Generate a test user object
   */
  generateTestUser: (overrides: object = {}) => ({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4V5b3iW6QwqC.mJK', // "password123"
    firstName: 'Test',
    lastName: 'User',
    role: 'Admin',
    agencyId: 1,
    organizationId: 'test-org-123',
    isActive: true,
    mfaEnabled: false,
    failedLoginAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Create a mock authenticated request
   */
  mockAuthenticatedRequest: (user: object = {}) => ({
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'Admin',
      agencyId: 1,
      organizationId: 'test-org-123',
      permissions: ['read', 'write'],
      ...user,
    },
    headers: {
      authorization: `Bearer ${testUtils.generateTestToken(user)}`,
    },
  }),
};

// Clean up between tests
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up any test artifacts
});

// Global setup
beforeAll(async () => {
  console.log('🧪 Test environment initialized');
});

// Global teardown
afterAll(async () => {
  console.log('🧪 Test environment cleaned up');
});

export default testUtils;
