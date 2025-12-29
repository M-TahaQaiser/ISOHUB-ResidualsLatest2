import { db } from '../db';
import { organizations } from '@shared/onboarding-schema';
import { agencies, users, processors } from '@shared/schema';
import { count, sql } from 'drizzle-orm';
import { 
  EXPECTED_ORGANIZATIONS, 
  getExpectedOrganizationIds,
  getCriticalOrganizationIds,
  getOrganizationSeedData,
  type ExpectedOrganization 
} from '../config/expectedOrganizations';

export interface DataIntegrityCheck {
  table: string;
  expectedMinCount: number;
  actualCount: number;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  critical: boolean;
}

export interface OrganizationRecord {
  organizationId: string;
  name: string;
  status: string | null;
  agencyId: number | null;
  hasAgencyLink: boolean;
}

export interface DataIntegrityReport {
  timestamp: string;
  environment: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  checks: DataIntegrityCheck[];
  requiredOrganizations: {
    expected: string[];
    missing: string[];
    present: string[];
    critical: string[];
  };
  allOrganizations: OrganizationRecord[];
  agencyOrganizationMapping: {
    linked: number;
    unlinked: number;
    orphanedAgencies: number;
  };
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  dataSnapshot: {
    organizationCount: number;
    agencyCount: number;
    userCount: number;
    processorCount: number;
    hash: string;
  };
}

const CRITICAL_TABLE_MINIMUMS: Record<string, { min: number; critical: boolean }> = {
  organizations: { min: 1, critical: true },
  agencies: { min: 0, critical: false },
  users: { min: 1, critical: true },
  processors: { min: 0, critical: false },
};

export class DataIntegrityService {
  async runFullIntegrityCheck(): Promise<DataIntegrityReport> {
    const checks: DataIntegrityCheck[] = [];
    const environment = process.env.NODE_ENV || 'development';
    const timestamp = new Date().toISOString();

    const organizationCheck = await this.checkOrganizations();
    const allOrganizations = await this.getAllOrganizations();
    const mappingCheck = await this.checkAgencyOrganizationMapping();
    const dataSnapshot = await this.createDataSnapshot();
    
    const tableChecks = await Promise.all([
      this.checkTableCount('organizations', organizations, CRITICAL_TABLE_MINIMUMS.organizations),
      this.checkTableCount('agencies', agencies, CRITICAL_TABLE_MINIMUMS.agencies),
      this.checkTableCount('users', users, CRITICAL_TABLE_MINIMUMS.users),
      this.checkTableCount('processors', processors, CRITICAL_TABLE_MINIMUMS.processors),
    ]);
    
    checks.push(...tableChecks);

    if (mappingCheck.orphanedAgencies > 0) {
      checks.push({
        table: 'agency-org-mapping',
        expectedMinCount: 0,
        actualCount: mappingCheck.orphanedAgencies,
        status: 'warning',
        message: `${mappingCheck.orphanedAgencies} agencies have no organization link`,
        critical: false,
      });
    }

    const summary = {
      totalChecks: checks.length,
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warning').length,
    };

    const hasCriticalFailure = checks.some(c => c.status === 'fail' && c.critical);
    const hasAnyFailure = summary.failed > 0;
    
    const missingCriticalOrgs = organizationCheck.missing.filter(
      id => organizationCheck.critical.includes(id)
    );
    const hasMissingCriticalOrg = missingCriticalOrgs.length > 0;
    
    const overallStatus: 'healthy' | 'degraded' | 'critical' = 
      hasCriticalFailure || hasMissingCriticalOrg ? 'critical' : 
      hasAnyFailure || organizationCheck.missing.length > 0 ? 'degraded' : 
      'healthy';
    
    if (hasMissingCriticalOrg) {
      console.error(`[DataIntegrity] CRITICAL: Missing critical organizations: ${missingCriticalOrgs.join(', ')}`);
    }

    return {
      timestamp,
      environment,
      overallStatus,
      checks,
      requiredOrganizations: organizationCheck,
      allOrganizations,
      agencyOrganizationMapping: mappingCheck,
      summary,
      dataSnapshot,
    };
  }

  async getAllOrganizations(): Promise<OrganizationRecord[]> {
    try {
      const result = await db.execute(
        sql`SELECT organization_id, name, status, agency_id FROM organizations ORDER BY name`
      );
      
      return (result.rows || []).map((row: any) => ({
        organizationId: row.organization_id,
        name: row.name,
        status: row.status,
        agencyId: row.agency_id,
        hasAgencyLink: row.agency_id !== null,
      }));
    } catch (error) {
      console.error('Error fetching all organizations:', error);
      return [];
    }
  }

