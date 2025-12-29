import { pgTable, foreignKey, serial, integer, numeric, text, timestamp, jsonb, boolean, unique, uniqueIndex, varchar, index, check, uuid, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const agencyStatus = pgEnum("agency_status", ['active', 'inactive', 'suspended', 'pending'])
export const auditAction = pgEnum("audit_action", ['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'bulk_operation'])
export const merchantStatus = pgEnum("merchant_status", ['active', 'inactive', 'pending', 'terminated'])
export const subscriptionTier = pgEnum("subscription_tier", ['starter', 'professional', 'enterprise', 'custom'])
export const userRole = pgEnum("user_role", ['superadmin', 'admin', 'manager', 'agent', 'viewer'])


export const assignments = pgTable("assignments", {
	id: serial().primaryKey().notNull(),
	merchantId: integer("merchant_id").notNull(),
	roleId: integer("role_id").notNull(),
	percentage: numeric({ precision: 5, scale:  2 }).notNull(),
	month: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	agencyId: integer("agency_id"),
}, (table) => [
	foreignKey({
			columns: [table.merchantId],
			foreignColumns: [merchants.id],
			name: "assignments_merchant_id_merchants_id_fk"
		}),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "assignments_role_id_roles_id_fk"
		}),
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [agencies.id],
			name: "assignments_agency_id_fkey"
		}),
]);

