import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb, unique, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enhanced agency schema with email tracking and onboarding
export const agencies = pgTable('agencies', {
  id: serial('id').primaryKey(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 255 }),
  industry: varchar('industry', { length: 100 }),
  isWhitelabel: boolean('is_whitelabel').default(false),
  
  // Domain Management Fields
  domainType: varchar('domain_type', { 
    length: 20,
    enum: ["standard", "custom_domain", "subdomain"] 
  }).default("standard"),
  customDomain: varchar('custom_domain', { length: 255 }),
  subdomainPrefix: varchar('subdomain_prefix', { length: 100 }),
  domainStatus: varchar('domain_status', { 
    length: 20,
    enum: ["pending", "configuring", "active", "error"] 
  }).default("pending"),
  sslStatus: varchar('ssl_status', { 
    length: 20,
    enum: ["pending", "issued", "expired", "error"] 
  }).default("pending"),
  
  // DNS and Email Configuration
  dnsProvider: varchar('dns_provider', { length: 100 }),
  nameservers: jsonb('nameservers').default([]),
  emailProvider: varchar('email_provider', { 
    length: 50,
    enum: ["isohub_smtp", "agency_smtp", "sendgrid", "mailgun"] 
  }).default("isohub_smtp"),
  smtpHost: varchar('smtp_host', { length: 255 }),
  smtpPort: integer('smtp_port'),
  smtpUsername: varchar('smtp_username', { length: 255 }),
  smtpPassword: varchar('smtp_password', { length: 255 }), // Encrypted
  fromEmailAddress: varchar('from_email_address', { length: 255 }),
  fromDisplayName: varchar('from_display_name', { length: 255 }),
  
  primaryColor: varchar('primary_color', { length: 7 }).default('#FFD700'),
  secondaryColor: varchar('secondary_color', { length: 7 }).default('#000000'),
  accentColor: varchar('accent_color', { length: 7 }).default('#FFFFFF'),
  logoUrl: varchar('logo_url', { length: 500 }),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('setup'), // setup, active, inactive, suspended
  adminUsername: varchar('admin_username', { length: 100 }).notNull(),
  tempPassword: varchar('temp_password', { length: 255 }), // Encrypted
  welcomeEmailSent: boolean('welcome_email_sent').default(false),
  passwordEmailSent: boolean('password_email_sent').default(false),
  emailDeliveryTracking: jsonb('email_delivery_tracking'),
  settings: jsonb('settings'),
  // Legacy columns - preserved to prevent data loss
  activationToken: varchar('activation_token', { length: 255 }),
  tokenExpiry: timestamp('token_expiry'),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enhanced users table with multi-tenancy and security
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Hashed with bcrypt
  email: text("email").unique(),
  role: text("role", { 
    enum: ["SuperAdmin", "Admin", "Manager", "Team Leaders", "Users/Reps", "Team Member", "Partners"] 
  }).notNull().default("Users/Reps"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  agencyId: integer("agency_id").references(() => agencies.id),
  organizationId: text("organization_id").notNull().default("org-86f76df1"),
  permissions: jsonb("permissions"), // Granular permissions
  isActive: boolean("is_active").notNull().default(true),
  mfaEnabled: boolean("mfa_enabled").default(false),
  mfaSecret: text("mfa_secret"), // Encrypted
  lastLoginAt: timestamp("last_login_at"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  isTemporaryPassword: boolean("is_temporary_password").default(false),
  repName: text("rep_name"),
  partnerName: text("partner_name"),
  // Legacy columns - preserved to prevent data loss
  agentName: text("agent_name"),
  bio: text("bio"),
  profilePictureUrl: text("profile_picture_url"),
  passwordChangedAt: timestamp("password_changed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const processors = pgTable("processors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Vendors table for login portal and vendor management
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { 
    length: 50,
    enum: ["Processors", "Gateways", "Hardware/Equipment", "Internal"]
  }).notNull(),
  description: text("description"),
  logoUrl: varchar("logo_url", { length: 500 }),
  loginUrl: varchar("login_url", { length: 500 }),
  status: varchar("status", { 
    length: 20,
    enum: ["active", "inactive", "pending"]
  }).default("active"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }), // Legacy column
  integrationNotes: text("integration_notes"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  mid: text("mid").notNull().unique(),
  legalName: text("legal_name"),
  dba: text("dba"),
  branchNumber: text("branch_number"),
  branchId: text("branch_id"), // Added for branch ID tracking
  partnerType: text("partner_type"), // Added for partner type (e.g., "Centennial")
  notes: text("notes"), // Added for notes
  status: text("status"),
  statusCategory: text("status_category"),
  currentProcessor: text("current_processor"),
  partnerName: text("partner_name"),
  agencyId: integer("agency_id").references(() => agencies.id), // Legacy column
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const monthlyData = pgTable("monthly_data", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id).notNull(),
  processorId: integer("processor_id").references(() => processors.id).notNull(),
  month: text("month").notNull(), // "2025-05"
  transactions: integer("transactions").default(0),
  salesAmount: decimal("sales_amount", { precision: 12, scale: 2 }).default("0"),
  income: decimal("income", { precision: 12, scale: 2 }).default("0"),
  expenses: decimal("expenses", { precision: 12, scale: 2 }).default("0"),
  net: decimal("net", { precision: 12, scale: 2 }).default("0"),
  bps: decimal("bps", { precision: 8, scale: 4 }).default("0"),
  percentage: decimal("percentage", { precision: 8, scale: 4 }).default("0"),
  repNet: decimal("rep_net", { precision: 12, scale: 2 }).default("0"),
  approvalDate: timestamp("approval_date"),
  groupCode: text("group_code"),
  // Legacy columns - preserved to prevent data loss
  agentNet: decimal("agent_net", { precision: 12, scale: 2 }),
  columnI: text("column_i"),
  agencyId: integer("agency_id").references(() => agencies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    uniqueMerchantProcessorMonth: unique().on(table.merchantId, table.processorId, table.month),
  };
});

// Master Dataset - Unified compiled data for reporting and assignments
export const masterDataset = pgTable("master_dataset", {
  id: serial("id").primaryKey(),
  mid: text("mid").notNull(),
  merchantName: text("merchant_name").notNull(),
  month: text("month").notNull(), // "2025-05"
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0"),
  processor: text("processor"),
  leadSheetUsers: text("lead_sheet_users"), // Column I users from lead sheet
  assignmentStatus: text("assignment_status").default("pending"), // pending, assigned, validated
  agencyId: integer("agency_id").references(() => agencies.id), // Legacy column
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueMidMonth: unique().on(table.mid, table.month), // One record per MID per month
}));

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // association, partner, rep, sales_manager, company
  isActive: boolean("is_active").notNull().default(true),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id).notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  month: text("month").notNull(),
  agencyId: integer("agency_id").references(() => agencies.id), // Legacy column
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  processorId: integer("processor_id").references(() => processors.id),
  month: text("month").notNull(),
  type: text("type").notNull(), // processor, lead_sheet
  recordsProcessed: integer("records_processed").default(0),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed, success
  errorMessage: text("error_message"),
  validationResults: jsonb("validation_results"),
  agencyId: integer("agency_id").references(() => agencies.id), // Legacy column
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// MID Role Assignments - parsed from Column I and persistent across months
export const midRoleAssignments = pgTable("mid_role_assignments", {
  id: serial("id").primaryKey(),
  mid: text("mid").notNull(),
  merchantName: text("merchant_name").notNull(),
  // Role Assignments
  rep: text("rep"), // Rep name from Column I
  repPercentage: decimal("rep_percentage", { precision: 5, scale: 2 }),
  partner: text("partner"), // Partner name from Column I  
  partnerPercentage: decimal("partner_percentage", { precision: 5, scale: 2 }),
  salesManager: text("sales_manager"), // Sales Manager from Column I
  salesManagerPercentage: decimal("sales_manager_percentage", { precision: 5, scale: 2 }),
  company: text("company"), // Company from Column I
  companyPercentage: decimal("company_percentage", { precision: 5, scale: 2 }),
  association: text("association"), // Association from Column I
  associationPercentage: decimal("association_percentage", { precision: 5, scale: 2 }),
  // Status tracking
  assignmentStatus: text("assignment_status").notNull().default("pending"), // pending, assigned, validated
  originalColumnI: text("original_column_i"), // Store original Column I for reference
  firstAssignedMonth: text("first_assigned_month"), // Track when first assigned
  lastUpdated: timestamp("last_updated").defaultNow(),
  // Legacy columns - preserved to prevent data loss
  agent: text("agent"),
  agentPercentage: decimal("agent_percentage", { precision: 5, scale: 2 }),
  agencyId: integer("agency_id").references(() => agencies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueMid: unique().on(table.mid), // One assignment per MID, persistent across months
}));

