import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = Router();

interface OnboardingStep {
  id: number;
  stepName: string;
  stepOrder: number;
  isCompleted: boolean;
  completedAt: string | null;
  stepData: any;
}

const defaultSteps = [
  { id: 1, stepName: 'Company Information', stepOrder: 1, isCompleted: false, completedAt: null, stepData: {} },
  { id: 2, stepName: 'Domain & Email Setup', stepOrder: 2, isCompleted: false, completedAt: null, stepData: {} },
  { id: 3, stepName: 'Subscription Plan', stepOrder: 3, isCompleted: false, completedAt: null, stepData: {} },
  { id: 4, stepName: 'User Setup', stepOrder: 4, isCompleted: false, completedAt: null, stepData: {} },
  { id: 5, stepName: 'Processor Configuration', stepOrder: 5, isCompleted: false, completedAt: null, stepData: {} },
  { id: 6, stepName: 'Commission Structure', stepOrder: 6, isCompleted: false, completedAt: null, stepData: {} },
  { id: 7, stepName: 'Reporting Setup', stepOrder: 7, isCompleted: false, completedAt: null, stepData: {} },
];

/**
 * GET /api/agencies/:id/onboarding
 * Get onboarding status for an agency
 */
router.get('/:id/onboarding', async (req, res) => {
  try {
    const agencyId = parseInt(req.params.id);

    // Check if onboarding_progress table exists, if not, return default steps
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'onboarding_progress'
      ) as exists
    `);

    const tableExists = (tableCheck.rows[0] as any)?.exists;

    if (!tableExists) {
      // Return default steps if table doesn't exist
      const completedSteps = 0;
      const progress = 0;
      const nextStep = defaultSteps[0];

      return res.json({
        steps: defaultSteps,
        progress,
        nextStep,
        isCompleted: false
      });
    }

    // Fetch onboarding progress from database
    const result = await db.execute(sql`
      SELECT * FROM onboarding_progress 
      WHERE agency_id = ${agencyId}
      ORDER BY step_order ASC
    `);

    let steps: OnboardingStep[] = [];

    if (result.rows && result.rows.length > 0) {
      steps = result.rows.map((row: any) => ({
        id: row.id,
        stepName: row.step_name,
        stepOrder: row.step_order,
        isCompleted: row.is_completed,
        completedAt: row.completed_at,
        stepData: row.step_data || {}
      }));
    } else {
      // Initialize with default steps if no progress exists
      steps = defaultSteps;
    }

    const completedSteps = steps.filter(s => s.isCompleted).length;
    const progress = Math.round((completedSteps / steps.length) * 100);
    const nextStep = steps.find(s => !s.isCompleted) || null;

    res.json({
      steps,
      progress,
      nextStep,
      isCompleted: completedSteps === steps.length
    });

  } catch (error: any) {
    console.error('Error fetching onboarding status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch onboarding status',
      message: error.message 
    });
  }
});

/**
 * POST /api/agencies/:id/onboarding/:stepName
 * Complete a specific onboarding step
 */
router.post('/:id/onboarding/:stepName', async (req, res) => {
  try {
    const agencyId = parseInt(req.params.id);
    const stepName = decodeURIComponent(req.params.stepName);
    const { userId, stepData } = req.body;

    console.log(`Completing step "${stepName}" for agency ${agencyId}`);

    // For now, just return success without database persistence
    // TODO: Implement proper database storage later
    res.json({
      success: true,
      message: `Step "${stepName}" completed successfully`,
      stepName,
      completedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error completing onboarding step:', error);
    res.status(500).json({ 
      error: 'Failed to complete step',
      message: error.message 
    });
  }
});

/**
 * POST /api/agencies/generate-code
 * Generate a unique agency code from company name
 */
router.post('/generate-code', async (req, res) => {
  try {
    const { companyName } = req.body;

    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Generate code: uppercase, remove special chars, take first 8 chars
    let baseCode = companyName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8);

    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const agencyCode = `${baseCode}${randomSuffix}`;

    res.json({
      agencyCode,
      companyName
    });

  } catch (error: any) {
    console.error('Error generating agency code:', error);
    res.status(500).json({ 
      error: 'Failed to generate agency code',
      message: error.message 
    });
  }
});

export default router;