export const reports = pgTable("reports", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	filters: jsonb(),
	schedule: text(),
	lastRun: timestamp("last_run", { mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const advancedReports = pgTable("advanced_reports", {
	id: serial().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	reportId: text("report_id").notNull(),
	type: text().notNull(),
	title: text(),
	monthYear: text("month_year"),
	processor: text(),
	agentId: text("agent_id"),
	reportData: jsonb("report_data").default([]).notNull(),
	approved: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("advanced_reports_report_id_unique").on(table.reportId),
]);

export const roles = pgTable("roles", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
});

export const processors = pgTable("processors", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const merchants = pgTable("merchants", {
	id: serial().primaryKey().notNull(),
	mid: text().notNull(),
	legalName: text("legal_name"),
	dba: text(),
	branchNumber: text("branch_number"),
	status: text(),
	statusCategory: text("status_category"),
	currentProcessor: text("current_processor"),
	partnerName: text("partner_name"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	agencyId: integer("agency_id"),
}, (table) => [
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [agencies.id],
			name: "merchants_agency_id_fkey"
		}),
	unique("merchants_mid_unique").on(table.mid),
]);

export const agentFileUploads = pgTable("agent_file_uploads", {
	id: serial().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	filename: text().notNull(),
	originalName: text("original_name"),
	fileType: text("file_type"),
	processor: text(),
	uploadDate: timestamp("upload_date", { mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	status: text().default('pending'),
	results: jsonb().default({}),
	userId: text("user_id"),
	needsAudit: jsonb("needs_audit").default([]),
	rejectedMerchants: jsonb("rejected_merchants").default([]),
});

export const monthlyData = pgTable("monthly_data", {
	id: serial().primaryKey().notNull(),
	merchantId: integer("merchant_id").notNull(),
	processorId: integer("processor_id").notNull(),
	month: text().notNull(),
	transactions: integer().default(0),
	salesAmount: numeric("sales_amount", { precision: 12, scale:  2 }).default('0'),
	income: numeric({ precision: 12, scale:  2 }).default('0'),
	expenses: numeric({ precision: 12, scale:  2 }).default('0'),
	net: numeric({ precision: 12, scale:  2 }).default('0'),
	bps: numeric({ precision: 8, scale:  4 }).default('0'),
	percentage: numeric({ precision: 8, scale:  4 }).default('0'),
	agentNet: numeric("agent_net", { precision: 12, scale:  2 }).default('0'),
	approvalDate: timestamp("approval_date", { mode: 'string' }),
	groupCode: text("group_code"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	columnI: text("column_i"),
	agencyId: integer("agency_id"),
}, (table) => [
	uniqueIndex("unique_monthly_data_idx").using("btree", table.merchantId.asc().nullsLast().op("text_ops"), table.processorId.asc().nullsLast().op("text_ops"), table.month.asc().nullsLast().op("int4_ops"), table.agencyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.merchantId],
			foreignColumns: [merchants.id],
			name: "monthly_data_merchant_id_merchants_id_fk"
		}),
	foreignKey({
			columns: [table.processorId],
			foreignColumns: [processors.id],
			name: "monthly_data_processor_id_processors_id_fk"
		}),
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [agencies.id],
			name: "monthly_data_agency_id_fkey"
		}),
]);

export const agentMerchants = pgTable("agent_merchants", {
	id: serial().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	agentId: text("agent_id").notNull(),
	merchantId: text("merchant_id").notNull(),
	merchantName: text("merchant_name").notNull(),
	processor: text(),
	bankSplit: numeric("bank_split", { precision: 5, scale:  4 }).default('0'),
	status: text().default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("agent_merchants_organization_id_agent_id_merchant_id_processor_").on(table.organizationId, table.agentId, table.merchantId, table.processor),
]);

export const isoAgents = pgTable("iso_agents", {
	id: serial().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	agentId: text("agent_id").notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	company: text(),
	companySplit: numeric("company_split", { precision: 5, scale:  4 }).default('0'),
	manager: text(),
	managerSplit: numeric("manager_split", { precision: 5, scale:  4 }).default('0'),
	agentSplit: numeric("agent_split", { precision: 5, scale:  4 }).default('0'),
	userId: text("user_id"),
	additionalSplits: jsonb("additional_splits").default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("iso_agents_agent_id_unique").on(table.agentId),
]);

export const organizations = pgTable("organizations", {
	id: serial().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	name: text().notNull(),
	settings: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	website: varchar({ length: 255 }),
	adminContactName: varchar("admin_contact_name", { length: 255 }),
	adminContactEmail: varchar("admin_contact_email", { length: 255 }),
	adminContactPhone: varchar("admin_contact_phone", { length: 50 }),
	industry: varchar({ length: 100 }),
	status: varchar({ length: 20 }).default('setup'),
	activationToken: varchar("activation_token", { length: 255 }),
	tokenExpiry: timestamp("token_expiry", { mode: 'string' }),
	welcomeEmailSent: boolean("welcome_email_sent").default(false),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	primaryColor: varchar("primary_color", { length: 7 }).default('#FFD700'),
	secondaryColor: varchar("secondary_color", { length: 7 }).default('#000000'),
	accentColor: varchar("accent_color", { length: 7 }).default('#FFFFFF'),
	logoUrl: varchar("logo_url", { length: 500 }),
	domainType: varchar("domain_type", { length: 20 }).default('standard'),
	customDomain: varchar("custom_domain", { length: 255 }),
	subdomainPrefix: varchar("subdomain_prefix", { length: 100 }),
	businessProfile: jsonb("business_profile"),
}, (table) => [
	unique("organizations_organization_id_unique").on(table.organizationId),
]);

export const auditLogs = pgTable("audit_logs", {
	id: serial().primaryKey().notNull(),
	agencyId: integer("agency_id"),
	userId: integer("user_id"),
	action: varchar({ length: 100 }).notNull(),
	resourceType: varchar("resource_type", { length: 50 }),
	resourceId: varchar("resource_id", { length: 100 }),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "audit_logs_user_id_users_id_fk"
		}),
]);

export const cacheEntries = pgTable("cache_entries", {
	id: serial().primaryKey().notNull(),
	key: varchar({ length: 255 }).notNull(),
	value: jsonb().notNull(),
	agencyId: integer("agency_id"),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("cache_entries_key_unique").on(table.key),
]);

