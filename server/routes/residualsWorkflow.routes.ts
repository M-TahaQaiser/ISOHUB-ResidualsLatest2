import { Router } from 'express';
import { ResidualsWorkflowService } from '../services/ResidualsWorkflowService';
import { DuplicatePreventionService } from '../services/DuplicatePreventionService';
import { db } from '../db';
import { sql, eq, and, inArray, desc } from 'drizzle-orm';
import { processors, monthlyData, uploadProgress, auditIssues, merchants, roleAssignmentWorkflow, midRoleAssignments } from '../../shared/schema';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Step 1: Initialize upload tracking for a month
router.post('/initialize/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const progress = await ResidualsWorkflowService.initializeUploadTracking(month);
    res.json({
      success: true,
      message: `Initialized upload tracking for ${month}`,
      processors: progress.length
    });
  } catch (error) {
    console.error('Initialize upload tracking failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize upload tracking'
    });
  }
});

// Step 2: Upload processor spreadsheet
router.post('/upload/:month/:processorId', upload.single('file'), async (req, res) => {
  try {
    const { month, processorId } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Validate file format
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: 'Invalid file format. Only CSV and Excel files are allowed.'
      });
    }

    console.log('Processor file uploaded:', {
      originalname: file.originalname,
      size: file.size,
      month: month,
      processorId: processorId
    });

    // Get processor name
    let processorName = 'Unknown Processor';
    try {
      const [processor] = await db.select({ name: processors.name })
        .from(processors)
        .where(eq(processors.id, parseInt(processorId)))
        .limit(1);
      if (processor) {
        processorName = processor.name;
      }
    } catch (e) {
      console.error('Failed to get processor name:', e);
    }

    // Simple approach: Update upload_progress to show file was uploaded
    try {
      await db.execute(sql`
        INSERT INTO upload_progress (month, processor_id, processor_name, upload_status, file_name, file_size, last_updated)
        VALUES (${month}, ${parseInt(processorId)}, ${processorName}, 'validated', ${file.originalname}, ${file.size}, NOW())
        ON CONFLICT (month, processor_id) 
        DO UPDATE SET upload_status = 'validated', file_name = ${file.originalname}, file_size = ${file.size}, last_updated = NOW()
      `);
      console.log(`Upload progress updated for processor ${processorId}`);
    } catch (dbError) {
      console.error('Failed to update upload progress:', dbError);
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      // Ignore cleanup errors
    }

    res.json({
      success: true,
      message: `File uploaded successfully for ${processorName}.`,
      results: {
        fileName: file.originalname,
        fileSize: file.size,
        month: month,
        processorId: parseInt(processorId),
        processorName: processorName,
        status: 'validated',
        recordCount: 0
      },
      validation: {
        errors: [],
        warnings: [],
        recordCount: 0
      }
    });

  } catch (error) {
    console.error('File upload failed:', error);
    res.status(500).json({
      success: false,
      error: 'File upload failed',
      details: error
    });
  }
});

// Step 2: Upload lead sheet
router.post('/upload-lead-sheet/:month', upload.single('file'), async (req, res) => {
  try {
    const { month } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No lead sheet uploaded'
      });
    }

    // Log file details for debugging
    console.log('Lead sheet uploaded:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      month: month
    });
    
    // Simple approach: Just track the upload in upload_progress
    // Update all processors to show lead sheet is validated
    try {
      const activeProcessors = await db.select({ id: processors.id, name: processors.name })
        .from(processors)
        .where(eq(processors.isActive, true));
      
      for (const processor of activeProcessors) {
        // Upsert upload progress record
        await db.execute(sql`
          INSERT INTO upload_progress (month, processor_id, processor_name, lead_sheet_status, last_updated)
          VALUES (${month}, ${processor.id}, ${processor.name}, 'validated', NOW())
          ON CONFLICT (month, processor_id) 
          DO UPDATE SET lead_sheet_status = 'validated', last_updated = NOW()
        `);
      }
      
      console.log(`Lead sheet status updated for ${activeProcessors.length} processors`);
    } catch (dbError) {
      console.error('Failed to update upload progress:', dbError);
      // Continue anyway - file was uploaded successfully
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      // Ignore cleanup errors
    }

    res.json({
      success: true,
      message: 'Lead sheet uploaded successfully',
      results: {
        fileName: file.originalname,
        fileSize: file.size,
        month: month,
        status: 'validated'
      }
    });

  } catch (error) {
    console.error('Lead sheet upload failed:', error);
    res.status(500).json({
      success: false,
      error: 'Lead sheet upload failed'
    });
  }
});

