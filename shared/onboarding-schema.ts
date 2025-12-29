import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { agencies } from "./schema";

// Organizations table for multi-tenant system
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").unique().notNull(),
  name: text("name").notNull(),
  website: varchar("website", { length: 255 }),
  adminContactName: varchar("admin_contact_name", { length: 255 }).notNull(),
  adminContactEmail: varchar("admin_contact_email", { length: 255 }).notNull(),
  adminContactPhone: varchar("admin_contact_phone", { length: 50 }),
  
  // Multi-tenancy bridge - links organization to agency for residuals data
  agencyId: integer("agency_id").references(() => agencies.id),
  
  // Branding and customization
  primaryColor: varchar("primary_color", { length: 7 }).default('#FFD700'),
  secondaryColor: varchar("secondary_color", { length: 7 }).default('#000000'),
  accentColor: varchar("accent_color", { length: 7 }).default('#FFFFFF'),
  logoUrl: varchar("logo_url", { length: 500 }),
  
  // Domain and email configuration
  domainType: varchar("domain_type", { 
    length: 20,
    enum: ["standard", "custom_domain", "subdomain"] 
  }).default("standard"),
  customDomain: varchar("custom_domain", { length: 255 }),
  subdomainPrefix: varchar("subdomain_prefix", { length: 100 }),
  
  // Business information
  industry: varchar("industry", { length: 100 }),
  businessProfile: jsonb("business_profile"), // AI-generated business profile
  
  // System configuration
  settings: jsonb("settings").default({}),
  status: varchar("status", { 
    length: 20,
    enum: ["setup", "onboarding", "active", "inactive", "suspended"]
  }).default("setup"),
  
  // Welcome email tracking
  welcomeEmailSent: boolean("welcome_email_sent").default(false),
  activationToken: varchar("activation_token", { length: 255 }),
  tokenExpiry: timestamp("token_expiry"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Onboarding progress tracking
export const onboardingProgress = pgTable("onboarding_progress", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.organizationId),
  
  // Onboarding steps completion
  step1Complete: boolean("step1_complete").default(false), // Instance Setup
  step2Complete: boolean("step2_complete").default(false), // Company Info
  step3Complete: boolean("step3_complete").default(false), // Org Chart
  step4Complete: boolean("step4_complete").default(false), // Business Profile
  step5Complete: boolean("step5_complete").default(false), // Vendor Selection
  step6Complete: boolean("step6_complete").default(false), // Docs Hub Integration
  step7Complete: boolean("step7_complete").default(false), // Dashboard Tour
  
  // Step data storage
  instanceData: jsonb("instance_data"),
  companyData: jsonb("company_data"),
  orgChartData: jsonb("org_chart_data"),
  businessProfileData: jsonb("business_profile_data"),
  vendorSelectionData: jsonb("vendor_selection_data"),
  docsHubData: jsonb("docs_hub_data"),
  tourData: jsonb("tour_data"),
  
  // Progress tracking
  currentStep: integer("current_step").default(1),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User activation and password management
export const userActivations = pgTable("user_activations", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.organizationId),
  email: varchar("email", { length: 255 }).notNull(),
  
  // Activation tokens
  activationToken: varchar("activation_token", { length: 255 }).notNull(),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  
  // Expiry management
  activationExpiry: timestamp("activation_expiry").notNull(),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  
  // Status tracking
  isActivated: boolean("is_activated").default(false),
  activatedAt: timestamp("activated_at"),
  passwordChanged: boolean("password_changed").default(false),
  passwordChangedAt: timestamp("password_changed_at"),
  
  // User details for first-time setup
  tempPassword: varchar("temp_password", { length: 255 }), // Encrypted
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  role: varchar("role", { length: 50 }).default("Admin"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Selected vendors for each organization
export const organizationVendors = pgTable("organization_vendors", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.organizationId),
  vendorId: integer("vendor_id").notNull(), // References vendors table
  category: varchar("category", { 
    length: 50,
    enum: ["Processors", "Gateways", "Hardware/Equipment", "Internal"]
  }).notNull(),
  
  // Selection metadata
  selectedAt: timestamp("selected_at").defaultNow().notNull(),
  configurationData: jsonb("configuration_data"), // Vendor-specific config
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Document hub integrations
export const documentIntegrations = pgTable("document_integrations", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.organizationId),
  
  // Integration type and credentials
  provider: varchar("provider", { 
    length: 50,
    enum: ["google_drive", "onedrive", "sharepoint", "dropbox", "manual"]
  }).notNull(),
  
  // OAuth data (encrypted)
  accessToken: text("access_token"), // Encrypted
  refreshToken: text("refresh_token"), // Encrypted
  tokenExpiry: timestamp("token_expiry"),
  
  // Integration metadata
  integrationData: jsonb("integration_data"), // Provider-specific data
  syncEnabled: boolean("sync_enabled").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  
  status: varchar("status", { 
    length: 20,
    enum: ["connected", "disconnected", "error", "pending"]
  }).default("pending"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Dashboard tour completion tracking
export const dashboardTours = pgTable("dashboard_tours", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.organizationId),
  userId: integer("user_id").notNull(), // References users table
  
  // Tour completion status
  tourCompleted: boolean("tour_completed").default(false),
  completedSteps: jsonb("completed_steps").default([]), // Array of completed step IDs
  
  // Tour customization
  tourType: varchar("tour_type", { 
    length: 50,
    enum: ["admin", "user", "manager", "custom"]
  }).default("admin"),
  
  completedAt: timestamp("completed_at"),
  skippedAt: timestamp("skipped_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  onboardingProgress: many(onboardingProgress),
  userActivations: many(userActivations),
  organizationVendors: many(organizationVendors),
  documentIntegrations: many(documentIntegrations),
  dashboardTours: many(dashboardTours),
}));

export const onboardingProgressRelations = relations(onboardingProgress, ({ one }) => ({
  organization: one(organizations, {
    fields: [onboardingProgress.organizationId],
    references: [organizations.organizationId],
  }),
}));

// Zod schemas for validation
export const insertOrganizationSchema = createInsertSchema(organizations);
export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress);
export const insertUserActivationSchema = createInsertSchema(userActivations);
export const insertOrganizationVendorSchema = createInsertSchema(organizationVendors);
export const insertDocumentIntegrationSchema = createInsertSchema(documentIntegrations);
export const insertDashboardTourSchema = createInsertSchema(dashboardTours);