export const jobQueue = pgTable("job_queue", {
	id: serial().primaryKey().notNull(),
	type: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 50 }).default('pending'),
	payload: jsonb().notNull(),
	result: jsonb(),
	error: text(),
	agencyId: integer("agency_id"),
	userId: integer("user_id"),
	attempts: integer().default(0),
	maxAttempts: integer("max_attempts").default(3),
	scheduledFor: timestamp("scheduled_for", { mode: 'string' }),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "job_queue_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	email: text(),
	role: text().default('Users/Reps').notNull(),
	agentName: text("agent_name"),
	partnerName: text("partner_name"),
	firstName: text("first_name"),
	lastName: text("last_name"),
	organizationId: text("organization_id").default('org-86f76df1').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	agencyId: integer("agency_id"),
	permissions: jsonb(),
	mfaEnabled: boolean("mfa_enabled").default(false),
	mfaSecret: text("mfa_secret"),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	failedLoginAttempts: integer("failed_login_attempts").default(0),
	lockedUntil: timestamp("locked_until", { mode: 'string' }),
	isTemporaryPassword: boolean("is_temporary_password").default(false),
	bio: text(),
	profilePictureUrl: text("profile_picture_url"),
	passwordChangedAt: timestamp("password_changed_at", { mode: 'string' }),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const apiRateLimits = pgTable("api_rate_limits", {
	id: serial().primaryKey().notNull(),
	identifier: varchar({ length: 255 }).notNull(),
	endpoint: varchar({ length: 255 }).notNull(),
	requests: integer().default(0),
	windowStart: timestamp("window_start", { mode: 'string' }).notNull(),
	agencyId: integer("agency_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	agencyId: integer("agency_id"),
	userId: integer("user_id"),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	isRead: boolean("is_read").default(false),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}),
]);

export const onboardingSteps = pgTable("onboarding_steps", {
	id: serial().primaryKey().notNull(),
	agencyId: integer("agency_id").notNull(),
	stepName: varchar("step_name", { length: 100 }).notNull(),
	stepOrder: integer("step_order").notNull(),
	isCompleted: boolean("is_completed").default(false),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	completedByUserId: integer("completed_by_user_id"),
	stepData: jsonb("step_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.completedByUserId],
			foreignColumns: [users.id],
			name: "onboarding_steps_completed_by_user_id_users_id_fk"
		}),
]);

export const subscriptions = pgTable("subscriptions", {
	id: serial().primaryKey().notNull(),
	agencyId: integer("agency_id").notNull(),
	plan: varchar({ length: 50 }).notNull(),
	status: varchar({ length: 50 }).default('active'),
	billingCycle: varchar("billing_cycle", { length: 50 }).default('monthly'),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: varchar({ length: 10 }).default('USD'),
	nextBillingDate: timestamp("next_billing_date", { mode: 'string' }),
	trialEndsAt: timestamp("trial_ends_at", { mode: 'string' }),
	canceledAt: timestamp("canceled_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("subscriptions_agency_id_unique").on(table.agencyId),
]);

export const vendors = pgTable("vendors", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 50 }).notNull(),
	description: text(),
	logoUrl: varchar("logo_url", { length: 500 }),
	loginUrl: varchar("login_url", { length: 500 }),
	contactEmail: varchar("contact_email", { length: 255 }),
	contactPhone: varchar("contact_phone", { length: 50 }),
	status: varchar({ length: 20 }).default('active'),
	integrationNotes: text("integration_notes"),
	settings: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	check("vendors_category_check", sql`(category)::text = ANY ((ARRAY['Processors'::character varying, 'Gateways'::character varying, 'Hardware/Equipment'::character varying, 'Internal'::character varying])::text[])`),
	check("vendors_status_check", sql`(status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'pending'::character varying])::text[])`),
]);

export const shortUrls = pgTable("short_urls", {
	id: serial().primaryKey().notNull(),
	shortCode: varchar("short_code", { length: 10 }).notNull(),
	originalUrl: text("original_url").notNull(),
	agencyCode: varchar("agency_code", { length: 50 }),
	agentName: varchar("agent_name", { length: 100 }),
	organizationId: varchar("organization_id", { length: 50 }),
	clickCount: integer("click_count").default(0),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	lastAccessedAt: timestamp("last_accessed_at", { mode: 'string' }),
	isActive: boolean("is_active").default(true),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("short_urls_short_code_key").on(table.shortCode),
]);

