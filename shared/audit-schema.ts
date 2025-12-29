import { pgTable, text, varchar, integer, timestamp, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Monthly Audit Tracking Table
export const monthlyAudits = pgTable("monthly_audits", {
  id: varchar("id").primaryKey().notNull(),
  processor: varchar("processor").notNull(),
  month: varchar("month").notNull(), // Format: "2025-05"
  year: integer("year").notNull(),
  status: varchar("status", { enum: ['needs_upload', 'uploaded', 'verified', 'error', 'corrected'] }).notNull().default('needs_upload'),
  uploadDate: timestamp("upload_date"),
  verificationDate: timestamp("verification_date"),
  recordCount: integer("record_count").default(0),
  expectedRecords: integer("expected_records"),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default('0.00'),
  expectedRevenue: decimal("expected_revenue", { precision: 12, scale: 2 }),
  discrepancies: jsonb("discrepancies"), // Array of validation errors
  userCorrections: jsonb("user_corrections"), // User edits to fix errors
  auditNotes: text("audit_notes"),
  verifiedBy: varchar("verified_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Data Validation Errors Table
export const validationErrors = pgTable("validation_errors", {
  id: varchar("id").primaryKey().notNull(),
  auditId: varchar("audit_id").notNull(),
  errorType: varchar("error_type").notNull(), // 'missing_field', 'invalid_format', 'duplicate_record', 'amount_mismatch'
  severity: varchar("severity", { enum: ['error', 'warning', 'info'] }).notNull(),
  fieldName: varchar("field_name"),
  expectedValue: text("expected_value"),
  actualValue: text("actual_value"),
  rowNumber: integer("row_number"),
  errorMessage: text("error_message").notNull(),
  isResolved: boolean("is_resolved").default(false),
  userCorrection: text("user_correction"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Upload Sessions Table
export const uploadSessions = pgTable("upload_sessions", {
  id: varchar("id").primaryKey().notNull(),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  processor: varchar("processor").notNull(),
  month: varchar("month").notNull(),
  fileSize: integer("file_size").notNull(),
  recordsProcessed: integer("records_processed").default(0),
  recordsValid: integer("records_valid").default(0),
  recordsInvalid: integer("records_invalid").default(0),
  validationStatus: varchar("validation_status", { enum: ['pending', 'processing', 'completed', 'failed'] }).notNull().default('pending'),
  processingStarted: timestamp("processing_started"),
  processingCompleted: timestamp("processing_completed"),
  errorSummary: jsonb("error_summary"),
  uploadedBy: varchar("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Data Corrections Table
export const userCorrections = pgTable("user_corrections", {
  id: varchar("id").primaryKey().notNull(),
  sessionId: varchar("session_id").notNull(),
  errorId: varchar("error_id").notNull(),
  fieldName: varchar("field_name").notNull(),
  originalValue: text("original_value"),
  correctedValue: text("corrected_value").notNull(),
  correctionReason: text("correction_reason"),
  appliedAt: timestamp("applied_at").defaultNow(),
  appliedBy: varchar("applied_by").notNull(),
});

// Insert and Select schemas
export const insertMonthlyAudit = createInsertSchema(monthlyAudits);
export const selectMonthlyAudit = createSelectSchema(monthlyAudits);
export const insertValidationError = createInsertSchema(validationErrors);
export const selectValidationError = createSelectSchema(validationErrors);
export const insertUploadSession = createInsertSchema(uploadSessions);
export const selectUploadSession = createSelectSchema(uploadSessions);
export const insertUserCorrection = createInsertSchema(userCorrections);
export const selectUserCorrection = createSelectSchema(userCorrections);

// Types
export type MonthlyAudit = typeof monthlyAudits.$inferSelect;
export type InsertMonthlyAudit = typeof monthlyAudits.$inferInsert;
export type ValidationError = typeof validationErrors.$inferSelect;
export type InsertValidationError = typeof validationErrors.$inferInsert;
export type UploadSession = typeof uploadSessions.$inferSelect;
export type InsertUploadSession = typeof uploadSessions.$inferInsert;
export type UserCorrection = typeof userCorrections.$inferSelect;
export type InsertUserCorrection = typeof userCorrections.$inferInsert;

// Validation schemas for frontend
export const monthlyAuditValidation = z.object({
  processor: z.string().min(1, "Processor is required"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  year: z.number().min(2020).max(2030),
  expectedRecords: z.number().min(0).optional(),
  expectedRevenue: z.string().optional(),
  auditNotes: z.string().optional(),
});

export const correctionValidation = z.object({
  fieldName: z.string().min(1, "Field name is required"),
  correctedValue: z.string().min(1, "Corrected value is required"),
  correctionReason: z.string().optional(),
});