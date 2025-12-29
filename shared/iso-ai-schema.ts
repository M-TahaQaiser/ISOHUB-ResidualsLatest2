import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ISO-AI specific tables
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(), // org-86f76df1
  name: text("name").notNull(),
  type: text("type").notNull().default("iso"), // iso, merchant, partner
  isActive: boolean("is_active").notNull().default(true),
  settings: jsonb("settings").default('{}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agents = pgTable("agents", {
  id: text("id").primaryKey(), // agent-uuid
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role", { 
    enum: ["SuperAdmin", "Admin", "Manager", "Team Leaders", "Users/Reps", "Team Member", "Partners"] 
  }).notNull().default("Users/Reps"),
  isActive: boolean("is_active").notNull().default(true),
  agentId: text("agent_id"), // External agent ID for integrations
  teamId: text("team_id"),
  managerId: text("manager_id").references(() => agents.id),
  settings: jsonb("settings").default('{}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const merchants = pgTable("iso_merchants", {
  id: text("id").primaryKey(), // merchant-uuid
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  agentId: text("agent_id").references(() => agents.id),
  businessName: text("business_name").notNull(),
  dba: text("dba"),
  merchantId: text("merchant_id"), // External merchant ID
  status: text("status", {
    enum: ["active", "inactive", "pending", "suspended", "closed"]
  }).notNull().default("pending"),
  industry: text("industry"),
  processingVolume: decimal("processing_volume", { precision: 12, scale: 2 }),
  monthlyVolume: decimal("monthly_volume", { precision: 12, scale: 2 }),
  averageTicket: decimal("average_ticket", { precision: 12, scale: 2 }),
  address: jsonb("address").default('{}'),
  contactInfo: jsonb("contact_info").default('{}'),
  settings: jsonb("settings").default('{}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reports = pgTable("iso_reports", {
  id: text("id").primaryKey(), // report-uuid
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  agentId: text("agent_id").references(() => agents.id),
  merchantId: text("merchant_id").references(() => merchants.id),
  reportType: text("report_type", {
    enum: ["monthly", "quarterly", "annual", "custom", "commission", "residual"]
  }).notNull(),
  month: text("month"), // 2025-07
  year: integer("year"),
  status: text("status", {
    enum: ["draft", "pending", "approved", "rejected", "completed"]
  }).notNull().default("draft"),
  data: jsonb("data").notNull().default('{}'),
  metrics: jsonb("metrics").default('{}'),
  approvedBy: text("approved_by").references(() => agents.id),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const commissions = pgTable("commissions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  agentId: text("agent_id").references(() => agents.id).notNull(),
  merchantId: text("merchant_id").references(() => merchants.id),
  reportId: text("report_id").references(() => reports.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  type: text("type", {
    enum: ["upfront", "residual", "bonus", "override", "split"]
  }).notNull(),
  status: text("status", {
    enum: ["pending", "approved", "paid", "disputed"]
  }).notNull().default("pending"),
  period: text("period"), // 2025-07
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  leaderId: text("leader_id").references(() => agents.id),
  isActive: boolean("is_active").notNull().default(true),
  settings: jsonb("settings").default('{}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id).notNull(),
  agentId: text("agent_id").references(() => agents.id),
  type: text("type").notNull(), // login, report_created, merchant_added, etc.
  description: text("description").notNull(),
  entityType: text("entity_type"), // merchant, report, agent, etc.
  entityId: text("entity_id"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  agents: many(agents),
  merchants: many(merchants),
  reports: many(reports),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [agents.organizationId],
    references: [organizations.id],
  }),
  manager: one(agents, {
    fields: [agents.managerId],
    references: [agents.id],
  }),
  merchants: many(merchants),
  reports: many(reports),
  commissions: many(commissions),
}));

export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [merchants.organizationId],
    references: [organizations.id],
  }),
  agent: one(agents, {
    fields: [merchants.agentId],
    references: [agents.id],
  }),
  reports: many(reports),
  commissions: many(commissions),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [reports.organizationId],
    references: [organizations.id],
  }),
  agent: one(agents, {
    fields: [reports.agentId],
    references: [agents.id],
  }),
  merchant: one(merchants, {
    fields: [reports.merchantId],
    references: [merchants.id],
  }),
  approver: one(agents, {
    fields: [reports.approvedBy],
    references: [agents.id],
  }),
  commissions: many(commissions),
}));

// Zod schemas
export const insertOrganizationSchema = createInsertSchema(organizations);
export const insertAgentSchema = createInsertSchema(agents);
export const insertMerchantSchema = createInsertSchema(merchants);
export const insertReportSchema = createInsertSchema(reports);
export const insertCommissionSchema = createInsertSchema(commissions);
export const insertTeamSchema = createInsertSchema(teams);
export const insertActivitySchema = createInsertSchema(activities);

// Types
export type Organization = typeof organizations.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type Merchant = typeof merchants.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Commission = typeof commissions.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Activity = typeof activities.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;