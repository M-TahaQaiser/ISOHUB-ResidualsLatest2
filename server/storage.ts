import { 
  users, processors, merchants, monthlyData, roles, assignments, 
  fileUploads, auditIssues, reports, vendors, processorColumnMappings,
  type User, type InsertUser, type Processor, type InsertProcessor,
  type Merchant, type InsertMerchant, type MonthlyData, type InsertMonthlyData,
  type Role, type InsertRole, type Assignment, type InsertAssignment,
  type FileUpload, type InsertFileUpload, type AuditIssue, type InsertAuditIssue,
  type Report, type InsertReport, type Vendor, type InsertVendor,
  type ProcessorColumnMapping, type InsertProcessorColumnMapping
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Processors
  getProcessors(): Promise<Processor[]>;
  getProcessor(id: number): Promise<Processor | undefined>;
  createProcessor(processor: InsertProcessor): Promise<Processor>;
  updateProcessor(id: number, processor: Partial<InsertProcessor>): Promise<Processor>;

  // Merchants
  getMerchants(): Promise<Merchant[]>;
  getMerchant(id: number): Promise<Merchant | undefined>;
  getMerchantByMid(mid: string): Promise<Merchant | undefined>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  updateMerchant(id: number, merchant: Partial<InsertMerchant>): Promise<Merchant>;

  // Monthly Data
  getMonthlyData(month: string): Promise<(MonthlyData & { merchant: Merchant; processor: Processor })[]>;
  getMonthlyDataByMerchant(merchantId: number, month: string): Promise<MonthlyData[]>;
  createMonthlyData(data: InsertMonthlyData): Promise<MonthlyData>;
  updateMonthlyData(id: number, data: Partial<InsertMonthlyData>): Promise<MonthlyData>;

  // Roles
  getRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;

  // Assignments
  getAssignments(month: string): Promise<(Assignment & { role: Role })[]>;
  getAssignmentsByMerchant(merchantId: number, month: string): Promise<(Assignment & { role: Role })[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment>;
  deleteAssignment(id: number): Promise<void>;

  // File Uploads
  getFileUploads(month: string): Promise<(FileUpload & { processor?: Processor })[]>;
  createFileUpload(upload: InsertFileUpload): Promise<FileUpload>;
  updateFileUpload(id: number, upload: Partial<InsertFileUpload>): Promise<FileUpload>;

  // Audit Issues
  getAuditIssues(month: string): Promise<(AuditIssue & { merchant: Merchant })[]>;
  createAuditIssue(issue: InsertAuditIssue): Promise<AuditIssue>;
  updateAuditIssue(id: number, issue: Partial<InsertAuditIssue>): Promise<AuditIssue>;

  // Reports
  getReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;

  // Vendors (Login Portal)
  getVendors(): Promise<Vendor[]>;
  getVendorsByCategory(category: string): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, updates: Partial<InsertVendor>): Promise<Vendor>;
  deleteVendor(id: number): Promise<void>;
  updateReport(id: number, report: Partial<InsertReport>): Promise<Report>;

  // Analytics
  getMonthlyStats(month: string): Promise<{
    totalMids: number;
    totalRevenue: string;
    pendingAssignments: number;
    auditIssues: number;
  }>;

  // Processor Column Mappings
  getProcessorColumnMappings(organizationId: string): Promise<ProcessorColumnMapping[]>;
  getProcessorColumnMapping(organizationId: string, processorId: number): Promise<ProcessorColumnMapping | undefined>;
  createProcessorColumnMapping(mapping: InsertProcessorColumnMapping): Promise<ProcessorColumnMapping>;
  updateProcessorColumnMapping(id: number, mapping: Partial<InsertProcessorColumnMapping>): Promise<ProcessorColumnMapping>;
  deleteProcessorColumnMapping(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProcessors(): Promise<Processor[]> {
    return await db.select().from(processors).where(eq(processors.isActive, true)).orderBy(processors.name);
  }

  async getProcessor(id: number): Promise<Processor | undefined> {
    const [processor] = await db.select().from(processors).where(eq(processors.id, id));
    return processor || undefined;
  }

  async createProcessor(processor: InsertProcessor): Promise<Processor> {
    const [newProcessor] = await db.insert(processors).values(processor).returning();
    return newProcessor;
  }

  async updateProcessor(id: number, processor: Partial<InsertProcessor>): Promise<Processor> {
    const [updated] = await db.update(processors).set(processor).where(eq(processors.id, id)).returning();
    return updated;
  }

  async getMerchants(): Promise<Merchant[]> {
    return await db.select().from(merchants).orderBy(merchants.dba);
  }

  async getMerchant(id: number): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
    return merchant || undefined;
  }

  async getMerchantByMid(mid: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.mid, mid));
    return merchant || undefined;
  }

  async createMerchant(merchant: InsertMerchant): Promise<Merchant> {
    const [newMerchant] = await db.insert(merchants).values(merchant).returning();
    return newMerchant;
  }

  async updateMerchant(id: number, merchant: Partial<InsertMerchant>): Promise<Merchant> {
    const [updated] = await db.update(merchants).set(merchant).where(eq(merchants.id, id)).returning();
    return updated;
  }

  async getMonthlyData(month: string, agencyId?: number): Promise<(MonthlyData & { merchant: Merchant; processor: Processor })[]> {
    const conditions = [eq(monthlyData.month, month)];
    if (agencyId !== undefined) {
      conditions.push(eq(monthlyData.agencyId, agencyId));
    }
    
    return await db
      .select()
      .from(monthlyData)
      .innerJoin(merchants, eq(monthlyData.merchantId, merchants.id))
      .innerJoin(processors, eq(monthlyData.processorId, processors.id))
      .where(and(...conditions))
      .orderBy(desc(monthlyData.net));
  }

  async getMonthlyDataByMerchant(merchantId: number, month: string): Promise<MonthlyData[]> {
    return await db
      .select()
      .from(monthlyData)
      .where(and(eq(monthlyData.merchantId, merchantId), eq(monthlyData.month, month)));
  }

  async createMonthlyData(data: InsertMonthlyData): Promise<MonthlyData> {
    const [newData] = await db.insert(monthlyData).values(data).returning();
    return newData;
  }

  async updateMonthlyData(id: number, data: Partial<InsertMonthlyData>): Promise<MonthlyData> {
    const [updated] = await db.update(monthlyData).set(data).where(eq(monthlyData.id, id)).returning();
    return updated;
  }

  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).where(eq(roles.isActive, true)).orderBy(roles.type, roles.name);
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async getAssignments(month: string): Promise<(Assignment & { role: Role })[]> {
    return await db
      .select()
      .from(assignments)
      .innerJoin(roles, eq(assignments.roleId, roles.id))
      .where(eq(assignments.month, month))
      .orderBy(assignments.merchantId);
  }

  async getAssignmentsByMerchant(merchantId: number, month: string): Promise<(Assignment & { role: Role })[]> {
    return await db
      .select()
      .from(assignments)
      .innerJoin(roles, eq(assignments.roleId, roles.id))
      .where(and(eq(assignments.merchantId, merchantId), eq(assignments.month, month)))
      .orderBy(assignments.roleId);
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments).values(assignment).returning();
    return newAssignment;
  }

  async updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment> {
    const [updated] = await db.update(assignments).set(assignment).where(eq(assignments.id, id)).returning();
    return updated;
  }

  async deleteAssignment(id: number): Promise<void> {
    await db.delete(assignments).where(eq(assignments.id, id));
  }

  async getFileUploads(month: string): Promise<(FileUpload & { processor?: Processor })[]> {
    return await db
      .select()
      .from(fileUploads)
      .leftJoin(processors, eq(fileUploads.processorId, processors.id))
      .where(eq(fileUploads.month, month))
      .orderBy(desc(fileUploads.uploadedAt));
  }

  async createFileUpload(upload: InsertFileUpload): Promise<FileUpload> {
    const [newUpload] = await db.insert(fileUploads).values(upload).returning();
    return newUpload;
  }

  async updateFileUpload(id: number, upload: Partial<InsertFileUpload>): Promise<FileUpload> {
    const [updated] = await db.update(fileUploads).set(upload).where(eq(fileUploads.id, id)).returning();
    return updated;
  }

  async getAuditIssues(month: string): Promise<(AuditIssue & { merchant: Merchant })[]> {
    return await db
      .select()
      .from(auditIssues)
      .innerJoin(merchants, eq(auditIssues.merchantId, merchants.id))
      .where(eq(auditIssues.month, month))
      .orderBy(desc(auditIssues.createdAt));
  }

  async createAuditIssue(issue: InsertAuditIssue): Promise<AuditIssue> {
    const [newIssue] = await db.insert(auditIssues).values(issue).returning();
    return newIssue;
  }

  async updateAuditIssue(id: number, issue: Partial<InsertAuditIssue>): Promise<AuditIssue> {
    const [updated] = await db.update(auditIssues).set(issue).where(eq(auditIssues.id, id)).returning();
    return updated;
  }

  async getReports(): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.isActive, true)).orderBy(desc(reports.createdAt));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async updateReport(id: number, report: Partial<InsertReport>): Promise<Report> {
    const [updated] = await db.update(reports).set(report).where(eq(reports.id, id)).returning();
    return updated;
  }

  async getMonthlyStats(month: string): Promise<{
    totalMids: number;
    totalRevenue: string;
    pendingAssignments: number;
    auditIssues: number;
  }> {
    const [stats] = await db
      .select({
        totalMids: sql<number>`count(distinct ${monthlyData.merchantId})`,
        totalRevenue: sql<string>`sum(${monthlyData.net})`,
      })
      .from(monthlyData)
      .where(eq(monthlyData.month, month));

    const [assignmentStats] = await db
      .select({
        pendingAssignments: sql<number>`count(distinct ${monthlyData.merchantId})`,
      })
      .from(monthlyData)
      .leftJoin(assignments, and(
        eq(monthlyData.merchantId, assignments.merchantId),
        eq(monthlyData.month, assignments.month)
      ))
      .where(and(eq(monthlyData.month, month), sql`${assignments.id} IS NULL`));

    const [auditStats] = await db
      .select({
        auditIssues: sql<number>`count(*)`,
      })
      .from(auditIssues)
      .where(and(eq(auditIssues.month, month), eq(auditIssues.status, 'open')));

    return {
      totalMids: stats.totalMids || 0,
      totalRevenue: stats.totalRevenue || "0",
      pendingAssignments: assignmentStats.pendingAssignments || 0,
      auditIssues: auditStats.auditIssues || 0,
    };
  }

  // Vendors (Login Portal)
  async getVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).where(eq(vendors.isActive, true)).orderBy(vendors.category, vendors.name);
  }

  async getVendorsByCategory(category: string): Promise<Vendor[]> {
    return await db.select().from(vendors).where(
      and(eq(vendors.category, category), eq(vendors.isActive, true))
    ).orderBy(vendors.name);
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [created] = await db.insert(vendors).values(vendor).returning();
    return created;
  }

  async updateVendor(id: number, updates: Partial<InsertVendor>): Promise<Vendor> {
    const [updated] = await db.update(vendors).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(vendors.id, id)).returning();
    return updated;
  }

  async deleteVendor(id: number): Promise<void> {
    await db.delete(vendors).where(eq(vendors.id, id));
  }

  // Processor Column Mappings
  async getProcessorColumnMappings(organizationId: string): Promise<ProcessorColumnMapping[]> {
    return await db.select()
      .from(processorColumnMappings)
      .where(eq(processorColumnMappings.organizationId, organizationId))
      .orderBy(processorColumnMappings.processorName);
  }

  async getProcessorColumnMapping(organizationId: string, processorId: number): Promise<ProcessorColumnMapping | undefined> {
    const [mapping] = await db.select()
      .from(processorColumnMappings)
      .where(and(
        eq(processorColumnMappings.organizationId, organizationId),
        eq(processorColumnMappings.processorId, processorId),
        eq(processorColumnMappings.isDefault, true)
      ));
    return mapping || undefined;
  }

  async createProcessorColumnMapping(mapping: InsertProcessorColumnMapping): Promise<ProcessorColumnMapping> {
    const [created] = await db.insert(processorColumnMappings).values(mapping).returning();
    return created;
  }

  async updateProcessorColumnMapping(id: number, mapping: Partial<InsertProcessorColumnMapping>): Promise<ProcessorColumnMapping> {
    const [updated] = await db.update(processorColumnMappings)
      .set({ ...mapping, updatedAt: new Date() })
      .where(eq(processorColumnMappings.id, id))
      .returning();
    return updated;
  }

  async deleteProcessorColumnMapping(id: number): Promise<void> {
    await db.delete(processorColumnMappings).where(eq(processorColumnMappings.id, id));
  }
}

export const storage = new DatabaseStorage();