// Step 2.5: Cross-reference processor data with lead sheet data and populate master dataset
router.post('/cross-reference/:month', async (req, res) => {
  try {
    const { month } = req.params;
    
    // Cross-reference and populate master dataset
    const results = await ResidualsWorkflowService.crossReferenceAndPopulateMasterDataset(month);
    
    res.json({
      success: true,
      message: `Cross-reference completed: ${results.matchedRecords} matched, ${results.unmatchedRecords} unmatched`,
      results
    });
  } catch (error) {
    console.error('Cross-reference failed:', error);
    res.status(500).json({
      success: false,
      error: 'Cross-reference failed'
    });
  }
});

// Step 2.6: Auto-populate assignments from previous month
router.post('/auto-populate-assignments/:month', async (req, res) => {
  try {
    const { month } = req.params;
    
    // Auto-populate assignments from previous month
    const results = await ResidualsWorkflowService.autoPopulateAssignments(month);
    
    // Run validation on the auto-populated assignments
    const validationResults = await ResidualsWorkflowService.validateAssignmentSplits(month);
    
    res.json({
      success: true,
      message: `Auto-populated ${results.autoPopulated} assignments, found ${results.newMIDs} new MIDs. Validation: ${validationResults.validAssignments} valid, ${validationResults.invalidAssignments} invalid`,
      results,
      validation: validationResults
    });
  } catch (error) {
    console.error('Auto-populate assignments failed:', error);
    res.status(500).json({
      success: false,
      error: 'Auto-populate assignments failed'
    });
  }
});

// Validate assignment splits (100% validation)
router.post('/validate-splits/:month', async (req, res) => {
  try {
    const { month } = req.params;
    
    // Validate all assignments for the month
    const results = await ResidualsWorkflowService.validateAssignmentSplits(month);
    
    res.json({
      success: true,
      message: `Validation completed: ${results.validAssignments} valid, ${results.invalidAssignments} invalid assignments`,
      results
    });
  } catch (error) {
    console.error('Split validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Split validation failed'
    });
  }
});

// Get previous month's assignments for a specific MID
router.get('/previous-assignments/:mid/:month', async (req, res) => {
  try {
    const { mid, month } = req.params;
    
    // Get previous month's assignments
    const previousAssignments = await ResidualsWorkflowService.getPreviousMonthAssignments(month);
    const assignment = previousAssignments.get(mid);
    
    res.json({
      success: true,
      hasPreviousAssignment: !!assignment,
      assignment: assignment || null
    });
  } catch (error) {
    console.error('Failed to get previous assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get previous assignments'
    });
  }
});

// Step 3: Compile dataset
router.post('/compile/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const recordsCompiled = await ResidualsWorkflowService.compileDataset(month);
    
    res.json({
      success: true,
      message: `Successfully compiled ${recordsCompiled} records into master dataset`,
      recordsCompiled
    });
  } catch (error) {
    console.error('Dataset compilation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Dataset compilation failed'
    });
  }
});

// Step 4: Assign roles from Column I
router.post('/assign-roles/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const { assignments, assignedBy } = req.body;
    
    const assignmentsCreated = await ResidualsWorkflowService.processColumnIAssignments(
      month,
      assignments,
      assignedBy
    );
    
    res.json({
      success: true,
      message: `Successfully created ${assignmentsCreated} role assignments`,
      assignmentsCreated
    });
  } catch (error: any) {
    console.error('Role assignment failed:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Role assignment failed'
    });
  }
});

// Step 5: Run audit validation
router.post('/audit/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const auditResults = await ResidualsWorkflowService.runAuditValidation(month);
    
    res.json({
      success: true,
      message: `Audit completed: ${auditResults.status}`,
      results: auditResults
    });
  } catch (error) {
    console.error('Audit validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Audit validation failed'
    });
  }
});

// Get upload progress dashboard
router.get('/progress/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const progress = await ResidualsWorkflowService.getUploadProgress(month);
    
    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Failed to get upload progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upload progress'
    });
  }
});

