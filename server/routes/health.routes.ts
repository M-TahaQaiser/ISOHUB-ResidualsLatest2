import { Router } from 'express';
import { dataIntegrityService } from '../services/DataIntegrityService';
import { runStartupDataSeeding, validateDeploymentData } from '../utils/startupDataSeeder';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

router.get('/data-integrity', async (req, res) => {
  try {
    const report = await dataIntegrityService.runFullIntegrityCheck();
    
    const statusCode = report.overallStatus === 'critical' ? 503 : 
                       report.overallStatus === 'degraded' ? 200 : 200;
    
    res.status(statusCode).json(report);
  } catch (error) {
    console.error('Data integrity check failed:', error);
    res.status(500).json({
      error: 'Failed to run data integrity check',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/data-integrity/organizations', async (req, res) => {
  try {
    const allOrganizations = await dataIntegrityService.getAllOrganizations();
    const organizationIds = allOrganizations.map(org => org.organizationId);
    
    res.json({
      count: allOrganizations.length,
      organizations: allOrganizations,
      organizationIds,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to list organizations:', error);
    res.status(500).json({
      error: 'Failed to list organizations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/data-integrity/validate-list', async (req, res) => {
  try {
    const { expectedOrganizationIds } = req.body;
    
    if (!Array.isArray(expectedOrganizationIds)) {
      return res.status(400).json({
        error: 'expectedOrganizationIds must be an array of organization IDs',
      });
    }
    
    const result = await dataIntegrityService.validateAgainstExpectedList(expectedOrganizationIds);
    
    res.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Validation failed:', error);
    res.status(500).json({
      error: 'Failed to validate organization list',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/data-integrity/quick', async (req, res) => {
  try {
    const status = await dataIntegrityService.getQuickStatus();
    res.json(status);
  } catch (error) {
    console.error('Quick status check failed:', error);
    res.status(500).json({
      error: 'Failed to get quick status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/data-integrity/seed', async (req, res) => {
  try {
    const result = await dataIntegrityService.seedRequiredOrganizations();
    
    res.json({
      success: result.errors.length === 0,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Seeding failed:', error);
    res.status(500).json({
      error: 'Failed to seed required data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/data-integrity/validate-deployment', async (req, res) => {
  try {
    const result = await validateDeploymentData();
    
    const statusCode = result.success ? 200 : 503;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Deployment validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate deployment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/status', async (req, res) => {
  try {
    const quickStatus = await dataIntegrityService.getQuickStatus();
    
    res.json({
      service: 'ISO Hub Residuals',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: quickStatus.status,
      organizations: quickStatus.organizationCount,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      service: 'ISO Hub Residuals',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/schema-status', async (req, res) => {
  try {
    const requiredTables = [
      'organizations', 'users', 'processors', 'merchants', 
      'monthly_data', 'mid_role_assignments', 'pre_applications'
    ];
    
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const existingTables = (result.rows || []).map((r: any) => r.table_name);
    
    const tableStatus: Record<string, { exists: boolean; rowCount?: number }> = {};
    
    for (const table of requiredTables) {
      const exists = existingTables.includes(table);
      tableStatus[table] = { exists };
      
      if (exists) {
        try {
          const countResult = await db.execute(
            sql.raw(`SELECT COUNT(*) as count FROM "${table}"`)
          );
          tableStatus[table].rowCount = parseInt((countResult.rows?.[0] as any)?.count || '0');
        } catch {
          tableStatus[table].rowCount = 0;
        }
      }
    }
    
    const missingTables = requiredTables.filter(t => !tableStatus[t].exists);
    const emptyTables = requiredTables.filter(t => tableStatus[t].exists && tableStatus[t].rowCount === 0);
    
    res.json({
      status: missingTables.length === 0 ? 'complete' : 'incomplete',
      environment: process.env.NODE_ENV || 'development',
      tables: tableStatus,
      summary: {
        total: requiredTables.length,
        existing: requiredTables.length - missingTables.length,
        missing: missingTables,
        empty: emptyTables,
      },
      instructions: missingTables.length > 0 
        ? 'Run `npm run db:push` on Railway to sync schema, then POST to /api/admin/seed-demo-data (requires admin auth)'
        : emptyTables.includes('merchants') || emptyTables.includes('monthly_data')
          ? 'Tables exist but are empty. POST to /api/admin/seed-demo-data (requires admin auth) to populate demo data'
          : 'Schema and data are ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Schema status check failed:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