// Role Assignment Workflow
export const roleAssignmentWorkflow = pgTable("role_assignment_workflow", {
  id: serial("id").primaryKey(),
  mid: text("mid").notNull(), // Reference MID instead of masterDataset
  userId: text("user_id").notNull(),
  roleType: text("role_type").notNull(), // rep, partner, sales_manager, company, association
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  assignedBy: text("assigned_by").notNull(),
  status: text("status").default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Upload Progress Tracking
export const uploadProgress = pgTable("upload_progress", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(),
  processorId: integer("processor_id").references(() => processors.id),
  processorName: text("processor_name").notNull(),
  uploadStatus: text("upload_status").default("needs_upload"), // needs_upload, uploaded, validated, error
  leadSheetStatus: text("lead_sheet_status").default("needs_upload"), // needs_upload, uploaded, validated, error
  compilationStatus: text("compilation_status").default("pending"), // pending, compiled, error
  assignmentStatus: text("assignment_status").default("pending"), // pending, assigned, validated
  auditStatus: text("audit_status").default("pending"), // pending, passed, failed
  recordCount: integer("record_count").default(0), // Number of records in uploaded file
  fileName: text("file_name"), // Original filename
  fileSize: integer("file_size"), // File size in bytes
  agencyId: integer("agency_id").references(() => agencies.id), // Legacy column
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => ({
  uniqueMonthProcessor: unique().on(table.month, table.processorId),
}));

export const auditIssues = pgTable("audit_issues", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id).notNull(),
  month: text("month").notNull(),
  issueType: text("issue_type").notNull(), // split_error, missing_assignment, unmatched_mid
  description: text("description").notNull(),
  priority: text("priority").notNull(), // high, medium, low
  status: text("status").notNull().default("open"), // open, resolved, ignored
  agencyId: integer("agency_id").references(() => agencies.id), // Legacy column
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  filters: jsonb("filters"),
  schedule: text("schedule"), // daily, weekly, monthly
  lastRun: timestamp("last_run"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// No MID declarations for processors with no new merchants in a given month
export const noMidDeclarations = pgTable("no_mid_declarations", {
  id: serial("id").primaryKey(),
  processorId: integer("processor_id").references(() => processors.id).notNull(),
  month: text("month").notNull(), // YYYY-MM format
  declaredBy: text("declared_by").notNull(), // User who declared no MIDs
  reason: text("reason"), // Optional reason for no MIDs
  declaredAt: timestamp("declared_at").defaultNow().notNull(),
}, (table) => ({
  uniqueProcessorMonth: unique().on(table.processorId, table.month),
}));

// Organizations table moved to onboarding-schema.ts for comprehensive organization management
// Now imported at the top of this file for relations

// ISO Reps table (Payment Processing Reps)
export const isoReps = pgTable("iso_reps", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  repId: text("rep_id").unique().notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company"),
  companySplit: decimal("company_split", { precision: 5, scale: 4 }).default("0"),
  manager: text("manager"),
  managerSplit: decimal("manager_split", { precision: 5, scale: 4 }).default("0"),
  repSplit: decimal("rep_split", { precision: 5, scale: 4 }).default("0"),
  userId: text("user_id"),
  additionalSplits: jsonb("additional_splits").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Rep Merchants table (linking reps to merchants)
export const repMerchants = pgTable("rep_merchants", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  repId: text("rep_id").notNull(),
  merchantId: text("merchant_id").notNull(),
  merchantName: text("merchant_name").notNull(),
  processor: text("processor"),
  bankSplit: decimal("bank_split", { precision: 5, scale: 4 }).default("0"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueRepMerchantProcessor: unique().on(table.organizationId, table.repId, table.merchantId, table.processor),
}));

// Advanced Reports table (V2 Architecture for ISO-AI)
export const advancedReports = pgTable("advanced_reports", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  reportId: text("report_id").unique().notNull(),
  type: text("type").notNull(), // 'rep', 'processor', 'bank_summary', 'rep_summary'
  title: text("title"),
  monthYear: text("month_year"),
  processor: text("processor"),
  agentId: text("agent_id"), // Was repId - renamed to match database
  reportData: jsonb("report_data").notNull().default([]),
  approved: boolean("approved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Rep File Uploads table (for CSV/XLSX uploads)
export const repFileUploads = pgTable("rep_file_uploads", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name"),
  fileType: text("file_type"),
  processor: text("processor"),
  status: text("status").default("pending"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Email tracking schema
export const emailTracking = pgTable('email_tracking', {
  id: serial('id').primaryKey(),
  agencyId: integer('agency_id').references(() => agencies.id),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  emailType: varchar('email_type', { length: 50 }).notNull(), // welcome, password, report, etc.
  subject: varchar('subject', { length: 255 }).notNull(),
  sentAt: timestamp('sent_at').defaultNow(),
  deliveredAt: timestamp('delivered_at'),
  openedAt: timestamp('opened_at'),
  clickedAt: timestamp('clicked_at'),
  bounced: boolean('bounced').default(false),
  status: varchar('status', { length: 20 }).default('sent'), // sent, delivered, opened, clicked, bounced
  metadata: jsonb('metadata'),
});

// Pre-applications tracking
export const preApplications = pgTable("pre_applications", {
  id: serial("id").primaryKey(),
  dba: varchar("dba", { length: 255 }).notNull(),
  businessContactName: varchar("business_contact_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  status: varchar("status", { 
    length: 50,
    enum: ["New", "Form Link Sent", "In Progress", "Pending Review", "Approved", "Declined"]
  }).default("New"),
  organizationId: varchar("organization_id", { length: 100 }),
  repId: varchar("rep_id", { length: 100 }),
  submittedAt: timestamp("submitted_at").defaultNow(),
  businessType: varchar("business_type", { length: 100 }),
  monthlyVolume: decimal("monthly_volume", { precision: 12, scale: 2 }),
  averageTicket: decimal("average_ticket", { precision: 10, scale: 2 }),
  notes: text("notes"),
  formLinkSentAt: timestamp("form_link_sent_at"),
  formLinkSentCount: integer("form_link_sent_count").default(0),
  // Legacy columns - preserved to prevent data loss
  agentId: varchar("agent_id", { length: 100 }),
  businessName: varchar("business_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Branded URL shortener system
export const shortUrls = pgTable("short_urls", {
  id: serial("id").primaryKey(),
  shortCode: text("short_code").unique().notNull(), // e.g., "abc123"
  originalUrl: text("original_url").notNull(), // e.g., "/TRM-2025-001/john-smith"
  agencyCode: text("agency_code").notNull(),
  repName: text("rep_name"), // Made nullable to prevent data loss on migration
  organizationId: text("organization_id").notNull(),
  clickCount: integer("click_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  expiresAt: timestamp("expires_at"), // Optional expiration
  isActive: boolean("is_active").default(true),
  agentName: text("agent_name"), // Legacy column
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Legacy tables - preserved to prevent data loss (matched to actual DB structure)
export const rawDataAudit = pgTable("raw_data_audit", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }),
  processor: varchar("processor", { length: 100 }),
  uploadTimestamp: timestamp("upload_timestamp"),
  totalRecords: integer("total_records"),
  validRecords: integer("valid_records"),
  validationErrors: jsonb("validation_errors"),
  rawData: jsonb("raw_data"),
  processedBy: varchar("processed_by", { length: 100 }),
  status: varchar("status", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const validationErrors = pgTable("validation_errors", {
  id: serial("id").primaryKey(),
  uploadId: integer("upload_id"),
  rowNumber: integer("row_number"),
  fieldName: text("field_name"),
  errorMessage: text("error_message"),
  rawValue: text("raw_value"),
  // Legacy columns - preserved to prevent data loss
  merchantMid: varchar("merchant_mid", { length: 100 }),
  processor: varchar("processor", { length: 100 }),
  errorType: varchar("error_type", { length: 100 }),
  severity: varchar("severity", { length: 20 }),
  month: varchar("month", { length: 7 }),
  detectedAt: timestamp("detected_at"),
  resolved: boolean("resolved"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Legacy tables matched to actual DB structure from introspect
export const agentFileUploads = pgTable("agent_file_uploads", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name"),
  fileType: text("file_type"),
  processor: text("processor"),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  status: text("status").default("pending"),
  results: jsonb("results").default({}),
  userId: text("user_id"),
  needsAudit: jsonb("needs_audit").default([]),
  rejectedMerchants: jsonb("rejected_merchants").default([]),
});

export const agentMerchants = pgTable("agent_merchants", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  agentId: text("agent_id").notNull(),
  merchantId: text("merchant_id").notNull(),
  merchantName: text("merchant_name").notNull(),
  processor: text("processor"),
  bankSplit: decimal("bank_split", { precision: 5, scale: 4 }).default("0"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueAgentMerchant: unique().on(table.organizationId, table.agentId, table.merchantId, table.processor),
}));

export const isoAgents = pgTable("iso_agents", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  agentId: text("agent_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company"),
  companySplit: decimal("company_split", { precision: 5, scale: 4 }).default("0"),
  manager: text("manager"),
  managerSplit: decimal("manager_split", { precision: 5, scale: 4 }).default("0"),
  agentSplit: decimal("agent_split", { precision: 5, scale: 4 }).default("0"),
  userId: text("user_id"),
  additionalSplits: jsonb("additional_splits").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const oauthStates = pgTable("oauth_states", {
  id: serial("id").primaryKey(),
  state: text("state"),
  provider: text("provider"),
  redirectUrl: text("redirect_url"),
  expiresAt: timestamp("expires_at"),
  // Legacy columns from database
  nonce: text("nonce"),
  agencyId: integer("agency_id"),
  userId: integer("user_id"),
  consumed: boolean("consumed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agencyOauthCredentials = pgTable("agency_oauth_credentials", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id"),
  provider: text("provider"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAgencies = pgTable("user_agencies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  agencyId: integer("agency_id"),
  role: text("role"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Multi-tenant (mt_) legacy tables
export const mtAgencies = pgTable("mt_agencies", {
  id: serial("id").primaryKey(),
  name: text("name"),
  status: text("status"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mtMonthlyData = pgTable("mt_monthly_data", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id"),
  month: text("month"),
  data: jsonb("data"),
  // Legacy columns from database
  subaccountId: integer("subaccount_id"),
  merchantId: integer("merchant_id"),
  processorId: integer("processor_id"),
  year: text("year"),
  volume: decimal("volume", { precision: 15, scale: 2 }),
  transactions: integer("transactions"),
  totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }),
  netRevenue: decimal("net_revenue", { precision: 15, scale: 2 }),
  updatedAt: timestamp("updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mtAuditLogs = pgTable("mt_audit_logs", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id"),
  action: text("action"),
  details: jsonb("details"),
  // Legacy columns from database
  subaccountId: integer("subaccount_id"),
  userId: integer("user_id"),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  previousValues: jsonb("previous_values"),
  newValues: jsonb("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mtSubaccounts = pgTable("mt_subaccounts", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id"),
  name: text("name"),
  status: text("status"),
  // Legacy columns from database
  email: text("email"),
  settings: jsonb("settings"),
  isActive: boolean("is_active"),
  updatedAt: timestamp("updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mtUsers = pgTable("mt_users", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id"),
  email: text("email"),
  role: text("role"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mtProcessors = pgTable("mt_processors", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id"),
  name: text("name"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mtMerchants = pgTable("mt_merchants", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id"),
  mid: text("mid"),
  name: text("name"),
  status: text("status"),
  // Legacy columns from database
  subaccountId: integer("subaccount_id"),
  processorId: integer("processor_id"),
  dbaName: text("dba_name"),
  legalName: text("legal_name"),
  metadata: jsonb("metadata"),
  updatedAt: timestamp("updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const merchantsRelations = relations(merchants, ({ many }) => ({
  monthlyData: many(monthlyData),
  assignments: many(assignments),
  auditIssues: many(auditIssues),
}));

export const processorsRelations = relations(processors, ({ many }) => ({
  monthlyData: many(monthlyData),
  fileUploads: many(fileUploads),
}));

export const monthlyDataRelations = relations(monthlyData, ({ one }) => ({
  merchant: one(merchants, {
    fields: [monthlyData.merchantId],
    references: [merchants.id],
  }),
  processor: one(processors, {
    fields: [monthlyData.processorId],
    references: [processors.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  merchant: one(merchants, {
    fields: [assignments.merchantId],
    references: [merchants.id],
  }),
  role: one(roles, {
    fields: [assignments.roleId],
    references: [roles.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  assignments: many(assignments),
}));

export const auditIssuesRelations = relations(auditIssues, ({ one }) => ({
  merchant: one(merchants, {
    fields: [auditIssues.merchantId],
    references: [merchants.id],
  }),
}));

// Export onboarding-related tables for use in main schema
export * from './onboarding-schema';

// Import organizations from onboarding-schema for relations
import { organizations } from './onboarding-schema';

// Multi-tenancy Schema Types (removed duplicates - types are defined at bottom of file)

// Zod schemas for validation - moved to end of file after all table definitions

export const fileUploadsRelations = relations(fileUploads, ({ one }) => ({
  processor: one(processors, {
    fields: [fileUploads.processorId],
    references: [processors.id],
  }),
}));

// ISO-AI Relations
export const isoRepsRelations = relations(isoReps, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [isoReps.organizationId],
    references: [organizations.organizationId],
  }),
  merchants: many(repMerchants),
  reports: many(advancedReports),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  reps: many(isoReps),
  merchants: many(repMerchants),
  reports: many(advancedReports),
  uploads: many(repFileUploads),
}));

export const repMerchantsRelations = relations(repMerchants, ({ one }) => ({
  rep: one(isoReps, {
    fields: [repMerchants.repId],
    references: [isoReps.repId],
  }),
  organization: one(organizations, {
    fields: [repMerchants.organizationId],
    references: [organizations.organizationId],
  }),
}));

export const advancedReportsRelations = relations(advancedReports, ({ one }) => ({
  agent: one(isoAgents, {
    fields: [advancedReports.agentId],
    references: [isoAgents.agentId],
  }),
  organization: one(organizations, {
    fields: [advancedReports.organizationId],
    references: [organizations.organizationId],
  }),
}));

export const repFileUploadsRelations = relations(repFileUploads, ({ one }) => ({
  organization: one(organizations, {
    fields: [repFileUploads.organizationId],
    references: [organizations.organizationId],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertProcessorSchema = createInsertSchema(processors).omit({ id: true, createdAt: true });
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMerchantSchema = createInsertSchema(merchants).omit({ id: true, createdAt: true });
export const insertMonthlyDataSchema = createInsertSchema(monthlyData).omit({ id: true, createdAt: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true });
export const insertFileUploadSchema = createInsertSchema(fileUploads).omit({ id: true, uploadedAt: true });
export const insertAuditIssueSchema = createInsertSchema(auditIssues).omit({ id: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true });

// ISO-AI Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true });
export const insertIsoRepSchema = createInsertSchema(isoReps).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRepMerchantSchema = createInsertSchema(repMerchants).omit({ id: true, createdAt: true });
export const insertAdvancedReportSchema = createInsertSchema(advancedReports).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRepFileUploadSchema = createInsertSchema(repFileUploads).omit({ id: true });

// Multi-tenancy Zod schemas - will be defined after all tables
export const onboardingSteps = pgTable("onboarding_steps", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").references(() => agencies.id).notNull(),
  stepName: varchar("step_name", { length: 100 }).notNull(),
  stepOrder: integer("step_order").notNull(),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  completedByUserId: integer("completed_by_user_id").references(() => users.id),
  stepData: jsonb("step_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscription management
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").references(() => agencies.id).notNull().unique(),
  plan: varchar("plan", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("active"), // active, canceled, suspended, trial
  billingCycle: varchar("billing_cycle", { length: 50 }).default("monthly"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD"),
  nextBillingDate: timestamp("next_billing_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Security audit logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").references(() => agencies.id),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: varchar("resource_id", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API rate limiting
export const apiRateLimits = pgTable("api_rate_limits", {
  id: serial("id").primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(), // IP or user ID
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  requests: integer("requests").default(0),
  windowStart: timestamp("window_start").notNull(),
  agencyId: integer("agency_id").references(() => agencies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Master lead sheets - comprehensive merchant tracking
export const masterLeadSheets = pgTable('master_lead_sheets', {
  id: serial('id').primaryKey(),
  fileName: text('file_name').notNull(),
  uploadDate: timestamp('upload_date').defaultNow().notNull(),
  month: text('month').notNull(), // Format: YYYY-MM
  totalRecords: integer('total_records').default(0),
  newMerchants: integer('new_merchants').default(0),
  reappearingMerchants: integer('reappearing_merchants').default(0),
  processedBy: integer('processed_by').references(() => users.id),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Lead sheet entries - individual merchant records from master sheet
export const leadSheetEntries = pgTable('lead_sheet_entries', {
  id: serial('id').primaryKey(),
  masterLeadSheetId: integer('master_lead_sheet_id').references(() => masterLeadSheets.id),
  mid: text('mid').notNull(),
  merchantName: text('merchant_name').notNull(),
  status: text('status'), // Application status, approval status, etc.
  isNewMerchant: boolean('is_new_merchant').default(false),
  isResidualClient: boolean('is_residual_client').default(false),
  applicationDate: timestamp('application_date'),
  approvalDate: timestamp('approval_date'),
  month: text('month').notNull(),
  processingVolume: decimal('processing_volume', { precision: 15, scale: 2 }),
  monthlyRevenue: decimal('monthly_revenue', { precision: 15, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Background job queue
export const jobQueue = pgTable("job_queue", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // csv_processing, email_sending, report_generation
  status: varchar("status", { length: 50 }).default("pending"), // pending, processing, completed, failed
  payload: jsonb("payload").notNull(),
  result: jsonb("result"),
  error: text("error"),
  agencyId: integer("agency_id").references(() => agencies.id),
  userId: integer("user_id").references(() => users.id),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  scheduledFor: timestamp("scheduled_for"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  agencyId: integer("agency_id").references(() => agencies.id),
  userId: integer("user_id").references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // info, warning, error, success
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cache management
export const cacheEntries = pgTable("cache_entries", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: jsonb("value").notNull(),
  agencyId: integer("agency_id").references(() => agencies.id),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Processor Column Mappings - Mailchimp-style column mapping for processor reports
// Stores how each processor's report columns map to our standard template fields
export const processorColumnMappings = pgTable("processor_column_mappings", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  processorId: integer("processor_id").references(() => processors.id).notNull(),
  processorName: text("processor_name").notNull(), // Denormalized for easier display
  mappingName: text("mapping_name"), // Optional friendly name like "TSYS Standard Format"
  columnMappings: jsonb("column_mappings").notNull(), // { sourceColumn: targetField, ... }
  sampleHeaders: text("sample_headers").array(), // First row from uploaded file for reference
  isDefault: boolean("is_default").default(true), // If processor changes format, user can create new mapping
  version: integer("version").default(1), // Track mapping version if processor changes format
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgProcessorIdx: index("idx_mapping_org_processor").on(table.organizationId, table.processorId),
  orgDefaultIdx: index("idx_mapping_org_default").on(table.organizationId, table.isDefault),
}));

// Template fields that processor columns can be mapped to
// These correspond to the fields we need for monthlyData and merchant tracking
export const PROCESSOR_TEMPLATE_FIELDS = [
  { key: "mid", label: "Merchant ID (MID)", required: true, description: "Unique merchant identifier" },
  { key: "merchantName", label: "Merchant Name", required: true, description: "Business or DBA name" },
  { key: "transactions", label: "Transaction Count", required: false, description: "Number of transactions for the period" },
  { key: "salesAmount", label: "Sales/Volume Amount", required: false, description: "Total sales volume in dollars" },
  { key: "income", label: "Income/Revenue", required: false, description: "Gross income from merchant" },
  { key: "expenses", label: "Expenses/Costs", required: false, description: "Processing costs" },
  { key: "net", label: "Net Revenue", required: true, description: "Net revenue after expenses" },
  { key: "bps", label: "Basis Points (BPS)", required: false, description: "Effective rate in basis points" },
  { key: "repNet", label: "Rep Net", required: false, description: "Representative's net share" },
  { key: "approvalDate", label: "Approval Date", required: false, description: "When merchant was approved" },
  { key: "groupCode", label: "Group/Branch Code", required: false, description: "Agent or branch identifier" },
  { key: "status", label: "Account Status", required: false, description: "Active, closed, etc." },
] as const;

// Enhanced relations with multi-tenancy
export const agencyRelations = relations(agencies, ({ many, one }) => ({
  users: many(users),
  onboardingSteps: many(onboardingSteps),
  subscription: one(subscriptions),
  processors: many(processors),
  merchants: many(merchants),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}));

// Agency onboarding configuration
export const ONBOARDING_STEPS = [
  { name: "Company Information", order: 1, description: "Basic company details and contact info" },
  { name: "Subscription Plan", order: 2, description: "Choose subscription and billing preferences" },
  { name: "User Setup", order: 3, description: "Create admin users and assign roles" },
  { name: "Processor Configuration", order: 4, description: "Set up payment processors" },
  { name: "Data Import", order: 5, description: "Import existing merchant data" },
  { name: "Commission Structure", order: 6, description: "Configure roles and commission splits" },
  { name: "Reporting Setup", order: 7, description: "Configure automated reports and schedules" },
] as const;

// Multi-tenancy and Core Types (consolidated)
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Agency = typeof agencies.$inferSelect;
export type InsertAgency = typeof agencies.$inferInsert;
export type OnboardingStep = typeof onboardingSteps.$inferSelect;
export type InsertOnboardingStep = typeof onboardingSteps.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type JobQueueItem = typeof jobQueue.$inferSelect;
export type InsertJobQueueItem = typeof jobQueue.$inferInsert;
export type Processor = typeof processors.$inferSelect;
export type InsertProcessor = z.infer<typeof insertProcessorSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type MonthlyData = typeof monthlyData.$inferSelect;
export type InsertMonthlyData = z.infer<typeof insertMonthlyDataSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;
export type AuditIssue = typeof auditIssues.$inferSelect;
export type InsertAuditIssue = z.infer<typeof insertAuditIssueSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

// ISO-AI Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type IsoRep = typeof isoReps.$inferSelect;
export type InsertIsoRep = z.infer<typeof insertIsoRepSchema>;
export type RepMerchant = typeof repMerchants.$inferSelect;
export type InsertRepMerchant = z.infer<typeof insertRepMerchantSchema>;
export type AdvancedReport = typeof advancedReports.$inferSelect;
export type InsertAdvancedReport = z.infer<typeof insertAdvancedReportSchema>;
export type RepFileUpload = typeof repFileUploads.$inferSelect;
export type InsertRepFileUpload = z.infer<typeof insertRepFileUploadSchema>;

// URL Shortener Types
export type ShortUrl = typeof shortUrls.$inferSelect;
export type InsertShortUrl = typeof shortUrls.$inferInsert;

// Pre-Application Types
export type PreApplication = typeof preApplications.$inferSelect;
export type InsertPreApplication = typeof preApplications.$inferInsert;

// Processor Column Mapping Types
export type ProcessorColumnMapping = typeof processorColumnMappings.$inferSelect;
export type InsertProcessorColumnMapping = typeof processorColumnMappings.$inferInsert;
export const insertProcessorColumnMappingSchema = createInsertSchema(processorColumnMappings).omit({ id: true, createdAt: true, updatedAt: true, lastUsedAt: true });

// Template field type for column mapping
export type ProcessorTemplateField = typeof PROCESSOR_TEMPLATE_FIELDS[number];

// Note: onboardingProgress and userActivations tables are defined in onboarding-schema.ts
// They are imported via the "export * from './onboarding-schema'" statement

// AI Integration Tables - ISO Hub AI (ISO-AI) Features
export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  userId: integer("user_id"), // Made nullable - removed foreign key to avoid constraint issues
  sessionId: text("session_id").notNull(),
  messages: jsonb("messages").notNull().default([]), // Array of {role, content, timestamp}
  modelUsed: text("model_used"), // claude-4-sonnet, gpt-4.1-mini, etc.
  totalTokens: integer("total_tokens").default(0),
  responseTime: integer("response_time"), // milliseconds
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AI Knowledge Base - Tenant-specific FAQ and documentation
export const aiKnowledgeBase = pgTable("ai_knowledge_base", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  category: text("category").notNull(), // commission, underwriting, compliance, etc.
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  keywords: text("keywords").array(), // For search optimization
  embeddings: jsonb("embeddings"), // Vector embeddings for semantic search
  usageCount: integer("usage_count").default(0),
  isCorrected: boolean("is_corrected").default(false),
  isActive: boolean("is_active").default(true),
  source: text("source"), // manual, imported, ai-generated
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgCategoryIdx: index("idx_kb_org_category").on(table.organizationId, table.category),
  searchIdx: index("idx_kb_search").on(table.organizationId, table.isActive),
}));

// AI Training Corrections - 4-step learning pipeline
export const aiTrainingCorrections = pgTable("ai_training_corrections", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  chatSessionId: integer("chat_session_id").references(() => aiChatSessions.id),
  originalQuery: text("original_query").notNull(),
  originalResponse: text("original_response").notNull(),
  correctedResponse: text("corrected_response").notNull(),
  adminId: integer("admin_id").references(() => users.id).notNull(),
  correctionReason: text("correction_reason"),
  trainingStatus: text("training_status").default("pending"), // pending, processing, applied, failed
  appliedToKnowledgeBase: boolean("applied_to_kb").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  appliedAt: timestamp("applied_at"),
});

// AI Document Analysis - Claude 4 Sonnet direct analysis
export const aiDocumentAnalysis = pgTable("ai_document_analysis", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  documentId: text("document_id").notNull(), // External reference or file path
  documentName: text("document_name").notNull(),
  documentType: text("document_type"), // pdf, csv, xlsx, image
  fileSize: integer("file_size"), // bytes
  analysisResult: jsonb("analysis_result").notNull(), // Structured extraction results
  modelUsed: text("model_used").default("claude-4-sonnet"),
  processingTime: integer("processing_time"), // milliseconds
  extractedEntities: jsonb("extracted_entities"), // merchants, amounts, dates, etc.
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  status: text("status").default("pending"), // pending, processing, completed, failed
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
}, (table) => ({
  orgDocIdx: index("idx_doc_org").on(table.organizationId, table.status),
}));

// AI Model Configurations - Per-tenant AI settings
export const aiModelConfigs = pgTable("ai_model_configs", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().unique(),
  primaryModel: text("primary_model").default("claude-4-sonnet"),
  secondaryModel: text("secondary_model").default("gpt-4.1-mini"),
  fallbackModel: text("fallback_model").default("claude-3.5-sonnet"),
  customPrompts: text("custom_prompts").array(),
  maxTokens: integer("max_tokens").default(8000),
  temperature: decimal("temperature", { precision: 2, scale: 1 }).default("0.7"),
  documentProcessingEnabled: boolean("doc_processing_enabled").default(true),
  chatEnabled: boolean("chat_enabled").default(true),
  knowledgeBaseEnabled: boolean("kb_enabled").default(true),
  monthlyTokenLimit: integer("monthly_token_limit"),
  currentMonthUsage: integer("current_month_usage").default(0),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// ISO-AI Full Chat System Tables
// ==========================================

// AI Chats - Conversation sessions with full features
export const aiChats = pgTable("ai_chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").notNull().default("org-86f76df1"),
  title: varchar("title", { length: 500 }),
  folderId: integer("folder_id"), // References aiChatFolders.id
  isActive: boolean("is_active").default(true),
  deletedAt: timestamp("deleted_at"),
  deletedBy: integer("deleted_by"),
  deletedReason: text("deleted_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
}, (table) => ({
  userIdx: index("idx_ai_chats_user").on(table.userId),
  orgIdx: index("idx_ai_chats_org").on(table.organizationId),
}));

// AI Messages - Individual messages within chat sessions
export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => aiChats.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  sourceType: varchar("source_type", { length: 50 }), // 'knowledge_base' | 'documents' | 'web'
  sourceMetadata: jsonb("source_metadata").default({}),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 6 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  chatIdx: index("idx_ai_messages_chat").on(table.chatId),
}));

// AI Chat Folders - User-created folders for organizing chats (max 20 per user)
export const aiChatFolders = pgTable("ai_chat_folders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  organizationId: text("organization_id").notNull().default("org-86f76df1"),
  name: varchar("name", { length: 100 }).notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_ai_chat_folders_user").on(table.userId),
}));

// AI Chat Folder Assignments - Many-to-many relationship between chats and folders
export const aiChatFolderAssignments = pgTable("ai_chat_folder_assignments", {
  id: serial("id").primaryKey(),
  folderId: integer("folder_id").references(() => aiChatFolders.id, { onDelete: "cascade" }).notNull(),
  chatId: integer("chat_id").references(() => aiChats.id, { onDelete: "cascade" }).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => ({
  folderChatIdx: index("idx_folder_chat").on(table.folderId, table.chatId),
}));

// AI Flow Sessions - Track guided conversation flows (processor finder, proposals, etc.)
export const aiFlowSessions = pgTable("ai_flow_sessions", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => aiChats.id, { onDelete: "cascade" }).notNull(),
  flowId: varchar("flow_id", { length: 50 }).notNull(), // 'find_processor' | 'general_merchant' | 'create_proposal' | 'rep_marketing'
  activeStepIndex: integer("active_step_index").default(0),
  answeredKeys: jsonb("answered_keys").default({}), // {step_key: answer_value}
  status: varchar("status", { length: 20 }).default("question"), // 'question' | 'complete' | 'followup'
  followUpDepth: integer("follow_up_depth").default(0),
  conversationHistory: jsonb("conversation_history").default([]), // [{question, answer, timestamp}]
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  chatFlowIdx: index("idx_flow_chat_flow").on(table.chatId, table.flowId),
}));

// AI Message Attachments - Store images and files for vision model
export const aiMessageAttachments = pgTable("ai_message_attachments", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => aiMessages.id, { onDelete: "cascade" }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  filePath: varchar("file_path", { length: 1000 }).notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  width: integer("width"),
  height: integer("height"),
  base64Data: text("base64_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Message Feedback - Track user satisfaction with AI responses
export const aiMessageFeedback = pgTable("ai_message_feedback", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => aiMessages.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rating: varchar("rating", { length: 20 }).notNull(), // 'helpful' | 'not_helpful'
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Search Analytics - Track search performance and patterns
export const aiSearchAnalytics = pgTable("ai_search_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  organizationId: text("organization_id").notNull().default("org-86f76df1"),
  question: text("question").notNull(),
  correctedQuery: text("corrected_query"),
  queryCorrected: boolean("query_corrected").default(false),
  metaQueryDetected: boolean("meta_query_detected").default(false),
  sourceUsed: varchar("source_used", { length: 50 }), // 'knowledge_base' | 'documents' | 'web' | 'cache'
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  kbConfidence: decimal("kb_confidence", { precision: 3, scale: 2 }),
  docConfidence: decimal("doc_confidence", { precision: 3, scale: 2 }),
  responseTimeMs: integer("response_time_ms"),
  cacheHit: boolean("cache_hit").default(false),
  resultCount: integer("result_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("idx_search_analytics_org").on(table.organizationId),
  userIdx: index("idx_search_analytics_user").on(table.userId),
}));

// AI User Preferences - Voice, theme, and other settings
export const aiUserPreferences = pgTable("ai_user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  voiceEnabled: boolean("voice_enabled").default(false),
  selectedVoice: varchar("selected_voice", { length: 20 }).default("nova"), // alloy | echo | fable | onyx | nova | shimmer
  darkMode: boolean("dark_mode").default(true),
  soundEffects: boolean("sound_effects").default(true),
  autoExpandChats: boolean("auto_expand_chats").default(true),
  keyboardShortcutsEnabled: boolean("keyboard_shortcuts_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Filter Presets - Save and reuse common filter combinations
export const filterPresets = pgTable("filter_presets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  filters: jsonb("filters").notNull(), // Store filter configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_filter_presets_user").on(table.userId),
}));

// ==========================================
// JACC Document Center Integration
// Multi-tenant document storage with approval workflow and vector search
// ==========================================

// Documents - Role-based document storage with vector search (JACC integration)
export const aiDocuments = pgTable("ai_documents", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("org-86f76df1"),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  fileData: text("file_data"), // Base64-encoded original file for preview
  filePath: varchar("file_path", { length: 1000 }),
  fileType: varchar("file_type", { length: 50 }), // pdf, docx, xlsx, txt, image/*
  fileSizeBytes: integer("file_size_bytes"),
  mimeType: varchar("mime_type", { length: 100 }),
  visibleToRole: varchar("visible_to_role", { length: 20 }).notNull().default("public"), // public | rep | admin
  uploadedBy: integer("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  viewCount: integer("view_count").default(0),
  isActive: boolean("is_active").default(true),
  // Approval workflow
  approvalStatus: varchar("approval_status", { length: 20 }).default("pending"), // pending | approved | rejected
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  // Vector embeddings for semantic search (stored as JSON array)
  embeddings: jsonb("embeddings"), // Array of floats for semantic search
  // Google Drive integration (optional)
  googleDriveId: varchar("google_drive_id", { length: 255 }),
  googleDriveFolderId: varchar("google_drive_folder_id", { length: 255 }),
  previewUrl: text("preview_url"),
  // Metadata
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("idx_ai_documents_org").on(table.organizationId),
  approvalIdx: index("idx_ai_documents_approval").on(table.organizationId, table.approvalStatus),
  roleIdx: index("idx_ai_documents_role").on(table.organizationId, table.visibleToRole),
}));

// Document Chunks - Split large documents for better search (JACC integration)
export const aiDocumentChunks = pgTable("ai_document_chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => aiDocuments.id, { onDelete: "cascade" }).notNull(),
  organizationId: text("organization_id").notNull().default("org-86f76df1"),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  embeddings: jsonb("embeddings"), // Vector embeddings for this chunk
  startPage: integer("start_page"),
  endPage: integer("end_page"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  docIdx: index("idx_ai_doc_chunks_doc").on(table.documentId),
  orgIdx: index("idx_ai_doc_chunks_org").on(table.organizationId),
}));

// FAQ Knowledge Base - Enhanced Q&A entries with semantic search (JACC integration)
export const aiFaqs = pgTable("ai_faqs", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("org-86f76df1"),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 100 }),
  embeddings: jsonb("embeddings"), // Vector embeddings for semantic search
  keywords: text("keywords").array(), // For keyword search optimization
  viewCount: integer("view_count").default(0),
  usageCount: integer("usage_count").default(0), // How many times used in AI responses
  isActive: boolean("is_active").default(true),
  isCorrected: boolean("is_corrected").default(false), // AI correction flag
  source: varchar("source", { length: 50 }).default("manual"), // manual | imported | ai-generated | google-sheets
  // Google Sheets sync (optional)
  googleSheetsRowId: varchar("google_sheets_row_id", { length: 100 }),
  lastSyncedAt: timestamp("last_synced_at"),
  // Audit fields
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  updatedBy: integer("updated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("idx_ai_faqs_org").on(table.organizationId),
  categoryIdx: index("idx_ai_faqs_category").on(table.organizationId, table.category),
  activeIdx: index("idx_ai_faqs_active").on(table.organizationId, table.isActive),
}));

// Document Search Logs - Track document searches for analytics (JACC integration)
export const aiDocumentSearchLogs = pgTable("ai_document_search_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  organizationId: text("organization_id").notNull().default("org-86f76df1"),
  query: text("query").notNull(),
  resultCount: integer("result_count").default(0),
  topDocumentId: integer("top_document_id").references(() => aiDocuments.id, { onDelete: "set null" }),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  responseTimeMs: integer("response_time_ms"),
  searchType: varchar("search_type", { length: 20 }).default("semantic"), // semantic | keyword | hybrid
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("idx_ai_doc_search_org").on(table.organizationId),
}));

// Teaching Logs - Store admin corrections for AI responses (JACC integration)
export const aiTeachingLogs = pgTable("ai_teaching_logs", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("org-86f76df1"),
  chatId: integer("chat_id").references(() => aiChats.id, { onDelete: "set null" }),
  messageId: integer("message_id").references(() => aiMessages.id, { onDelete: "set null" }),
  originalQuery: text("original_query").notNull(),
  originalResponse: text("original_response").notNull(),
  correctedResponse: text("corrected_response").notNull(),
  correctionType: varchar("correction_type", { length: 50 }), // factual_error | better_answer | logic_correction | tone_adjustment | other
  teachingContent: text("teaching_content"), // Explanation of why correction was made
  adminId: integer("admin_id").references(() => users.id, { onDelete: "set null" }).notNull(),
  status: varchar("status", { length: 30 }).default("needs_review"), // needs_review | reviewed | applied | archived | deleted
  appliedToFaq: boolean("applied_to_faq").default(false),
  faqId: integer("faq_id").references(() => aiFaqs.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  appliedAt: timestamp("applied_at"),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  orgIdx: index("idx_ai_teaching_org").on(table.organizationId),
  statusIdx: index("idx_ai_teaching_status").on(table.organizationId, table.status),
}));

// Google Sync Config - Store Google Sheets/Drive configuration per org (JACC integration)
export const aiGoogleSyncConfig = pgTable("ai_google_sync_config", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  sheetId: varchar("sheet_id", { length: 255 }),
  sheetName: varchar("sheet_name", { length: 255 }),
  driveFolderId: varchar("drive_folder_id", { length: 255 }),
  syncEnabled: boolean("sync_enabled").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  syncFrequency: varchar("sync_frequency", { length: 20 }).default("manual"), // manual | hourly | daily
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Multi-tenancy Zod schemas (defined at the end after all tables)
export const insertAgencySchema = createInsertSchema(agencies);
export const insertOnboardingStepSchema = createInsertSchema(onboardingSteps);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertAuditLogSchema = createInsertSchema(auditLogs);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertJobQueueSchema = createInsertSchema(jobQueue);
export const insertCacheEntrySchema = createInsertSchema(cacheEntries);
// Note: insertOnboardingProgressSchema and insertUserActivationSchema are exported from onboarding-schema.ts
export const insertAiChatSessionSchema = createInsertSchema(aiChatSessions);
export const insertAiKnowledgeBaseSchema = createInsertSchema(aiKnowledgeBase);
export const insertAiTrainingCorrectionSchema = createInsertSchema(aiTrainingCorrections);
export const insertAiDocumentAnalysisSchema = createInsertSchema(aiDocumentAnalysis);
export const insertAiModelConfigSchema = createInsertSchema(aiModelConfigs);
export const insertFilterPresetSchema = createInsertSchema(filterPresets).omit({ id: true, createdAt: true, updatedAt: true });

// Enhanced 7-Step Workflow Tables (already exist above, just adding types)
export type SelectUploadProgress = typeof uploadProgress.$inferSelect;

export type SelectRoleAssignmentWorkflow = typeof roleAssignmentWorkflow.$inferSelect;

// Note: OnboardingProgress, InsertOnboardingProgress, UserActivation, InsertUserActivation
// types are exported from onboarding-schema.ts

// AI Integration Types
export type AiChatSession = typeof aiChatSessions.$inferSelect;
export type InsertAiChatSession = z.infer<typeof insertAiChatSessionSchema>;
export type AiKnowledgeBase = typeof aiKnowledgeBase.$inferSelect;
export type InsertAiKnowledgeBase = z.infer<typeof insertAiKnowledgeBaseSchema>;
export type AiTrainingCorrection = typeof aiTrainingCorrections.$inferSelect;
export type InsertAiTrainingCorrection = z.infer<typeof insertAiTrainingCorrectionSchema>;
export type AiDocumentAnalysis = typeof aiDocumentAnalysis.$inferSelect;
export type InsertAiDocumentAnalysis = z.infer<typeof insertAiDocumentAnalysisSchema>;
export type AiModelConfig = typeof aiModelConfigs.$inferSelect;
export type InsertAiModelConfig = z.infer<typeof insertAiModelConfigSchema>;

// Filter Preset Types
export type FilterPreset = typeof filterPresets.$inferSelect;
export type InsertFilterPreset = z.infer<typeof insertFilterPresetSchema>;

// ==========================================
// ISO-AI Chat System Schemas and Types
// ==========================================

// Zod schemas for ISO-AI chat tables
export const insertAiChatSchema = createInsertSchema(aiChats).omit({ id: true, createdAt: true, updatedAt: true, lastMessageAt: true });
export const insertAiMessageSchema = createInsertSchema(aiMessages).omit({ id: true, createdAt: true });
export const insertAiChatFolderSchema = createInsertSchema(aiChatFolders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiChatFolderAssignmentSchema = createInsertSchema(aiChatFolderAssignments).omit({ id: true, assignedAt: true });
export const insertAiFlowSessionSchema = createInsertSchema(aiFlowSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiMessageAttachmentSchema = createInsertSchema(aiMessageAttachments).omit({ id: true, createdAt: true });
export const insertAiMessageFeedbackSchema = createInsertSchema(aiMessageFeedback).omit({ id: true, createdAt: true });
export const insertAiSearchAnalyticsSchema = createInsertSchema(aiSearchAnalytics).omit({ id: true, createdAt: true });
export const insertAiUserPreferencesSchema = createInsertSchema(aiUserPreferences).omit({ id: true, createdAt: true, updatedAt: true });

// ISO-AI Chat Types
export type AiChat = typeof aiChats.$inferSelect;
export type InsertAiChat = z.infer<typeof insertAiChatSchema>;
export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = z.infer<typeof insertAiMessageSchema>;
export type AiChatFolder = typeof aiChatFolders.$inferSelect;
export type InsertAiChatFolder = z.infer<typeof insertAiChatFolderSchema>;
export type AiChatFolderAssignment = typeof aiChatFolderAssignments.$inferSelect;
export type InsertAiChatFolderAssignment = z.infer<typeof insertAiChatFolderAssignmentSchema>;
export type AiFlowSession = typeof aiFlowSessions.$inferSelect;
export type InsertAiFlowSession = z.infer<typeof insertAiFlowSessionSchema>;
export type AiMessageAttachment = typeof aiMessageAttachments.$inferSelect;
export type InsertAiMessageAttachment = z.infer<typeof insertAiMessageAttachmentSchema>;
export type AiMessageFeedback = typeof aiMessageFeedback.$inferSelect;
export type InsertAiMessageFeedback = z.infer<typeof insertAiMessageFeedbackSchema>;
export type AiSearchAnalytics = typeof aiSearchAnalytics.$inferSelect;
export type InsertAiSearchAnalytics = z.infer<typeof insertAiSearchAnalyticsSchema>;
export type AiUserPreferences = typeof aiUserPreferences.$inferSelect;
export type InsertAiUserPreferences = z.infer<typeof insertAiUserPreferencesSchema>;

// Flow Metadata type for frontend state
export interface FlowMetadata {
  flowId: string;
  step: number;
  flowAnswers: Record<string, string>;
}

// Message with attachment type
export interface AiMessageWithAttachment extends AiMessage {
  attachments?: AiMessageAttachment[];
}

// Chat with folder info type (folderId already in AiChat, just add folderName)
export interface AiChatWithFolder extends AiChat {
  folderName?: string | null;
}

// ==========================================
// JACC Document Center Schemas and Types
// ==========================================

// Zod schemas for JACC Document Center tables
export const insertAiDocumentSchema = createInsertSchema(aiDocuments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  viewCount: true,
  approvedAt: true,
});
export const insertAiDocumentChunkSchema = createInsertSchema(aiDocumentChunks).omit({ 
  id: true, 
  createdAt: true 
});
export const insertAiFaqSchema = createInsertSchema(aiFaqs).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  viewCount: true,
  usageCount: true,
});
export const insertAiDocumentSearchLogSchema = createInsertSchema(aiDocumentSearchLogs).omit({ 
  id: true, 
  createdAt: true 
});
export const insertAiTeachingLogSchema = createInsertSchema(aiTeachingLogs).omit({ 
  id: true, 
  createdAt: true,
  reviewedAt: true,
  appliedAt: true,
  deletedAt: true,
});
export const insertAiGoogleSyncConfigSchema = createInsertSchema(aiGoogleSyncConfig).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  lastSyncAt: true,
});

// JACC Document Center Types
export type AiDocument = typeof aiDocuments.$inferSelect;
export type InsertAiDocument = z.infer<typeof insertAiDocumentSchema>;
export type AiDocumentChunk = typeof aiDocumentChunks.$inferSelect;
export type InsertAiDocumentChunk = z.infer<typeof insertAiDocumentChunkSchema>;
export type AiFaq = typeof aiFaqs.$inferSelect;
export type InsertAiFaq = z.infer<typeof insertAiFaqSchema>;
export type AiDocumentSearchLog = typeof aiDocumentSearchLogs.$inferSelect;
export type InsertAiDocumentSearchLog = z.infer<typeof insertAiDocumentSearchLogSchema>;
export type AiTeachingLog = typeof aiTeachingLogs.$inferSelect;
export type InsertAiTeachingLog = z.infer<typeof insertAiTeachingLogSchema>;
export type AiGoogleSyncConfig = typeof aiGoogleSyncConfig.$inferSelect;
export type InsertAiGoogleSyncConfig = z.infer<typeof insertAiGoogleSyncConfigSchema>;

// Document with chunks for search results
export interface AiDocumentWithChunks extends AiDocument {
  chunks?: AiDocumentChunk[];
  matchedChunk?: AiDocumentChunk;
  searchScore?: number;
}

// FAQ with search metadata
export interface AiFaqWithScore extends AiFaq {
  searchScore?: number;
  matchedKeywords?: string[];
}

// Document approval status enum
export const DOCUMENT_APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Document visibility roles
export const DOCUMENT_VISIBILITY_ROLES = {
  PUBLIC: 'public',
  REP: 'rep',
  ADMIN: 'admin',
} as const;

// Teaching log status enum
export const TEACHING_LOG_STATUS = {
  NEEDS_REVIEW: 'needs_review',
  REVIEWED: 'reviewed',
  APPLIED: 'applied',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

// FAQ source types
export const FAQ_SOURCE_TYPES = {
  MANUAL: 'manual',
  IMPORTED: 'imported',
  AI_GENERATED: 'ai-generated',
  GOOGLE_SHEETS: 'google-sheets',
} as const;

// ==========================================
// ISO-SIGN E-SIGNATURE MODULE
// ==========================================

// Envelope status enum
export const ISO_SIGN_ENVELOPE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  DELIVERED: 'delivered',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DECLINED: 'declined',
  VOIDED: 'voided',
  EXPIRED: 'expired',
} as const;

// Recipient role enum
export const ISO_SIGN_RECIPIENT_ROLE = {
  SIGNER: 'signer',
  CC: 'cc',
  WITNESS: 'witness',
  APPROVER: 'approver',
} as const;

// Recipient status enum
export const ISO_SIGN_RECIPIENT_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  SIGNED: 'signed',
  DECLINED: 'declined',
  COMPLETED: 'completed',
} as const;

// Envelopes - Main container for a signing request
export const isoSignEnvelopes = pgTable("iso_sign_envelopes", {
  id: serial("id").primaryKey(),
  envelopeUuid: varchar("envelope_uuid", { length: 36 }).notNull().unique(),
  organizationId: text("organization_id").notNull(),
  agencyId: integer("agency_id"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { 
    length: 20,
    enum: ["draft", "sent", "delivered", "in_progress", "completed", "declined", "voided", "expired"]
  }).notNull().default("draft"),
  
  // Source integration references
  sourceType: varchar("source_type", { 
    length: 50,
    enum: ["pre_application", "onboarding", "commission_agreement", "document_center", "manual"]
  }),
  sourceId: integer("source_id"),
  
  // Sender info
  senderUserId: integer("sender_user_id").references(() => users.id),
  senderName: varchar("sender_name", { length: 255 }),
  senderEmail: varchar("sender_email", { length: 255 }),
  
  // Settings
  expiresAt: timestamp("expires_at"),
  reminderEnabled: boolean("reminder_enabled").default(true),
  reminderDays: integer("reminder_days").default(3),
  sequentialSigning: boolean("sequential_signing").default(false),
  
  // Completion data
  completedAt: timestamp("completed_at"),
  voidedAt: timestamp("voided_at"),
  voidReason: text("void_reason"),
  
  // Audit hash for tamper detection
  auditHash: text("audit_hash"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Documents within an envelope
export const isoSignDocuments = pgTable("iso_sign_documents", {
  id: serial("id").primaryKey(),
  documentUuid: varchar("document_uuid", { length: 36 }).notNull().unique(),
  envelopeId: integer("envelope_id").references(() => isoSignEnvelopes.id).notNull(),
  organizationId: text("organization_id").notNull(),
  
  // Document info
  name: varchar("name", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSizeBytes: integer("file_size_bytes"),
  pageCount: integer("page_count"),
  order: integer("order").default(1),
  
  // Storage - encrypted document content or reference
  storageType: varchar("storage_type", { 
    length: 20,
    enum: ["database", "s3", "local"]
  }).default("database"),
  documentContent: text("document_content"), // Base64 encoded, encrypted
  storagePath: text("storage_path"),
  encryptionKey: text("encryption_key"), // Encrypted with master key
  
  // Completed/signed version
  completedDocumentContent: text("completed_document_content"),
  completedStoragePath: text("completed_storage_path"),
  documentHash: text("document_hash"), // SHA-256 hash for integrity
  completedHash: text("completed_hash"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Recipients/Signers for an envelope
export const isoSignRecipients = pgTable("iso_sign_recipients", {
  id: serial("id").primaryKey(),
  recipientUuid: varchar("recipient_uuid", { length: 36 }).notNull().unique(),
  envelopeId: integer("envelope_id").references(() => isoSignEnvelopes.id).notNull(),
  organizationId: text("organization_id").notNull(),
  
  // Recipient info
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  role: varchar("role", { 
    length: 20,
    enum: ["signer", "cc", "witness", "approver"]
  }).notNull().default("signer"),
  routingOrder: integer("routing_order").default(1),
  
  // Status tracking
  status: varchar("status", { 
    length: 20,
    enum: ["pending", "sent", "delivered", "signed", "declined", "completed"]
  }).notNull().default("pending"),
  
  // Authentication
  accessCode: text("access_code"), // Encrypted PIN/password
  requireIdVerification: boolean("require_id_verification").default(false),
  requireSmsVerification: boolean("require_sms_verification").default(false),
  
  // Signing details
  signedAt: timestamp("signed_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: text("decline_reason"),
  signatureData: text("signature_data"), // Encrypted signature image/data
  signatureIp: varchar("signature_ip", { length: 45 }),
  signatureUserAgent: text("signature_user_agent"),
  
  // Secure signing token
  signingToken: text("signing_token"),
  signingTokenExpiresAt: timestamp("signing_token_expires_at"),
  
  // Linked internal user if applicable
  userId: integer("user_id").references(() => users.id),
  
  // Notification tracking
  lastNotificationSentAt: timestamp("last_notification_sent_at"),
  notificationCount: integer("notification_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Signature fields/anchors on documents
export const isoSignFields = pgTable("iso_sign_fields", {
  id: serial("id").primaryKey(),
  fieldUuid: varchar("field_uuid", { length: 36 }).notNull().unique(),
  documentId: integer("document_id").references(() => isoSignDocuments.id).notNull(),
  recipientId: integer("recipient_id").references(() => isoSignRecipients.id).notNull(),
  organizationId: text("organization_id").notNull(),
  
  // Field type
  fieldType: varchar("field_type", { 
    length: 30,
    enum: ["signature", "initial", "date", "text", "checkbox", "dropdown", "name", "email", "company", "title"]
  }).notNull(),
  
  // Position on document
  pageNumber: integer("page_number").notNull(),
  xPosition: decimal("x_position", { precision: 10, scale: 4 }).notNull(),
  yPosition: decimal("y_position", { precision: 10, scale: 4 }).notNull(),
  width: decimal("width", { precision: 10, scale: 4 }).notNull(),
  height: decimal("height", { precision: 10, scale: 4 }).notNull(),
  
  // Field settings
  isRequired: boolean("is_required").default(true),
  label: varchar("label", { length: 255 }),
  placeholder: varchar("placeholder", { length: 255 }),
  defaultValue: text("default_value"),
  options: jsonb("options"), // For dropdown fields
  
  // Completed value
  value: text("value"),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Signer events/activity log
export const isoSignEvents = pgTable("iso_sign_events", {
  id: serial("id").primaryKey(),
  envelopeId: integer("envelope_id").references(() => isoSignEnvelopes.id).notNull(),
  recipientId: integer("recipient_id").references(() => isoSignRecipients.id),
  documentId: integer("document_id").references(() => isoSignDocuments.id),
  organizationId: text("organization_id").notNull(),
  
  // Event details
  eventType: varchar("event_type", { 
    length: 50,
    enum: [
      "envelope_created", "envelope_sent", "envelope_delivered", "envelope_viewed",
      "envelope_completed", "envelope_declined", "envelope_voided", "envelope_expired",
      "recipient_sent", "recipient_delivered", "recipient_viewed", "recipient_signed",
      "recipient_declined", "recipient_auth_failed", "document_viewed", "field_completed",
      "reminder_sent", "access_code_entered", "sms_verified"
    ]
  }).notNull(),
  
  // Actor info
  actorType: varchar("actor_type", { 
    length: 20,
    enum: ["system", "sender", "recipient", "admin"]
  }).notNull(),
  actorEmail: varchar("actor_email", { length: 255 }),
  actorName: varchar("actor_name", { length: 255 }),
  actorUserId: integer("actor_user_id"),
  
  // Technical details
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  geoLocation: jsonb("geo_location"),
  
  // Event metadata
  metadata: jsonb("metadata"),
  message: text("message"),
  
  // Hash chain for audit integrity
  previousEventHash: text("previous_event_hash"),
  eventHash: text("event_hash"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Templates for reusable envelopes
export const isoSignTemplates = pgTable("iso_sign_templates", {
  id: serial("id").primaryKey(),
  templateUuid: varchar("template_uuid", { length: 36 }).notNull().unique(),
  organizationId: text("organization_id").notNull(),
  agencyId: integer("agency_id"),
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  
  // Template content
  templateData: jsonb("template_data").notNull(), // Documents, fields, recipients structure
  
  // Usage tracking
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ISO-Sign Zod Schemas
export const insertIsoSignEnvelopeSchema = createInsertSchema(isoSignEnvelopes).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  completedAt: true,
  voidedAt: true,
});
export const insertIsoSignDocumentSchema = createInsertSchema(isoSignDocuments).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
});
export const insertIsoSignRecipientSchema = createInsertSchema(isoSignRecipients).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
  signedAt: true,
  declinedAt: true,
});
export const insertIsoSignFieldSchema = createInsertSchema(isoSignFields).omit({ 
  id: true, 
  createdAt: true,
  completedAt: true,
});
export const insertIsoSignEventSchema = createInsertSchema(isoSignEvents).omit({ 
  id: true, 
  createdAt: true,
});
export const insertIsoSignTemplateSchema = createInsertSchema(isoSignTemplates).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  lastUsedAt: true,
});

// ISO-Sign Types
export type IsoSignEnvelope = typeof isoSignEnvelopes.$inferSelect;
export type InsertIsoSignEnvelope = z.infer<typeof insertIsoSignEnvelopeSchema>;
export type IsoSignDocument = typeof isoSignDocuments.$inferSelect;
export type InsertIsoSignDocument = z.infer<typeof insertIsoSignDocumentSchema>;
export type IsoSignRecipient = typeof isoSignRecipients.$inferSelect;
export type InsertIsoSignRecipient = z.infer<typeof insertIsoSignRecipientSchema>;
export type IsoSignField = typeof isoSignFields.$inferSelect;
export type InsertIsoSignField = z.infer<typeof insertIsoSignFieldSchema>;
export type IsoSignEvent = typeof isoSignEvents.$inferSelect;
export type InsertIsoSignEvent = z.infer<typeof insertIsoSignEventSchema>;
export type IsoSignTemplate = typeof isoSignTemplates.$inferSelect;
export type InsertIsoSignTemplate = z.infer<typeof insertIsoSignTemplateSchema>;

// Envelope with related data for API responses
export interface IsoSignEnvelopeWithDetails extends IsoSignEnvelope {
  documents?: IsoSignDocument[];
  recipients?: IsoSignRecipient[];
  events?: IsoSignEvent[];
}

// PROSPECTS TABLE - Pre-Onboarding Management
// ==========================================

export const prospects = pgTable('prospects', {
  id: serial('id').primaryKey(),
  
  // Unique identifier for the prospect
  prospectId: varchar('prospect_id', { length: 50 }).unique().notNull(),
  
  // Company Information
  companyName: varchar('company_name', { length: 255 }).notNull(),
  
  // Contact Information
  contactFirstName: varchar('contact_first_name', { length: 100 }).notNull(),
  contactLastName: varchar('contact_last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  
  // Pricing
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }),
  pricingNotes: text('pricing_notes'),
  
  // Invoice Management
  invoiceLink: varchar('invoice_link', { length: 500 }),
  invoiceSentAt: timestamp('invoice_sent_at'),
  
  // Payment Status (manual toggle)
  isPaid: boolean('is_paid').default(false),
  paidAt: timestamp('paid_at'),
  isActive: boolean('is_active').default(false),
  
  // Conversion to Agency
  convertedToAgencyId: integer('converted_to_agency_id').references(() => agencies.id),
  convertedAt: timestamp('converted_at'),
  
  // Onboarding Access
  onboardingToken: varchar('onboarding_token', { length: 255 }),
  onboardingTokenExpiry: timestamp('onboarding_token_expiry'),
  welcomeEmailSent: boolean('welcome_email_sent').default(false),
  welcomeEmailSentAt: timestamp('welcome_email_sent_at'),
  
  // Status tracking
  status: varchar('status', { 
    length: 25,
    enum: ['new', 'invoice_sent', 'paid', 'pending_activation', 'onboarding', 'converted', 'cancelled']
  }).default('new'),
  
  // Admin tracking
  createdBy: integer('created_by').references(() => users.id),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Prospects Zod Schemas
export const insertProspectSchema = createInsertSchema(prospects).omit({
  id: true,
  prospectId: true,
  createdAt: true,
  updatedAt: true,
  convertedAt: true,
  paidAt: true,
  onboardingToken: true,
  onboardingTokenExpiry: true,
  welcomeEmailSent: true,
  welcomeEmailSentAt: true,
  invoiceSentAt: true,
});

export const createProspectSchema = insertProspectSchema.extend({
  companyName: z.string().min(1, 'Company name is required'),
  contactFirstName: z.string().min(1, 'First name is required'),
  contactLastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
});

// Prospects Types
export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = z.infer<typeof insertProspectSchema>;
