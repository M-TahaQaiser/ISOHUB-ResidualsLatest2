/**
 * Multi-Tenant Service
 *
 * Provides tenant-isolated database operations using the new mt_* schema.
 * All operations automatically enforce tenant boundaries via agencyId/subaccountId.
 */

import { db, setTenantContext, mtSchema } from '../db';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

// Type exports for convenience
export type MTAgency = typeof mtSchema.mtAgencies.$inferSelect;
export type MTSubaccount = typeof mtSchema.mtSubaccounts.$inferSelect;
export type MTUser = typeof mtSchema.mtUsers.$inferSelect;
export type MTProcessor = typeof mtSchema.mtProcessors.$inferSelect;
export type MTMerchant = typeof mtSchema.mtMerchants.$inferSelect;
export type MTMonthlyData = typeof mtSchema.mtMonthlyData.$inferSelect;
export type MTAuditLog = typeof mtSchema.mtAuditLogs.$inferSelect;

// Insert types
export type InsertMTAgency = typeof mtSchema.mtAgencies.$inferInsert;
export type InsertMTSubaccount = typeof mtSchema.mtSubaccounts.$inferInsert;
export type InsertMTUser = typeof mtSchema.mtUsers.$inferInsert;
export type InsertMTProcessor = typeof mtSchema.mtProcessors.$inferInsert;
export type InsertMTMerchant = typeof mtSchema.mtMerchants.$inferInsert;
export type InsertMTMonthlyData = typeof mtSchema.mtMonthlyData.$inferInsert;
export type InsertMTAuditLog = typeof mtSchema.mtAuditLogs.$inferInsert;

// Tenant context type
export interface TenantContext {
  agencyId: string;
  subaccountId?: string | null;
  userId?: number;
}

export class MultiTenantService {
  // ===========================================
  // AGENCY OPERATIONS (SuperAdmin only)
  // ===========================================

  static async createAgency(data: Omit<InsertMTAgency, 'id' | 'createdAt' | 'updatedAt'> & {
    adminEmail?: string;
    adminUsername?: string;
    adminPassword?: string;
    contactName?: string;
  }): Promise<{ agency: MTAgency; adminUser?: MTUser; tempPassword?: string }> {
    const agencyId = uuidv4();

    const [agency] = await db.insert(mtSchema.mtAgencies).values({
      ...data,
      id: agencyId,
    }).returning();

    // Log the creation
    await this.logAudit({
      agencyId: agency.id,
      userId: null,
      action: 'create',
      resourceType: 'agency',
      resourceId: agency.id,
      newValues: agency,
    });

    // Create admin user if email provided
    let adminUser: MTUser | undefined;
    let tempPassword: string | undefined;

    if (data.adminEmail || data.email) {
      const email = data.adminEmail || data.email;
      const username = data.adminUsername || data.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '_admin';
      tempPassword = data.adminPassword || this.generateSecurePassword(16);
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      const [user] = await db.insert(mtSchema.mtUsers).values({
        id: uuidv4(),
        agencyId: agency.id,
        username,
        email,
        passwordHash: hashedPassword,
        firstName: data.contactName?.split(' ')[0] || 'Admin',
        lastName: data.contactName?.split(' ').slice(1).join(' ') || '',
        role: 'agency_owner',
        isTemporaryPassword: true,
        isActive: true,
      }).returning();

      adminUser = user;

      await this.logAudit({
        agencyId: agency.id,
        userId: null,
        action: 'create',
        resourceType: 'user',
        resourceId: user.id,
        newValues: { ...user, passwordHash: '[REDACTED]' },
      });
    }

    return { agency, adminUser, tempPassword };
  }

