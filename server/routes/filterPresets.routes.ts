import { Router } from "express";
import { db } from "../db";
import { filterPresets, insertFilterPresetSchema } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Get all filter presets for current user
router.get("/", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const presets = await db
      .select()
      .from(filterPresets)
      .where(eq(filterPresets.userId, userId))
      .orderBy(filterPresets.createdAt);
    
    res.json({ presets });
  } catch (error: any) {
    console.error("Error fetching filter presets:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new filter preset
router.post("/", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { name, filters } = req.body;
    
    // Validate input
    const validated = insertFilterPresetSchema.parse({
      userId,
      name,
      filters
    });
    
    const [preset] = await db
      .insert(filterPresets)
      .values(validated)
      .returning();
    
    res.json({ preset });
  } catch (error: any) {
    console.error("Error creating filter preset:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a filter preset
router.delete("/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const presetId = parseInt(req.params.id);
    
    // Delete only if it belongs to the current user
    const deleted = await db
      .delete(filterPresets)
      .where(and(
        eq(filterPresets.id, presetId),
        eq(filterPresets.userId, userId)
      ))
      .returning();
    
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Preset not found or unauthorized" });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting filter preset:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