export const rawDataAudit = pgTable("raw_data_audit", {
	id: serial().primaryKey().notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	processor: varchar({ length: 100 }).notNull(),
	uploadTimestamp: timestamp("upload_timestamp", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	totalRecords: integer("total_records"),
	validRecords: integer("valid_records"),
	validationErrors: jsonb("validation_errors"),
	rawData: jsonb("raw_data"),
	processedBy: varchar("processed_by", { length: 100 }),
	status: varchar({ length: 50 }).default('pending'),
});

export const preApplications = pgTable("pre_applications", {
	id: serial().primaryKey().notNull(),
	dba: varchar({ length: 255 }).notNull(),
	businessContactName: varchar("business_contact_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }),
	status: varchar({ length: 50 }).default('New'),
	organizationId: varchar("organization_id", { length: 100 }),
	agentId: varchar("agent_id", { length: 100 }),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	businessType: varchar("business_type", { length: 100 }),
	monthlyVolume: numeric("monthly_volume", { precision: 12, scale:  2 }),
	averageTicket: numeric("average_ticket", { precision: 10, scale:  2 }),
	notes: text(),
	formLinkSentAt: timestamp("form_link_sent_at", { mode: 'string' }),
	formLinkSentCount: integer("form_link_sent_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	businessName: varchar("business_name", { length: 255 }),
});

export const validationErrors = pgTable("validation_errors", {
	id: serial().primaryKey().notNull(),
	merchantMid: varchar("merchant_mid", { length: 100 }),
	processor: varchar({ length: 100 }),
	errorType: varchar("error_type", { length: 100 }),
	errorMessage: text("error_message"),
	severity: varchar({ length: 20 }),
	month: varchar({ length: 7 }),
	detectedAt: timestamp("detected_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	resolved: boolean().default(false),
});

export const onboardingProgress = pgTable("onboarding_progress", {
	id: serial().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	step1Complete: boolean("step1_complete").default(false),
	step2Complete: boolean("step2_complete").default(false),
	step3Complete: boolean("step3_complete").default(false),
	step4Complete: boolean("step4_complete").default(false),
	step5Complete: boolean("step5_complete").default(false),
	step6Complete: boolean("step6_complete").default(false),
	step7Complete: boolean("step7_complete").default(false),
	instanceData: jsonb("instance_data"),
	companyData: jsonb("company_data"),
	orgChartData: jsonb("org_chart_data"),
	businessProfileData: jsonb("business_profile_data"),
	vendorSelectionData: jsonb("vendor_selection_data"),
	docsHubData: jsonb("docs_hub_data"),
	tourData: jsonb("tour_data"),
	currentStep: integer("current_step").default(1),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.organizationId],
			name: "onboarding_progress_organization_id_fkey"
		}),
]);

export const userActivations = pgTable("user_activations", {
	id: serial().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	activationToken: varchar("activation_token", { length: 255 }).notNull(),
	passwordResetToken: varchar("password_reset_token", { length: 255 }),
	activationExpiry: timestamp("activation_expiry", { mode: 'string' }).notNull(),
	passwordResetExpiry: timestamp("password_reset_expiry", { mode: 'string' }),
	isActivated: boolean("is_activated").default(false),
	activatedAt: timestamp("activated_at", { mode: 'string' }),
	passwordChanged: boolean("password_changed").default(false),
	passwordChangedAt: timestamp("password_changed_at", { mode: 'string' }),
	tempPassword: varchar("temp_password", { length: 255 }),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	role: varchar({ length: 50 }).default('Admin'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.organizationId],
			name: "user_activations_organization_id_fkey"
		}),
]);

export const organizationVendors = pgTable("organization_vendors", {
	id: serial().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	vendorId: integer("vendor_id").notNull(),
	category: varchar({ length: 50 }).notNull(),
	selectedAt: timestamp("selected_at", { mode: 'string' }).defaultNow().notNull(),
	configurationData: jsonb("configuration_data"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.organizationId],
			name: "organization_vendors_organization_id_fkey"
		}),
]);

