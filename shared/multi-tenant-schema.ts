/**
 * ISOHUB Unified Multi-Tenant Database Schema
 *
 * This schema implements a GoHighLevel-style hierarchy:
 * - Agencies (top-level tenants - our direct customers)
 * - Subaccounts (child accounts under agencies - our customer's customers)
 * - Users (can belong to agency, subaccount, or both)
 *
 * KEY SECURITY PRINCIPLES:
 * 1. Every tenant-scoped table has agency_id (required) and subaccount_id (optional)
 * 2. Subaccounts NEVER see other subaccounts' data (even within same agency)
 * 3. Agencies CAN see aggregated data across their subaccounts
 * 4. Cross-agency data access is impossible
 * 5. Row-Level Security (RLS) is implemented at database level
 */

import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  serial,
  primaryKey
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================================
// ENUMS
// ============================================================

export const agencyStatusEnum = pgEnum('agency_status', [
  'trial',
  'active',
  'suspended',
  'cancelled'
]);

export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'starter',
  'professional',
  'enterprise',
  'custom'
]);

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',      // Platform admin (ISOHub staff)
  'agency_owner',     // Full agency access
  'agency_admin',     // Agency admin
  'agency_manager',   // Limited agency management
  'subaccount_admin', // Full subaccount access
  'subaccount_user',  // Standard subaccount user
  'rep',              // Sales representative
  'partner',          // External partner
  'viewer'            // Read-only access
]);

export const merchantStatusEnum = pgEnum('merchant_status', [
  'pending',
  'active',
  'inactive',
  'terminated'
]);

export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'export',
  'import',
  'permission_change'
]);

// ============================================================
// CORE MULTI-TENANT TABLES
// ============================================================

/**
 * Agencies - Top-Level Tenants
 * These are our direct customers (ISOs, payment companies, etc.)
 */
export const mtAgencies = pgTable('mt_agencies', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Identity
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  legalName: varchar('legal_name', { length: 255 }),

  // Contact
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 255 }),

  // Address
  addressLine1: varchar('address_line_1', { length: 255 }),
  addressLine2: varchar('address_line_2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('USA'),

  // Branding
  logoUrl: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 7 }).default('#FFD700'),
  secondaryColor: varchar('secondary_color', { length: 7 }).default('#000000'),
  accentColor: varchar('accent_color', { length: 7 }).default('#FFFFFF'),

  // Configuration
  settings: jsonb('settings').default(sql`'{}'::jsonb`),
  featureFlags: jsonb('feature_flags').default(sql`'{}'::jsonb`),

  // Subscription
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('starter'),
  subscriptionStatus: agencyStatusEnum('subscription_status').default('trial'),
  trialEndsAt: timestamp('trial_ends_at'),

  // Limits
  maxSubaccounts: integer('max_subaccounts').default(10),
  maxUsers: integer('max_users').default(50),
  maxStorageMb: integer('max_storage_mb').default(1000),

  // Status
  status: agencyStatusEnum('status').default('trial'),
  isActive: boolean('is_active').default(true),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('mt_agencies_slug_idx').on(table.slug),
  emailIdx: index('mt_agencies_email_idx').on(table.email),
  statusIdx: index('mt_agencies_status_idx').on(table.status),
}));

/**
 * Subaccounts - Child Tenants under Agencies
 * These are our customer's customers (merchants, businesses they serve)
 */
export const mtSubaccounts = pgTable('mt_subaccounts', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Parent Agency (REQUIRED - every subaccount belongs to exactly one agency)
  agencyId: uuid('agency_id').notNull().references(() => mtAgencies.id, { onDelete: 'cascade' }),

  // Identity
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(), // Unique within agency
  description: text('description'),

  // Contact
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),

  // Configuration (can override agency settings)
  settings: jsonb('settings').default(sql`'{}'::jsonb`),
  featureFlags: jsonb('feature_flags').default(sql`'{}'::jsonb`),

  // Status
  isActive: boolean('is_active').default(true),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  agencyIdx: index('mt_subaccounts_agency_idx').on(table.agencyId),
  agencySlugIdx: uniqueIndex('mt_subaccounts_agency_slug_idx').on(table.agencyId, table.slug),
  activeIdx: index('mt_subaccounts_active_idx').on(table.agencyId, table.isActive),
}));

/**
 * Users - Multi-Tenant Users
 * Users can belong to an agency, a subaccount, or both
 */