// TypeScript types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = typeof onboardingProgress.$inferInsert;
export type UserActivation = typeof userActivations.$inferSelect;
export type InsertUserActivation = typeof userActivations.$inferInsert;
export type OrganizationVendor = typeof organizationVendors.$inferSelect;
export type InsertOrganizationVendor = typeof organizationVendors.$inferInsert;
export type DocumentIntegration = typeof documentIntegrations.$inferSelect;
export type InsertDocumentIntegration = typeof documentIntegrations.$inferInsert;
export type DashboardTour = typeof dashboardTours.$inferSelect;
export type InsertDashboardTour = typeof dashboardTours.$inferInsert;

// Extended schemas for forms
export const createOrganizationSchema = insertOrganizationSchema
  .omit({ 
    id: true, 
    organizationId: true, 
    activationToken: true, 
    tokenExpiry: true,
    welcomeEmailSent: true,
    createdAt: true,
    updatedAt: true,
    status: true,
    settings: true,
    primaryColor: true,
    secondaryColor: true,
    accentColor: true,
    logoUrl: true,
    domainType: true,
    customDomain: true,
    subdomainPrefix: true,
    businessProfile: true
  })
  .extend({
    adminContactEmail: z.string().email("Please enter a valid email address"),
    name: z.string().min(1, "Organization name is required"),
    adminContactName: z.string().min(1, "Admin contact name is required"),
  });

export const activateUserSchema = z.object({
  token: z.string().min(1, "Activation token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const onboardingStepSchema = z.object({
  step: z.number().min(1).max(7),
  data: z.record(z.any()),
});