export const documentIntegrations = pgTable("document_integrations", {
	id: serial().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	provider: varchar({ length: 50 }).notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	tokenExpiry: timestamp("token_expiry", { mode: 'string' }),
	integrationData: jsonb("integration_data"),
	syncEnabled: boolean("sync_enabled").default(true),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	status: varchar({ length: 20 }).default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.organizationId],
			name: "document_integrations_organization_id_fkey"
		}),
]);

export const dashboardTours = pgTable("dashboard_tours", {
	id: serial().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	userId: integer("user_id").notNull(),
	tourCompleted: boolean("tour_completed").default(false),
	completedSteps: jsonb("completed_steps").default([]),
	tourType: varchar("tour_type", { length: 50 }).default('admin'),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	skippedAt: timestamp("skipped_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.organizationId],
			name: "dashboard_tours_organization_id_fkey"
		}),
]);

export const fileUploads = pgTable("file_uploads", {
	id: serial().primaryKey().notNull(),
	filename: text().notNull(),
	processorId: integer("processor_id"),
	month: text().notNull(),
	type: text().notNull(),
	recordsProcessed: integer("records_processed").default(0),
	status: text().default('pending').notNull(),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow().notNull(),
	errorMessage: text("error_message"),
	validationResults: jsonb("validation_results"),
	agencyId: integer("agency_id"),
}, (table) => [
	foreignKey({
			columns: [table.processorId],
			foreignColumns: [processors.id],
			name: "file_uploads_processor_id_processors_id_fk"
		}),
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [agencies.id],
			name: "file_uploads_agency_id_fkey"
		}),
]);

export const agencies = pgTable("agencies", {
	id: serial().primaryKey().notNull(),
	companyName: varchar("company_name", { length: 255 }).notNull(),
	contactName: varchar("contact_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }),
	website: varchar({ length: 255 }),
	industry: varchar({ length: 100 }),
	isWhitelabel: boolean("is_whitelabel").default(false),
	domainType: varchar("domain_type", { length: 20 }).default('standard'),
	customDomain: varchar("custom_domain", { length: 255 }),
	subdomainPrefix: varchar("subdomain_prefix", { length: 100 }),
	domainStatus: varchar("domain_status", { length: 20 }).default('pending'),
	sslStatus: varchar("ssl_status", { length: 20 }).default('pending'),
	dnsProvider: varchar("dns_provider", { length: 100 }),
	nameservers: jsonb().default([]),
	emailProvider: varchar("email_provider", { length: 50 }).default('isohub_smtp'),
	smtpHost: varchar("smtp_host", { length: 255 }),
	smtpPort: integer("smtp_port"),
	smtpUsername: varchar("smtp_username", { length: 255 }),
	smtpPassword: varchar("smtp_password", { length: 255 }),
	fromEmailAddress: varchar("from_email_address", { length: 255 }),
	fromDisplayName: varchar("from_display_name", { length: 255 }),
	primaryColor: varchar("primary_color", { length: 7 }).default('#FFD700'),
	secondaryColor: varchar("secondary_color", { length: 7 }).default('#000000'),
	accentColor: varchar("accent_color", { length: 7 }).default('#FFFFFF'),
	logoUrl: varchar("logo_url", { length: 500 }),
	description: text(),
	status: varchar({ length: 20 }).default('setup'),
	adminUsername: varchar("admin_username", { length: 100 }).notNull(),
	tempPassword: varchar("temp_password", { length: 255 }),
	welcomeEmailSent: boolean("welcome_email_sent").default(false),
	passwordEmailSent: boolean("password_email_sent").default(false),
	emailDeliveryTracking: jsonb("email_delivery_tracking"),
	settings: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	activationToken: varchar("activation_token", { length: 100 }),
	tokenExpiry: timestamp("token_expiry", { mode: 'string' }),
	onboardingCompleted: boolean("onboarding_completed").default(false),
	onboardingCompletedAt: timestamp("onboarding_completed_at", { mode: 'string' }),
});

export const masterDataset = pgTable("master_dataset", {
	id: serial().primaryKey().notNull(),
	mid: text().notNull(),
	merchantName: text("merchant_name").notNull(),
	month: text().notNull(),
	totalRevenue: numeric("total_revenue", { precision: 12, scale:  2 }).default('0'),
	processor: text(),
	leadSheetUsers: text("lead_sheet_users"),
	assignmentStatus: text("assignment_status").default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	agencyId: integer("agency_id"),
}, (table) => [
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [agencies.id],
			name: "master_dataset_agency_id_fkey"
		}),
	unique("master_dataset_mid_month_key").on(table.mid, table.month),
]);