export const mtUsers = pgTable('mt_users', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Tenant Association
  agencyId: uuid('agency_id').references(() => mtAgencies.id, { onDelete: 'cascade' }),
  subaccountId: uuid('subaccount_id').references(() => mtSubaccounts.id, { onDelete: 'set null' }),

  // Authentication
  username: varchar('username', { length: 100 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),

  // Profile
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  phone: varchar('phone', { length: 50 }),
  timezone: varchar('timezone', { length: 50 }).default('America/New_York'),

  // Role & Permissions
  role: userRoleEnum('role').notNull().default('subaccount_user'),
  permissions: jsonb('permissions').default(sql`'[]'::jsonb`),

  // Security
  mfaEnabled: boolean('mfa_enabled').default(false),
  mfaSecret: varchar('mfa_secret', { length: 255 }),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  lastLoginAt: timestamp('last_login_at'),
  lastLoginIp: varchar('last_login_ip', { length: 45 }),
  isTemporaryPassword: boolean('is_temporary_password').default(false),
  passwordChangedAt: timestamp('password_changed_at'),

  // Status
  isActive: boolean('is_active').default(true),
  emailVerified: boolean('email_verified').default(false),
  emailVerifiedAt: timestamp('email_verified_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  usernameIdx: uniqueIndex('mt_users_username_idx').on(table.username),
  emailIdx: uniqueIndex('mt_users_email_idx').on(table.email),
  agencyIdx: index('mt_users_agency_idx').on(table.agencyId),
  subaccountIdx: index('mt_users_subaccount_idx').on(table.subaccountId),
  agencyActiveIdx: index('mt_users_agency_active_idx').on(table.agencyId, table.isActive),
}));

/**
 * User-Subaccount Access - Junction table for multi-subaccount access
 * Allows users to have access to multiple subaccounts within their agency
 */
export const mtUserSubaccountAccess = pgTable('mt_user_subaccount_access', {
  userId: uuid('user_id').notNull().references(() => mtUsers.id, { onDelete: 'cascade' }),
  subaccountId: uuid('subaccount_id').notNull().references(() => mtSubaccounts.id, { onDelete: 'cascade' }),

  role: userRoleEnum('role').default('subaccount_user'),
  permissions: jsonb('permissions').default(sql`'[]'::jsonb`),

  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  grantedBy: uuid('granted_by').references(() => mtUsers.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.subaccountId] }),
  userIdx: index('mt_user_subaccount_access_user_idx').on(table.userId),
  subaccountIdx: index('mt_user_subaccount_access_subaccount_idx').on(table.subaccountId),
}));

// ============================================================
// BUSINESS TABLES (All with tenant columns)
// ============================================================

/**
 * Processors - Payment Processors (Agency-scoped)
 */
export const mtProcessors = pgTable('mt_processors', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => mtAgencies.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  description: text('description'),

  loginUrl: varchar('login_url', { length: 500 }),
  logoUrl: text('logo_url'),

  // Configuration
  settings: jsonb('settings').default(sql`'{}'::jsonb`),
  fieldMappings: jsonb('field_mappings').default(sql`'{}'::jsonb`),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  agencyIdx: index('mt_processors_agency_idx').on(table.agencyId),
  agencyNameIdx: uniqueIndex('mt_processors_agency_name_idx').on(table.agencyId, table.name),
  activeIdx: index('mt_processors_active_idx').on(table.agencyId, table.isActive),
}));

/**
 * Merchants - Merchant Accounts (Subaccount-scoped)
 */
export const mtMerchants = pgTable('mt_merchants', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => mtAgencies.id, { onDelete: 'cascade' }),
  subaccountId: uuid('subaccount_id').references(() => mtSubaccounts.id, { onDelete: 'set null' }),

  // Identifier
  mid: varchar('mid', { length: 100 }).notNull(),

  // Business Info
  legalName: varchar('legal_name', { length: 255 }),
  dba: varchar('dba', { length: 255 }),
  businessType: varchar('business_type', { length: 100 }),

  // Contact
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),

  // Address
  addressLine1: varchar('address_line_1', { length: 255 }),
  addressLine2: varchar('address_line_2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),

  // Processor Relationship
  processorId: uuid('processor_id').references(() => mtProcessors.id),

  // Status
  status: merchantStatusEnum('status').default('pending'),
  activatedAt: timestamp('activated_at'),
  terminatedAt: timestamp('terminated_at'),

  // Metadata
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  agencyIdx: index('mt_merchants_agency_idx').on(table.agencyId),
  agencyMidIdx: uniqueIndex('mt_merchants_agency_mid_idx').on(table.agencyId, table.mid),
  subaccountIdx: index('mt_merchants_subaccount_idx').on(table.subaccountId),
  statusIdx: index('mt_merchants_status_idx').on(table.agencyId, table.status),
  processorIdx: index('mt_merchants_processor_idx').on(table.processorId),
}));

