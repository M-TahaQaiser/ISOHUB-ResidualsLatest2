import { Router } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Create test users for role demonstration
router.post("/test-users/create", async (req, res) => {
  try {
    const testUsers = [
      {
        id: "admin-test-001",
        firstName: "Admin",
        lastName: "User",
        email: "admin@test.com",
        role: "Admin",
        organizationId: "org-test-001",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "agent-test-001", 
        firstName: "Sales",
        lastName: "Agent",
        email: "agent@test.com",
        role: "Agent",
        organizationId: "org-test-001",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "manager-test-001",
        firstName: "Team",
        lastName: "Manager", 
        email: "manager@test.com",
        role: "Manager",
        organizationId: "org-test-001",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const results = [];
    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, userData.email));

        if (existingUser.length === 0) {
          const [user] = await db.insert(users).values(userData).returning();
          results.push({ created: true, user });
        } else {
          results.push({ created: false, user: existingUser[0] });
        }
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
        results.push({ created: false, error: error.message });
      }
    }

    res.json({
      success: true,
      message: "Test users processed",
      results
    });
  } catch (error) {
    console.error("Error creating test users:", error);
    res.status(500).json({ error: "Failed to create test users" });
  }
});

// Switch user role for testing
router.post("/test-users/:userId/switch-role", async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;

    const validRoles = ['SuperAdmin', 'Admin', 'Manager', 'TeamLeader', 'Agent', 'Partner'];
    
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    const [updatedUser] = await db
      .update(users)
      .set({ 
        role: newRole,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: `User role switched to ${newRole}`,
      user: updatedUser
    });
  } catch (error) {
    console.error("Error switching user role:", error);
    res.status(500).json({ error: "Failed to switch user role" });
  }
});

// Get test user credentials for easy login switching
router.get("/test-users/credentials", async (req, res) => {
  try {
    const testUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role
      })
      .from(users)
      .where(eq(users.organizationId, "org-test-001"));

    const credentials = testUsers.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      loginId: user.id
    }));

    res.json({
      credentials,
      instructions: "Use these test accounts to demonstrate role-based access control"
    });
  } catch (error) {
    console.error("Error fetching test credentials:", error);
    res.status(500).json({ error: "Failed to fetch test credentials" });
  }
});

export default router;