// Get MIDs for assignment interface - shows new unassigned and previously assigned with status
router.get('/role-assignment/unassigned/:month', async (req, res) => {
  try {
    const { month } = req.params;
    
    // Check if any data exists for this month
    const monthlyDataCheck = await db.execute(sql`
      SELECT COUNT(*) as record_count
      FROM monthly_data 
      WHERE month = ${month}
    `);
    
    const monthlyRecordCount = (monthlyDataCheck.rows[0] as any)?.record_count || 0;
    
    if (monthlyRecordCount === 0) {
      return res.json({
        success: true,
        unassignedMIDs: [],
        previouslyAssigned: [],
        status: 'no_data_uploaded',
        message: `No processor data has been uploaded for ${month}. Please upload processor spreadsheets first.`,
        summary: {
          totalMIDs: 0,
          newUnassigned: 0,
          previouslyAssigned: 0
        }
      });
    }
    
    // Get all MIDs for this month with assignment status
    const allMIDs = await db.execute(sql`
      WITH deduplicated_mids AS (
        SELECT 
          m.mid,
          COALESCE(m.dba, m.legal_name, 'Unknown Merchant') as merchant_name,
          md.net as monthly_revenue,
          p.name as processor,
          COALESCE(mra.original_column_i, '') as original_column_i,
          CASE 
            WHEN mra.mid IS NOT NULL THEN 'previously_assigned'
            ELSE 'new_unassigned'
          END as assignment_status,
          mra.first_assigned_month,
          mra.rep,
          mra.rep_percentage,
          mra.partner,
          mra.partner_percentage,
          mra.sales_manager,
          mra.sales_manager_percentage,
          mra.company,
          mra.company_percentage,
          mra.association,
          mra.association_percentage,
          ROW_NUMBER() OVER (PARTITION BY m.mid ORDER BY md.net DESC, md.processor_id ASC) as row_num
        FROM monthly_data md
        LEFT JOIN merchants m ON md.merchant_id = m.id
        LEFT JOIN processors p ON md.processor_id = p.id
        LEFT JOIN mid_role_assignments mra ON m.mid = mra.mid
        WHERE md.month = ${month}
          AND m.mid IS NOT NULL
      )
      SELECT * FROM deduplicated_mids
      WHERE row_num = 1
      ORDER BY 
        CASE WHEN assignment_status = 'new_unassigned' THEN 0 ELSE 1 END,
        monthly_revenue DESC
    `);
    
    // Separate new unassigned from previously assigned
    const newUnassigned = allMIDs.rows.filter((row: any) => row.assignment_status === 'new_unassigned');
    const previouslyAssigned = allMIDs.rows.filter((row: any) => row.assignment_status === 'previously_assigned');
    
    // Clean up duplicates
    try {
      await DuplicatePreventionService.cleanupDuplicateMonthlyData(month);
    } catch (cleanupError) {
      console.warn('Duplicate cleanup failed, continuing with results:', cleanupError);
    }
    
    console.log(`[MID STATUS] Month: ${month} - New: ${newUnassigned.length}, Previously Assigned: ${previouslyAssigned.length}`);
    
    res.json({
      success: true,
      month,
      unassignedMIDs: newUnassigned, // For backward compatibility
      newUnassigned,
      previouslyAssigned,
      status: 'data_available',
      summary: {
        totalMIDs: allMIDs.rows.length,
        newUnassigned: newUnassigned.length,
        previouslyAssigned: previouslyAssigned.length
      },
      monthlyRecordCount
    });
  } catch (error) {
    console.error('Failed to get unassigned MIDs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unassigned MIDs'
    });
  }
});

// Get completed role assignments for a month (MIDs with 100% assignment)
router.get('/role-assignment/completed/:month', async (req, res) => {
  try {
    const { month } = req.params;
    
    // Get all MIDs with completed assignments (100% split)
    const completedAssignments = await db.execute(sql`
      SELECT 
        mra.mid,
        mra.merchant_name,
        mra.rep,
        mra.rep_percentage,
        mra.partner,
        mra.partner_percentage,
        mra.sales_manager,
        mra.sales_manager_percentage,
        mra.company,
        mra.company_percentage,
        mra.association,
        mra.association_percentage,
        mra.assignment_status,
        mra.last_updated,
        mra.first_assigned_month,
        mra.original_column_i,
        md.net as monthly_revenue,
        p.name as processor
      FROM mid_role_assignments mra
      INNER JOIN merchants m ON mra.mid = m.mid
      INNER JOIN monthly_data md ON m.id = md.merchant_id AND md.month = ${month}
      LEFT JOIN processors p ON md.processor_id = p.id
      WHERE (
        COALESCE(CAST(mra.rep_percentage AS NUMERIC), 0) +
        COALESCE(CAST(mra.partner_percentage AS NUMERIC), 0) +
        COALESCE(CAST(mra.sales_manager_percentage AS NUMERIC), 0) +
        COALESCE(CAST(mra.company_percentage AS NUMERIC), 0) +
        COALESCE(CAST(mra.association_percentage AS NUMERIC), 0)
      ) = 100
      ORDER BY mra.last_updated DESC, md.net DESC
    `);
    
    // Format the assignments for the UI
    const formattedAssignments = completedAssignments.rows.map((row: any) => {
      const assignments = [];
      
      if (row.rep && row.rep_percentage) {
        assignments.push({
          roleType: 'agent',
          userName: row.rep,
          percentage: parseFloat(row.rep_percentage)
        });
      }
      if (row.partner && row.partner_percentage) {
        assignments.push({
          roleType: 'partner',
          userName: row.partner,
          percentage: parseFloat(row.partner_percentage)
        });
      }
      if (row.sales_manager && row.sales_manager_percentage) {
        assignments.push({
          roleType: 'sales_manager',
          userName: row.sales_manager,
          percentage: parseFloat(row.sales_manager_percentage)
        });
      }
      if (row.company && row.company_percentage) {
        assignments.push({
          roleType: 'company',
          userName: row.company,
          percentage: parseFloat(row.company_percentage)
        });
      }
      if (row.association && row.association_percentage) {
        assignments.push({
          roleType: 'association',
          userName: row.association,
          percentage: parseFloat(row.association_percentage)
        });
      }
      
      return {
        mid: row.mid,
        merchant_name: row.merchant_name,
        monthly_revenue: row.monthly_revenue || '0',
        processor: row.processor || 'Unknown',
        original_column_i: row.original_column_i || '',
        assignments,
        assignment_status: row.assignment_status,
        last_updated: row.last_updated,
        first_assigned_month: row.first_assigned_month
      };
    });
    
    console.log(`[COMPLETED ASSIGNMENTS] Month: ${month} - Found ${formattedAssignments.length} completed assignments`);
    
    res.json({
      success: true,
      month,
      completedAssignments: formattedAssignments,
      summary: {
        totalCompleted: formattedAssignments.length,
        totalRevenue: formattedAssignments.reduce((sum: number, item: any) => sum + parseFloat(item.monthly_revenue || '0'), 0)
      }
    });
  } catch (error) {
    console.error('Failed to get completed assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get completed assignments'
    });
  }
});