/**
 * Monthly Data - Residual/Revenue Data (Subaccount-scoped)
 */
export const mtMonthlyData = pgTable('mt_monthly_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => mtAgencies.id, { onDelete: 'cascade' }),
  subaccountId: uuid('subaccount_id').references(() => mtSubaccounts.id, { onDelete: 'set null' }),

  merchantId: uuid('merchant_id').notNull().references(() => mtMerchants.id, { onDelete: 'cascade' }),
  processorId: uuid('processor_id').notNull().references(() => mtProcessors.id),

  month: varchar('month', { length: 7 }).notNull(), // Format: YYYY-MM

  // Metrics
  transactions: integer('transactions').default(0),
  salesAmount: decimal('sales_amount', { precision: 14, scale: 2 }).default('0'),
  income: decimal('income', { precision: 12, scale: 2 }).default('0'),
  expenses: decimal('expenses', { precision: 12, scale: 2 }).default('0'),
  net: decimal('net', { precision: 12, scale: 2 }).default('0'),

  // Additional Metrics
  chargebacks: integer('chargebacks').default(0),
  chargebackAmount: decimal('chargeback_amount', { precision: 12, scale: 2 }).default('0'),
  refunds: integer('refunds').default(0),
  refundAmount: decimal('refund_amount', { precision: 12, scale: 2 }).default('0'),

  // Raw Data
  rawData: jsonb('raw_data').default(sql`'{}'::jsonb`),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  agencyMonthIdx: index('mt_monthly_data_agency_month_idx').on(table.agencyId, table.month),
  merchantMonthIdx: uniqueIndex('mt_monthly_data_merchant_processor_month_idx').on(
    table.agencyId, table.merchantId, table.processorId, table.month
  ),
  subaccountMonthIdx: index('mt_monthly_data_subaccount_month_idx').on(table.subaccountId, table.month),
}));

/**
 * Role Assignments - Commission/Revenue Split Assignments
 */
export const mtRoleAssignments = pgTable('mt_role_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => mtAgencies.id, { onDelete: 'cascade' }),
  subaccountId: uuid('subaccount_id').references(() => mtSubaccounts.id, { onDelete: 'set null' }),

  merchantId: uuid('merchant_id').notNull().references(() => mtMerchants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => mtUsers.id, { onDelete: 'set null' }),

  roleType: varchar('role_type', { length: 50 }).notNull(), // rep, partner, manager, etc.
  roleName: varchar('role_name', { length: 255 }),

  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),

  // Effective dates
  effectiveFrom: varchar('effective_from', { length: 7 }), // YYYY-MM
  effectiveTo: varchar('effective_to', { length: 7 }),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  agencyIdx: index('mt_role_assignments_agency_idx').on(table.agencyId),
  merchantIdx: index('mt_role_assignments_merchant_idx').on(table.merchantId),
  userIdx: index('mt_role_assignments_user_idx').on(table.userId),
  activeIdx: index('mt_role_assignments_active_idx').on(table.agencyId, table.isActive),
}));

// ============================================================
// AUDIT & SECURITY TABLES
// ============================================================

/**
 * Audit Logs - Comprehensive activity tracking
 */
export const mtAuditLogs = pgTable('mt_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Tenant Context
  agencyId: uuid('agency_id').references(() => mtAgencies.id, { onDelete: 'set null' }),
  subaccountId: uuid('subaccount_id').references(() => mtSubaccounts.id, { onDelete: 'set null' }),
  userId: uuid('user_id').references(() => mtUsers.id, { onDelete: 'set null' }),

  // Action
  action: auditActionEnum('action').notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: varchar('resource_id', { length: 100 }),

  // Request Context
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  requestPath: varchar('request_path', { length: 500 }),
  requestMethod: varchar('request_method', { length: 10 }),

  // Change Data
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  metadata: jsonb('metadata'),

  // Result
  success: boolean('success').default(true),
  errorMessage: text('error_message'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  agencyIdx: index('mt_audit_logs_agency_idx').on(table.agencyId, table.createdAt),
  subaccountIdx: index('mt_audit_logs_subaccount_idx').on(table.subaccountId, table.createdAt),
  userIdx: index('mt_audit_logs_user_idx').on(table.userId, table.createdAt),
  actionIdx: index('mt_audit_logs_action_idx').on(table.action, table.createdAt),
  resourceIdx: index('mt_audit_logs_resource_idx').on(table.resourceType, table.resourceId),
}));

