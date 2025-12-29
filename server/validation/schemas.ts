/**
 * Comprehensive Zod validation schemas for all API endpoints
 * SECURITY: Input validation is critical for preventing injection attacks
 */
import { z } from 'zod';

// ============================================================
// COMMON VALIDATION PATTERNS
// ============================================================

// String sanitization helper
const sanitizedString = (maxLength: number = 1000) =>
  z.string()
    .max(maxLength)
    .transform(val => val.trim())
    .refine(val => !/<script/i.test(val), 'Invalid content detected')
    .refine(val => !/javascript:/i.test(val), 'Invalid content detected');

// Email validation
export const emailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .toLowerCase()
  .trim();

// Password validation with strength requirements
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

// Username validation
export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .toLowerCase()
  .trim();

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Safe ID (numeric or UUID)
export const safeIdSchema = z.union([
  z.number().int().positive(),
  z.string().regex(/^[0-9]+$/).transform(Number),
  uuidSchema
]);

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Date range
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
}).refine(
  data => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
  'Start date must be before end date'
);

// ============================================================
// AUTHENTICATION SCHEMAS
// ============================================================

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(128)
});

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  firstName: sanitizedString(100).optional(),
  lastName: sanitizedString(100).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(128),
  newPassword: passwordSchema
}).refine(
  data => data.currentPassword !== data.newPassword,
  'New password must be different from current password'
);

export const mfaTokenSchema = z.object({
  token: z.string().length(6).regex(/^[0-9]+$/, 'MFA token must be 6 digits')
});

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

// ============================================================
// USER MANAGEMENT SCHEMAS
// ============================================================

export const createUserSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema.optional(),
  firstName: sanitizedString(100),
  lastName: sanitizedString(100),
  role: z.enum(['SuperAdmin', 'Admin', 'Manager', 'Team Leaders', 'Users/Reps', 'Team Member', 'Partners']),
  agencyId: z.number().int().positive().optional(),
  permissions: z.array(z.string().max(50)).max(50).optional(),
  isActive: z.boolean().default(true)
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

export const userIdParamSchema = z.object({
  id: safeIdSchema
});

// ============================================================
// MERCHANT SCHEMAS
// ============================================================

export const merchantIdSchema = z.string()
  .min(1, 'Merchant ID is required')
  .max(50, 'Merchant ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid merchant ID format');

export const createMerchantSchema = z.object({
  mid: merchantIdSchema,
  dba: sanitizedString(200),
  legalName: sanitizedString(200).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).default('pending'),
  processorId: z.number().int().positive().optional(),
  address: sanitizedString(500).optional(),
  phone: z.string().max(20).regex(/^[0-9+\-() ]+$/, 'Invalid phone format').optional(),
  email: emailSchema.optional()
});

export const updateMerchantSchema = createMerchantSchema.partial();

// ============================================================
// ASSIGNMENT SCHEMAS
// ============================================================

export const createAssignmentSchema = z.object({
  merchantId: z.number().int().positive(),
  roleId: z.number().int().positive(),
  userId: z.number().int().positive().optional(),
  percentage: z.number().min(0).max(100),
  effectiveDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

export const bulkAssignmentSchema = z.object({
  assignments: z.array(createAssignmentSchema).min(1).max(1000),
  overwriteExisting: z.boolean().default(false)
});

// ============================================================
// FILE UPLOAD SCHEMAS
// ============================================================

export const fileUploadMetadataSchema = z.object({
  processorId: z.number().int().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month format must be YYYY-MM'),
  fileType: z.enum(['residuals', 'roster', 'merchants', 'other']).default('residuals')
});

// ============================================================
// AI/CHAT SCHEMAS
// ============================================================

export const aiChatMessageSchema = z.object({
  query: sanitizedString(10000),
  sessionId: z.string().max(100).optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: sanitizedString(50000)
  })).max(100).optional()
});

export const aiKnowledgeBaseEntrySchema = z.object({
  category: z.string().min(1).max(100),
  question: sanitizedString(1000),
  answer: sanitizedString(10000),
  keywords: z.array(z.string().max(50)).max(20).optional(),
  isActive: z.boolean().default(true)
});

export const aiTrainingCorrectionSchema = z.object({
  chatSessionId: z.number().int().positive().optional(),
  originalQuery: sanitizedString(1000),
  originalResponse: sanitizedString(10000),
  correctedResponse: sanitizedString(10000),
  correctionReason: sanitizedString(500).optional()
});

export const documentAnalysisSchema = z.object({
  documentId: z.string().max(100).optional(),
  documentName: z.string().max(255),
  documentType: z.enum(['pdf', 'csv', 'xlsx', 'xls', 'png', 'jpg', 'jpeg', 'gif', 'txt']),
  content: z.string().max(10000000).optional() // 10MB limit for base64
});