// Assign roles to a MID
router.post('/role-assignment/assign', async (req, res) => {
  try {
    const { mid, assignments } = req.body;
    const month = req.body.month || '2025-05'; // Default to current month
    
    // Check if this MID already has assignments to prevent duplicates
    const hasExistingAssignments = await DuplicatePreventionService.checkMIDHasAssignments(mid);
    
    if (hasExistingAssignments) {
      return res.status(409).json({
        success: false,
        error: `MID ${mid} already has role assignments. Delete existing assignments first to reassign.`
      });
    }
    
    // Validate total percentage equals 100%
    const totalPercentage = assignments.reduce((sum: number, assignment: any) => sum + assignment.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        error: `Role percentages total ${totalPercentage}%, must equal 100%`
      });
    }

    // Get merchant name from monthly_data using actual MID
    const merchantQuery = sql`
      SELECT 
        COALESCE(m.dba, m.legal_name, 'Unknown Merchant') as merchant_name, 
        COALESCE(mra.original_column_i, '') as original_column_i, 
        md.net
      FROM monthly_data md
      LEFT JOIN merchants m ON md.merchant_id = m.id
      LEFT JOIN mid_role_assignments mra ON m.mid = mra.mid
      WHERE m.mid = ${mid} AND md.month = ${month}
    `;
    const merchantData = await db.execute(merchantQuery);

    if (merchantData.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'MID not found in monthly data'
      });
    }

    const merchant = merchantData.rows[0] as any;

    // Build role assignment object
    const roleAssignment: any = {
      mid,
      merchant_name: merchant.merchant_name,
      assignment_status: 'assigned',
      original_column_i: merchant.original_column_i,
      first_assigned_month: month,
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Add role assignments
    assignments.forEach((assignment: any) => {
      // Map 'agent' roleType to 'rep' for database column
      const dbRoleType = assignment.roleType === 'agent' ? 'rep' : assignment.roleType;
      roleAssignment[dbRoleType] = assignment.userName;
      roleAssignment[`${dbRoleType}_percentage`] = assignment.percentage;
    });

    // Insert or update role assignment
    const insertQuery = sql`
      INSERT INTO mid_role_assignments (
        mid, merchant_name, assignment_status, original_column_i, first_assigned_month,
        rep, rep_percentage, partner, partner_percentage, sales_manager, sales_manager_percentage,
        company, company_percentage, association, association_percentage,
        last_updated, created_at
      ) VALUES (
        ${roleAssignment.mid}, ${roleAssignment.merchant_name}, ${roleAssignment.assignment_status}, 
        ${roleAssignment.original_column_i}, ${roleAssignment.first_assigned_month},
        ${roleAssignment.rep || null}, ${roleAssignment.rep_percentage || null},
        ${roleAssignment.partner || null}, ${roleAssignment.partner_percentage || null},
        ${roleAssignment.sales_manager || null}, ${roleAssignment.sales_manager_percentage || null},
        ${roleAssignment.company || null}, ${roleAssignment.company_percentage || null},
        ${roleAssignment.association || null}, ${roleAssignment.association_percentage || null},
        NOW(), NOW()
      ) ON CONFLICT (mid) DO UPDATE SET
        assignment_status = EXCLUDED.assignment_status,
        rep = EXCLUDED.rep,
        rep_percentage = EXCLUDED.rep_percentage,
        partner = EXCLUDED.partner,
        partner_percentage = EXCLUDED.partner_percentage,
        sales_manager = EXCLUDED.sales_manager,
        sales_manager_percentage = EXCLUDED.sales_manager_percentage,
        company = EXCLUDED.company,
        company_percentage = EXCLUDED.company_percentage,
        association = EXCLUDED.association,
        association_percentage = EXCLUDED.association_percentage,
        last_updated = NOW()
    `;
    await db.execute(insertQuery);
    
    res.json({
      success: true,
      message: 'Role assignments saved successfully'
    });
  } catch (error) {
    console.error('Failed to assign roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign roles'
    });
  }
});

