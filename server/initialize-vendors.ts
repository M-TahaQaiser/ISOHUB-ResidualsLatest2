import { storage } from './storage';
import type { InsertVendor } from '@shared/schema';

// Comprehensive vendor data with categories and logos
const vendorData: InsertVendor[] = [
  // Processors
  {
    name: "Payment Advisors",
    category: "Processors",
    description: "Full-service payment processing solutions",
    logoUrl: "https://logo.clearbit.com/paymentadvisors.com",
    loginUrl: "https://portal.paymentadvisors.com"
  },
  {
    name: "Clearent",
    category: "Processors",
    description: "Integrated payment processing platform",
    logoUrl: "https://logo.clearbit.com/clearent.com",
    loginUrl: "https://portal.clearent.com"
  },
  {
    name: "Micamp Solutions",
    category: "Processors",
    description: "Innovative payment processing technology",
    logoUrl: "https://logo.clearbit.com/micamp.com",
    loginUrl: "https://portal.micamp.com"
  },
  {
    name: "Global Payments TSYS",
    category: "Processors",
    description: "Global payment technology solutions",
    logoUrl: "https://logo.clearbit.com/globalpayments.com",
    loginUrl: "https://portal.tsys.com"
  },
  {
    name: "Merchant Lynx",
    category: "Processors",
    description: "Advanced merchant services platform",
    logoUrl: "https://logo.clearbit.com/merchantlynx.com",
    loginUrl: "https://portal.merchantlynx.com"
  },
  {
    name: "First Data",
    category: "Processors",
    description: "Leading payment processing services",
    logoUrl: "https://logo.clearbit.com/firstdata.com",
    loginUrl: "https://portal.firstdata.com"
  },
  {
    name: "Shift4",
    category: "Processors",
    description: "Secure payment processing solutions",
    logoUrl: "https://logo.clearbit.com/shift4.com",
    loginUrl: "https://portal.shift4.com"
  },
  
  // Gateways
  {
    name: "Authorize.Net",
    category: "Gateways",
    description: "Leading payment gateway services",
    logoUrl: "https://logo.clearbit.com/authorize.net",
    loginUrl: "https://account.authorize.net"
  },
  {
    name: "PayPal Gateway",
    category: "Gateways",
    description: "Secure online payment gateway",
    logoUrl: "https://logo.clearbit.com/paypal.com",
    loginUrl: "https://manager.paypal.com"
  },
  {
    name: "Stripe Connect",
    category: "Gateways",
    description: "Developer-friendly payment platform",
    logoUrl: "https://logo.clearbit.com/stripe.com",
    loginUrl: "https://dashboard.stripe.com"
  },
  {
    name: "Square Gateway",
    category: "Gateways",
    description: "Integrated payment gateway solution",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://squareup.com/dashboard"
  },
  {
    name: "Braintree",
    category: "Gateways",
    description: "PayPal's payment gateway platform",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://sandbox.braintreegateway.com"
  },
  {
    name: "WorldPay Gateway",
    category: "Gateways",
    description: "Global payment gateway services",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://secure.worldpay.com"
  },
  {
    name: "Chase Paymentech",
    category: "Gateways",
    description: "Enterprise payment gateway solutions",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://orbitaljr.chasepaymentech.com"
  },
  {
    name: "Elavon Gateway",
    category: "Gateways",
    description: "Secure payment gateway platform",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://portal.elavon.com"
  },
  {
    name: "NMI Gateway",
    category: "Gateways",
    description: "Network Merchants payment gateway",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://secure.nmi.com"
  },
  {
    name: "USAePay Gateway",
    category: "Gateways",
    description: "Comprehensive payment gateway",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://secure.usaepay.com"
  },
  {
    name: "Cardknox Gateway",
    category: "Gateways",
    description: "Secure payment processing gateway",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://portal.cardknox.com"
  },

  // Hardware/Equipment
  {
    name: "Clover POS",
    category: "Hardware/Equipment",
    description: "All-in-one point of sale systems",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://www.clover.com/dashboard"
  },
  {
    name: "Square Terminal",
    category: "Hardware/Equipment",
    description: "Portable payment terminals",
    logoUrl: "https://logo.clearbit.com/squareup.com/terminal-logo.png",
    loginUrl: "https://squareup.com/dashboard/hardware"
  },
  {
    name: "Ingenico Terminals",
    category: "Hardware/Equipment",
    description: "Professional payment terminals",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://portal.ingenico.com"
  },
  {
    name: "Verifone Systems",
    category: "Hardware/Equipment",
    description: "Advanced payment terminal solutions",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://portal.verifone.com"
  },
  {
    name: "PAX Technology",
    category: "Hardware/Equipment",
    description: "Smart payment terminal devices",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://portal.pax.com"
  },
  {
    name: "TSYS Hardware",
    category: "Hardware/Equipment",
    description: "Payment processing hardware solutions",
    logoUrl: "https://logo.clearbit.com/tsys.com/hardware-logo.png",
    loginUrl: "https://hardware.tsys.com"
  },
  {
    name: "Dejavoo Terminals",
    category: "Hardware/Equipment",
    description: "Innovative payment terminal technology",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://portal.dejavoo.com"
  },
  {
    name: "First Data Hardware",
    category: "Hardware/Equipment",
    description: "Payment terminal hardware solutions",
    logoUrl: "https://logo.clearbit.com/firstdata.com/hardware-logo.png",
    loginUrl: "https://hardware.firstdata.com"
  },
  {
    name: "Heartland Hardware",
    category: "Hardware/Equipment",
    description: "POS hardware and terminal solutions",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://hardware.heartlandpaymentsystems.com"
  },
  {
    name: "BBPOS Terminals",
    category: "Hardware/Equipment",
    description: "Mobile payment terminal solutions",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://portal.bbpos.com"
  },
  {
    name: "Mira Payment Terminals",
    category: "Hardware/Equipment",
    description: "Secure payment terminal hardware",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://portal.mira.com"
  },
  {
    name: "CenPOS Hardware",
    category: "Hardware/Equipment",
    description: "Integrated payment hardware solutions",
    logoUrl: "https://logo.clearbit.com/squareup.com",
    loginUrl: "https://hardware.cenpos.com"
  },

  // Internal Tools
  {
    name: "ISOHub Dashboard",
    category: "Internal",
    description: "Main dashboard and analytics platform",
    logoUrl: "/images/isohub-logo.png",
    loginUrl: "/dashboard"
  },
  {
    name: "Residuals Tracker",
    category: "Internal",
    description: "Commission and residual tracking system",
    logoUrl: "/images/residuals-logo.png",
    loginUrl: "/residuals"
  },
  {
    name: "Agent Management",
    category: "Internal",
    description: "Agent onboarding and management tools",
    logoUrl: "/images/agents-logo.png",
    loginUrl: "/iso-ai/agents"
  },
  {
    name: "Reports Builder",
    category: "Internal",
    description: "Custom report generation platform",
    logoUrl: "/images/reports-logo.png",
    loginUrl: "/reports"
  },
  {
    name: "Document Portal",
    category: "Internal",
    description: "Secure document management system",
    logoUrl: "/images/docs-logo.png",
    loginUrl: "/secured-docs"
  },
  {
    name: "Pre-Applications",
    category: "Internal",
    description: "Application management and tracking",
    logoUrl: "/images/preapps-logo.png",
    loginUrl: "/pre-applications"
  }
];

export async function initializeVendors() {
  console.log('Initializing comprehensive vendor database...');
  
  try {
    // Check if vendors already exist
    const existingVendors = await storage.getVendors();
    
    if (existingVendors.length > 0) {
      console.log(`Found ${existingVendors.length} existing vendors, skipping initialization`);
      return existingVendors;
    }

    // Create all vendor categories
    const createdVendors = [];
    for (const vendor of vendorData) {
      try {
        const created = await storage.createVendor(vendor);
        createdVendors.push(created);
        console.log(`Created vendor: ${vendor.name} (${vendor.category})`);
      } catch (error) {
        console.error(`Failed to create vendor ${vendor.name}:`, error);
      }
    }

    console.log(`Successfully initialized ${createdVendors.length} vendors across all categories`);
    
    // Log vendor counts by category
    const categoryCounts = createdVendors.reduce((acc, vendor) => {
      acc[vendor.category] = (acc[vendor.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Vendor counts by category:', categoryCounts);
    
    return createdVendors;
    
  } catch (error) {
    console.error('Failed to initialize vendors:', error);
    throw error;
  }
}