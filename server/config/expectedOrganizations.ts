/**
 * Expected Organizations Configuration
 * 
 * This file defines the organizations that MUST exist in both dev and production.
 * Update this list when adding new organizations that should be deployed.
 * 
 * Usage:
 * 1. Add new organizations here when they're created in dev
 * 2. Run deployment validation before deploying
 * 3. Health check will warn if any are missing
 */

export interface ExpectedOrganization {
  id: string;
  name: string;
  critical: boolean;
  seedData?: {
    adminContactName: string;
    adminContactEmail: string;
    adminContactPhone?: string;
    industry?: string;
    status?: 'setup' | 'active' | 'inactive';
    settings?: Record<string, any>;
  };
}

export const EXPECTED_ORGANIZATIONS: ExpectedOrganization[] = [
  {
    id: 'org-demo-isohub-2025',
    name: 'DEMO ISO Agency',
    critical: true,
    seedData: {
      adminContactName: 'Demo Admin',
      adminContactEmail: 'demo@isohub.io',
      adminContactPhone: '555-DEMO',
      industry: 'Payment Processing',
      status: 'active',
      settings: { isDemo: true },
    },
  },
  {
    id: 'org-86f76df1',
    name: 'Tracer',
    critical: true,
    seedData: {
      adminContactName: 'Tracer Admin',
      adminContactEmail: 'admin@tracer.io',
      adminContactPhone: '555-0001',
      industry: 'Payment Processing',
      status: 'active',
      settings: {},
    },
  },
];

export function getExpectedOrganizationIds(): string[] {
  return EXPECTED_ORGANIZATIONS.map(org => org.id);
}

export function getCriticalOrganizationIds(): string[] {
  return EXPECTED_ORGANIZATIONS.filter(org => org.critical).map(org => org.id);
}

export function getOrganizationSeedData(id: string): ExpectedOrganization['seedData'] | undefined {
  const org = EXPECTED_ORGANIZATIONS.find(o => o.id === id);
  return org?.seedData;
}
