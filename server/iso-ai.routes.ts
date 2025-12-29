import express from "express";
import { ISOAIService } from "./services/isoAIService";
import { 
  insertAgentSchema, 
  insertMerchantSchema, 
  insertReportSchema,
  insertCommissionSchema 
} from "../shared/iso-ai-schema";

const router = express.Router();

// Organization endpoints
router.get("/organizations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await ISOAIService.getOrganization(id);
    
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }
    
    res.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    res.status(500).json({ error: "Failed to fetch organization" });
  }
});

// Agent endpoints
router.get("/agents", async (req, res) => {
  try {
    const { organizationId } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ error: "organizationId is required" });
    }
    
    const agents = await ISOAIService.getAgents(organizationId as string);
    res.json({ agents });
  } catch (error) {
    console.error("Error fetching agents:", error);
    res.status(500).json({ error: "Failed to fetch agents" });
  }
});

router.get("/agents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await ISOAIService.getAgent(id);
    
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    
    res.json(agent);
  } catch (error) {
    console.error("Error fetching agent:", error);
    res.status(500).json({ error: "Failed to fetch agent" });
  }
});

router.post("/agents", async (req, res) => {
  try {
    const agentData = insertAgentSchema.parse(req.body);
    const agent = await ISOAIService.createAgent(agentData);
    res.status(201).json(agent);
  } catch (error) {
    console.error("Error creating agent:", error);
    res.status(400).json({ error: error.message });
  }
});

router.put("/agents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = insertAgentSchema.partial().parse(req.body);
    const agent = await ISOAIService.updateAgent(id, updates);
    res.json(agent);
  } catch (error) {
    console.error("Error updating agent:", error);
    res.status(400).json({ error: error.message });
  }
});

router.delete("/agents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await ISOAIService.deleteAgent(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting agent:", error);
    res.status(500).json({ error: "Failed to delete agent" });
  }
});

// Merchant endpoints
router.get("/merchants", async (req, res) => {
  try {
    const { organizationId, agentId } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ error: "organizationId is required" });
    }
    
    const merchants = await ISOAIService.getMerchants(
      organizationId as string, 
      agentId as string
    );
    res.json({ merchants });
  } catch (error) {
    console.error("Error fetching merchants:", error);
    res.status(500).json({ error: "Failed to fetch merchants" });
  }
});

router.post("/merchants", async (req, res) => {
  try {
    const merchantData = insertMerchantSchema.parse(req.body);
    const merchant = await ISOAIService.createMerchant(merchantData);
    res.status(201).json(merchant);
  } catch (error) {
    console.error("Error creating merchant:", error);
    res.status(400).json({ error: error.message });
  }
});

// Report endpoints
router.get("/reports", async (req, res) => {
  try {
    const { organizationId, agentId } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ error: "organizationId is required" });
    }
    
    const reports = await ISOAIService.getReports(
      organizationId as string, 
      agentId as string
    );
    res.json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.post("/reports", async (req, res) => {
  try {
    const reportData = insertReportSchema.parse(req.body);
    const report = await ISOAIService.createReport(reportData);
    res.status(201).json(report);
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(400).json({ error: error.message });
  }
});

// Dashboard endpoints
router.get("/dashboard/metrics", async (req, res) => {
  try {
    const { organizationId } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ error: "organizationId is required" });
    }
    
    const metrics = await ISOAIService.getDashboardMetrics(organizationId as string);
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ error: "Failed to fetch dashboard metrics" });
  }
});

router.get("/dashboard/top-agents", async (req, res) => {
  try {
    const { organizationId, limit = 5 } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ error: "organizationId is required" });
    }
    
    const topAgents = await ISOAIService.getTopAgents(
      organizationId as string, 
      parseInt(limit as string)
    );
    res.json({ agents: topAgents });
  } catch (error) {
    console.error("Error fetching top agents:", error);
    res.status(500).json({ error: "Failed to fetch top agents" });
  }
});

router.get("/dashboard/recent-activity", async (req, res) => {
  try {
    const { organizationId, limit = 10 } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ error: "organizationId is required" });
    }
    
    const activities = await ISOAIService.getRecentActivity(
      organizationId as string, 
      parseInt(limit as string)
    );
    res.json({ activities });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ error: "Failed to fetch recent activity" });
  }
});

// Initialize sample data
router.post("/initialize", async (req, res) => {
  try {
    const { organizationId = "org-86f76df1" } = req.body;
    await ISOAIService.initializeSampleData(organizationId);
    res.json({ success: true, message: "Sample data initialized" });
  } catch (error) {
    console.error("Error initializing sample data:", error);
    res.status(500).json({ error: "Failed to initialize sample data" });
  }
});

export default router;