  // Generate secure random password
  static generateSecurePassword(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  static async getAllAgencies(): Promise<MTAgency[]> {
    return db.select().from(mtSchema.mtAgencies).orderBy(desc(mtSchema.mtAgencies.createdAt));
  }

  static async getAgencyById(agencyId: string): Promise<MTAgency | null> {
    const [agency] = await db.select().from(mtSchema.mtAgencies).where(eq(mtSchema.mtAgencies.id, agencyId));
    return agency || null;
  }

  static async updateAgency(agencyId: string, updates: Partial<InsertMTAgency>): Promise<MTAgency> {
    const [existing] = await db.select().from(mtSchema.mtAgencies).where(eq(mtSchema.mtAgencies.id, agencyId));

    const [agency] = await db.update(mtSchema.mtAgencies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mtSchema.mtAgencies.id, agencyId))
      .returning();

    await this.logAudit({
      agencyId,
      action: 'update',
      resourceType: 'agency',
      resourceId: agencyId,
      previousValues: existing,
      newValues: agency,
    });

    return agency;
  }

  // ===========================================
  // SUBACCOUNT OPERATIONS (Tenant-scoped)
  // ===========================================

  static async createSubaccount(ctx: TenantContext, data: Omit<InsertMTSubaccount, 'id' | 'agencyId' | 'createdAt' | 'updatedAt'>): Promise<MTSubaccount> {
    await setTenantContext(ctx.agencyId);

    const [subaccount] = await db.insert(mtSchema.mtSubaccounts).values({
      ...data,
      id: uuidv4(),
      agencyId: ctx.agencyId,
    }).returning();

    await this.logAudit({
      agencyId: ctx.agencyId,
      subaccountId: subaccount.id,
      userId: ctx.userId,
      action: 'create',
      resourceType: 'subaccount',
      resourceId: subaccount.id,
      newValues: subaccount,
    });

    return subaccount;
  }