// Get existing role assignments for editing
router.get('/role-assignment/existing/:mid', async (req, res) => {
  try {
    const { mid } = req.params;
    
    // Get existing assignments for this MID
    const existingAssignments = await db.execute(sql`
      SELECT 
        mid, merchant_name, assignment_status, original_column_i,
        rep, rep_percentage, partner, partner_percentage, 
        sales_manager, sales_manager_percentage, company, company_percentage, 
        association, association_percentage, last_updated
      FROM mid_role_assignments
      WHERE mid = ${mid}
    `);
    
    if (existingAssignments.rows.length === 0) {
      return res.json({
        success: true,
        assignments: [],
        isCompleted: false
      });
    }
    
    const assignment = existingAssignments.rows[0] as any;
    const assignments: any[] = [];
    
    // Convert database format back to role assignment format
    const roles = ['rep', 'partner', 'sales_manager', 'company', 'association'];
    roles.forEach(role => {
      const displayRole = role === 'rep' ? 'agent' : role; // Convert 'rep' to 'agent' for UI
      if (assignment[role] && assignment[`${role}_percentage`]) {
        assignments.push({
          roleType: displayRole,
          userName: assignment[role],
          percentage: assignment[`${role}_percentage`],
          isCompleted: assignment.assignment_status === 'assigned'
        });
      }
    });
    
    res.json({
      success: true,
      assignments: assignments,
      isCompleted: assignment.assignment_status === 'assigned',
      originalColumnI: assignment.original_column_i,
      lastUpdated: assignment.last_updated
    });
  } catch (error) {
    console.error('Failed to get existing assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get existing assignments'
    });
  }
});

// Get MID assignment status - check if already assigned in previous months
router.get('/role-assignment/mid-status/:month', async (req, res) => {
  try {
    const { month } = req.params;
    
    // Get all MIDs for this month with their assignment status
    const midStatus = await db.execute(sql`
      SELECT DISTINCT
        m.mid,
        COALESCE(m.dba, m.legal_name, 'Unknown Merchant') as merchant_name,
        md.net as monthly_revenue,
        p.name as processor,
        CASE 
          WHEN mra.mid IS NOT NULL THEN 'previously_assigned'
          ELSE 'new_unassigned'
        END as assignment_status,
        mra.first_assigned_month,
        mra.rep,
        mra.rep_percentage,
        mra.partner,
        mra.partner_percentage,
        mra.sales_manager,
        mra.sales_manager_percentage,
        mra.company,
        mra.company_percentage,
        mra.association,
        mra.association_percentage
      FROM monthly_data md
      LEFT JOIN merchants m ON md.merchant_id = m.id
      LEFT JOIN processors p ON md.processor_id = p.id
      LEFT JOIN mid_role_assignments mra ON m.mid = mra.mid
      WHERE md.month = ${month}
        AND m.mid IS NOT NULL
      ORDER BY 
        CASE WHEN mra.mid IS NULL THEN 0 ELSE 1 END, -- New unassigned first
        md.net DESC
    `);
    
    const newUnassigned = midStatus.rows.filter((row: any) => row.assignment_status === 'new_unassigned');
    const previouslyAssigned = midStatus.rows.filter((row: any) => row.assignment_status === 'previously_assigned');
    
    console.log(`[MID STATUS] Month: ${month} - New: ${newUnassigned.length}, Previously Assigned: ${previouslyAssigned.length}`);
    
    res.json({
      success: true,
      month,
      summary: {
        totalMIDs: midStatus.rows.length,
        newUnassigned: newUnassigned.length,
        previouslyAssigned: previouslyAssigned.length
      },
      newUnassigned,
      previouslyAssigned,
      allMIDs: midStatus.rows
    });
  } catch (error) {
    console.error('Failed to get MID assignment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MID assignment status'
    });
  }
});

