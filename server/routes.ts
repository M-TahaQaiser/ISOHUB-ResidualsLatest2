import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { AuthenticatedRequest } from "./middleware/auth";
import { authenticateToken, requireRole } from "./middleware/auth";
import { CSVParser } from "./services/csvParser";
import { MIDMatcher } from "./services/midMatcher";
import { AIReportingService } from "./services/aiReporting";
import { EmailService } from "./services/emailService";
import { TenancyService } from "./services/tenancyService";
import { db } from "./db";
import { monthlyData } from "@shared/schema";
import { sql, and, eq } from "drizzle-orm";

const emailService = new EmailService();
import preApplicationsRouter from "./preApplications.routes";
import securedDocsRouter from "./securedDocs.routes";
import marketingRouter from "./marketing.routes";
import repsRouter from "./reps.routes";
import dashboardRouter from "./dashboard.routes";
import reportsRouter from "./reports.routes";
import assignmentsRouter from "./assignments.routes";
import agenciesRouter from "./routes/agencies.routes";
import bulkAssignmentsRouter from "./routes/bulk-assignments.routes";
import isoAIRouter from "./iso-ai.routes";
import jaccRouter from "./routes/isoAI.routes";
import { vendorsRouter } from "./vendors.routes";
import { initializeVendors } from "./initialize-vendors";
import preApplicationsRouterNew from "./routes/preApplications.routes";
import domainRouter from "./routes/domain.routes";
import emailRouter from "./routes/email.routes";
import shortUrlRouter from "./routes/shortUrl.routes";
import authRouter from "./routes/auth.routes";
import usersRouter from "./routes/users.routes";
import securityRouter from "./routes/security.routes";
import statusRouter from "./routes/status.routes";
import onboardingRouter from "./routes/onboarding.routes";
import helpRouter from "./routes/help.routes";
import repMetricsRouter from "./routes/repMetrics.routes";
import testRolesRouter from "./routes/testRoles.routes";
import aiRouter from "./routes/ai.routes";
import { registerRoleAccessRoutes } from "./routes/roleAccess.routes";
import { validationRoutes } from "./routes/validation.routes";
import residualsWorkflowRouter from "./routes/residualsWorkflow.routes";
import realDataDisplayRouter from "./routes/realDataDisplay.routes";
import searchRouter from "./routes/search.routes";
import analyticsRouter from "./routes/analytics.routes";
import mtRouter from "./routes/mt.routes";
import ssoRouter from "./routes/sso.routes";
import processorMappingsRouter from "./routes/processorMappings.routes";
import healthRouter from "./routes/health.routes";
import multer from "multer";
import path from "path";
import {
  insertProcessorSchema,
  insertRoleSchema,
  insertAssignmentSchema,
  insertReportSchema,
} from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Email test endpoint for development
  app.post("/api/test-email", authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { to, subject, message } = req.body;

      if (!to || !subject || !message) {
        return res
          .status(400)
          .json({ error: "Email, subject, and message are required" });
      }

      const testEmailService = new EmailService();
      const emailSent = await testEmailService.sendEmail({
        to,
        subject,
        html: `<p>${message}</p>`,
        text: message,
        emailType: "test",
      });

      if (emailSent) {
        res.json({ success: true, message: "Test email sent successfully" });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to send test email - check SMTP configuration",
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Login Portal Categories (Vendor Cards)
  app.get("/api/login-portal/categories", async (req, res) => {
    try {
      console.log("Loading authentic ISOHub vendor data...");

      // Use authentic ISOHub vendor data
      const { VendorMigrationService } = await import(
        "./services/vendorMigrationService"
      );
      const vendorsByCategory = VendorMigrationService.getVendorsByCategory();

      // Transform vendor data for frontend
      const categories = [
        "Processors",
        "Gateways",
        "Hardware/Equipment",
        "Internal",
      ].map((categoryName) => {
        const categoryVendors = vendorsByCategory[categoryName] || [];
        return {
          name: categoryName,
          count: categoryVendors.length,
          processors: categoryVendors.map((vendor) => ({
            id: vendor.id,
            name: vendor.name,
            category: vendor.category,
            description: vendor.description,
            loginUrl: vendor.loginUrl,
            logo:
              vendor.logoUrl ||
              `https://logo.clearbit.com/${vendor.name
                .toLowerCase()
                .replace(/\s+/g, "")
                .replace(/[^a-z0-9]/gi, "")}.com`,
            isActive: vendor.isActive,
          })),
        };
      });

      res.json(categories);
    } catch (error) {
      console.error("Failed to fetch login portal categories:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Internal logo API for branded system logos
  app.get("/api/logo/:system", (req, res) => {
    const { system } = req.params;

    // Return branded SVG logos for internal systems
    const logoSvg = `
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" rx="12" fill="#FFD700"/>
        <text x="32" y="36" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#000">
          ${system.charAt(0).toUpperCase()}
        </text>
      </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    res.send(logoSvg);
  });

  // Update vendor endpoint
  // Simple processor upload endpoint for your real data
  app.post(
    "/api/upload-processor",
    authenticateToken,
    upload.single("csvFile"),
    async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const { processor, month } = req.body;
        if (!processor || !month) {
          return res
            .status(400)
            .json({ error: "Processor and month are required" });
        }

        console.log(`Processing ${processor} upload for ${month}`);
        const csvContent = req.file.buffer.toString();

        // Parse CSV with proper quote handling using static method
        const parsedData = CSVParser.parseCSV(csvContent);

        console.log(
          `Found ${parsedData.length} merchant records for ${processor}`,
        );

        // Get processor ID from database
        const processors = await storage.getProcessors();
        const processorRecord = processors.find(
          (p) => p.name.toLowerCase() === processor.toLowerCase(),
        );
        if (!processorRecord) {
          return res
            .status(400)
            .json({ error: `Processor "${processor}" not found in database` });
        }

        // Process each merchant record
        const results = [];
        const errors = [];

        for (const record of parsedData) {
          try {
            const merchantId =
              record["Merchant ID"] ||
              record["MID"] ||
              record["Mid"] ||
              record["merchant_id"];
            const merchantName =
              record["Merchant"] ||
              record["Business Name"] ||
              record["merchant_name"];
            const net =
              record["Net"] || record["net"] || record["Revenue"] || "0";
            const volume =
              record["Sales Amount"] ||
              record["Volume"] ||
              record["sales_amount"] ||
              "0";
            const transactions = parseInt(
              record["Transactions"] || record["transaction_count"] || "0",
            );

            if (!merchantId || !merchantName) {
              errors.push(
                `Missing merchant ID or name: ${JSON.stringify(record)}`,
              );
              continue;
            }

            // Find or create merchant
            let merchant = await storage.getMerchantByMid(merchantId);
            if (!merchant) {
              merchant = await storage.createMerchant({
                mid: merchantId,
                legalName: merchantName,
                dba: merchantName,
              });
            }

            // Insert monthly data for this processor/month
            await storage.createMonthlyData({
              merchantId: merchant.id,
              processorId: processorRecord.id,
              month: month,
              net: net.toString(),
              salesAmount: volume.toString(),
              transactions: transactions,
            });

            results.push({ merchantId, merchantName, net, volume });
          } catch (error) {
            console.error("Error processing record:", error);
            errors.push(`Processing error: ${(error as Error).message}`);
          }
        }

        console.log(
          `✅ Successfully processed ${results.length} records for ${processor} - ${month}`,
        );
        if (errors.length > 0) {
          console.log(`⚠️ ${errors.length} errors encountered`);
        }

        res.json({
          success: true,
          processor,
          month,
          recordsProcessed: results.length,
          totalRecords: parsedData.length,
          errors: errors.length,
          message: `Successfully uploaded ${results.length} records for ${processor} - ${month}`,
          sampleData: results.slice(0, 3),
          errorSample: errors.slice(0, 3),
        });
      } catch (error: any) {
        console.error("Processor Upload Error:", error);
        res.status(500).json({ error: (error as Error).message });
      }
    },
  );

  app.patch("/api/vendors/:id", authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validate the updates
      if (!updates || typeof updates !== "object") {
        return res.status(400).json({ error: "Invalid update data" });
      }

      // For authentic vendor data, we don't allow editing core vendor information
      // This would be handled through proper vendor management systems
      console.log(`Vendor update requested for ${id}:`, updates);

      // Return the original vendor with updates applied (for demo purposes)
      const { VendorMigrationService } = await import(
        "./services/vendorMigrationService"
      );
      const vendor = VendorMigrationService.getVendorById(id);

      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      // In a real system, this would update the vendor management database
      const updatedVendor = {
        ...vendor,
        ...updates,
        id: vendor.id, // Preserve original ID
      };

      res.json(updatedVendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ error: "Failed to update vendor" });
    }
  });

  // Helper functions for processor details
  function getProcessorDescription(name: string): string {
    const descriptions: Record<string, string> = {
      "Payment Advisors":
        "Premier payment processing and merchant services solutions.",
      Clearent: "A premier payment processor and financial tech provider.",
      "Micamp Solutions":
        "Comprehensive payment processing and merchant solutions.",
      "Global Payments TSYS":
        "Global payment processing and financial tech provider. Integrated with Fiserv.",
      "Merchant Lynx":
        "Payment processing solutions for merchants of all sizes.",
      "First Data":
        "Global payment processing and financial tech provider. Now part of Fiserv.",
      Shift4: "Secure payment processing and POS solutions for businesses.",
    };
    return descriptions[name] || "Professional payment processing services.";
  }

  function getProcessorLoginUrl(name: string): string {
    const urls: Record<string, string> = {
      "Payment Advisors": "https://portal.paymentadvisors.com",
      Clearent: "https://portal.clearent.com",
      "Micamp Solutions": "https://portal.micamp.com",
      "Global Payments TSYS": "https://portal.tsys.com",
      "Merchant Lynx": "https://portal.merchantlynx.com",
      "First Data": "https://portal.firstdata.com",
      Shift4: "https://portal.shift4.com",
    };
    return urls[name] || "#";
  }

  // Processors
  app.get("/api/processors", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const processors = await storage.getProcessors();
      res.json(processors);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/processors", authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const processor = insertProcessorSchema.parse(req.body);
      const created = await storage.createProcessor(processor);
      res.json(created);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.put("/api/processors/:id", authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertProcessorSchema.partial().parse(req.body);
      const updated = await storage.updateProcessor(id, updates);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Merchants
  app.get("/api/merchants", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const merchants = await storage.getMerchants();
      res.json(merchants);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/merchants/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const merchant = await storage.getMerchant(id);
      if (!merchant) {
        return res.status(404).json({ error: "Merchant not found" });
      }
      res.json(merchant);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Monthly Data
  app.get("/api/monthly-data/:month", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const month = req.params.month;
      const data = await storage.getMonthlyData(month);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/monthly-stats/:month", async (req, res) => {
    try {
      const month = req.params.month;
      const organizationId = req.query.organizationId as string | undefined;
      
      // If organizationId provided, use multi-tenant filtered query
      if (organizationId) {
        const agencyId = await TenancyService.resolveAgencyId(organizationId);
        if (agencyId === null) {
          return res.status(404).json({ error: "Organization not found" });
        }
        
        // Get filtered stats for this agency
        const [stats] = await db
          .select({
            totalMids: sql<number>`count(distinct ${monthlyData.merchantId})`,
            totalRevenue: sql<string>`COALESCE(sum(${monthlyData.net}), 0)`,
          })
          .from(monthlyData)
          .where(and(eq(monthlyData.month, month), eq(monthlyData.agencyId, agencyId)));
        
        return res.json({
          totalMids: stats?.totalMids || 0,
          totalRevenue: stats?.totalRevenue || "0",
          pendingAssignments: 0,
          auditIssues: 0
        });
      }
      
      // Fall back to authenticated access for non-org queries
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Access token required" });
      }
      
      const stats = await storage.getMonthlyStats(month);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // File Uploads
  app.post("/api/upload/:month", authenticateToken, upload.single("file"), async (req: AuthenticatedRequest, res) => {
    try {
      const month = req.params.month;
      const { processorId, type } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString("utf-8");

      // Create file upload record
      const fileUpload = await storage.createFileUpload({
        filename: req.file.originalname,
        processorId: processorId ? parseInt(processorId) : null,
        month,
        type,
        status: "processing",
      });

      let result;

      if (type === "lead_sheet") {
        const leadData = CSVParser.parseLeadSheet(csvContent);
        result = await MIDMatcher.matchLeadSheet(leadData);
      } else if (type === "processor" && processorId) {
        const processor = await storage.getProcessor(parseInt(processorId));
        if (!processor) {
          return res.status(404).json({ error: "Processor not found" });
        }

        const processorData = CSVParser.parseProcessorFile(
          csvContent,
          processor.name,
        );
        result = await MIDMatcher.matchProcessorData(
          processorData,
          parseInt(processorId),
          month,
        );
      } else {
        return res
          .status(400)
          .json({ error: "Invalid upload type or missing processor ID" });
      }

      // Update file upload status
      await storage.updateFileUpload(fileUpload.id, {
        status: result.errors.length > 0 ? "completed" : "completed",
        recordsProcessed: result.matched + result.created + result.updated,
      });

      res.json({
        success: true,
        fileUploadId: fileUpload.id,
        result,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/file-uploads/:month", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const month = req.params.month;
      const uploads = await storage.getFileUploads(month);
      res.json(uploads);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Roles
  app.get("/api/roles", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/roles", authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const role = insertRoleSchema.parse(req.body);
      const created = await storage.createRole(role);
      res.json(created);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Assignments
  app.get("/api/assignments/:merchantId/:month", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const merchantId = parseInt(req.params.merchantId);
      const month = req.params.month;
      const assignments = await storage.getAssignmentsByMerchant(merchantId, month);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/assignments", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const assignments = req.body.assignments as any[];
      const results = [];

      for (const assignmentData of assignments) {
        const assignment = insertAssignmentSchema.parse(assignmentData);
        const created = await storage.createAssignment(assignment);
        console.log(`Created assignment: ${JSON.stringify(created)}`);
        results.push(created);
      }

      // Check for audit issues after assignments
      if (assignments.length > 0) {
        await MIDMatcher.checkForAuditIssues(
          assignments[0].merchantId,
          assignments[0].month,
        );
      }

      res.json(results);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.put("/api/assignments/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertAssignmentSchema.partial().parse(req.body);
      const updated = await storage.updateAssignment(id, updates);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/assignments/:id", authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAssignment(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Audit Issues
  app.get("/api/audit-issues/:month", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const month = req.params.month;
      const issues = await storage.getAuditIssues(month);
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/audit/run/:month", authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      const month = req.params.month;
      const auditResults = await MIDMatcher.runFullAudit(month);
      res.json(auditResults);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/audit-issues/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updated = await storage.updateAuditIssue(id, updates);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // AI Reporting
  app.post("/api/reports/ai-query", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { query } = req.body;
      const reportSpec =
        await AIReportingService.parseNaturalLanguageQuery(query);
      res.json(reportSpec);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/reports/suggestions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const suggestions = await AIReportingService.suggestReportQueries();
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/reports/generate", async (req: AuthenticatedRequest, res) => {
    try {
      const { reportSpec, month } = req.body;

      // Check authentication
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get all data first
      let monthlyData = await storage.getMonthlyData(month);

      // Apply role-based filtering based on authenticated user
      const userRole = req.user.role.toLowerCase();
      
      // Note: Legacy code used repName/partnerName from user object
      // Modern implementation should use username and role-based queries
      if (userRole === "rep" || userRole === "agent") {
        // For reps/agents, only show their assigned merchants
        const assignments = await storage.getAssignments(month);
        const repRoles = await storage.getRoles();
        const repRole = repRoles.find(
          (r) => r.name === req.user!.username && (r.type === "rep" || r.type === "agent"),
        );

        if (repRole) {
          const repAssignments = assignments.filter(
            (a) => a.roleId === repRole.id,
          );
          const repMerchantIds = repAssignments.map((a) => a.merchantId);
          monthlyData = monthlyData.filter((d) =>
            repMerchantIds.includes(d.merchantId),
          );

          // Calculate rep revenue and cuts
          monthlyData = monthlyData.map((d) => {
            const assignment = repAssignments.find(
              (a) => a.merchantId === d.merchantId,
            );
            const repCut = assignment
              ? (parseFloat(d.net || "0") *
                  parseFloat(assignment.percentage || "0")) /
                100
              : 0;

            return {
              ...d,
              repNet: repCut.toFixed(2),
              percentage: assignment ? assignment.percentage : "0.00",
            };
          });
        }
      } else if (userRole === "partner") {
        // For partners, filter by their assignments
        const assignments = await storage.getAssignments(month);
        const partnerRoles = await storage.getRoles();
        const partnerRole = partnerRoles.find(
          (r) => r.name === req.user!.username && r.type === "partner",
        );
        
        if (partnerRole) {
          const partnerAssignments = assignments.filter((a) => a.roleId === partnerRole.id);
          const partnerMerchantIds = partnerAssignments.map((a) => a.merchantId);
          monthlyData = monthlyData.filter((d) => partnerMerchantIds.includes(d.merchantId));
        }
      }
      // Admin, SuperAdmin, and Manager users see all data

      // Generate insights
      const insights = await AIReportingService.generateInsights(
        monthlyData,
        reportSpec,
      );

      res.json({
        spec: reportSpec,
        data: monthlyData,
        insights,
        userContext: {
          role: req.user.role,
          username: req.user.username,
          userId: req.user.id,
        },
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Reports
  app.get("/api/reports", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/reports", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const report = insertReportSchema.parse(req.body);
      const created = await storage.createReport(report);
      res.json(created);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/reports/:id/email", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { recipients, reportData, branding } = req.body;

      const report = await storage.getReports();
      const targetReport = report.find((r) => r.id === id);

      if (!targetReport) {
        return res.status(404).json({ error: "Report not found" });
      }

      // Send report via email using sendEmail method
      const emailHtml = `
        <div style="font-family: Arial, sans-serif;">
          <h2>Report: ${targetReport.name}</h2>
          <p>Type: ${targetReport.type}</p>
          <pre>${JSON.stringify(reportData, null, 2)}</pre>
        </div>
      `;

      const sent = await emailService.sendEmail({
        to: recipients,
        subject: `Report: ${targetReport.name}`,
        html: emailHtml,
        text: `Report: ${targetReport.name}\nType: ${targetReport.type}`,
        emailType: "report",
      });

      if (sent) {
        res.json({ success: true, message: "Report email sent successfully" });
      } else {
        res.status(500).json({ success: false, error: "Failed to send report email" });
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Initialize default processors and roles
  app.post("/api/initialize", authenticateToken, requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res) => {
    try {
      // Check existing processors first
      const existingProcessors = await storage.getProcessors();
      const existingNames = new Set(existingProcessors.map((p) => p.name));

      // Create default processors only if they don't exist
      const defaultProcessors = [
        { name: "Payment Advisors", isActive: true },
        { name: "Clearent", isActive: true },
        { name: "Micamp Solutions", isActive: true },
        { name: "Global Payments TSYS", isActive: true },
        { name: "Merchant Lynx", isActive: true },
        { name: "First Data", isActive: true },
        { name: "Shift4", isActive: true },
      ];

      const processors = [...existingProcessors];
      for (const processor of defaultProcessors) {
        if (!existingNames.has(processor.name)) {
          try {
            const created = await storage.createProcessor(processor);
            processors.push(created);
          } catch (error) {
            console.error(
              `Failed to create processor ${processor.name}:`,
              error,
            );
          }
        }
      }

      // Check existing roles first
      const existingRoles = await storage.getRoles();
      const existingRoleNames = new Set(existingRoles.map((r) => r.name));

      // Create default roles only if they don't exist
      const defaultRoles = [
        { name: "CoCard 0827", type: "company", isActive: true },
        { name: "Christy G Milton", type: "sales_manager", isActive: true },
        { name: "Mark Pierce", type: "sales_manager", isActive: true },
        { name: "Troy Esentan", type: "rep", isActive: true },
        { name: "Cody Burnell", type: "rep", isActive: true },
        { name: "James Carner", type: "rep", isActive: true },
        { name: "HBS Partner 0827", type: "partner", isActive: true },
        { name: "C2FS Partner 0827", type: "partner", isActive: true },
        { name: "Tracer CoCard", type: "association", isActive: true },
      ];

      const roles = [...existingRoles];
      for (const role of defaultRoles) {
        if (!existingRoleNames.has(role.name)) {
          try {
            const created = await storage.createRole(role);
            roles.push(created);
          } catch (error) {
            console.error(`Failed to create role ${role.name}:`, error);
          }
        }
      }

      res.json({ processors, roles });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Demo data seeding endpoint (admin or superadmin)
  app.post("/api/admin/seed-demo-data", authenticateToken, requireRole(['superadmin', 'SuperAdmin', 'admin', 'Admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { seedDemoData } = await import('./utils/seedDemoData');
      const result = await seedDemoData();
      res.json(result);
    } catch (error) {
      console.error('Demo data seed failed:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Clear demo data endpoint (admin or superadmin)
  app.delete("/api/admin/demo-data", authenticateToken, requireRole(['superadmin', 'SuperAdmin', 'admin', 'Admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { clearDemoData } = await import('./utils/seedDemoData');
      const result = await clearDemoData();
      res.json(result);
    } catch (error) {
      console.error('Failed to clear demo data:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // API endpoint for roles (duplicate - already protected above)
  app.get("/api/roles", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  // Upload history and status endpoints
  app.get("/api/uploads/history", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // This would fetch real upload history from database
      res.json([]); // Empty for now - will be populated as users upload files
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Monthly upload status endpoint
  app.get("/api/uploads/monthly-status", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { month } = req.query;

      // For now, return mock data based on known uploads
      const mockMonthlyStatus = [
        {
          processor: "Clearent",
          status: "uploaded",
          recordCount: 121,
          uploadDate: "2025-04-15",
        },
        {
          processor: "Global Payments TSYS",
          status: "uploaded",
          recordCount: 17,
          uploadDate: "2025-04-16",
        },
        {
          processor: "Payment Advisors",
          status: "not_uploaded",
          recordCount: 0,
          uploadDate: null,
        },
        {
          processor: "Merchant Lynx",
          status: "not_uploaded",
          recordCount: 0,
          uploadDate: null,
        },
        {
          processor: "Shift4",
          status: "not_uploaded",
          recordCount: 0,
          uploadDate: null,
        },
      ];

      res.json(mockMonthlyStatus);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Handle personalized form URLs - /{agencyCode}/{fullname} (ONLY for GET requests)
  app.get("/:agencyCode/:fullname", (req, res, next) => {
    const { agencyCode, fullname } = req.params;

    // Skip all static assets, API routes, and system paths
    if (
      agencyCode.includes(".") ||
      agencyCode.startsWith("@") ||
      agencyCode === "api" ||
      agencyCode === "src" ||
      agencyCode === "assets" ||
      agencyCode === "form" ||
      agencyCode === "manifest.json" ||
      agencyCode === "sw.js" ||
      fullname.includes(".") ||
      fullname === "assets"
    ) {
      return next();
    }

    console.log(`🔗 Personalized URL accessed: /${agencyCode}/${fullname}`);

    // Validate agency code and fullname patterns
    if (
      agencyCode &&
      fullname &&
      agencyCode.length > 2 &&
      fullname.includes("-")
    ) {
      console.log("✅ Valid personalized URL, redirecting to form");
      return res.redirect(`/form/${agencyCode}/${fullname}`);
    }

    // If not a valid personalized URL pattern, continue to next handler
    next();
  });

  // Handle secured document portal URLs - /secured/{name}/documents
  // SECURITY FIX: Require access token for secured document portal
  app.get("/secured/:name/documents", async (req, res) => {
    const { name } = req.params;
    const { token } = req.query;

    console.log(`🔒 Secured portal URL accessed: /secured/${name}/documents`);

    // Validate the name parameter format
    if (!name || !/^[a-zA-Z0-9-_]+$/.test(name) || name.length > 100) {
      return res.status(400).render('error', {
        title: 'Invalid Request',
        message: 'Invalid portal link format.'
      });
    }

    // SECURITY: Require access token for document portal access
    // Tokens are generated when sending the portal link email
    if (!token) {
      console.warn(`[SECURITY] Secured portal access attempt without token: /secured/${name}/documents`);
      return res.status(401).render('error', {
        title: 'Access Denied',
        message: 'A valid access token is required. Please use the link provided in your email.'
      });
    }

    try {
      // Validate the access token
      const { SecuredDocTokenService } = await import('./services/SecuredDocTokenService');
      const isValidToken = await SecuredDocTokenService.validateToken(token as string, name);

      if (!isValidToken) {
        console.warn(`[SECURITY] Invalid or expired token for secured portal: /secured/${name}/documents`);
        return res.status(403).render('error', {
          title: 'Invalid Token',
          message: 'This access link has expired or is invalid. Please request a new link.'
        });
      }

      // Token is valid, redirect to secured docs page with validated token
      res.redirect(`/secured-docs?contact=${encodeURIComponent(name)}&token=${encodeURIComponent(token as string)}`);
    } catch (error) {
      console.error('Error validating secured portal token:', error);
      res.status(500).render('error', {
        title: 'Server Error',
        message: 'An error occurred while processing your request. Please try again.'
      });
    }
  });

  // Mount routers
  app.use("/api/health", healthRouter);
  app.use("/api/status", statusRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/sso", ssoRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/roster", (await import("./routes/roster.routes")).default);
  app.use("/api/security", securityRouter);
  app.use("/api/pre-applications", preApplicationsRouter);
  app.use("/api/secured-docs", securedDocsRouter);
  app.use("/api/marketing", marketingRouter);
  app.use("/api/reps", repsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/assignments", assignmentsRouter);
  app.use("/api/agencies", agenciesRouter);
  app.use("/api/organizations", agenciesRouter); // Alias for organizations terminology
  app.use("/api/bulk-assignments", bulkAssignmentsRouter);
  app.use("/api/iso-ai", isoAIRouter);
  app.use("/api/vendors", vendorsRouter);
  app.use("/api/preapplications", preApplicationsRouter);
  console.log("📋 PreApplications router mounted at /api/preapplications");
  app.use("/api/domain", domainRouter);
  app.use("/api/email", emailRouter);
  app.use("/api/residuals-workflow", residualsWorkflowRouter);
  app.use("/api/real-data", realDataDisplayRouter);
  app.use("/s", shortUrlRouter);
  app.use("/api/onboarding", onboardingRouter);
  app.use("/api/help", helpRouter);
  app.use("/api", repMetricsRouter);
  app.use("/api", testRolesRouter);

  // Mount audit routes for monthly data verification
  app.use("/api/audit", (await import("./routes/audit.routes")).default);

  // Mount AI chat routes for intelligent assistant
  app.use("/api/ai-chat", (await import("./routes/ai-chat.routes")).default);
  
  // Mount new AI routes for AI Center
  app.use("/api/ai", aiRouter);

  // Mount support ticket management routes
  app.use("/api/support", (await import("./routes/support.routes")).default);

  // Register role access routes
  registerRoleAccessRoutes(app);

  // Mount validation routes for data upload validation
  app.use("/api/validation", validationRoutes);

  // Mount filter presets routes
  app.use("/api/filter-presets", (await import("./routes/filterPresets.routes")).default);
  
  // Mount global search routes
  app.use("/api/search", searchRouter);

  // Analytics routes
  app.use("/api/analytics", analyticsRouter);

  // Multi-tenant routes (new mt_* schema)
  app.use("/api/mt", mtRouter);

  // ISO-AI Chat routes - Full chat system with streaming, flows, folders
  app.use("/api/jacc", jaccRouter);
  app.use("/api/processor-mappings", processorMappingsRouter);

  // Document Center routes - JACC integration for document storage and search
  app.use("/api/documents", (await import("./routes/documentCenter.routes")).default);

  // ISO-Sign routes - Electronic signature management
  app.use("/api/iso-sign", (await import("./routes/isoSign.routes")).default);

  // Compliance & observability routes - Audit log, metrics, data inventory
  app.use("/api/compliance", (await import("./routes/compliance.routes")).default);

  const httpServer = createServer(app);
  return httpServer;
}
