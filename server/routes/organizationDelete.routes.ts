import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * DELETE /api/organizations/:organizationId
 * Delete an organization and all its associated data
 * Requires authentication
 */
router.delete('/:organizationId', async (req: AuthenticatedRequest, res) => {
  try {
    const { organizationId } = req.params;

    console.log(`Attempting to delete organization: ${organizationId}`);

    // Get organization details and agency_id
    const orgResult = await db.execute(sql`
      SELECT id, organization_id, name, agency_id 
      FROM organizations 
      WHERE organization_id = ${organizationId}
      LIMIT 1
    `);

    if (!orgResult.rows || orgResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Organization not found' 
      });
    }

    const org = orgResult.rows[0] as any;
    const agencyId = org.agency_id;
    const orgName = org.name;

    console.log(`Deleting organization: ${orgName} (agency_id: ${agencyId})`);

    // Delete all data associated with this organization's agency_id
    const deletionResults = {
      monthlyData: 0,
      merchants: 0,
      uploadProgress: 0,
      masterLeadSheets: 0,
      roleAssignmentWorkflow: 0,
      fileUploads: 0,
      organization: 0
    };

    // Delete monthly_data
    const monthlyDataResult = await db.execute(sql`
      DELETE FROM monthly_data WHERE agency_id = ${agencyId}
    `);
    deletionResults.monthlyData = (monthlyDataResult as any).rowCount || 0;

    // Delete upload_progress
    const uploadProgressResult = await db.execute(sql`
      DELETE FROM upload_progress WHERE agency_id = ${agencyId}
    `);
    deletionResults.uploadProgress = (uploadProgressResult as any).rowCount || 0;

    // Delete master_lead_sheets
    const masterLeadSheetsResult = await db.execute(sql`
      DELETE FROM master_lead_sheets WHERE agency_id = ${agencyId}
    `);
    deletionResults.masterLeadSheets = (masterLeadSheetsResult as any).rowCount || 0;

    // Delete merchants
    const merchantsResult = await db.execute(sql`
      DELETE FROM merchants WHERE agency_id = ${agencyId}
    `);
    deletionResults.merchants = (merchantsResult as any).rowCount || 0;

    // Delete role_assignment_workflow
    const roleAssignmentResult = await db.execute(sql`
      DELETE FROM role_assignment_workflow WHERE agency_id = ${agencyId}
    `);
    deletionResults.roleAssignmentWorkflow = (roleAssignmentResult as any).rowCount || 0;

    // Delete file_uploads (if table exists and has agency_id column)
    try {
      const fileUploadsResult = await db.execute(sql`
        DELETE FROM file_uploads WHERE agency_id = ${agencyId}
      `);
      deletionResults.fileUploads = (fileUploadsResult as any).rowCount || 0;
    } catch (err) {
      console.log('file_uploads table does not exist or has no agency_id column');
    }

    // Finally, delete the organization itself
    const orgDeleteResult = await db.execute(sql`
      DELETE FROM organizations WHERE organization_id = ${organizationId}
    `);
    deletionResults.organization = (orgDeleteResult as any).rowCount || 0;

    console.log('Deletion complete:', deletionResults);

    res.json({
      success: true,
      message: `Organization "${orgName}" and all associated data have been permanently deleted`,
      deletionResults
    });

  } catch (error: any) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete organization',
      message: error.message 
    });
  }
});

export default router;