export const masterLeadSheets = pgTable("master_lead_sheets", {
	id: serial().primaryKey().notNull(),
	fileName: text("file_name").notNull(),
	uploadDate: timestamp("upload_date", { mode: 'string' }).defaultNow().notNull(),
	month: text().notNull(),
	totalRecords: integer("total_records").default(0),
	newMerchants: integer("new_merchants").default(0),
	reappearingMerchants: integer("reappearing_merchants").default(0),
	processedBy: integer("processed_by"),
	status: varchar({ length: 20 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.processedBy],
			foreignColumns: [users.id],
			name: "master_lead_sheets_processed_by_fkey"
		}),
]);

export const midRoleAssignments = pgTable("mid_role_assignments", {
	id: serial().primaryKey().notNull(),
	mid: text().notNull(),
	merchantName: text("merchant_name").notNull(),
	agent: text(),
	agentPercentage: numeric("agent_percentage", { precision: 5, scale:  2 }),
	partner: text(),
	partnerPercentage: numeric("partner_percentage", { precision: 5, scale:  2 }),
	salesManager: text("sales_manager"),
	salesManagerPercentage: numeric("sales_manager_percentage", { precision: 5, scale:  2 }),
	company: text(),
	companyPercentage: numeric("company_percentage", { precision: 5, scale:  2 }),
	association: text(),
	associationPercentage: numeric("association_percentage", { precision: 5, scale:  2 }),
	assignmentStatus: text("assignment_status").default('pending').notNull(),
	originalColumnI: text("original_column_i"),
	firstAssignedMonth: text("first_assigned_month"),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	agencyId: integer("agency_id"),
}, (table) => [
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [agencies.id],
			name: "mid_role_assignments_agency_id_fkey"
		}),
	unique("mid_role_assignments_mid_key").on(table.mid),
]);

export const oauthStates = pgTable("oauth_states", {
	nonce: varchar({ length: 64 }).primaryKey().notNull(),
	agencyId: integer("agency_id").notNull(),
	userId: integer("user_id").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	consumed: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const agencyOauthCredentials = pgTable("agency_oauth_credentials", {
	id: serial().primaryKey().notNull(),
	agencyId: integer("agency_id").notNull(),
	provider: varchar({ length: 20 }).notNull(),
	clientId: text("client_id"),
	clientSecret: text("client_secret"),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	tokenType: varchar("token_type", { length: 20 }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	scope: text(),
	isActive: boolean("is_active").default(true),
	isConnected: boolean("is_connected").default(false),
	lastConnected: timestamp("last_connected", { mode: 'string' }),
	lastRefreshed: timestamp("last_refreshed", { mode: 'string' }),
	userId: text("user_id"),
	userName: text("user_name"),
	userEmail: text("user_email"),
	lastError: text("last_error"),
	errorCount: integer("error_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [agencies.id],
			name: "agency_oauth_credentials_agency_id_fkey"
		}),
	unique("agency_oauth_credentials_agency_id_provider_key").on(table.agencyId, table.provider),
	check("agency_oauth_credentials_provider_check", sql`(provider)::text = ANY ((ARRAY['dropbox'::character varying, 'onedrive'::character varying, 'google_drive'::character varying])::text[])`),
]);

export const roleAssignmentWorkflow = pgTable("role_assignment_workflow", {
	id: serial().primaryKey().notNull(),
	mid: text().notNull(),
	userId: text("user_id").notNull(),
	roleType: text("role_type").notNull(),
	percentage: numeric({ precision: 5, scale:  2 }).notNull(),
	assignedBy: text("assigned_by").notNull(),
	status: text().default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	agencyId: integer("agency_id"),
}, (table) => [
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [agencies.id],
			name: "role_assignment_workflow_agency_id_fkey"
		}),
]);

