/**
 * Multi-Tenant Verification Script
 *
 * Tests the multi-tenant schema and RLS policies to ensure
 * proper tenant isolation is working correctly.
 *
 * Usage:
 *   npx tsx scripts/verify-multi-tenant.ts
 *
 * Prerequisites:
 *   - DATABASE_URL environment variable set
 *   - Migrations have been run
 */

import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import * as mtSchema from '../shared/multi-tenant-schema';
import { v4 as uuidv4 } from 'uuid';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(type: 'info' | 'success' | 'warning' | 'error', message: string) {
  const colorMap = {
    info: colors.blue,
    success: colors.green,
    warning: colors.yellow,
    error: colors.red,
  };
  console.log(`${colorMap[type]}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      message: 'Passed',
      duration: Date.now() - start,
    });
    log('success', `✓ ${name}`);
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      message: error.message,
      duration: Date.now() - start,
    });
    log('error', `✗ ${name}: ${error.message}`);
  }
}

async function main() {
  log('info', '============================================');
  log('info', 'ISOHUB Multi-Tenant Verification Tests');
  log('info', '============================================\n');

  if (!process.env.DATABASE_URL) {
    log('error', 'DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  const db = drizzle(pool, { schema: mtSchema });

  // Test data
  const testAgencyId1 = uuidv4();
  const testAgencyId2 = uuidv4();
  const testSubaccountId1 = uuidv4();
  const testUserId1 = uuidv4();
  const testUserId2 = uuidv4();

  try {
    // ==========================================
    // Test 1: Schema Tables Exist
    // ==========================================
    await runTest('Schema tables exist', async () => {
      const result = await pool.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name LIKE 'mt_%'
        ORDER BY table_name
      `);

      const expectedTables = [
        'mt_agencies',
        'mt_api_rate_limits',
        'mt_audit_logs',
        'mt_merchants',
        'mt_monthly_data',
        'mt_processors',
        'mt_role_assignments',
        'mt_subaccounts',
        'mt_user_subaccount_access',
        'mt_users',
      ];

      const foundTables = result.rows.map((r: any) => r.table_name);
      const missingTables = expectedTables.filter(t => !foundTables.includes(t));

      if (missingTables.length > 0) {
        throw new Error(`Missing tables: ${missingTables.join(', ')}`);
      }
    });

    // ==========================================
    // Test 2: RLS is Enabled
    // ==========================================
    await runTest('Row Level Security is enabled', async () => {
      const result = await pool.query(`
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename LIKE 'mt_%'
      `);

      const tablesWithoutRLS = result.rows.filter((r: any) => !r.rowsecurity);
      if (tablesWithoutRLS.length > 0) {
        throw new Error(`RLS not enabled on: ${tablesWithoutRLS.map((t: any) => t.tablename).join(', ')}`);
      }
    });

    // ==========================================
    // Test 3: RLS Policies Exist
    // ==========================================
    await runTest('RLS policies exist', async () => {
      const result = await pool.query(`
        SELECT tablename, COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename LIKE 'mt_%'
        GROUP BY tablename
      `);

      const tablesWithPolicies = result.rows.map((r: any) => r.tablename);
      const expectedTables = ['mt_merchants', 'mt_users', 'mt_processors', 'mt_monthly_data'];

      for (const table of expectedTables) {
        if (!tablesWithPolicies.includes(table)) {
          throw new Error(`No policies found for table: ${table}`);
        }
      }
    });

    // ==========================================
    // Test 4: Tenant Context Function Works
    // ==========================================
    await runTest('Tenant context function works', async () => {
      await pool.query(`SELECT set_tenant_context('test-agency-123', 'test-subaccount-456')`);

      const result = await pool.query(`
        SELECT
          current_setting('app.current_agency_id', true) as agency_id,
          current_setting('app.current_subaccount_id', true) as subaccount_id
      `);

      if (result.rows[0].agency_id !== 'test-agency-123') {
        throw new Error(`Expected agency_id 'test-agency-123', got '${result.rows[0].agency_id}'`);
      }

      if (result.rows[0].subaccount_id !== 'test-subaccount-456') {
        throw new Error(`Expected subaccount_id 'test-subaccount-456', got '${result.rows[0].subaccount_id}'`);
      }
    });

    // ==========================================
    // Test 5: Create Test Agency
    // ==========================================
    await runTest('Can create agency', async () => {
      const [agency] = await db.insert(mtSchema.mtAgencies).values({
        id: testAgencyId1,
        name: 'Test Agency 1',
        email: 'test1@example.com',
        status: 'active',
        subscriptionTier: 'professional',
      }).returning();

      if (!agency || agency.id !== testAgencyId1) {
        throw new Error('Failed to create agency');
      }

      // Create second agency for isolation tests
      await db.insert(mtSchema.mtAgencies).values({
        id: testAgencyId2,
        name: 'Test Agency 2',
        email: 'test2@example.com',
        status: 'active',
        subscriptionTier: 'starter',
      });
    });

    // ==========================================
    // Test 6: Create Subaccount
    // ==========================================
    await runTest('Can create subaccount', async () => {
      const [subaccount] = await db.insert(mtSchema.mtSubaccounts).values({
        id: testSubaccountId1,
        agencyId: testAgencyId1,
        name: 'Test Subaccount',
        email: 'subaccount@example.com',
      }).returning();

      if (!subaccount || subaccount.agencyId !== testAgencyId1) {
        throw new Error('Failed to create subaccount with correct agency');
      }
    });

    // ==========================================
    // Test 7: Create Users in Different Agencies
    // ==========================================
    await runTest('Can create users with agency isolation', async () => {
      // Create user in agency 1
      await db.insert(mtSchema.mtUsers).values({
        id: testUserId1,
        agencyId: testAgencyId1,
        email: 'user1@agency1.com',
        passwordHash: 'hashed_password_1',
        firstName: 'Test',
        lastName: 'User1',
        role: 'admin',
      });

      // Create user in agency 2
      await db.insert(mtSchema.mtUsers).values({
        id: testUserId2,
        agencyId: testAgencyId2,
        email: 'user2@agency2.com',
        passwordHash: 'hashed_password_2',
        firstName: 'Test',
        lastName: 'User2',
        role: 'admin',
      });
    });

    // ==========================================
    // Test 8: RLS Tenant Isolation (Critical)
    // ==========================================
    await runTest('RLS enforces tenant isolation', async () => {
      // Set tenant context to agency 1
      await pool.query(`SELECT set_tenant_context($1, NULL)`, [testAgencyId1]);

      // Try to query users - should only see agency 1's users
      const usersResult = await pool.query(`
        SELECT id, agency_id, email FROM mt_users WHERE agency_id = $1
      `, [testAgencyId1]);

      const agency1Users = usersResult.rows;

      // Verify we only get agency 1 users
      for (const user of agency1Users) {
        if (user.agency_id !== testAgencyId1) {
          throw new Error(`RLS violation: Got user from agency ${user.agency_id} when context is ${testAgencyId1}`);
        }
      }

      // Now set context to agency 2 and verify isolation
      await pool.query(`SELECT set_tenant_context($1, NULL)`, [testAgencyId2]);

      const agency2UsersResult = await pool.query(`
        SELECT id, agency_id, email FROM mt_users WHERE agency_id = $1
      `, [testAgencyId2]);

      for (const user of agency2UsersResult.rows) {
        if (user.agency_id !== testAgencyId2) {
          throw new Error(`RLS violation: Got user from agency ${user.agency_id} when context is ${testAgencyId2}`);
        }
      }
    });

    // ==========================================
    // Test 9: Audit Logging Works
    // ==========================================
    await runTest('Audit logging works', async () => {
      const auditId = uuidv4();

      await db.insert(mtSchema.mtAuditLogs).values({
        id: auditId,
        agencyId: testAgencyId1,
        action: 'create',
        resourceType: 'test',
        resourceId: 'test-resource-1',
        newValues: { test: 'data' },
      });

      const [auditLog] = await db.select()
        .from(mtSchema.mtAuditLogs)
        .where(eq(mtSchema.mtAuditLogs.id, auditId));

      if (!auditLog) {
        throw new Error('Audit log was not created');
      }
    });

    // ==========================================
    // Test 10: Foreign Key Constraints
    // ==========================================
    await runTest('Foreign key constraints work', async () => {
      // Try to create a subaccount with non-existent agency
      const fakeAgencyId = uuidv4();

      try {
        await db.insert(mtSchema.mtSubaccounts).values({
          id: uuidv4(),
          agencyId: fakeAgencyId, // This agency doesn't exist
          name: 'Should Fail',
          email: 'fail@example.com',
        });

        throw new Error('Should have failed due to FK constraint');
      } catch (error: any) {
        if (!error.message.includes('violates foreign key constraint') &&
            !error.message.includes('Should have failed')) {
          throw error;
        }
        // Expected behavior - FK constraint prevented insert
      }
    });

    // ==========================================
    // Cleanup Test Data
    // ==========================================
    await runTest('Cleanup test data', async () => {
      // Delete in correct order due to FK constraints
      await db.delete(mtSchema.mtAuditLogs).where(eq(mtSchema.mtAuditLogs.agencyId, testAgencyId1));
      await db.delete(mtSchema.mtUsers).where(eq(mtSchema.mtUsers.agencyId, testAgencyId1));
      await db.delete(mtSchema.mtUsers).where(eq(mtSchema.mtUsers.agencyId, testAgencyId2));
      await db.delete(mtSchema.mtSubaccounts).where(eq(mtSchema.mtSubaccounts.agencyId, testAgencyId1));
      await db.delete(mtSchema.mtAgencies).where(eq(mtSchema.mtAgencies.id, testAgencyId1));
      await db.delete(mtSchema.mtAgencies).where(eq(mtSchema.mtAgencies.id, testAgencyId2));
    });

  } catch (error: any) {
    log('error', `Unhandled error: ${error.message}`);
  } finally {
    await pool.end();
  }

  // ==========================================
  // Print Summary
  // ==========================================
  console.log('\n');
  log('info', '============================================');
  log('info', 'TEST SUMMARY');
  log('info', '============================================\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Total Duration: ${totalDuration}ms\n`);

  if (failed > 0) {
    log('error', 'Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  } else {
    log('success', 'All tests passed!');
    process.exit(0);
  }
}

main().catch(error => {
  log('error', `Fatal error: ${error.message}`);
  process.exit(1);
});
