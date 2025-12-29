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
  { name: "Payment Advisors", category: "Processors", description: "Full-service payment processing solutions", logoUrl: "/logos/payment-advisors.png", loginUrl: "https://pa.paymentadvisors.com", status: "active" },
  { name: "Clearent", category: "Processors", description: "Secure payment processing platform", logoUrl: "/logos/clearent.png", loginUrl: "https://portal.clearent.com", status: "active" },
  { name: "Global Payments TSYS", category: "Processors", description: "Global payment technology solutions", logoUrl: "/logos/global-payments.png", loginUrl: "https://tsysacquiring.com", status: "active" },
  { name: "Merchant Lynx", category: "Processors", description: "Merchant services and payment solutions", logoUrl: "/logos/merchant-lynx.png", loginUrl: "https://portal.merchantlynx.com", status: "active" },
  { name: "First Data", category: "Processors", description: "Payment processing and merchant services", logoUrl: "/logos/first-data.png", loginUrl: "https://www.firstdata.com", status: "active" },
  { name: "Shift4", category: "Processors", description: "Payment processing solutions", logoUrl: "/logos/shift4.png", loginUrl: "https://shift4.com", status: "active" },
  { name: "Heartland", category: "Processors", description: "Payment processing and point-of-sale solutions", logoUrl: "/logos/heartland.png", loginUrl: "https://www.heartlandpaymentsystems.com", status: "active" },
  
  // Gateways
  { name: "Authorize.Net", category: "Gateways", description: "Payment gateway solutions", logoUrl: "/logos/authorize-net.png", loginUrl: "https://account.authorize.net", status: "active" },
  { name: "Stripe", category: "Gateways", description: "Online payment processing", logoUrl: "/logos/stripe.png", loginUrl: "https://dashboard.stripe.com", status: "active" },
  { name: "PayPal", category: "Gateways", description: "Digital payment platform", logoUrl: "/logos/paypal.png", loginUrl: "https://www.paypal.com", status: "active" },
  { name: "Square", category: "Gateways", description: "Point of sale and payment solutions", logoUrl: "/logos/square.png", loginUrl: "https://squareup.com", status: "active" },
  { name: "Braintree", category: "Gateways", description: "Mobile and web payment systems", logoUrl: "/logos/braintree.png", loginUrl: "https://www.braintreegateway.com", status: "active" },
  { name: "Worldpay", category: "Gateways", description: "Global payment technology", logoUrl: "/logos/worldpay.png", loginUrl: "https://online.worldpay.com", status: "active" },
  { name: "Adyen", category: "Gateways", description: "Global payment platform", logoUrl: "/logos/adyen.png", loginUrl: "https://ca-live.adyen.com", status: "active" },
  { name: "CyberSource", category: "Gateways", description: "Payment management platform", logoUrl: "/logos/cybersource.png", loginUrl: "https://businesscenter.cybersource.com", status: "active" },
  { name: "BlueSnap", category: "Gateways", description: "Global payment orchestration", logoUrl: "/logos/bluesnap.png", loginUrl: "https://cp.bluesnap.com", status: "active" },
  { name: "NMI", category: "Gateways", description: "Payment gateway and processing", logoUrl: "/logos/nmi.png", loginUrl: "https://secure.nmi.com", status: "active" },
  { name: "USAePay", category: "Gateways", description: "Payment gateway solutions", logoUrl: "/logos/usaepay.png", loginUrl: "https://secure.usaepay.com", status: "active" },
  
  // Hardware/Equipment
  { name: "Ingenico", category: "Hardware/Equipment", description: "Payment terminals and solutions", logoUrl: "/logos/ingenico.png", loginUrl: "https://www.ingenico.com", status: "active" },
  { name: "Verifone", category: "Hardware/Equipment", description: "Electronic payment solutions", logoUrl: "/logos/verifone.png", loginUrl: "https://www.verifone.com", status: "active" },
  { name: "PAX Technology", category: "Hardware/Equipment", description: "Payment terminal manufacturer", logoUrl: "/logos/pax.png", loginUrl: "https://www.pax.us", status: "active" },
  { name: "Clover", category: "Hardware/Equipment", description: "Point of sale systems", logoUrl: "/logos/clover.png", loginUrl: "https://www.clover.com", status: "active" },
  { name: "Dejavoo", category: "Hardware/Equipment", description: "Payment processing terminals", logoUrl: "/logos/dejavoo.png", loginUrl: "https://www.dejavoo.com", status: "active" },
  { name: "BBPOS", category: "Hardware/Equipment", description: "Mobile payment terminals", logoUrl: "/logos/bbpos.png", loginUrl: "https://www.bbpos.com", status: "active" },
  { name: "Castles Technology", category: "Hardware/Equipment", description: "Payment terminal solutions", logoUrl: "/logos/castles.png", loginUrl: "https://www.castlestech.com", status: "active" },
  { name: "ID TECH", category: "Hardware/Equipment", description: "Payment device manufacturer", logoUrl: "/logos/idtech.png", loginUrl: "https://www.idtechproducts.com", status: "active" },
  { name: "Magensa", category: "Hardware/Equipment", description: "Payment security solutions", logoUrl: "/logos/magensa.png", loginUrl: "https://www.magensa.net", status: "active" },
  { name: "NewPOS Technology", category: "Hardware/Equipment", description: "POS terminal solutions", logoUrl: "/logos/newpos.png", loginUrl: "https://www.newpos.com", status: "active" },
  { name: "Spire Payments", category: "Hardware/Equipment", description: "Payment processing hardware", logoUrl: "/logos/spire.png", loginUrl: "https://www.spirepayments.com", status: "active" },
  { name: "WisePad", category: "Hardware/Equipment", description: "Mobile payment readers", logoUrl: "/logos/wisepad.png", loginUrl: "https://www.wisepad.com", status: "active" },
  
  // Internal
  { name: "ISOHub CRM", category: "Internal", description: "Customer relationship management", logoUrl: "/logos/isohub.png", loginUrl: "https://crm.isohub.io", status: "active" },
  { name: "ISOHub Analytics", category: "Internal", description: "Business intelligence platform", logoUrl: "/logos/isohub.png", loginUrl: "https://analytics.isohub.io", status: "active" },
  { name: "ISOHub Documents", category: "Internal", description: "Document management system", logoUrl: "/logos/isohub.png", loginUrl: "https://docs.isohub.io", status: "active" },
  { name: "ISOHub Support", category: "Internal", description: "Customer support portal", logoUrl: "/logos/isohub.png", loginUrl: "https://support.isohub.io", status: "active" },
  { name: "ISOHub Training", category: "Internal", description: "Training and certification", logoUrl: "/logos/isohub.png", loginUrl: "https://training.isohub.io", status: "active" },
  { name: "ISOHub API", category: "Internal", description: "Developer API access", logoUrl: "/logos/isohub.png", loginUrl: "https://api.isohub.io", status: "active" },
] as const;

// Initialize vendors if none exist
async function initializeVendors() {
  try {
    const existingVendors = await db.select().from(vendors).limit(1);
    
    if (existingVendors.length === 0) {
      console.log("Initializing vendors database...");
      
      for (const vendor of DEFAULT_VENDORS) {
        await db.insert(vendors).values({
          ...vendor,
          contactEmail: `support@${vendor.name.toLowerCase().replace(/\s+/g, '')}.com`,
          integrationNotes: `Integration notes for ${vendor.name}`,
        });
      }
      
      console.log(`Initialized ${DEFAULT_VENDORS.length} vendors`);
    }
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