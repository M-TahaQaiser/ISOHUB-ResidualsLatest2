#!/usr/bin/env tsx
/**
 * Deployment Validation Script
 * 
 * Run this before/after deployments to verify data integrity
 * 
 * Usage:
 *   npx tsx scripts/validate-deployment.ts
 *   npm run validate:deployment
 * 
 * Exit Codes:
 *   0 - All checks passed
 *   1 - Critical failures detected
 *   2 - Warnings (non-critical issues)
 */

import { db } from '../server/db';
import { organizations } from '../shared/onboarding-schema';
import { agencies, users, processors } from '../shared/schema';
import { 
  EXPECTED_ORGANIZATIONS, 
  getExpectedOrganizationIds,
  getCriticalOrganizationIds 
} from '../server/config/expectedOrganizations';
import { count, sql } from 'drizzle-orm';

interface ValidationResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  critical: boolean;
}

async function runValidation(): Promise<{ success: boolean; exitCode: number }> {
  console.log('\n🔍 ISO Hub Deployment Validation');
  console.log('='.repeat(50));
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Expected Organizations: ${EXPECTED_ORGANIZATIONS.length}`);
  console.log('');

  const results: ValidationResult[] = [];

  console.log('📊 Checking database connectivity...');
  try {
    await db.execute(sql`SELECT 1`);
    results.push({
      name: 'Database Connection',
      status: 'pass',
      message: 'Connected successfully',
      critical: true,
    });
    console.log('  ✅ Database connected');
  } catch (error) {
    results.push({
      name: 'Database Connection',
      status: 'fail',
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      critical: true,
    });
    console.log('  ❌ Database connection FAILED');
    return { success: false, exitCode: 1 };
  }

  console.log('\n📋 Checking expected organizations from config...');
  const criticalOrgIds = getCriticalOrganizationIds();
  
  for (const org of EXPECTED_ORGANIZATIONS) {
    try {
      const result = await db.execute(
        sql`SELECT organization_id, name FROM organizations WHERE organization_id = ${org.id} LIMIT 1`
      );
      
      const isCritical = criticalOrgIds.includes(org.id);
      
      if (result.rows && result.rows.length > 0) {
        results.push({
          name: `Organization: ${org.id}`,
          status: 'pass',
          message: `Found: ${org.name}`,
          critical: isCritical,
        });
        console.log(`  ✅ ${org.id} (${org.name})${isCritical ? ' [CRITICAL]' : ''}`);
      } else {
        results.push({
          name: `Organization: ${org.id}`,
          status: 'fail',
          message: `Missing: ${org.name}`,
          critical: isCritical,
        });
        console.log(`  ❌ MISSING: ${org.id} (${org.name})${isCritical ? ' [CRITICAL]' : ''}`);
      }
    } catch (error) {
      results.push({
        name: `Organization: ${org.id}`,
        status: 'fail',
        message: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: org.critical,
      });
      console.log(`  ❌ ERROR checking ${org.id}`);
    }
  }

  console.log('\n📈 Checking table counts...');
  const tablesToCheck = [
    { name: 'organizations', table: organizations, min: 1, critical: true },
    { name: 'agencies', table: agencies, min: 0, critical: false },
    { name: 'users', table: users, min: 1, critical: true },
    { name: 'processors', table: processors, min: 0, critical: false },
  ];

  for (const { name, table, min, critical } of tablesToCheck) {
    try {
      const [result] = await db.select({ count: count() }).from(table);
      const actualCount = result?.count || 0;
      
      if (actualCount >= min) {
        results.push({
          name: `Table: ${name}`,
          status: 'pass',
          message: `Count: ${actualCount} (min: ${min})`,
          critical,
        });
        console.log(`  ✅ ${name}: ${actualCount} records`);
      } else {
        results.push({
          name: `Table: ${name}`,
          status: critical ? 'fail' : 'warning',
          message: `Count: ${actualCount}, expected minimum ${min}`,
          critical,
        });
        console.log(`  ${critical ? '❌' : '⚠️'} ${name}: ${actualCount} records (expected >= ${min})`);
      }
    } catch (error) {
      results.push({
        name: `Table: ${name}`,
        status: 'fail',
        message: `Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical,
      });
      console.log(`  ❌ ${name}: Query failed`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📝 VALIDATION SUMMARY');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const criticalFailed = results.filter(r => r.status === 'fail' && r.critical).length;

  console.log(`Total Checks: ${results.length}`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed} (${criticalFailed} critical)`);
  console.log(`  ⚠️  Warnings: ${warnings}`);
  console.log('');

  if (criticalFailed > 0) {
    console.log('🚨 DEPLOYMENT VALIDATION FAILED');
    console.log('Critical issues must be resolved before deployment.');
    console.log('\nCritical failures:');
    results.filter(r => r.status === 'fail' && r.critical).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
    return { success: false, exitCode: 1 };
  } else if (warnings > 0 || failed > 0) {
    console.log('⚠️  DEPLOYMENT VALIDATION PASSED WITH WARNINGS');
    console.log('Review warnings before proceeding.');
    return { success: true, exitCode: 2 };
  } else {
    console.log('✅ DEPLOYMENT VALIDATION PASSED');
    console.log('All checks completed successfully.');
    return { success: true, exitCode: 0 };
  }
}

runValidation()
  .then(({ exitCode }) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('\n🚨 Validation script failed:', error);
    process.exit(1);
  });
