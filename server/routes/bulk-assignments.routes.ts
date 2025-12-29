import { Router } from "express";
import { BulkAssignmentService } from "../services/bulkAssignmentService";
import { z } from "zod";

const router = Router();

// Bulk assignment schema
const bulkAssignmentSchema = z.object({
  merchantIds: z.array(z.number()),
  assignments: z.array(z.object({
    roleId: z.number(),
    percentage: z.number()
  })),
  month: z.string()
});

const smartAssignmentSchema = z.object({
  processorId: z.number().optional(),
  revenueRange: z.object({
    min: z.number(),
    max: z.number()
  }).optional(),
  defaultAssignments: z.array(z.object({
    roleId: z.number(),
    percentage: z.number()
  })),
  month: z.string()
});

// Execute bulk assignments
router.post("/execute", async (req, res) => {
  try {
    const { rules } = req.body;
    
    // Validate rules
    const validatedRules = rules.map((rule: any) => bulkAssignmentSchema.parse(rule));
    
    const result = await BulkAssignmentService.bulkAssignMerchants(validatedRules);
    
    if (result.success) {
      res.json({
        success: true,
        assignedCount: result.assignedCount,
        message: `Successfully assigned ${result.assignedCount} merchants`
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error("Error executing bulk assignment:", error);
    res.status(400).json({ 
      error: error instanceof z.ZodError ? error.errors : "Failed to execute bulk assignment"
    });
  }
});

// Smart assignment by revenue
router.post("/smart", async (req, res) => {
  try {
    const { rules } = req.body;
    
    // Validate smart rules
    const validatedRules = rules.map((rule: any) => smartAssignmentSchema.parse(rule));
    
    const result = await BulkAssignmentService.smartAssignByRevenue(validatedRules);
    
    if (result.success) {
      res.json({
        success: true,
        assignedCount: result.assignedCount,
        merchantsProcessed: result.merchantsProcessed,
        message: `Processed ${result.merchantsProcessed} merchants, assigned ${result.assignedCount}`
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error("Error executing smart assignment:", error);
    res.status(400).json({ 
      error: error instanceof z.ZodError ? error.errors : "Failed to execute smart assignment"
    });
  }
});

// Assign by processor
router.post("/processor/:processorId", async (req, res) => {
  try {
    const processorId = parseInt(req.params.processorId);
    const { month, defaultAssignments } = req.body;
    
    // Validate assignments
    const assignments = z.array(z.object({
      roleId: z.number(),
      percentage: z.number()
    })).parse(defaultAssignments);
    
    const result = await BulkAssignmentService.assignByProcessor(
      processorId,
      month,
      assignments
    );
    
    if (result.success) {
      res.json({
        success: true,
        assignedCount: result.assignedCount,
        message: `Successfully assigned ${result.assignedCount} merchants from processor`
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error("Error assigning by processor:", error);
    res.status(400).json({ 
      error: error instanceof z.ZodError ? error.errors : "Failed to assign by processor"
    });
  }
});

// Copy assignments from previous month
router.post("/copy", async (req, res) => {
  try {
    const { fromMonth, toMonth, merchantIds } = req.body;
    
    const result = await BulkAssignmentService.copyPreviousMonthAssignments(
      fromMonth,
      toMonth,
      merchantIds
    );
    
    if (result.success) {
      res.json({
        success: true,
        copiedCount: result.copiedCount,
        message: `Successfully copied ${result.copiedCount} assignments`
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error("Error copying assignments:", error);
    res.status(400).json({ error: "Failed to copy assignments" });
  }
});

// Get unassigned merchants summary
router.get("/unassigned", async (req, res) => {
  try {
    const month = req.query.month as string || "2025-05";
    
    const summary = await BulkAssignmentService.getUnassignedSummary(month);
    
    res.json(summary);
  } catch (error) {
    console.error("Error fetching unassigned summary:", error);
    res.status(500).json({ error: "Failed to fetch unassigned summary" });
  }
});

// Get assignment templates
router.get("/templates", async (req, res) => {
  try {
    const templates = BulkAssignmentService.getAssignmentTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

export default router;