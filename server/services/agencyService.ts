import { db } from "../db";
import { 
  agencies, 
  users, 
  subscriptions, 
  onboardingSteps, 
  auditLogs,
  notifications,
  jobQueue,
  ONBOARDING_STEPS,
  type Agency,
  type InsertAgency,
  type User,
  type OnboardingStep,
  type Subscription,
  type InsertSubscription,
  type InsertOnboardingStep,
  type InsertAuditLog,
  type InsertNotification,
  type InsertJobQueueItem
} from "../../shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export class AgencyService {
  // Super Admin - Get all agencies with stats
  static async getAllAgencies(): Promise<(Agency & { 
    userCount: number; 
    merchantCount: number; 
    subscriptionStatus: string;
    onboardingProgress: number;
  })[]> {
    const result = await db
      .select({
        ...agencies,
        userCount: sql<number>`COALESCE(user_stats.count, 0)`,
        merchantCount: sql<number>`COALESCE(merchant_stats.count, 0)`,
        subscriptionStatus: sql<string>`COALESCE(sub_stats.status, 'none')`,
        onboardingProgress: sql<number>`COALESCE(onboarding_stats.progress, 0)`
      })
      .from(agencies)
      .leftJoin(
        sql`(SELECT agency_id, COUNT(*) as count FROM users WHERE is_active = true GROUP BY agency_id) user_stats`,
        sql`user_stats.agency_id = agencies.id`
      )
      .leftJoin(
        sql`(SELECT agency_id, COUNT(*) as count FROM merchants GROUP BY agency_id) merchant_stats`, 
        sql`merchant_stats.agency_id = agencies.id`
      )
      .leftJoin(
        sql`(SELECT agency_id, status FROM subscriptions) sub_stats`,
        sql`sub_stats.agency_id = agencies.id`
      )
      .leftJoin(
        sql`(SELECT agency_id, (COUNT(CASE WHEN is_completed THEN 1 END) * 100.0 / COUNT(*)) as progress FROM onboarding_steps GROUP BY agency_id) onboarding_stats`,
        sql`onboarding_stats.agency_id = agencies.id`
      )
      .orderBy(desc(agencies.createdAt));

    return result as any;
  }

  // Create new agency with onboarding steps
  static async createAgency(agencyData: InsertAgency, adminUser: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{ agency: Agency; user: User; onboardingSteps: OnboardingStep[] }> {
    
    return await db.transaction(async (tx) => {
      // 1. Create agency
      const [agency] = await tx.insert(agencies).values(agencyData).returning();
      
      // 2. Create admin user for agency
      const hashedPassword = await bcrypt.hash(adminUser.password, 12);
      const [user] = await tx.insert(users).values({
        username: adminUser.username,
        email: adminUser.email,
        password: hashedPassword,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        agencyId: agency.id,
        role: "Admin",
        isActive: true,
        permissions: JSON.stringify({
          canManageUsers: true,
          canViewAllReports: true,
          canManageProcessors: true,
          canManageCommissions: true,
          canExportData: true
        })
      }).returning();

      // 3. Create onboarding steps
      const stepInserts: InsertOnboardingStep[] = ONBOARDING_STEPS.map(step => ({
        agencyId: agency.id,
        stepName: step.name,
        stepOrder: step.order,
        isCompleted: step.name === "Company Information", // First step auto-completed
        completedAt: step.name === "Company Information" ? new Date() : undefined,
        completedByUserId: step.name === "Company Information" ? user.id : undefined,
        stepData: JSON.stringify({ description: step.description })
      }));

      const createdSteps = await tx.insert(onboardingSteps).values(stepInserts).returning();

      // 4. Create trial subscription
      await tx.insert(subscriptions).values({
        agencyId: agency.id,
        plan: "trial",
        status: "trial",
        amount: "0.00",
        billingCycle: "monthly",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      });

      // 5. Log agency creation
      await tx.insert(auditLogs).values({
        agencyId: agency.id,
        userId: user.id,
        action: "agency_created",
        resourceType: "agency",
        resourceId: agency.id.toString(),
        metadata: JSON.stringify({
          agencyName: agency.name,
          adminEmail: user.email
        })
      });

      // 6. Create welcome notification
      await tx.insert(notifications).values({
        agencyId: agency.id,
        userId: user.id,
        type: "success",
        title: "Welcome to ISO Hub!",
        message: `Your agency "${agency.name}" has been created successfully. Complete the onboarding steps to get started.`,
        metadata: JSON.stringify({ onboardingUrl: "/onboarding" })
      });

      return { agency, user, onboardingSteps: createdSteps };
    });
  }

  // Update agency
  static async updateAgency(agencyId: number, updates: Partial<InsertAgency>): Promise<Agency> {
    const [agency] = await db
      .update(agencies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(agencies.id, agencyId))
      .returning();
    
    if (!agency) throw new Error("Agency not found");
    return agency;
  }

  // Get agency with full details
  static async getAgencyDetails(agencyId: number): Promise<{
    agency: Agency;
    users: User[];
    subscription: Subscription | null;
    onboardingSteps: OnboardingStep[];
    stats: {
      merchantCount: number;
      revenueTotal: number;
      userCount: number;
      onboardingProgress: number;
    };
  }> {
    const [agency] = await db.select().from(agencies).where(eq(agencies.id, agencyId));
    if (!agency) throw new Error("Agency not found");

    const agencyUsers = await db.select().from(users).where(eq(users.agencyId, agencyId));
    
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.agencyId, agencyId));
    
    const steps = await db.select().from(onboardingSteps)
      .where(eq(onboardingSteps.agencyId, agencyId))
      .orderBy(onboardingSteps.stepOrder);

    // Get stats - simplified for now, extend with actual queries later
    const stats = {
      merchantCount: 0,
      revenueTotal: 0,
      userCount: agencyUsers.length,
      onboardingProgress: Math.round((steps.filter(s => s.isCompleted).length / steps.length) * 100)
    };

    return {
      agency,
      users: agencyUsers,
      subscription: subscription || null,
      onboardingSteps: steps,
      stats
    };
  }

  // Complete onboarding step
  static async completeOnboardingStep(
    agencyId: number, 
    stepName: string, 
    userId: number, 
    stepData?: any
  ): Promise<OnboardingStep> {
    const [step] = await db
      .update(onboardingSteps)
      .set({
        isCompleted: true,
        completedAt: new Date(),
        completedByUserId: userId,
        stepData: stepData ? JSON.stringify(stepData) : undefined
      })
      .where(and(
        eq(onboardingSteps.agencyId, agencyId),
        eq(onboardingSteps.stepName, stepName)
      ))
      .returning();

    if (!step) throw new Error("Onboarding step not found");

    // Log completion
    await db.insert(auditLogs).values({
      agencyId,
      userId,
      action: "onboarding_step_completed",
      resourceType: "onboarding_step",
      resourceId: step.id.toString(),
      metadata: JSON.stringify({ stepName, stepData })
    });

    return step;
  }

  // Get agency onboarding status
  static async getOnboardingStatus(agencyId: number): Promise<{
    steps: OnboardingStep[];
    progress: number;
    nextStep: OnboardingStep | null;
    isCompleted: boolean;
  }> {
    const steps = await db.select().from(onboardingSteps)
      .where(eq(onboardingSteps.agencyId, agencyId))
      .orderBy(onboardingSteps.stepOrder);

    const completedSteps = steps.filter(s => s.isCompleted);
    const progress = Math.round((completedSteps.length / steps.length) * 100);
    const nextStep = steps.find(s => !s.isCompleted) || null;
    const isCompleted = completedSteps.length === steps.length;

    return {
      steps,
      progress,
      nextStep,
      isCompleted
    };
  }

  // Super Admin - Delete agency (with safeguards)
  static async deleteAgency(agencyId: number, superAdminId: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Log deletion attempt
      await tx.insert(auditLogs).values({
        agencyId,
        userId: superAdminId,
        action: "agency_deletion_initiated",
        resourceType: "agency",
        resourceId: agencyId.toString(),
        metadata: JSON.stringify({ superAdminId })
      });

      // Deactivate instead of hard delete for data integrity
      await tx.update(agencies)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(agencies.id, agencyId));

      // Deactivate all users
      await tx.update(users)
        .set({ isActive: false })
        .where(eq(users.agencyId, agencyId));
    });
  }

  // Create background job
  static async createJob(job: InsertJobQueueItem): Promise<void> {
    await db.insert(jobQueue).values(job);
  }

  // Get agency notifications
  static async getNotifications(agencyId: number, userId?: number, limit: number = 50): Promise<any[]> {
    let query = db.select().from(notifications)
      .where(eq(notifications.agencyId, agencyId));

    if (userId) {
      query = query.where(eq(notifications.userId, userId));
    }

    return await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  // Mark notification as read
  static async markNotificationRead(notificationId: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }
}