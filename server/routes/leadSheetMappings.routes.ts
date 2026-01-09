import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

const router = Router();

// POST /api/lead-sheet-mappings - Save lead sheet column mappings
router.post("/", async (req, res) => {
  try {
    const { fileName, columnMappings, agencyId: reqAgencyId } = req.body;
    const agencyId = reqAgencyId || (req as any).user?.agencyId || 1;

    if (!columnMappings) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Upsert lead sheet mapping (insert or update if exists)
    const result = await db.execute(sql`
      INSERT INTO lead_sheet_mappings (agency_id, file_name, column_mappings, updated_at)
      VALUES (${agencyId}, ${fileName}, ${JSON.stringify(columnMappings)}::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT (agency_id) 
      DO UPDATE SET 
        file_name = EXCLUDED.file_name,
        column_mappings = EXCLUDED.column_mappings,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `);

    res.json({ 
      success: true, 
      message: "Lead sheet mapping saved successfully",
      mapping: result.rows[0]
    });
  } catch (error) {
    console.error("Error saving lead sheet mapping:", error);
    res.status(500).json({ error: "Failed to save lead sheet mapping" });
  }
});

// GET /api/lead-sheet-mappings - Get lead sheet mapping for current agency
router.get("/", async (req, res) => {
  try {
    const agencyId = (req.query.agencyId as string) || (req as any).user?.agencyId || 1;

    const result = await db.execute(sql`
      SELECT * FROM lead_sheet_mappings 
      WHERE agency_id = ${agencyId}
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lead sheet mapping not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching lead sheet mapping:", error);
    res.status(500).json({ error: "Failed to fetch lead sheet mapping" });
  }
});

// DELETE /api/lead-sheet-mappings - Delete lead sheet mapping
router.delete("/", async (req, res) => {
  try {
    const agencyId = (req.query.agencyId as string) || (req as any).user?.agencyId || 1;

    await db.execute(sql`
      DELETE FROM lead_sheet_mappings 
      WHERE agency_id = ${agencyId}
    `);

    res.json({ success: true, message: "Lead sheet mapping deleted" });
  } catch (error) {
    console.error("Error deleting lead sheet mapping:", error);
    res.status(500).json({ error: "Failed to delete lead sheet mapping" });
  }
});

export default router;