// ============================================================
// AGENCY/ORGANIZATION SCHEMAS
// ============================================================

export const createAgencySchema = z.object({
  companyName: sanitizedString(200),
  subdomain: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens').optional(),
  customDomain: z.string().max(255).optional(),
  contactEmail: emailSchema,
  contactPhone: z.string().max(20).regex(/^[0-9+\-() ]+$/, 'Invalid phone format').optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional()
});

export const updateAgencySchema = createAgencySchema.partial();

// ============================================================
// PRE-APPLICATION SCHEMAS
// ============================================================

export const createPreApplicationSchema = z.object({
  dba: sanitizedString(200),
  legalName: sanitizedString(200).optional(),
  businessContact: sanitizedString(100),
  email: emailSchema,
  phone: z.string().max(20).regex(/^[0-9+\-() ]+$/, 'Invalid phone format'),
  businessType: z.string().max(100).optional(),
  annualVolume: z.string().max(50).optional(),
  averageTicket: z.string().max(50).optional(),
  notes: sanitizedString(2000).optional(),
  status: z.enum(['new', 'pending', 'approved', 'declined', 'withdrawn']).default('new')
});

export const updatePreApplicationSchema = createPreApplicationSchema.partial();

// ============================================================
// REPORT SCHEMAS
// ============================================================

export const reportQuerySchema = z.object({
  type: z.enum(['residuals', 'merchants', 'assignments', 'analytics', 'custom']),
  dateRange: dateRangeSchema.optional(),
  filters: z.record(z.string(), z.any()).optional(),
  format: z.enum(['json', 'csv', 'pdf']).default('json')
}).merge(paginationSchema);

// ============================================================
// SEARCH SCHEMAS
// ============================================================

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(500),
  type: z.enum(['all', 'merchants', 'users', 'documents', 'reports']).default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// ============================================================
// SHORT URL SCHEMAS
// ============================================================

export const createShortUrlSchema = z.object({
  agencyCode: z.string().min(1).max(50),
  fullname: sanitizedString(100),
  agentName: sanitizedString(100),
  organizationId: z.string().min(1).max(100),
  expiresInDays: z.number().int().min(1).max(365).optional()
});

// ============================================================
// EMAIL SCHEMAS
// ============================================================

export const sendEmailSchema = z.object({
  to: z.union([emailSchema, z.array(emailSchema).max(50)]),
  cc: z.array(emailSchema).max(10).optional(),
  bcc: z.array(emailSchema).max(10).optional(),
  subject: sanitizedString(200),
  body: sanitizedString(50000).optional(),
  templateId: z.string().max(100).optional(),
  templateData: z.record(z.string(), z.any()).optional()
});

// ============================================================
// WEBHOOK SCHEMAS
// ============================================================

export const webhookPayloadSchema = z.object({
  event: z.string().max(100),
  data: z.record(z.string(), z.any()),
  timestamp: z.string().datetime(),
  signature: z.string().max(256).optional()
});

// ============================================================
// EXPORT ALL SCHEMAS
// ============================================================

export const schemas = {
  // Auth
  login: loginSchema,
  register: registerSchema,
  changePassword: changePasswordSchema,
  mfaToken: mfaTokenSchema,
  forgotPassword: forgotPasswordSchema,

  // Users
  createUser: createUserSchema,
  updateUser: updateUserSchema,
  userIdParam: userIdParamSchema,

  // Merchants
  merchantId: merchantIdSchema,
  createMerchant: createMerchantSchema,
  updateMerchant: updateMerchantSchema,

  // Assignments
  createAssignment: createAssignmentSchema,
  bulkAssignment: bulkAssignmentSchema,

  // Files
  fileUploadMetadata: fileUploadMetadataSchema,

  // AI
  aiChatMessage: aiChatMessageSchema,
  aiKnowledgeBaseEntry: aiKnowledgeBaseEntrySchema,
  aiTrainingCorrection: aiTrainingCorrectionSchema,
  documentAnalysis: documentAnalysisSchema,

  // Agencies
  createAgency: createAgencySchema,
  updateAgency: updateAgencySchema,

  // Pre-applications
  createPreApplication: createPreApplicationSchema,
  updatePreApplication: updatePreApplicationSchema,

  // Reports
  reportQuery: reportQuerySchema,

  // Search
  searchQuery: searchQuerySchema,

  // Short URLs
  createShortUrl: createShortUrlSchema,

  // Email
  sendEmail: sendEmailSchema,

  // Webhooks
  webhookPayload: webhookPayloadSchema,

  // Common
  pagination: paginationSchema,
  dateRange: dateRangeSchema,
  uuid: uuidSchema,
  safeId: safeIdSchema
};

export default schemas;
