import { db } from "../db";
import { sql } from "drizzle-orm";
import { midRoleAssignments, monthlyData } from "../../shared/schema";

export class DuplicatePreventionService {
  
  /**
   * Remove duplicate MID entries from role assignments, keeping the most recent or highest revenue entry
   */
  static async cleanupDuplicateMIDAssignments(): Promise<{ removed: number; kept: number }> {
    console.log('[DUPLICATE CLEANUP] Starting duplicate MID assignment cleanup...');
    
    try {
      // Find all duplicate MID assignments
      const duplicates = await db.execute(sql`
        SELECT 
          mid,
          COUNT(*) as assignment_count,
          ARRAY_AGG(id ORDER BY created_at DESC) as assignment_ids
        FROM mid_role_assignments 
        GROUP BY mid 
        HAVING COUNT(*) > 1
      `);
      
      let totalRemoved = 0;
      let totalKept = 0;
      
      for (const duplicate of duplicates.rows as any[]) {
        const { mid, assignment_count, assignment_ids } = duplicate;
        console.log(`[DUPLICATE CLEANUP] Found ${assignment_count} assignments for MID ${mid}`);
        
        // Keep the first (most recent) assignment, remove others
        const idsToRemove = assignment_ids.slice(1); // Remove all except first
        const idToKeep = assignment_ids[0];
        
        if (idsToRemove.length > 0) {
          // Delete duplicate assignments
          for (const idToRemove of idsToRemove) {
            await db.execute(sql`DELETE FROM mid_role_assignments WHERE id = ${idToRemove}`);
            console.log(`[DUPLICATE CLEANUP] Removed duplicate assignment ID ${idToRemove} for MID ${mid}`);
          }
          
          totalRemoved += idsToRemove.length;
          totalKept += 1;
          
          console.log(`[DUPLICATE CLEANUP] Kept assignment ID ${idToKeep} for MID ${mid}`);
        }
      }
      
      console.log(`[DUPLICATE CLEANUP] Cleanup complete: ${totalRemoved} duplicates removed, ${totalKept} assignments kept`);
      
      return { removed: totalRemoved, kept: totalKept };
    } catch (error) {
      console.error('[DUPLICATE CLEANUP] Error during cleanup:', error);
      throw new Error(`Duplicate cleanup failed: ${error}`);
    }
  }
  
  /**
   * Remove duplicate MID entries from monthly data, keeping the entry with highest revenue
   */
  static async cleanupDuplicateMonthlyData(month: string): Promise<{ removed: number; kept: number }> {
    console.log(`[DUPLICATE CLEANUP] Starting duplicate monthly data cleanup for ${month}...`);
    
    try {
      // Find duplicates in monthly_data for the specific month
      const duplicates = await db.execute(sql`
        WITH duplicate_mids AS (
          SELECT 
            md.merchant_id,
            m.mid,
            COUNT(*) as record_count,
            ARRAY_AGG(md.id ORDER BY md.net DESC, md.created_at DESC) as data_ids
          FROM monthly_data md
          LEFT JOIN merchants m ON md.merchant_id = m.id
          WHERE md.month = ${month}
            AND m.mid IS NOT NULL
          GROUP BY md.merchant_id, m.mid
          HAVING COUNT(*) > 1
        )
        SELECT * FROM duplicate_mids
      `);
      
      let totalRemoved = 0;
      let totalKept = 0;
      
      for (const duplicate of duplicates.rows as any[]) {
        const { mid, record_count, data_ids } = duplicate;
        console.log(`[DUPLICATE CLEANUP] Found ${record_count} records for MID ${mid} in ${month}`);
        
        // Keep the first (highest revenue/most recent) record, remove others
        const idsToRemove = data_ids.slice(1);
        const idToKeep = data_ids[0];
        
        if (idsToRemove.length > 0) {
          // Delete duplicate records
          for (const idToRemove of idsToRemove) {
            await db.execute(sql`DELETE FROM monthly_data WHERE id = ${idToRemove}`);
            console.log(`[DUPLICATE CLEANUP] Removed duplicate monthly data ID ${idToRemove} for MID ${mid}`);
          }
          
          totalRemoved += idsToRemove.length;
          totalKept += 1;
          
          console.log(`[DUPLICATE CLEANUP] Kept monthly data ID ${idToKeep} for MID ${mid}`);
        }
      }
      
      console.log(`[DUPLICATE CLEANUP] Monthly data cleanup complete: ${totalRemoved} duplicates removed, ${totalKept} records kept`);
      
      return { removed: totalRemoved, kept: totalKept };
    } catch (error) {
      console.error('[DUPLICATE CLEANUP] Error during monthly data cleanup:', error);
      throw new Error(`Monthly data duplicate cleanup failed: ${error}`);
    }
  }
  
  /**
   * Check if a MID already has role assignments
   */
  static async checkMIDHasAssignments(mid: string): Promise<boolean> {
    try {
      const existing = await db.execute(sql`
        SELECT COUNT(*) as assignment_count 
        FROM mid_role_assignments 
        WHERE mid = ${mid}
      `);
      
      const count = (existing.rows[0] as any)?.assignment_count || 0;
      return count > 0;
    } catch (error) {
      console.error('[DUPLICATE CHECK] Error checking MID assignments:', error);
      return false;
    }
  }
  
  /**
   * Get duplicate MIDs that appear multiple times in assignment interface
   */
  static async getDuplicateMIDs(month: string): Promise<string[]> {
    try {
      const duplicates = await db.execute(sql`
        SELECT 
          m.mid,
          COUNT(*) as occurrence_count
        FROM monthly_data md
        LEFT JOIN merchants m ON md.merchant_id = m.id
        WHERE md.month = ${month}
          AND m.mid IS NOT NULL
        GROUP BY m.mid
        HAVING COUNT(*) > 1
        ORDER BY occurrence_count DESC
      `);
      
      return duplicates.rows.map((row: any) => row.mid);
    } catch (error) {
      console.error('[DUPLICATE CHECK] Error finding duplicate MIDs:', error);
      return [];
    }
  }
  
  /**
   * Create database constraints to prevent future duplicates
   */
  static async createDuplicatePreventionConstraints(): Promise<boolean> {
    try {
      console.log('[CONSTRAINT SETUP] Creating duplicate prevention constraints...');
      
      // Create unique constraint on mid_role_assignments table
      // Note: This would be better handled in a migration, but adding here for immediate effect
      await db.execute(sql`
        DO $$ 
        BEGIN
          -- Try to add unique constraint if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'unique_mid_assignment'
          ) THEN
            ALTER TABLE mid_role_assignments 
            ADD CONSTRAINT unique_mid_assignment UNIQUE (mid);
          END IF;
        END $$;
      `);
      
      console.log('[CONSTRAINT SETUP] Unique constraint created for MID assignments');
      return true;
    } catch (error) {
      console.error('[CONSTRAINT SETUP] Error creating constraints:', error);
      return false;
    }
  }
}