import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Roster data from attached file
const rosterData = {
  agents: [
    "Cody Burnell",
    "Emma Barre", 
    "Lindsay Dugger",
    "Cail Brewer",
    "Jane't Howey",
    "James Carner",
    "Mark Pierce",
    "Tammy Huffacker",
    "Troy Esentan",
    "Christy Milton"
  ],
  partners: [
    "Cody Burnell",
    "Bucky Brammel",
    "Centennial Bank",
    "Christy Milton"
  ],
  managers: [
    "Cody Burnell",
    "Stephanie",
    "Christy Milton"
  ],
  companies: [
    "Tracer CoCard",
    "Tracer C2FS"
  ],
  associations: []
};

// GET /api/roster - Get all roster data
router.get("/", async (req, res) => {
  try {
    res.json({
      success: true,
      data: rosterData
    });
  } catch (error) {
    console.error("Error fetching roster:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch roster data"
    });
  }
});

// GET /api/roster/:role - Get roster by role type
router.get("/:role", async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ['agents', 'partners', 'managers', 'companies', 'associations'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role type"
      });
    }
    
    res.json({
      success: true,
      data: rosterData[role as keyof typeof rosterData] || []
    });
  } catch (error) {
    console.error("Error fetching roster by role:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch roster data"
    });
  }
});

// POST /api/roster/:role - Add to roster
router.post("/:role", async (req, res) => {
  try {
    const { role } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required"
      });
    }
    
    const validRoles = ['agents', 'partners', 'managers', 'companies', 'associations'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role type"
      });
    }
    
    const roleArray = rosterData[role as keyof typeof rosterData];
    if (!roleArray.includes(name)) {
      roleArray.push(name);
    }
    
    res.json({
      success: true,
      data: roleArray
    });
  } catch (error) {
    console.error("Error adding to roster:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add to roster"
    });
  }
});

export default router;