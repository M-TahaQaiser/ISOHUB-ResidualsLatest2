import express from "express";
import { storage } from "./storage";
import { insertAssignmentSchema } from "@shared/schema";

const router = express.Router();

// Get merchants with revenue for a specific month
router.get("/merchants", async (req, res) => {
  try {
    const { month = "2025-05" } = req.query;
    
    const monthlyData = await storage.getMonthlyData(month as string);
    console.log(`Found ${monthlyData.length} monthly data records for ${month}`);
    
    // Log first record to understand structure
    if (monthlyData.length > 0) {
      console.log("First record structure:", JSON.stringify(monthlyData[0], null, 2));
    }
    
    // Group by merchant and sum revenue  
    const merchantRevenue = monthlyData.reduce((acc: any, data) => {
      try {
        // Handle both potential Drizzle structures
        const merchant = data.merchant || data.merchants;
        const monthly = data.monthly_data || data;
        
        if (!merchant || !monthly) {
          console.log("Missing merchant or monthly data:", { merchant: !!merchant, monthly: !!monthly });
          return acc;
        }
        
        const merchantId = merchant.id;
        const revenue = parseFloat(monthly.net || "0");
        
        if (!acc[merchantId]) {
          acc[merchantId] = {
            id: merchant.id,
            mid: merchant.mid,
            legalName: merchant.legalName || merchant.dba || `MID ${merchant.mid}`,
            dba: merchant.dba,
            revenue: 0,
          };
        }
        acc[merchantId].revenue += revenue;
        return acc;
      } catch (error) {
        console.error("Error processing record:", error, data);
        return acc;
      }
    }, {});

    const merchants = Object.values(merchantRevenue);
    console.log(`Returning ${merchants.length} merchants with revenue`);
    res.json(merchants);
  } catch (error) {
    console.error("Error fetching merchants:", error);
    res.status(500).json({ error: "Failed to fetch merchants" });
  }
});

// Get assignments for a specific month
router.get("/", async (req, res) => {
  try {
    const { month = "2025-05" } = req.query;
    const assignments = await storage.getAssignments(month as string);
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// Create a new assignment
router.post("/", async (req, res) => {
  try {
    const validatedData = insertAssignmentSchema.parse(req.body);
    const assignment = await storage.createAssignment(validatedData);
    res.status(201).json(assignment);
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// Update an assignment
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertAssignmentSchema.partial().parse(req.body);
    const assignment = await storage.updateAssignment(parseInt(id), validatedData);
    res.json(assignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ error: "Failed to update assignment" });
  }
});

// Delete an assignment
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteAssignment(parseInt(id));
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

export default router;