export const uploadProgress = pgTable("upload_progress", {
	id: serial().primaryKey().notNull(),
	month: text().notNull(),
	processorId: integer("processor_id"),
	processorName: text("processor_name").notNull(),
	uploadStatus: text("upload_status").default('needs_upload'),
	leadSheetStatus: text("lead_sheet_status").default('needs_upload'),
	compilationStatus: text("compilation_status").default('pending'),
	assignmentStatus: text("assignment_status").default('pending'),
	auditStatus: text("audit_status").default('pending'),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
	recordCount: integer("record_count").default(0),
	fileName: text("file_name"),
	fileSize: integer("file_size"),
	agencyId: integer("agency_id"),
}, (table) => [
	foreignKey({
			columns: [table.processorId],
			foreignColumns: [processors.id],
			name: "upload_progress_processor_id_fkey"
		}),
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [agencies.id],
			name: "upload_progress_agency_id_fkey"
		}),
	unique("upload_progress_month_processor_id_key").on(table.month, table.processorId),
]);

export const auditIssues = pgTable("audit_issues", {
	id: serial().primaryKey().notNull(),
	merchantId: integer("merchant_id").notNull(),
	month: text().notNull(),
	issueType: text("issue_type").notNull(),
	description: text().notNull(),
	priority: text().notNull(),
	status: text().default('open').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	agencyId: integer("agency_id"),
}, (table) => [
	foreignKey({
			columns: [table.merchantId],
			foreignColumns: [merchants.id],
			name: "audit_issues_merchant_id_merchants_id_fk"
		}),
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [agencies.id],
			name: "audit_issues_agency_id_fkey"
		}),
]);

export const noMidDeclarations = pgTable("no_mid_declarations", {
	id: serial().primaryKey().notNull(),
	processorId: integer("processor_id").notNull(),
	month: text().notNull(),
	declaredBy: text("declared_by").notNull(),
	reason: text(),
	declaredAt: timestamp("declared_at", { mode: 'string' }).defaultNow(),
	agencyId: integer("agency_id"),
}, (table) => [
	foreignKey({
			columns: [table.processorId],
			foreignColumns: [processors.id],
			name: "no_mid_declarations_processor_id_fkey"
		}),
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [agencies.id],
			name: "no_mid_declarations_agency_id_fkey"
		}),
	unique("no_mid_declarations_processor_id_month_key").on(table.processorId, table.month),
]);

export const userAgencies = pgTable("user_agencies", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	agencyId: integer("agency_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_agencies_user_id_fkey"
		}),
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [agencies.id],
			name: "user_agencies_agency_id_fkey"
		}),
	unique("user_agencies_user_id_agency_id_key").on(table.userId, table.agencyId),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	token: varchar({ length: 100 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	used: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_reset_tokens_user_id_fkey"
		}).onDelete("cascade"),
	unique("password_reset_tokens_token_key").on(table.token),
]);

export const mtAgencies = pgTable("mt_agencies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 100 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	website: varchar({ length: 255 }),
	logoUrl: varchar("logo_url", { length: 500 }),
	status: agencyStatus().default('active'),
	subscriptionTier: subscriptionTier("subscription_tier").default('starter'),
	settings: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("mt_agencies_slug_key").on(table.slug),
]);

