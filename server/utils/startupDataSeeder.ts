import { dataIntegrityService } from '../services/DataIntegrityService';
import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function runStartupDataSeeding(): Promise<void> {
  console.log('[Startup] Running data integrity check...');
  
  try {
    const quickStatus = await dataIntegrityService.getQuickStatus();
    console.log(`[Startup] Current status: ${quickStatus.status}`);
    console.log(`[Startup] Organizations: ${quickStatus.organizationCount}, Missing required: ${quickStatus.missingRequired}`);

    if (quickStatus.missingRequired > 0) {
      console.log('[Startup] Missing required organizations detected, seeding...');
      const seedResult = await dataIntegrityService.seedRequiredOrganizations();
      
      if (seedResult.seeded.length > 0) {
        console.log(`[Startup] Seeded ${seedResult.seeded.length} organizations: ${seedResult.seeded.join(', ')}`);
      }
      if (seedResult.skipped.length > 0) {
        console.log(`[Startup] Skipped ${seedResult.skipped.length} (already exist): ${seedResult.skipped.join(', ')}`);
      }
      if (seedResult.errors.length > 0) {
        console.error(`[Startup] Errors during seeding: ${seedResult.errors.join('; ')}`);
      }
    } else {
      console.log('[Startup] All required organizations present, no seeding needed');
    }

    // Check if demo data needs seeding (merchants and monthly_data should have data)
    await seedDemoDataIfNeeded();

    const finalStatus = await dataIntegrityService.getQuickStatus();
    console.log(`[Startup] Final data integrity status: ${finalStatus.status}`);
    
    if (finalStatus.status === 'critical') {
      console.error('[Startup] WARNING: Data integrity is in CRITICAL state!');
    }
  } catch (error) {
    console.error('[Startup] Error during data integrity check/seeding:', error);
  }
}

async function seedDemoDataIfNeeded(): Promise<void> {
  try {
    // Check if merchants table exists and has data
    const merchantsResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM merchants
    `);
    const merchantCount = parseInt((merchantsResult.rows?.[0] as any)?.count || '0');
    
    // Check if monthly_data table exists and has data
    const monthlyResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM monthly_data
    `);
    const monthlyCount = parseInt((monthlyResult.rows?.[0] as any)?.count || '0');
    
    console.log(`[Startup] Demo data check: ${merchantCount} merchants, ${monthlyCount} monthly records`);
    
    // If both are empty or very low, seed demo data
    if (merchantCount < 10 && monthlyCount < 50) {
      console.log('[Startup] Demo data appears empty, seeding...');
      
      try {
        const { seedDemoData } = await import('./seedDemoData');
        const result = await seedDemoData();
        console.log(`[Startup] Demo data seeded successfully:`);
        console.log(`   - Processors: ${result.processors}`);
        console.log(`   - Merchants: ${result.merchants}`);
        console.log(`   - Monthly records: ${result.monthlyRecords}`);
        console.log(`   - Role assignments: ${result.roleAssignments}`);
      } catch (seedError) {
        console.error('[Startup] Failed to seed demo data:', seedError);
      }
    } else {
      console.log('[Startup] Demo data already exists, skipping seed');
    }
  } catch (error) {
    // Tables might not exist, that's okay
    console.log('[Startup] Could not check demo data status (tables may not exist):', 
      error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function validateDeploymentData(): Promise<{
  success: boolean;
  report: any;
}> {
  console.log('[Deploy] Running deployment data validation...');
  
  try {
    const report = await dataIntegrityService.runFullIntegrityCheck();
    
    console.log(`[Deploy] Environment: ${report.environment}`);
    console.log(`[Deploy] Overall status: ${report.overallStatus}`);
    console.log(`[Deploy] Checks: ${report.summary.passed}/${report.summary.totalChecks} passed`);
    
    if (report.requiredOrganizations.missing.length > 0) {
      console.error(`[Deploy] MISSING ORGANIZATIONS: ${report.requiredOrganizations.missing.join(', ')}`);
    }
    
    for (const check of report.checks) {
      if (check.status === 'fail') {
        console.error(`[Deploy] FAILED: ${check.table} - ${check.message}`);
      } else if (check.status === 'warning') {
        console.warn(`[Deploy] WARNING: ${check.table} - ${check.message}`);
      }
    }
    
    const success = report.overallStatus !== 'critical' && report.requiredOrganizations.missing.length === 0;
    
    if (!success) {
      console.error('[Deploy] DEPLOYMENT VALIDATION FAILED - Data integrity issues detected!');
    } else {
      console.log('[Deploy] Deployment validation passed');
    }
    
    return { success, report };
  } catch (error) {
    console.error('[Deploy] Error during deployment validation:', error);
    return { 
      success: false, 
      report: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      } 
    };
  }
}
