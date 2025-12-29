import type { Express } from "express";
import { RoleBasedAccessService } from "../services/RoleBasedAccessService";

export function registerRoleAccessRoutes(app: Express) {
  
  // Get user role and permissions
  app.get("/api/user/role/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const userRole = await RoleBasedAccessService.getUserRole(userId);
      
      if (!userRole) {
        return res.status(404).json({ error: "User role not found" });
      }
      
      res.json(userRole);
    } catch (error) {
      console.error("Error fetching user role:", error);
      res.status(500).json({ error: "Failed to fetch user role" });
    }
  });

  // Get navigation items based on user role
  app.get("/api/user/navigation/:role", async (req, res) => {
    try {
      const { role } = req.params;
      const navigation = RoleBasedAccessService.getNavigationForRole(role);
      
      res.json(navigation);
    } catch (error) {
      console.error("Error fetching navigation:", error);
      res.status(500).json({ error: "Failed to fetch navigation" });
    }
  });

  // Check user permission
  app.get("/api/user/:userId/permission/:permission", async (req, res) => {
    try {
      const { userId, permission } = req.params;
      const hasPermission = await RoleBasedAccessService.hasPermission(userId, permission);
      
      res.json({ hasPermission });
    } catch (error) {
      console.error("Error checking permission:", error);
      res.status(500).json({ error: "Failed to check permission" });
    }
  });

  // Get filtered reports for user
  app.get("/api/reports/filtered/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get all reports first (this would normally come from your existing reports endpoint)
      // For now, we'll use a placeholder - you'd replace this with actual reports fetching
      const allReports: any[] = []; // TODO: Fetch from actual reports service
      
      const filteredReports = await RoleBasedAccessService.filterReportsForUser(userId, allReports);
      
      res.json({ reports: filteredReports });
    } catch (error) {
      console.error("Error fetching filtered reports:", error);
      res.status(500).json({ error: "Failed to fetch filtered reports" });
    }
  });

  // Get roster upload template
  app.get("/api/admin/roster-template", async (req, res) => {
    try {
      const template = RoleBasedAccessService.getRosterUploadTemplate();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="agent_roster_template.csv"');
      res.send(template);
    } catch (error) {
      console.error("Error generating roster template:", error);
      res.status(500).json({ error: "Failed to generate roster template" });
    }
  });

  // Process roster upload
  app.post("/api/admin/roster-upload", async (req, res) => {
    try {
      const { csvData, organizationId } = req.body;
      
      if (!csvData || !organizationId) {
        return res.status(400).json({ error: "CSV data and organization ID are required" });
      }
      
      const result = await RoleBasedAccessService.processRosterUpload(csvData, organizationId);
      
      res.json(result);
    } catch (error) {
      console.error("Error processing roster upload:", error);
      res.status(500).json({ error: "Failed to process roster upload" });
    }
  });

  // Get agent's assigned merchant IDs
  app.get("/api/agent/:userId/merchants", async (req, res) => {
    try {
      const { userId } = req.params;
      const merchantIds = await RoleBasedAccessService.getAgentMerchantIds(userId);
      
      res.json({ merchantIds });
    } catch (error) {
      console.error("Error fetching agent merchants:", error);
      res.status(500).json({ error: "Failed to fetch agent merchants" });
    }
  });
}