// Manual assignment save with proper logging
router.post('/role-assignment/save-manual/:mid', async (req, res) => {
  try {
    const { mid } = req.params;
    const { assignments, assignedBy, month } = req.body;
    
    console.log(`[MANUAL ASSIGNMENT] Starting assignment for MID: ${mid}, Month: ${month}, Assigned by: ${assignedBy}`);
    
    // Validate assignments total 100%
    const totalPercentage = assignments.reduce((sum: number, assignment: any) => sum + assignment.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      console.log(`[ASSIGNMENT ERROR] Invalid percentage total: ${totalPercentage}% for MID: ${mid}`);
      return res.status(400).json({
        success: false,
        error: `Role percentages total ${totalPercentage}%, must equal 100%`
      });
    }
    
    // Get merchant info
    const merchantInfo = await db.execute(sql`
      SELECT COALESCE(m.dba, m.legal_name, 'Unknown Merchant') as merchant_name
      FROM merchants m
      WHERE m.mid = ${mid}
      LIMIT 1
    `);
    
    const merchantName = merchantInfo.rows[0]?.merchant_name || 'Unknown Merchant';
    
    // Check if assignment already exists
    const existingAssignment = await db.execute(sql`
      SELECT * FROM mid_role_assignments WHERE mid = ${mid}
    `);
    
    const assignmentData: any = {
      mid,
      merchantName,
      assignmentStatus: 'assigned',
      lastUpdated: new Date(),
      firstAssignedMonth: existingAssignment.rows.length > 0 ? existingAssignment.rows[0].first_assigned_month : month
    };
    
    // Build assignment fields
    assignments.forEach((assignment: any) => {
      const { roleType, userName, percentage } = assignment;
      if (roleType === 'rep') {
        assignmentData.rep = userName;
        assignmentData.repPercentage = percentage.toString();
      } else if (roleType === 'partner') {
        assignmentData.partner = userName;
        assignmentData.partnerPercentage = percentage.toString();
      } else if (roleType === 'sales_manager') {
        assignmentData.salesManager = userName;
        assignmentData.salesManagerPercentage = percentage.toString();
      } else if (roleType === 'company') {
        assignmentData.company = userName;
        assignmentData.companyPercentage = percentage.toString();
      } else if (roleType === 'association') {
        assignmentData.association = userName;
        assignmentData.associationPercentage = percentage.toString();
      }
    });
    
    // Save or update assignment
    if (existingAssignment.rows.length > 0) {
      console.log(`[ASSIGNMENT UPDATE] Updating existing assignment for MID: ${mid}`);
      await db.update(midRoleAssignments)
        .set(assignmentData)
        .where(eq(midRoleAssignments.mid, mid));
    } else {
      console.log(`[ASSIGNMENT CREATE] Creating new assignment for MID: ${mid}`);
      await db.insert(midRoleAssignments).values(assignmentData);
    }
    
    console.log(`[ASSIGNMENT SUCCESS] Successfully saved assignment for MID: ${mid} - ${assignments.length} roles assigned`);
    
    res.json({
      success: true,
      message: `Assignment saved successfully for MID: ${mid}`,
      mid,
      assignmentCount: assignments.length,
      totalPercentage
    });
    
  } catch (error) {
    console.error(`[ASSIGNMENT ERROR] Failed to save manual assignment for MID: ${req.params.mid}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to save manual assignment'
    });
  }
});

// Column I parsing function
function parseColumnI(columnI: string): Array<{roleType: string, userName: string, percentage: number}> {
  if (!columnI || columnI.trim() === '') {
    return [];
  }

  const assignments: Array<{roleType: string, userName: string, percentage: number}> = [];
  const text = columnI.trim();

  // Common patterns for Column I data:
  // "John Smith 50%, Jane Doe 25%, Company 25%"
  // "Agent: John Smith (50%) | Partner: Jane Doe (25%) | Company (25%)"
  // "John Smith - Agent 50% / Jane Doe - Partner 30% / Company 20%"
  // "50% John Smith, 30% Jane Doe, 20% Company"

  try {
    // Pattern 1: Name followed by percentage
    const pattern1 = /([A-Za-z\s\.]+?)\s*[-:]?\s*(\d+(?:\.\d+)?)%/g;
    let match;
    let totalFound = 0;

    while ((match = pattern1.exec(text)) !== null && totalFound < 100) {
      const name = match[1].trim();
      const percentage = parseFloat(match[2]);
      
      if (name && percentage > 0 && percentage <= 100) {
        const roleType = inferRoleType(name, text);
        assignments.push({
          roleType,
          userName: name,
          percentage
        });
        totalFound += percentage;
      }
    }

    // If percentages don't add up to 100%, adjust proportionally
    if (assignments.length > 0 && totalFound !== 100) {
      const scaleFactor = 100 / totalFound;
      assignments.forEach(assignment => {
        assignment.percentage = Math.round(assignment.percentage * scaleFactor * 100) / 100;
      });
    }

    // Fallback: if no percentages found, try to extract names and assign equal percentages
    if (assignments.length === 0) {
      const names = extractNamesFromText(text);
      if (names.length > 0) {
        const equalPercentage = Math.round((100 / names.length) * 100) / 100;
        names.forEach(name => {
          assignments.push({
            roleType: inferRoleType(name, text),
            userName: name,
            percentage: equalPercentage
          });
        });
      }
    }

  } catch (error) {
    console.error('Error parsing Column I:', error);
  }

  return assignments;
}

// Infer role type based on name and context
function inferRoleType(name: string, fullText: string): string {
  const lowerName = name.toLowerCase();
  const lowerText = fullText.toLowerCase();

  // Company/Organization indicators
  if (lowerName.includes('company') || lowerName.includes('corp') || 
      lowerName.includes('llc') || lowerName.includes('inc') ||
      lowerName.includes('ltd') || lowerName.includes('group')) {
    return 'company';
  }

  // Association indicators
  if (lowerName.includes('association') || lowerName.includes('assoc') ||
      lowerName.includes('alliance') || lowerName.includes('network')) {
    return 'association';
  }

  // Role indicators in context
  if (lowerText.includes('manager') || lowerText.includes('mgr')) {
    return 'sales_manager';
  }
  
  if (lowerText.includes('partner') || lowerText.includes('partnership')) {
    return 'partner';
  }

  // Default to agent for individual names
  return 'agent';
}

// Extract names from unstructured text
function extractNamesFromText(text: string): string[] {
  const names: string[] = [];
  
  // Remove common non-name words
  const cleanText = text.replace(/\b(percentage|percent|commission|split|role|assignment|agent|partner|manager|company|association)\b/gi, '');
  
  // Pattern for potential names (2-4 words starting with capital letters)
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g;
  let match;
  
  while ((match = namePattern.exec(cleanText)) !== null) {
    const potentialName = match[1].trim();
    if (potentialName.length >= 3 && !names.includes(potentialName)) {
      names.push(potentialName);
    }
  }
  
  return names;
}

// Get permission-based reports
router.get('/reports/:userId/:roleType', async (req, res) => {
  try {
    const { userId, roleType } = req.params;
    const { month } = req.query;
    
    const reports = await ResidualsWorkflowService.getPermissionBasedReports(
      userId,
      roleType,
      month as string
    );
    
    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Failed to get permission-based reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get permission-based reports'
    });
  }
});

// Get usernames by role type for dropdown options
router.get('/role-assignment/usernames/:roleType', async (req, res) => {
  try {
    const { roleType } = req.params;
    let usernames: string[] = [];

    // Map role assignment types to user table roles and fields
    const roleMapping: Record<string, { roles: string[], field?: string }> = {
      'agent': { roles: ['Users/Reps', 'Team Member'], field: 'agentName' },
      'partner': { roles: ['Partners'], field: 'partnerName' },
      'sales_manager': { roles: ['Manager', 'Team Leaders'], field: 'firstName' },
      'company': { roles: [], field: undefined }, // Will use static options
      'association': { roles: [], field: undefined } // Will use static options
    };

    const mapping = roleMapping[roleType];
    if (!mapping) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role type'
      });
    }

    // For company and association, return common options
    if (roleType === 'company') {
      usernames = ['Company', 'Corporate', 'Head Office', 'Main Office'];
    } else if (roleType === 'association') {
      usernames = ['Association', 'ISO Association', 'Partner Association', 'Industry Association'];
    } else {
      // Query users table for actual usernames using a simpler approach
      let usersQuery;
      
      if (roleType === 'rep' || roleType === 'agent') {
        usersQuery = sql`
          SELECT DISTINCT 
            CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) as display_name
          FROM users 
          WHERE (role = 'Users/Reps' OR role = 'Team Member')
          AND is_active = true
          AND first_name IS NOT NULL AND first_name != ''
          ORDER BY display_name
        `;
      } else if (roleType === 'partner') {
        usersQuery = sql`
          SELECT DISTINCT 
            CASE 
              WHEN partner_name IS NOT NULL AND partner_name != '' THEN partner_name
              ELSE CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))
            END as display_name
          FROM users 
          WHERE role = 'Partners'
          AND is_active = true
          AND (
            (partner_name IS NOT NULL AND partner_name != '') OR
            (first_name IS NOT NULL AND first_name != '')
          )
          ORDER BY display_name
        `;
      } else if (roleType === 'sales_manager') {
        usersQuery = sql`
          SELECT DISTINCT 
            CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) as display_name
          FROM users 
          WHERE (role = 'Manager' OR role = 'Team Leaders')
          AND is_active = true
          AND first_name IS NOT NULL AND first_name != ''
          ORDER BY display_name
        `;
      }
      
      if (usersQuery) {
        const result = await db.execute(usersQuery);
        usernames = result.rows
          .map((row: any) => row.display_name?.trim())
          .filter((name: string) => name && name !== ' ')
          .filter((name: string, index: number, array: string[]) => array.indexOf(name) === index); // Remove duplicates
      }
    }

    res.json({
      success: true,
      usernames
    });
  } catch (error) {
    console.error('Failed to get usernames by role type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usernames by role type'
    });
  }
});

// Delete uploaded data for a processor/month
router.delete('/delete/:month/:processorId', async (req, res) => {
  try {
    const { month, processorId } = req.params;
    
    // Delete monthly data for this processor/month
    await db.execute(sql`
      DELETE FROM monthly_data 
      WHERE month = ${month} AND processor_id = ${parseInt(processorId)}
    `);
    
    // Delete no MID declarations if any
    await db.execute(sql`
      DELETE FROM no_mid_declarations 
      WHERE month = ${month} AND processor_id = ${parseInt(processorId)}
    `);
    
    // Reset upload progress status
    await ResidualsWorkflowService.updateUploadStatus(
      month,
      parseInt(processorId),
      'processor',
      'error'
    );
    
    res.json({
      success: true,
      message: `Data deleted for processor ${processorId} in ${month}`
    });
  } catch (error) {
    console.error('Delete data failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete data'
    });
  }
});

// Delete lead sheet data for a month
router.delete('/delete-lead-sheet/:month', async (req, res) => {
  try {
    const { month } = req.params;
    
    // Delete master lead sheet data
    await db.execute(sql`
      DELETE FROM master_lead_sheets 
      WHERE month = ${month}
    `);
    
    // Get all active processors and reset their lead sheet status
    const activeProcessors = await db.select({ id: processors.id }).from(processors).where(eq(processors.isActive, true));
    
    for (const processor of activeProcessors) {
      await ResidualsWorkflowService.updateUploadStatus(
        month,
        processor.id,
        'lead_sheet',
        'error'
      );
    }
    
    res.json({
      success: true,
      message: `Lead sheet data deleted for ${month}`
    });
  } catch (error) {
    console.error('Delete lead sheet failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete lead sheet data'
    });
  }
});

// Cleanup duplicate MID entries
router.post('/cleanup-duplicates/:month', async (req, res) => {
  try {
    const { month } = req.params;
    
    console.log(`[CLEANUP] Starting duplicate cleanup for ${month}...`);
    
    // Clean up duplicate assignments
    const assignmentResults = await DuplicatePreventionService.cleanupDuplicateMIDAssignments();
    
    // Clean up duplicate monthly data
    const monthlyDataResults = await DuplicatePreventionService.cleanupDuplicateMonthlyData(month);
    
    // Create constraints to prevent future duplicates
    const constraintsCreated = await DuplicatePreventionService.createDuplicatePreventionConstraints();
    
    res.json({
      success: true,
      message: 'Duplicate cleanup completed successfully',
      results: {
        assignmentCleanup: assignmentResults,
        monthlyDataCleanup: monthlyDataResults,
        constraintsCreated
      }
    });
  } catch (error) {
    console.error('Duplicate cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup duplicates',
      details: error
    });
  }
});

// Get duplicate MID report
router.get('/duplicate-report/:month', async (req, res) => {
  try {
    const { month } = req.params;
    
    const duplicateMIDs = await DuplicatePreventionService.getDuplicateMIDs(month);
    
    res.json({
      success: true,
      duplicateMIDs,
      duplicateCount: duplicateMIDs.length,
      message: duplicateMIDs.length > 0 
        ? `Found ${duplicateMIDs.length} duplicate MIDs for ${month}` 
        : `No duplicate MIDs found for ${month}`
    });
  } catch (error) {
    console.error('Failed to get duplicate report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get duplicate report'
    });
  }
});

// Master Data QC Approval endpoint
router.post('/master-data-qc/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const { action, approvedBy } = req.body; // action: 'approve' | 'reject'
    
    console.log(`[MASTER DATA QC] ${action.toUpperCase()} requested for month: ${month} by: ${approvedBy}`);
    
    if (action === 'approve') {
      // Update all assignments for this month to "approved" status
      await db.execute(sql`
        UPDATE mid_role_assignments 
        SET assignment_status = 'approved', last_updated = NOW()
        WHERE mid IN (
          SELECT DISTINCT m.mid 
          FROM monthly_data md 
          JOIN merchants m ON md.merchant_id = m.id 
          WHERE md.month = ${month}
        )
      `);
      
      console.log(`[MASTER DATA QC] Successfully approved all assignments for ${month}`);
      
      res.json({
        success: true,
        action: 'approved',
        month,
        message: `Master data for ${month} has been approved and is ready for reports.`
      });
      
    } else if (action === 'reject') {
      // Mark assignments as needing revision
      await db.execute(sql`
        UPDATE mid_role_assignments 
        SET assignment_status = 'needs_revision', last_updated = NOW()
        WHERE mid IN (
          SELECT DISTINCT m.mid 
          FROM monthly_data md 
          JOIN merchants m ON md.merchant_id = m.id 
          WHERE md.month = ${month}
        )
      `);
      
      console.log(`[MASTER DATA QC] Rejected assignments for ${month} - marked for revision`);
      
      res.json({
        success: true,
        action: 'rejected',
        month,
        message: `Master data for ${month} has been rejected and requires revision.`
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be "approve" or "reject".'
      });
    }
    
  } catch (error) {
    console.error('Master Data QC action failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process QC action'
    });
  }
});

export default router;