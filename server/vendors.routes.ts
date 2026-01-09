import { Router } from "express";
import { db } from "./db";
import { vendors, insertVendorSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Vendor categories and initial data
const VENDOR_CATEGORIES = ["Processors", "Gateways", "Hardware/Equipment", "Internal"] as const;

const DEFAULT_VENDORS = [
  // Processors
  { name: "Other (+ another)", category: "Processors", description: "Custom processor option", logoUrl: "/logos/other.png", loginUrl: "", status: "active" },
  { name: "Adyen", category: "Processors", description: "Global payment platform", logoUrl: "/logos/adyen.png", loginUrl: "https://ca-live.adyen.com", status: "active" },
  { name: "Affinipay", category: "Processors", description: "Payment solutions for professionals", logoUrl: "/logos/affinipay.png", loginUrl: "https://www.affinipay.com", status: "active" },
  { name: "CardConnect", category: "Processors", description: "Payment processing solutions", logoUrl: "/logos/cardconnect.png", loginUrl: "https://cardconnect.com", status: "active" },
  { name: "Chase", category: "Processors", description: "Chase payment processing", logoUrl: "/logos/chase.png", loginUrl: "https://www.chase.com", status: "active" },
  { name: "Clearent", category: "Processors", description: "Secure payment processing platform", logoUrl: "/logos/clearent.png", loginUrl: "https://portal.clearent.com", status: "active" },
  { name: "Elavon", category: "Processors", description: "Payment processing services", logoUrl: "/logos/elavon.png", loginUrl: "https://www.elavon.com", status: "active" },
  { name: "FiServ", category: "Processors", description: "Financial services technology", logoUrl: "/logos/fiserv.png", loginUrl: "https://www.fiserv.com", status: "active" },
  { name: "Global / TSYS", category: "Processors", description: "Global payment technology solutions", logoUrl: "/logos/global-payments.png", loginUrl: "https://tsysacquiring.com", status: "active" },
  { name: "Heartland", category: "Processors", description: "Payment processing and point-of-sale solutions", logoUrl: "/logos/heartland.png", loginUrl: "https://www.heartlandpaymentsystems.com", status: "active" },
  { name: "Leap Payments", category: "Processors", description: "Payment processing platform", logoUrl: "/logos/leap-payments.png", loginUrl: "https://www.leappayments.com", status: "active" },
  { name: "MerchantLynx", category: "Processors", description: "Merchant services and payment solutions", logoUrl: "/logos/merchant-lynx.png", loginUrl: "https://portal.merchantlynx.com", status: "active" },
  { name: "MiCamp", category: "Processors", description: "Payment processing services", logoUrl: "/logos/micamp.png", loginUrl: "https://www.micamp.com", status: "active" },
  { name: "North American Bancard", category: "Processors", description: "Payment processing solutions", logoUrl: "/logos/nab.png", loginUrl: "https://www.nabancard.com", status: "active" },
  { name: "Paya", category: "Processors", description: "Integrated payment solutions", logoUrl: "/logos/paya.png", loginUrl: "https://www.paya.com", status: "active" },
  { name: "Priority Payments", category: "Processors", description: "Payment processing services", logoUrl: "/logos/priority-payments.png", loginUrl: "https://www.prioritypayments.com", status: "active" },
  { name: "Shift4", category: "Processors", description: "Payment processing solutions", logoUrl: "/logos/shift4.png", loginUrl: "https://shift4.com", status: "active" },
  { name: "Worldpay", category: "Processors", description: "Global payment technology", logoUrl: "/logos/worldpay.png", loginUrl: "https://online.worldpay.com", status: "active" },
  
  // Gateways
  { name: "Other (+ another)", category: "Gateways", description: "Custom gateway option", logoUrl: "/logos/other.png", loginUrl: "", status: "active" },
  { name: "Affirm", category: "Gateways", description: "Buy now pay later gateway", logoUrl: "/logos/affirm.png", loginUrl: "https://www.affirm.com", status: "active" },
  { name: "Authorize.net", category: "Gateways", description: "Payment gateway solutions", logoUrl: "/logos/authorize-net.png", loginUrl: "https://account.authorize.net", status: "active" },
  { name: "Hyfin", category: "Gateways", description: "Payment gateway platform", logoUrl: "/logos/hyfin.png", loginUrl: "https://www.hyfin.com", status: "active" },
  { name: "NMI", category: "Gateways", description: "Payment gateway and processing", logoUrl: "/logos/nmi.png", loginUrl: "https://secure.nmi.com", status: "active" },
  { name: "Rectangle Health", category: "Gateways", description: "Healthcare payment solutions", logoUrl: "/logos/rectangle-health.png", loginUrl: "https://www.rectanglehealth.com", status: "active" },
  { name: "TracerPay", category: "Gateways", description: "Payment gateway services", logoUrl: "/logos/tracerpay.png", loginUrl: "https://www.tracerpay.com", status: "active" },
  { name: "WooCommerce", category: "Gateways", description: "E-commerce payment gateway", logoUrl: "/logos/woocommerce.png", loginUrl: "https://woocommerce.com", status: "active" },
  
  // Hardware/Equipment (POS)
  { name: "Other (+ another)", category: "Hardware/Equipment", description: "Custom hardware option", logoUrl: "/logos/other.png", loginUrl: "", status: "active" },
  { name: "DeJavoo", category: "Hardware/Equipment", description: "Payment processing terminals", logoUrl: "/logos/dejavoo.png", loginUrl: "https://www.dejavoo.com", status: "active" },
  { name: "Ingenico", category: "Hardware/Equipment", description: "Payment terminals and solutions", logoUrl: "/logos/ingenico.png", loginUrl: "https://www.ingenico.com", status: "active" },
  { name: "Pax", category: "Hardware/Equipment", description: "Payment terminal manufacturer", logoUrl: "/logos/pax.png", loginUrl: "https://www.pax.us", status: "active" },
  { name: "Valor", category: "Hardware/Equipment", description: "POS terminal solutions", logoUrl: "/logos/valor.png", loginUrl: "https://www.valor-pos.com", status: "active" },
  { name: "Verifone", category: "Hardware/Equipment", description: "Electronic payment solutions", logoUrl: "/logos/verifone.png", loginUrl: "https://www.verifone.com", status: "active" },
  
  // Internal
  { name: "ISOHub CRM", category: "Internal", description: "Customer relationship management", logoUrl: "/logos/isohub.png", loginUrl: "https://crm.isohub.io", status: "active" },
  { name: "ISOHub Analytics", category: "Internal", description: "Business intelligence platform", logoUrl: "/logos/isohub.png", loginUrl: "https://analytics.isohub.io", status: "active" },
  { name: "ISOHub Documents", category: "Internal", description: "Document management system", logoUrl: "/logos/isohub.png", loginUrl: "https://docs.isohub.io", status: "active" },
  { name: "ISOHub Support", category: "Internal", description: "Customer support portal", logoUrl: "/logos/isohub.png", loginUrl: "https://support.isohub.io", status: "active" },
  { name: "ISOHub Training", category: "Internal", description: "Training and certification", logoUrl: "/logos/isohub.png", loginUrl: "https://training.isohub.io", status: "active" },
  { name: "ISOHub API", category: "Internal", description: "Developer API access", logoUrl: "/logos/isohub.png", loginUrl: "https://api.isohub.io", status: "active" },
] as const;

// Initialize vendors - clear and reseed every time
async function initializeVendors() {
  try {
    // Clear all existing vendors
    await db.delete(vendors);
    console.log("Cleared existing vendors...");
    
    // Insert all vendors from DEFAULT_VENDORS
    console.log("Initializing vendors database...");
    
    for (const vendor of DEFAULT_VENDORS) {
      await db.insert(vendors).values({
        ...vendor,
        contactEmail: `support@${vendor.name.toLowerCase().replace(/\s+/g, '').replace(/[()]/g, '').replace(/\+/g, '')}.com`,
        integrationNotes: `Integration notes for ${vendor.name}`,
      });
    }
    
    console.log(`✅ Initialized ${DEFAULT_VENDORS.length} vendors`);
  } catch (error) {
    console.error("Error initializing vendors:", error);
  }
}

// GET /api/vendors - Get all vendors
router.get("/", async (req, res) => {
  try {
    // Initialize vendors if needed
    await initializeVendors();
    
    const allVendors = await db.select().from(vendors).orderBy(vendors.category, vendors.name);
    
    // Transform for frontend
    const transformedVendors = allVendors.map(vendor => ({
      ...vendor,
      lastUpdated: vendor.updatedAt.toLocaleDateString(),
    }));
    
    res.json(transformedVendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// GET /api/vendors/categories - Get vendor counts by category
router.get("/categories", async (req, res) => {
  try {
    await initializeVendors();
    
    const allVendors = await db.select().from(vendors);
    
    const categoryCounts = VENDOR_CATEGORIES.reduce((acc, category) => {
      acc[category] = allVendors.filter(v => v.category === category).length;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      categories: VENDOR_CATEGORIES,
      counts: categoryCounts,
      total: allVendors.length
    });
  } catch (error) {
    console.error("Error fetching vendor categories:", error);
    res.status(500).json({ error: "Failed to fetch vendor categories" });
  }
});

// GET /api/vendors/:id - Get single vendor
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await db.select().from(vendors).where(eq(vendors.id, parseInt(id))).limit(1);
    
    if (vendor.length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    
    const transformedVendor = {
      ...vendor[0],
      lastUpdated: vendor[0].updatedAt.toLocaleDateString(),
    };
    
    res.json(transformedVendor);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

// POST /api/vendors - Create new vendor
router.post("/", async (req, res) => {
  try {
    const validatedData = insertVendorSchema.parse(req.body);
    
    const [newVendor] = await db.insert(vendors).values({
      ...validatedData,
      updatedAt: new Date(),
    }).returning();
    
    const transformedVendor = {
      ...newVendor,
      lastUpdated: newVendor.updatedAt.toLocaleDateString(),
    };
    
    res.status(201).json(transformedVendor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid vendor data", details: error.errors });
    }
    console.error("Error creating vendor:", error);
    res.status(500).json({ error: "Failed to create vendor" });
  }
});

// PUT /api/vendors/:id - Update vendor
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertVendorSchema.partial().parse(req.body);
    
    const [updatedVendor] = await db.update(vendors)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, parseInt(id)))
      .returning();
    
    if (!updatedVendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    
    const transformedVendor = {
      ...updatedVendor,
      lastUpdated: updatedVendor.updatedAt.toLocaleDateString(),
    };
    
    res.json(transformedVendor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid vendor data", details: error.errors });
    }
    console.error("Error updating vendor:", error);
    res.status(500).json({ error: "Failed to update vendor" });
  }
});

// DELETE /api/vendors/:id - Delete vendor
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [deletedVendor] = await db.delete(vendors)
      .where(eq(vendors.id, parseInt(id)))
      .returning();
    
    if (!deletedVendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    
    res.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({ error: "Failed to delete vendor" });
  }
});

export { router as vendorsRouter };