export const mtMonthlyData = pgTable("mt_monthly_data", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	agencyId: uuid("agency_id").notNull(),
	subaccountId: uuid("subaccount_id"),
	merchantId: uuid("merchant_id"),
	processorId: uuid("processor_id"),
	month: integer().notNull(),
	year: integer().notNull(),
	volume: numeric({ precision: 15, scale:  2 }).default('0'),
	transactions: integer().default(0),
	totalRevenue: numeric("total_revenue", { precision: 15, scale:  2 }).default('0'),
	netRevenue: numeric("net_revenue", { precision: 15, scale:  2 }).default('0'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_mt_monthly_data_agency").using("btree", table.agencyId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [mtAgencies.id],
			name: "mt_monthly_data_agency_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subaccountId],
			foreignColumns: [mtSubaccounts.id],
			name: "mt_monthly_data_subaccount_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.merchantId],
			foreignColumns: [mtMerchants.id],
			name: "mt_monthly_data_merchant_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.processorId],
			foreignColumns: [mtProcessors.id],
			name: "mt_monthly_data_processor_id_fkey"
		}).onDelete("set null"),
]);

export const mtAuditLogs = pgTable("mt_audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	agencyId: uuid("agency_id").notNull(),
	subaccountId: uuid("subaccount_id"),
	userId: varchar("user_id", { length: 100 }),
	action: auditAction().notNull(),
	resourceType: varchar("resource_type", { length: 100 }).notNull(),
	resourceId: varchar("resource_id", { length: 100 }),
	previousValues: jsonb("previous_values"),
	newValues: jsonb("new_values"),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_mt_audit_logs_agency").using("btree", table.agencyId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [mtAgencies.id],
			name: "mt_audit_logs_agency_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subaccountId],
			foreignColumns: [mtSubaccounts.id],
			name: "mt_audit_logs_subaccount_id_fkey"
		}).onDelete("set null"),
]);

export const mtSubaccounts = pgTable("mt_subaccounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	agencyId: uuid("agency_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	settings: jsonb().default({}),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_mt_subaccounts_agency").using("btree", table.agencyId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [mtAgencies.id],
			name: "mt_subaccounts_agency_id_fkey"
		}).onDelete("cascade"),
]);

export const mtUsers = pgTable("mt_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	agencyId: uuid("agency_id").notNull(),
	subaccountId: uuid("subaccount_id"),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	role: userRole().default('viewer'),
	permissions: jsonb().default([]),
	isActive: boolean("is_active").default(true),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_mt_users_agency").using("btree", table.agencyId.asc().nullsLast().op("uuid_ops")),
	index("idx_mt_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [mtAgencies.id],
			name: "mt_users_agency_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subaccountId],
			foreignColumns: [mtSubaccounts.id],
			name: "mt_users_subaccount_id_fkey"
		}).onDelete("set null"),
	unique("mt_users_email_key").on(table.email),
]);

export const mtProcessors = pgTable("mt_processors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	agencyId: uuid("agency_id").notNull(),
	subaccountId: uuid("subaccount_id"),
	name: varchar({ length: 255 }).notNull(),
	isActive: boolean("is_active").default(true),
	settings: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [mtAgencies.id],
			name: "mt_processors_agency_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subaccountId],
			foreignColumns: [mtSubaccounts.id],
			name: "mt_processors_subaccount_id_fkey"
		}).onDelete("set null"),
]);

export const mtMerchants = pgTable("mt_merchants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	agencyId: uuid("agency_id").notNull(),
	subaccountId: uuid("subaccount_id"),
	processorId: uuid("processor_id"),
	mid: varchar({ length: 100 }),
	dbaName: varchar("dba_name", { length: 255 }),
	legalName: varchar("legal_name", { length: 255 }),
	status: merchantStatus().default('active'),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_mt_merchants_agency").using("btree", table.agencyId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [mtAgencies.id],
			name: "mt_merchants_agency_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subaccountId],
			foreignColumns: [mtSubaccounts.id],
			name: "mt_merchants_subaccount_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.processorId],
			foreignColumns: [mtProcessors.id],
			name: "mt_merchants_processor_id_fkey"
		}).onDelete("set null"),
]);
