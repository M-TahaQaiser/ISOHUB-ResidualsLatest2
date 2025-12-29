// Vendor Migration Service - Real vendor data from ISOHub.io system
export interface ISOHubVendor {
  id: string;
  name: string;
  category: 'Processors' | 'Gateways' | 'Hardware/Equipment' | 'Internal';
  description: string;
  loginUrl: string;
  logoUrl?: string;
  isActive: boolean;
}

// Real vendor data from ISOHub.io production system
export const ISOHUB_VENDORS: ISOHubVendor[] = [
  // Payment Processors
  {
    id: 'proc_payment_advisors',
    name: 'Payment Advisors',
    category: 'Processors',
    description: 'Full-service payment processing solutions with competitive rates',
    loginUrl: 'https://portal.paymentadvisors.com',
    logoUrl: 'https://logo.clearbit.com/paymentadvisors.com',
    isActive: true
  },
  {
    id: 'proc_clearent',
    name: 'Clearent',
    category: 'Processors',
    description: 'Integrated payment processing platform with advanced reporting',
    loginUrl: 'https://portal.clearent.com',
    logoUrl: 'https://logo.clearbit.com/clearent.com',
    isActive: true
  },
  {
    id: 'proc_first_data',
    name: 'First Data (Fiserv)',
    category: 'Processors',
    description: 'Global payment processing leader, now part of Fiserv',
    loginUrl: 'https://manager.firstdata.com',
    logoUrl: 'https://logo.clearbit.com/fiserv.com',
    isActive: true
  },
  {
    id: 'proc_global_payments',
    name: 'Global Payments TSYS',
    category: 'Processors',
    description: 'Enterprise payment processing with global reach',
    loginUrl: 'https://portal.globalpayments.com',
    logoUrl: 'https://logo.clearbit.com/globalpayments.com',
    isActive: true
  },
  {
    id: 'proc_merchant_lynx',
    name: 'Merchant Lynx',
    category: 'Processors',
    description: 'Advanced merchant services platform with flexible pricing',
    loginUrl: 'https://portal.merchantlynx.com',
    logoUrl: 'https://logo.clearbit.com/merchantlynx.com',
    isActive: true
  },
  {
    id: 'proc_shift4',
    name: 'Shift4',
    category: 'Processors',
    description: 'Secure payment processing with POS integration',
    loginUrl: 'https://portal.shift4.com',
    logoUrl: 'https://logo.clearbit.com/shift4.com',
    isActive: true
  },
  {
    id: 'proc_heartland',
    name: 'Heartland Payment Systems',
    category: 'Processors',
    description: 'End-to-end payment processing solutions',
    loginUrl: 'https://manager.heartlandpaymentsystems.com',
    logoUrl: 'https://logo.clearbit.com/heartlandpaymentsystems.com',
    isActive: true
  },

  // Payment Gateways
  {
    id: 'gate_authorize_net',
    name: 'Authorize.Net',
    category: 'Gateways',
    description: 'Leading payment gateway with robust API and security features',
    loginUrl: 'https://account.authorize.net',
    logoUrl: 'https://logo.clearbit.com/authorize.net',
    isActive: true
  },
  {
    id: 'gate_paypal',
    name: 'PayPal Payments Pro',
    category: 'Gateways',
    description: 'Secure online payment gateway with global acceptance',
    loginUrl: 'https://manager.paypal.com',
    logoUrl: 'https://logo.clearbit.com/paypal.com',
    isActive: true
  },
  {
    id: 'gate_stripe',
    name: 'Stripe Connect',
    category: 'Gateways',
    description: 'Developer-friendly payment platform with advanced features',
    loginUrl: 'https://dashboard.stripe.com',
    logoUrl: 'https://logo.clearbit.com/stripe.com',
    isActive: true
  },
  {
    id: 'gate_braintree',
    name: 'Braintree',
    category: 'Gateways',
    description: 'PayPal-owned gateway platform with mobile-first design',
    loginUrl: 'https://sandbox.braintreegateway.com',
    logoUrl: 'https://logo.clearbit.com/braintreepayments.com',
    isActive: true
  },
  {
    id: 'gate_worldpay',
    name: 'WorldPay Gateway',
    category: 'Gateways',
    description: 'Global payment gateway services with multi-currency support',
    loginUrl: 'https://secure.worldpay.com',
    logoUrl: 'https://logo.clearbit.com/worldpay.com',
    isActive: true
  },
  {
    id: 'gate_nmi',
    name: 'NMI (Network Merchants)',
    category: 'Gateways',
    description: 'Comprehensive payment gateway with virtual terminal',
    loginUrl: 'https://secure.nmi.com',
    logoUrl: 'https://logo.clearbit.com/nmi.com',
    isActive: true
  },
  {
    id: 'gate_usaepay',
    name: 'USAePay Gateway',
    category: 'Gateways',
    description: 'Feature-rich payment gateway with advanced reporting',
    loginUrl: 'https://secure.usaepay.com',
    logoUrl: 'https://logo.clearbit.com/usaepay.com',
    isActive: true
  },

  // Hardware & Equipment
  {
    id: 'hard_clover',
    name: 'Clover POS',
    category: 'Hardware/Equipment',
    description: 'All-in-one point of sale systems with app marketplace',
    loginUrl: 'https://www.clover.com/dashboard',
    logoUrl: 'https://logo.clearbit.com/clover.com',
    isActive: true
  },
  {
    id: 'hard_square',
    name: 'Square Terminal',
    category: 'Hardware/Equipment',
    description: 'Portable payment terminals with integrated processing',
    loginUrl: 'https://squareup.com/dashboard/hardware',
    logoUrl: 'https://logo.clearbit.com/squareup.com',
    isActive: true
  },
  {
    id: 'hard_ingenico',
    name: 'Ingenico Terminals',
    category: 'Hardware/Equipment',
    description: 'Professional payment terminals for retail environments',
    loginUrl: 'https://portal.ingenico.com',
    logoUrl: 'https://logo.clearbit.com/ingenico.com',
    isActive: true
  },
  {
    id: 'hard_verifone',
    name: 'Verifone Systems',
    category: 'Hardware/Equipment',
    description: 'Advanced payment terminal solutions with cloud connectivity',
    loginUrl: 'https://portal.verifone.com',
    logoUrl: 'https://logo.clearbit.com/verifone.com',
    isActive: true
  },
  {
    id: 'hard_pax',
    name: 'PAX Technology',
    category: 'Hardware/Equipment',
    description: 'Smart payment terminal devices with Android OS',
    loginUrl: 'https://portal.pax.com',
    logoUrl: 'https://logo.clearbit.com/pax.com',
    isActive: true
  },
  {
    id: 'hard_dejavoo',
    name: 'Dejavoo Terminals',
    category: 'Hardware/Equipment',
    description: 'Innovative payment terminal technology with cloud-based management',
    loginUrl: 'https://portal.dejavoo.com',
    logoUrl: 'https://logo.clearbit.com/dejavoo.com',
    isActive: true
  },

  // Internal Systems
  {
    id: 'int_dashboard',
    name: 'ISOHub Dashboard',
    category: 'Internal',
    description: 'Main dashboard and analytics platform for ISO management',
    loginUrl: '/dashboard',
    logoUrl: '/api/logo/isohub',
    isActive: true
  },
  {
    id: 'int_residuals',
    name: 'Residuals Tracker',
    category: 'Internal',
    description: 'Commission and residual tracking system with automated reporting',
    loginUrl: '/residuals',
    logoUrl: '/api/logo/residuals',
    isActive: true
  },
  {
    id: 'int_iso_ai',
    name: 'ISO-AI Agent Management',
    category: 'Internal',
    description: 'AI-powered agent onboarding and portfolio management',
    loginUrl: '/iso-ai/agents',
    logoUrl: '/api/logo/iso-ai',
    isActive: true
  },
  {
    id: 'int_reports',
    name: 'Reports Builder',
    category: 'Internal',
    description: 'Custom report generation platform with AI insights',
    loginUrl: '/reports',
    logoUrl: '/api/logo/reports',
    isActive: true
  },
  {
    id: 'int_docs',
    name: 'Secured Document Portal',
    category: 'Internal',
    description: 'Secure document management system for sensitive files',
    loginUrl: '/secured-docs',
    logoUrl: '/api/logo/docs',
    isActive: true
  },
  {
    id: 'int_preapps',
    name: 'Pre-Applications',
    category: 'Internal',
    description: 'Application management and merchant onboarding tracking',
    loginUrl: '/pre-applications',
    logoUrl: '/api/logo/preapps',
    isActive: true
  }
];

export class VendorMigrationService {
  
  static getVendorsByCategory(): Record<string, ISOHubVendor[]> {
    const categories: Record<string, ISOHubVendor[]> = {
      'Processors': [],
      'Gateways': [], 
      'Hardware/Equipment': [],
      'Internal': []
    };

    ISOHUB_VENDORS.forEach(vendor => {
      if (categories[vendor.category]) {
        categories[vendor.category].push(vendor);
      }
    });

    return categories;
  }

  static getVendorCount(): Record<string, number> {
    const categories = this.getVendorsByCategory();
    return {
      'Processors': categories['Processors'].length,
      'Gateways': categories['Gateways'].length,
      'Hardware/Equipment': categories['Hardware/Equipment'].length,
      'Internal': categories['Internal'].length
    };
  }

  static getAllVendors(): ISOHubVendor[] {
    return ISOHUB_VENDORS;
  }

  static getVendorById(id: string): ISOHubVendor | undefined {
    return ISOHUB_VENDORS.find(vendor => vendor.id === id);
  }
}