  static async getSubaccounts(ctx: TenantContext): Promise<MTSubaccount[]> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    return db.select().from(mtSchema.mtSubaccounts)
      .where(eq(mtSchema.mtSubaccounts.agencyId, ctx.agencyId))
      .orderBy(desc(mtSchema.mtSubaccounts.createdAt));
  }

  static async getSubaccountById(ctx: TenantContext, subaccountId: string): Promise<MTSubaccount | null> {
    await setTenantContext(ctx.agencyId, subaccountId);

    const [subaccount] = await db.select().from(mtSchema.mtSubaccounts)
      .where(and(
        eq(mtSchema.mtSubaccounts.id, subaccountId),
        eq(mtSchema.mtSubaccounts.agencyId, ctx.agencyId)
      ));

    return subaccount || null;
  }

  // ===========================================
  // USER OPERATIONS (Tenant-scoped)
  // ===========================================

  static async createUser(ctx: TenantContext, data: Omit<InsertMTUser, 'id' | 'agencyId' | 'createdAt' | 'updatedAt'> & { password: string }): Promise<MTUser> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const [user] = await db.insert(mtSchema.mtUsers).values({
      ...data,
      id: uuidv4(),
      agencyId: ctx.agencyId,
      subaccountId: ctx.subaccountId || null,
      passwordHash: hashedPassword,
    }).returning();

    await this.logAudit({
      agencyId: ctx.agencyId,
      subaccountId: ctx.subaccountId,
      userId: ctx.userId,
      action: 'create',
      resourceType: 'user',
      resourceId: user.id,
      newValues: { ...user, passwordHash: '[REDACTED]' },
    });

    return user;
  }

  static async getUsers(ctx: TenantContext): Promise<MTUser[]> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    let query = db.select().from(mtSchema.mtUsers)
      .where(eq(mtSchema.mtUsers.agencyId, ctx.agencyId));

    if (ctx.subaccountId) {
      query = query.where(eq(mtSchema.mtUsers.subaccountId, ctx.subaccountId));
    }

    return query.orderBy(desc(mtSchema.mtUsers.createdAt));
  }

  static async getUserById(ctx: TenantContext, userId: string): Promise<MTUser | null> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    const [user] = await db.select().from(mtSchema.mtUsers)
      .where(and(
        eq(mtSchema.mtUsers.id, userId),
        eq(mtSchema.mtUsers.agencyId, ctx.agencyId)
      ));

    return user || null;
  }

  static async getUserByEmail(email: string): Promise<MTUser | null> {
    const [user] = await db.select().from(mtSchema.mtUsers)
      .where(eq(mtSchema.mtUsers.email, email));
    return user || null;
  }

  // ===========================================
  // PROCESSOR OPERATIONS (Tenant-scoped)
  // ===========================================

  static async createProcessor(ctx: TenantContext, data: Omit<InsertMTProcessor, 'id' | 'agencyId' | 'createdAt' | 'updatedAt'>): Promise<MTProcessor> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    const [processor] = await db.insert(mtSchema.mtProcessors).values({
      ...data,
      id: uuidv4(),
      agencyId: ctx.agencyId,
      // Note: mtProcessors is agency-scoped only, no subaccountId
    }).returning();

    await this.logAudit({
      agencyId: ctx.agencyId,
      subaccountId: ctx.subaccountId,
      userId: ctx.userId,
      action: 'create',
      resourceType: 'processor',
      resourceId: processor.id,
      newValues: processor,
    });

    return processor;
  }

  static async getProcessors(ctx: TenantContext): Promise<MTProcessor[]> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    // Processors are agency-scoped only (no subaccountId)
    return db.select().from(mtSchema.mtProcessors)
      .where(eq(mtSchema.mtProcessors.agencyId, ctx.agencyId))
      .orderBy(mtSchema.mtProcessors.name);
  }

  static async getProcessorById(ctx: TenantContext, processorId: string): Promise<MTProcessor | null> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    const [processor] = await db.select().from(mtSchema.mtProcessors)
      .where(and(
        eq(mtSchema.mtProcessors.id, processorId),
        eq(mtSchema.mtProcessors.agencyId, ctx.agencyId)
      ));

    return processor || null;
  }

  // ===========================================
  // MERCHANT OPERATIONS (Tenant-scoped)
  // ===========================================

  static async createMerchant(ctx: TenantContext, data: Omit<InsertMTMerchant, 'id' | 'agencyId' | 'createdAt' | 'updatedAt'>): Promise<MTMerchant> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    const [merchant] = await db.insert(mtSchema.mtMerchants).values({
      ...data,
      id: uuidv4(),
      agencyId: ctx.agencyId,
      subaccountId: ctx.subaccountId || null,
    }).returning();

    await this.logAudit({
      agencyId: ctx.agencyId,
      subaccountId: ctx.subaccountId,
      userId: ctx.userId,
      action: 'create',
      resourceType: 'merchant',
      resourceId: merchant.id,
      newValues: merchant,
    });

    return merchant;
  }

  static async getMerchants(ctx: TenantContext, options?: { processorId?: string; status?: string }): Promise<MTMerchant[]> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    let conditions = [eq(mtSchema.mtMerchants.agencyId, ctx.agencyId)];

    if (ctx.subaccountId) {
      conditions.push(eq(mtSchema.mtMerchants.subaccountId, ctx.subaccountId));
    }

    if (options?.processorId) {
      conditions.push(eq(mtSchema.mtMerchants.processorId, options.processorId));
    }

    if (options?.status) {
      conditions.push(eq(mtSchema.mtMerchants.status, options.status as any));
    }

    return db.select().from(mtSchema.mtMerchants)
      .where(and(...conditions))
      .orderBy(mtSchema.mtMerchants.dba);
  }

  static async getMerchantById(ctx: TenantContext, merchantId: string): Promise<MTMerchant | null> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    const [merchant] = await db.select().from(mtSchema.mtMerchants)
      .where(and(
        eq(mtSchema.mtMerchants.id, merchantId),
        eq(mtSchema.mtMerchants.agencyId, ctx.agencyId)
      ));

    return merchant || null;
  }

  static async updateMerchant(ctx: TenantContext, merchantId: string, updates: Partial<InsertMTMerchant>): Promise<MTMerchant> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    const [existing] = await db.select().from(mtSchema.mtMerchants)
      .where(and(
        eq(mtSchema.mtMerchants.id, merchantId),
        eq(mtSchema.mtMerchants.agencyId, ctx.agencyId)
      ));

    if (!existing) {
      throw new Error('Merchant not found or access denied');
    }

    const [merchant] = await db.update(mtSchema.mtMerchants)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(mtSchema.mtMerchants.id, merchantId),
        eq(mtSchema.mtMerchants.agencyId, ctx.agencyId)
      ))
      .returning();

    await this.logAudit({
      agencyId: ctx.agencyId,
      subaccountId: ctx.subaccountId,
      userId: ctx.userId,
      action: 'update',
      resourceType: 'merchant',
      resourceId: merchantId,
      previousValues: existing,
      newValues: merchant,
    });

    return merchant;
  }

  // ===========================================
  // MONTHLY DATA OPERATIONS (Tenant-scoped)
  // ===========================================

  static async createMonthlyData(ctx: TenantContext, data: Omit<InsertMTMonthlyData, 'id' | 'agencyId' | 'createdAt' | 'updatedAt'>): Promise<MTMonthlyData> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    const [monthlyData] = await db.insert(mtSchema.mtMonthlyData).values({
      ...data,
      id: uuidv4(),
      agencyId: ctx.agencyId,
      subaccountId: ctx.subaccountId || null,
    }).returning();

    await this.logAudit({
      agencyId: ctx.agencyId,
      subaccountId: ctx.subaccountId,
      userId: ctx.userId,
      action: 'create',
      resourceType: 'monthly_data',
      resourceId: monthlyData.id,
      newValues: monthlyData,
    });

    return monthlyData;
  }

  static async getMonthlyData(ctx: TenantContext, options?: {
    merchantId?: string;
    processorId?: string;
    month?: number;  // 1-12
    year?: number;   // e.g., 2025
  }): Promise<MTMonthlyData[]> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    let conditions = [eq(mtSchema.mtMonthlyData.agencyId, ctx.agencyId)];

    if (ctx.subaccountId) {
      conditions.push(eq(mtSchema.mtMonthlyData.subaccountId, ctx.subaccountId));
    }

    if (options?.merchantId) {
      conditions.push(eq(mtSchema.mtMonthlyData.merchantId, options.merchantId));
    }

    if (options?.processorId) {
      conditions.push(eq(mtSchema.mtMonthlyData.processorId, options.processorId));
    }

    // The month column is YYYY-MM format, construct filter if month/year provided
    if (options?.month !== undefined && options?.year !== undefined) {
      const monthStr = `${options.year}-${String(options.month).padStart(2, '0')}`;
      conditions.push(eq(mtSchema.mtMonthlyData.month, monthStr));
    } else if (options?.year !== undefined) {
      // Filter by year only using LIKE
      conditions.push(sql`${mtSchema.mtMonthlyData.month} LIKE ${options.year + '-%'}`);
    }

    return db.select().from(mtSchema.mtMonthlyData)
      .where(and(...conditions))
      .orderBy(desc(mtSchema.mtMonthlyData.month));
  }

  // ===========================================
  // AUDIT LOG OPERATIONS
  // ===========================================

  static async logAudit(data: {
    agencyId: string;
    subaccountId?: string | null;
    userId?: number | null;
    action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'bulk_operation';
    resourceType: string;
    resourceId?: string;
    previousValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await db.insert(mtSchema.mtAuditLogs).values({
        id: uuidv4(),
        agencyId: data.agencyId,
        subaccountId: data.subaccountId || null,
        userId: data.userId?.toString() || null,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId || null,
        previousValues: data.previousValues || null,
        newValues: data.newValues || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw - audit log failures shouldn't break operations
    }
  }

  static async getAuditLogs(ctx: TenantContext, options?: {
    resourceType?: string;
    resourceId?: string;
    action?: string;
    limit?: number;
  }): Promise<MTAuditLog[]> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    let conditions = [eq(mtSchema.mtAuditLogs.agencyId, ctx.agencyId)];

    if (ctx.subaccountId) {
      conditions.push(eq(mtSchema.mtAuditLogs.subaccountId, ctx.subaccountId));
    }

    if (options?.resourceType) {
      conditions.push(eq(mtSchema.mtAuditLogs.resourceType, options.resourceType));
    }

    if (options?.resourceId) {
      conditions.push(eq(mtSchema.mtAuditLogs.resourceId, options.resourceId));
    }

    if (options?.action) {
      conditions.push(eq(mtSchema.mtAuditLogs.action, options.action as any));
    }

    return db.select().from(mtSchema.mtAuditLogs)
      .where(and(...conditions))
      .orderBy(desc(mtSchema.mtAuditLogs.createdAt))
      .limit(options?.limit || 100);
  }

  // ===========================================
  // DASHBOARD / ANALYTICS (Tenant-scoped)
  // ===========================================

  static async getDashboardStats(ctx: TenantContext): Promise<{
    merchantCount: number;
    processorCount: number;
    userCount: number;
    totalRevenue: number;
    monthlyRevenue: number;
  }> {
    await setTenantContext(ctx.agencyId, ctx.subaccountId);

    const baseCondition = ctx.subaccountId
      ? and(
          eq(mtSchema.mtMerchants.agencyId, ctx.agencyId),
          eq(mtSchema.mtMerchants.subaccountId, ctx.subaccountId)
        )
      : eq(mtSchema.mtMerchants.agencyId, ctx.agencyId);

    const [merchantStats] = await db.select({
      count: sql<number>`count(*)::int`
    }).from(mtSchema.mtMerchants).where(baseCondition);

    // Processors are agency-scoped only
    const [processorStats] = await db.select({
      count: sql<number>`count(*)::int`
    }).from(mtSchema.mtProcessors).where(
      eq(mtSchema.mtProcessors.agencyId, ctx.agencyId)
    );

    const [userStats] = await db.select({
      count: sql<number>`count(*)::int`
    }).from(mtSchema.mtUsers).where(
      ctx.subaccountId
        ? and(
            eq(mtSchema.mtUsers.agencyId, ctx.agencyId),
            eq(mtSchema.mtUsers.subaccountId, ctx.subaccountId)
          )
        : eq(mtSchema.mtUsers.agencyId, ctx.agencyId)
    );

    // Get current month in YYYY-MM format
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const monthlyConditions = ctx.subaccountId
      ? and(
          eq(mtSchema.mtMonthlyData.agencyId, ctx.agencyId),
          eq(mtSchema.mtMonthlyData.subaccountId, ctx.subaccountId),
          eq(mtSchema.mtMonthlyData.month, currentMonthStr)
        )
      : and(
          eq(mtSchema.mtMonthlyData.agencyId, ctx.agencyId),
          eq(mtSchema.mtMonthlyData.month, currentMonthStr)
        );

    const [monthlyRevenueStats] = await db.select({
      total: sql<number>`COALESCE(SUM(CAST(income AS DECIMAL)), 0)::float`
    }).from(mtSchema.mtMonthlyData).where(monthlyConditions);

    const [totalRevenueStats] = await db.select({
      total: sql<number>`COALESCE(SUM(CAST(income AS DECIMAL)), 0)::float`
    }).from(mtSchema.mtMonthlyData).where(
      ctx.subaccountId
        ? and(
            eq(mtSchema.mtMonthlyData.agencyId, ctx.agencyId),
            eq(mtSchema.mtMonthlyData.subaccountId, ctx.subaccountId)
          )
        : eq(mtSchema.mtMonthlyData.agencyId, ctx.agencyId)
    );

    return {
      merchantCount: merchantStats?.count || 0,
      processorCount: processorStats?.count || 0,
      userCount: userStats?.count || 0,
      totalRevenue: totalRevenueStats?.total || 0,
      monthlyRevenue: monthlyRevenueStats?.total || 0,
    };
  }
}

export default MultiTenantService;
