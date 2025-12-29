import { oauthStateService } from '../services/OAuthStateService';

/**
 * OAuth State Cleanup Job
 * Removes expired OAuth state records to prevent table bloat
 * Should be run periodically (e.g., every hour)
 */
export async function runOAuthStateCleanup() {
  try {
    const deletedCount = await oauthStateService.cleanupExpiredStates();
    if (deletedCount > 0) {
      console.log(`[OAuth Cleanup] Removed ${deletedCount} expired state records`);
    }
  } catch (error) {
    console.error('[OAuth Cleanup] Error cleaning up expired states:', error);
  }
}

/**
 * Start periodic cleanup job
 * Runs every hour
 */
export function startOAuthStateCleanupJob() {
  // Run immediately on startup
  runOAuthStateCleanup();
  
  // Run every hour
  const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  setInterval(runOAuthStateCleanup, CLEANUP_INTERVAL_MS);
  
  console.log('[OAuth Cleanup] Started periodic cleanup job (runs every hour)');
}
