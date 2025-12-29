import express from 'express';
import { dataAuditService } from '../services/DataAuditService';
// Simple auth middleware for development
const isAuthenticated = (req: any, res: any, next: any) => {
  // For development, allow all requests
  req.user = { email: 'demo@example.com' };
  next();
};

const router = express.Router();

// Get monthly audit status for current month
router.get('/monthly-status', isAuthenticated, async (req, res) => {
  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const monthString = `${year}-${month}`;

    const auditStatus = await dataAuditService.getMonthlyAuditStatus(year, monthString);
    
    res.json({
      success: true,
      data: auditStatus,
      month: monthString,
      year
    });
  } catch (error) {
    console.error('Error fetching monthly audit status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit status'
    });
  }
});

// Get audit status for specific month/year
router.get('/status/:year/:month', isAuthenticated, async (req, res) => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year);
    const monthString = `${year}-${month.padStart(2, '0')}`;

    const auditStatus = await dataAuditService.getMonthlyAuditStatus(yearNum, monthString);
    
    res.json({
      success: true,
      data: auditStatus,
      month: monthString,
      year: yearNum
    });
  } catch (error) {
    console.error('Error fetching audit status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit status'
    });
  }
});

// Get validation errors for an audit
router.get('/errors/:auditId', isAuthenticated, async (req, res) => {
  try {
    const { auditId } = req.params;
    const errors = await dataAuditService.getValidationErrors(auditId);
    
    res.json({
      success: true,
      data: errors
    });
  } catch (error) {
    console.error('Error fetching validation errors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch validation errors'
    });
  }
});

// Apply user correction
router.post('/correction', isAuthenticated, async (req, res) => {
  try {
    const correctionData = {
      ...req.body,
      appliedBy: (req as any).user?.email || 'unknown'
    };

    const correction = await dataAuditService.applyUserCorrection(correctionData);
    
    res.json({
      success: true,
      data: correction,
      message: 'Correction applied successfully'
    });
  } catch (error) {
    console.error('Error applying correction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply correction'
    });
  }
});

// Verify audit completion
router.post('/verify/:auditId', isAuthenticated, async (req, res) => {
  try {
    const { auditId } = req.params;
    const { notes } = req.body;
    const verifiedBy = (req as any).user?.email || 'unknown';

    const updatedAudit = await dataAuditService.verifyAudit(auditId, verifiedBy, notes);
    
    res.json({
      success: true,
      data: updatedAudit,
      message: 'Audit verified successfully'
    });
  } catch (error) {
    console.error('Error verifying audit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify audit'
    });
  }
});

// Get audit history for a processor
router.get('/history/:processor', isAuthenticated, async (req, res) => {
  try {
    const { processor } = req.params;
    const limit = parseInt(req.query.limit as string) || 12;

    const history = await dataAuditService.getAuditHistory(processor, limit);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching audit history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit history'
    });
  }
});

export default router;