  async checkAgencyOrganizationMapping(): Promise<{
    linked: number;
    unlinked: number;
    orphanedAgencies: number;
  }> {
    try {
      const linkedResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM organizations WHERE agency_id IS NOT NULL`
      );
      const unlinkedResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM organizations WHERE agency_id IS NULL`
      );
      const orphanedResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM agencies a 
            WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.agency_id = a.id)`
      );

      return {
        linked: Number((linkedResult.rows?.[0] as any)?.count || 0),
        unlinked: Number((unlinkedResult.rows?.[0] as any)?.count || 0),
        orphanedAgencies: Number((orphanedResult.rows?.[0] as any)?.count || 0),
      };
    } catch (error) {
      console.error('Error checking agency-organization mapping:', error);
      return { linked: 0, unlinked: 0, orphanedAgencies: 0 };
    }
  }

  async createDataSnapshot(): Promise<{
    organizationCount: number;
    agencyCount: number;
    userCount: number;
    processorCount: number;
    hash: string;
  }> {
    try {
      const [orgCount] = await db.select({ count: count() }).from(organizations);
      const [agencyCount] = await db.select({ count: count() }).from(agencies);
      const [userCount] = await db.select({ count: count() }).from(users);
      const [processorCount] = await db.select({ count: count() }).from(processors);

      const counts = {
        organizationCount: orgCount?.count || 0,
        agencyCount: agencyCount?.count || 0,
        userCount: userCount?.count || 0,
        processorCount: processorCount?.count || 0,
      };

      const hash = Buffer.from(
        `${counts.organizationCount}-${counts.agencyCount}-${counts.userCount}-${counts.processorCount}`
      ).toString('base64');

      return { ...counts, hash };
    } catch (error) {
      console.error('Error creating data snapshot:', error);
      return {
        organizationCount: 0,
        agencyCount: 0,
        userCount: 0,
        processorCount: 0,
        hash: 'error',
      };
    }
  }

  async compareSnapshots(
    snapshot1: { hash: string },
    snapshot2: { hash: string }
  ): Promise<{
    match: boolean;
    message: string;
  }> {
    const match = snapshot1.hash === snapshot2.hash;
    return {
      match,
      message: match 
        ? 'Data snapshots match' 
        : 'Data snapshots differ - potential sync issue detected',
    };
  }

  async checkOrganizations(): Promise<{
    expected: string[];
    missing: string[];
    present: string[];
    critical: string[];
  }> {
    const expected = getExpectedOrganizationIds();
    const critical = getCriticalOrganizationIds();
    const present: string[] = [];
    const missing: string[] = [];

    for (const org of EXPECTED_ORGANIZATIONS) {
      try {
        const result = await db.execute(
          sql`SELECT organization_id FROM organizations WHERE organization_id = ${org.id} LIMIT 1`
        );
        if (result.rows && result.rows.length > 0) {
          present.push(org.id);
        } else {
          missing.push(org.id);
        }
      } catch (error) {
        console.error(`Error checking organization ${org.id}:`, error);
        missing.push(org.id);
      }
    }

    return { expected, missing, present, critical };
  }

  private async checkTableCount(
    tableName: string, 
    table: any, 
    config: { min: number; critical: boolean }
  ): Promise<DataIntegrityCheck> {
    try {
      const [result] = await db.select({ count: count() }).from(table);
      const actualCount = result?.count || 0;
      
      let status: 'pass' | 'fail' | 'warning';
      let message: string;

      if (actualCount >= config.min) {
        status = 'pass';
        message = `Table has ${actualCount} records (minimum: ${config.min})`;
      } else if (config.critical) {
        status = 'fail';
        message = `CRITICAL: Table has ${actualCount} records, expected at least ${config.min}`;
      } else {
        status = 'warning';
        message = `Table has ${actualCount} records, expected at least ${config.min}`;
      }

      return {
        table: tableName,
        expectedMinCount: config.min,
        actualCount,
        status,
        message,
        critical: config.critical,
      };
    } catch (error) {
      return {
        table: tableName,
        expectedMinCount: config.min,
        actualCount: -1,
        status: 'fail',
        message: `Failed to query table: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: config.critical,
      };
    }
  }

  async seedRequiredOrganizations(): Promise<{
    seeded: string[];
    skipped: string[];
    errors: string[];
  }> {
    const seeded: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    // First, discover what columns exist in the organizations table
    let availableColumns: string[] = [];
    try {
      const columnsResult = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'organizations' AND table_schema = 'public'
      `);
      availableColumns = (columnsResult.rows || []).map((r: any) => r.column_name);
      console.log(`[DataIntegrity] Available columns in organizations: ${availableColumns.join(', ')}`);
    } catch (error) {
      console.error(`[DataIntegrity] Could not discover columns:`, error);
    }

    for (const expectedOrg of EXPECTED_ORGANIZATIONS) {
      const seedData = expectedOrg.seedData;
      if (!seedData) {
        console.log(`[DataIntegrity] No seed data for ${expectedOrg.id}, skipping`);
        skipped.push(expectedOrg.id);
        continue;
      }

      try {
        const existing = await db.execute(
          sql`SELECT organization_id FROM organizations WHERE organization_id = ${expectedOrg.id} LIMIT 1`
        );

        if (existing.rows && existing.rows.length > 0) {
          skipped.push(expectedOrg.id);
          continue;
        }

        // Build dynamic insert based on available columns
        // Start with the absolute minimum required columns
        const hasAdminContact = availableColumns.includes('admin_contact_name');
        const hasSettings = availableColumns.includes('settings');
        const hasIndustry = availableColumns.includes('industry');
        const hasTimestamps = availableColumns.includes('created_at');
        
        if (hasAdminContact) {
          // Full schema - use all columns
          const settingsJson = JSON.stringify(seedData.settings || {});
          await db.execute(sql`
            INSERT INTO organizations (
              organization_id, 
              name, 
              admin_contact_name, 
              admin_contact_email, 
              admin_contact_phone, 
              industry, 
              status, 
              settings,
              created_at,
              updated_at
            ) VALUES (
              ${expectedOrg.id},
              ${expectedOrg.name},
              ${seedData.adminContactName},
              ${seedData.adminContactEmail},
              ${seedData.adminContactPhone || null},
              ${seedData.industry || null},
              ${seedData.status || 'active'},
              ${settingsJson}::jsonb,
              NOW(),
              NOW()
            )
          `);
        } else {
          // Minimal schema - only organization_id and name (absolute minimum)
          // Check what status column type exists
          const hasStatusColumn = availableColumns.includes('status');
          
          if (hasStatusColumn && hasTimestamps) {
            await db.execute(sql`
              INSERT INTO organizations (organization_id, name, status, created_at, updated_at)
              VALUES (${expectedOrg.id}, ${expectedOrg.name}, ${seedData.status || 'active'}, NOW(), NOW())
            `);
          } else if (hasStatusColumn) {
            await db.execute(sql`
              INSERT INTO organizations (organization_id, name, status)
              VALUES (${expectedOrg.id}, ${expectedOrg.name}, ${seedData.status || 'active'})
            `);
          } else {
            await db.execute(sql`
              INSERT INTO organizations (organization_id, name)
              VALUES (${expectedOrg.id}, ${expectedOrg.name})
            `);
          }
        }
        
        seeded.push(expectedOrg.id);
        console.log(`[DataIntegrity] Seeded organization: ${expectedOrg.id} (${expectedOrg.name})`);
      } catch (error) {
        const errorMsg = `Failed to seed ${expectedOrg.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`[DataIntegrity] ${errorMsg}`);
      }
    }

    return { seeded, skipped, errors };
  }

  async getQuickStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    organizationCount: number;
    missingRequired: number;
    missingCritical: number;
    lastChecked: string;
  }> {
    const orgCheck = await this.checkOrganizations();
    const [orgCount] = await db.select({ count: count() }).from(organizations);
    
    const missingCritical = orgCheck.missing.filter(
      id => orgCheck.critical.includes(id)
    ).length;
    
    const status = missingCritical > 0 ? 'critical' : 
                   orgCheck.missing.length > 0 ? 'degraded' : 'healthy';

    return {
      status,
      organizationCount: orgCount?.count || 0,
      missingRequired: orgCheck.missing.length,
      missingCritical,
      lastChecked: new Date().toISOString(),
    };
  }

  async getOrganizationList(): Promise<string[]> {
    const allOrgs = await this.getAllOrganizations();
    return allOrgs.map(org => org.organizationId);
  }

  async validateAgainstExpectedList(expectedOrganizationIds: string[]): Promise<{
    valid: boolean;
    missing: string[];
    extra: string[];
    message: string;
  }> {
    const currentOrgs = await this.getOrganizationList();
    const missing = expectedOrganizationIds.filter(id => !currentOrgs.includes(id));
    const extra = currentOrgs.filter(id => !expectedOrganizationIds.includes(id));

    const valid = missing.length === 0;

    let message = valid
      ? 'All expected organizations are present'
      : `Missing ${missing.length} expected organizations: ${missing.join(', ')}`;

    if (extra.length > 0) {
      message += `. Note: ${extra.length} additional organizations found: ${extra.join(', ')}`;
    }

    return { valid, missing, extra, message };
  }
}

export const dataIntegrityService = new DataIntegrityService();