/**
 * API Rate Limits - Per-tenant rate limiting
 */
export const mtApiRateLimits = pgTable('mt_api_rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),

  agencyId: uuid('agency_id').references(() => mtAgencies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => mtUsers.id, { onDelete: 'cascade' }),

  identifier: varchar('identifier', { length: 255 }).notNull(),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),

  requests: integer('requests').default(0),
  windowStart: timestamp('window_start').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  lookupIdx: index('mt_api_rate_limits_lookup_idx').on(table.identifier, table.endpoint, table.windowStart),
}));

// ============================================================
// RELATIONS
// ============================================================

export const mtAgenciesRelations = relations(mtAgencies, ({ many }) => ({
  subaccounts: many(mtSubaccounts),
  users: many(mtUsers),
  processors: many(mtProcessors),
  merchants: many(mtMerchants),
  auditLogs: many(mtAuditLogs),
}));

export const mtSubaccountsRelations = relations(mtSubaccounts, ({ one, many }) => ({
  agency: one(mtAgencies, {
    fields: [mtSubaccounts.agencyId],
    references: [mtAgencies.id],
  }),
  users: many(mtUsers),
  merchants: many(mtMerchants),
  monthlyData: many(mtMonthlyData),
}));

export const mtUsersRelations = relations(mtUsers, ({ one, many }) => ({
  agency: one(mtAgencies, {
    fields: [mtUsers.agencyId],
    references: [mtAgencies.id],
  }),
  subaccount: one(mtSubaccounts, {
    fields: [mtUsers.subaccountId],
    references: [mtSubaccounts.id],
  }),
  subaccountAccess: many(mtUserSubaccountAccess),
  roleAssignments: many(mtRoleAssignments),
  auditLogs: many(mtAuditLogs),
}));

export const mtMerchantsRelations = relations(mtMerchants, ({ one, many }) => ({
  agency: one(mtAgencies, {
    fields: [mtMerchants.agencyId],
    references: [mtAgencies.id],
  }),
  subaccount: one(mtSubaccounts, {
    fields: [mtMerchants.subaccountId],
    references: [mtSubaccounts.id],
  }),
  processor: one(mtProcessors, {
    fields: [mtMerchants.processorId],
    references: [mtProcessors.id],
  }),
  monthlyData: many(mtMonthlyData),
  roleAssignments: many(mtRoleAssignments),
}));

export const mtMonthlyDataRelations = relations(mtMonthlyData, ({ one }) => ({
  agency: one(mtAgencies, {
    fields: [mtMonthlyData.agencyId],
    references: [mtAgencies.id],
  }),
  subaccount: one(mtSubaccounts, {
    fields: [mtMonthlyData.subaccountId],
    references: [mtSubaccounts.id],
  }),
  merchant: one(mtMerchants, {
    fields: [mtMonthlyData.merchantId],
    references: [mtMerchants.id],
  }),
  processor: one(mtProcessors, {
    fields: [mtMonthlyData.processorId],
    references: [mtProcessors.id],
  }),
}));

// ============================================================
// TYPE EXPORTS
// ============================================================

export type MTAgency = typeof mtAgencies.$inferSelect;
export type MTInsertAgency = typeof mtAgencies.$inferInsert;

export type MTSubaccount = typeof mtSubaccounts.$inferSelect;
export type MTInsertSubaccount = typeof mtSubaccounts.$inferInsert;

export type MTUser = typeof mtUsers.$inferSelect;
export type MTInsertUser = typeof mtUsers.$inferInsert;

export type MTProcessor = typeof mtProcessors.$inferSelect;
export type MTInsertProcessor = typeof mtProcessors.$inferInsert;

export type MTMerchant = typeof mtMerchants.$inferSelect;
export type MTInsertMerchant = typeof mtMerchants.$inferInsert;

export type MTMonthlyData = typeof mtMonthlyData.$inferSelect;
export type MTInsertMonthlyData = typeof mtMonthlyData.$inferInsert;

export type MTRoleAssignment = typeof mtRoleAssignments.$inferSelect;
export type MTInsertRoleAssignment = typeof mtRoleAssignments.$inferInsert;

export type MTAuditLog = typeof mtAuditLogs.$inferSelect;
export type MTInsertAuditLog = typeof mtAuditLogs.$inferInsert;
