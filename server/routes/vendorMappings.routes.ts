import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

const router = Router();

// POST /api/vendor-mappings - Save vendor column mappings
router.post("/", async (req, res) => {
  try {
    const { vendorId, vendorName, vendorCategory, fileName, columnMappings, agencyId: reqAgencyId } = req.body;
    const agencyId = reqAgencyId || (req as any).user?.agencyId || 1; // Default to 1 for demo

    if (!vendorId || !vendorName || !columnMappings) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Upsert vendor mapping (insert or update if exists)
    const result = await db.execute(sql`
      INSERT INTO vendor_mappings (agency_id, vendor_id, vendor_name, vendor_category, file_name, column_mappings, updated_at)
      VALUES (${agencyId}, ${vendorId}, ${vendorName}, ${vendorCategory}, ${fileName}, ${JSON.stringify(columnMappings)}::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT (agency_id, vendor_id) 
      DO UPDATE SET 
        vendor_name = EXCLUDED.vendor_name,
        vendor_category = EXCLUDED.vendor_category,
        file_name = EXCLUDED.file_name,
        column_mappings = EXCLUDED.column_mappings,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `);

    res.json({ 
      success: true, 
      message: "Vendor mapping saved successfully",
      mapping: result.rows[0]
    });
  } catch (error) {
    console.error("Error saving vendor mapping:", error);
    res.status(500).json({ error: "Failed to save vendor mapping" });
  }
});

// GET /api/vendor-mappings - Get all vendor mappings for current agency
router.get("/", async (req, res) => {
  try {
    const agencyId = (req.query.agencyId as string) || (req as any).user?.agencyId || 1;

    const result = await db.execute(sql`
      SELECT * FROM vendor_mappings 
      WHERE agency_id = ${agencyId}
      ORDER BY vendor_category, vendor_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching vendor mappings:", error);
    res.status(500).json({ error: "Failed to fetch vendor mappings" });
  }
});

// GET /api/vendor-mappings/:vendorId - Get mapping for specific vendor
router.get("/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;
    const agencyId = (req.query.agencyId as string) || (req as any).user?.agencyId || 1;

    const result = await db.execute(sql`
      SELECT * FROM vendor_mappings 
      WHERE agency_id = ${agencyId} AND vendor_id = ${vendorId}
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendor mapping not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching vendor mapping:", error);
    res.status(500).json({ error: "Failed to fetch vendor mapping" });
  }
});

// DELETE /api/vendor-mappings/:vendorId - Delete vendor mapping
router.delete("/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;
    const agencyId = (req.query.agencyId as string) || (req as any).user?.agencyId || 1;

    await db.execute(sql`
      DELETE FROM vendor_mappings 
      WHERE agency_id = ${agencyId} AND vendor_id = ${vendorId}
    `);

    res.json({ success: true, message: "Vendor mapping deleted" });
  } catch (error) {
    console.error("Error deleting vendor mapping:", error);
    res.status(500).json({ error: "Failed to delete vendor mapping" });
  }
});

export default router;
