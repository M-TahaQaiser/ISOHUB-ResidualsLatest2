import { pool } from '../db';

export async function getMonthApproval(month: string, agencyId: number) {
  console.log('getMonthApproval params:', { month, agencyId });
  const result = await pool.query(
    `SELECT id, month, agency_id as "agencyId", assignments_complete as "assignmentsComplete", audit_complete as "auditComplete", approval_status as "approvalStatus", approved_by as "approvedBy", updated_at as "updatedAt" FROM month_approvals WHERE month = $1 AND agency_id = $2 LIMIT 1`,
    [month, agencyId]
  );
  console.log('getMonthApproval result:', result && result.rows && result.rows[0]);
  return result.rows[0] || null;
}

export async function upsertMonthApproval(month: string, agencyId: number, assignmentsComplete: boolean, auditComplete: boolean, approvedBy: number | null = null) {
  // Determine approval status
  const approvalStatus = assignmentsComplete && auditComplete ? 'approved' : 'pending';

  // Try update first
  console.log('upsertMonthApproval params:', { month, agencyId, assignmentsComplete, auditComplete, approvalStatus, approvedBy });
  const res = await pool.query(
    `UPDATE month_approvals SET assignments_complete = $3, audit_complete = $4, approval_status = $5, approved_by = $6, updated_at = now() WHERE month = $1 AND agency_id = $2 RETURNING id, month, agency_id as "agencyId", assignments_complete as "assignmentsComplete", audit_complete as "auditComplete", approval_status as "approvalStatus", approved_by as "approvedBy", updated_at as "updatedAt"`,
    [month, agencyId, assignmentsComplete, auditComplete, approvalStatus, approvedBy]
  );

  if (res.rows && res.rows.length > 0) return res.rows[0];

  // Insert if not present
  const insertRes = await pool.query(
    `INSERT INTO month_approvals (month, agency_id, assignments_complete, audit_complete, approval_status, approved_by, updated_at) VALUES ($1, $2, $3, $4, $5, $6, now()) RETURNING id, month, agency_id as "agencyId", assignments_complete as "assignmentsComplete", audit_complete as "auditComplete", approval_status as "approvalStatus", approved_by as "approvedBy", updated_at as "updatedAt"`,
    [month, agencyId, assignmentsComplete, auditComplete, approvalStatus, approvedBy]
  );

  return insertRes.rows[0] || null;
}
