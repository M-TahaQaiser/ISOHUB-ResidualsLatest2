import { db } from "../db";
import { merchants, assignments, roles, monthlyData } from "../../shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export interface BulkAssignmentRule {
  merchantIds: number[];
  assignments: {
    roleId: number;
    percentage: number;
  }[];
  month: string;
}

export interface SmartAssignmentRule {
  processorId?: number;
  revenueRange?: { min: number; max: number };
  defaultAssignments: {
    roleId: number;
    percentage: number;
  }[];
  month: string;
}

export class BulkAssignmentService {
  
  // Bulk assign merchants to roles
  static async bulkAssignMerchants(rules: BulkAssignmentRule[]): Promise<{
    success: boolean;
    assignedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let assignedCount = 0;

    for (const rule of rules) {
      try {
        // Validate percentages total 100%
        const totalPercentage = rule.assignments.reduce((sum, a) => sum + a.percentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          errors.push(`Rule for merchants ${rule.merchantIds.join(',')} has invalid percentage total: ${totalPercentage}%`);
          continue;
        }

        // Check if merchants exist
        const existingMerchants = await db.select({ id: merchants.id })
          .from(merchants)
          .where(inArray(merchants.id, rule.merchantIds));
        
        const existingIds = existingMerchants.map(m => m.id);
        const missingIds = rule.merchantIds.filter(id => !existingIds.includes(id));
        
        if (missingIds.length > 0) {
          errors.push(`Merchants not found: ${missingIds.join(', ')}`);
          continue;
        }

        // Remove existing assignments for these merchants in this month
        await db.delete(assignments)
          .where(and(
            inArray(assignments.merchantId, rule.merchantIds),
            eq(assignments.month, rule.month)
          ));

        // Create new assignments
        const assignmentInserts = [];
        for (const merchantId of rule.merchantIds) {
          for (const assignment of rule.assignments) {
            assignmentInserts.push({
              merchantId,
              roleId: assignment.roleId,
              percentage: assignment.percentage.toString(),
              month: rule.month
            });
          }
        }

        await db.insert(assignments).values(assignmentInserts);
        assignedCount += rule.merchantIds.length;

      } catch (error) {
        console.error('Bulk assignment error:', error);
        errors.push(`Error processing merchants ${rule.merchantIds.join(',')}: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      assignedCount,
      errors
    };
  }

  // Smart assignment based on revenue ranges and processors
  static async smartAssignByRevenue(rules: SmartAssignmentRule[]): Promise<{
    success: boolean;
    assignedCount: number;
    merchantsProcessed: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let assignedCount = 0;
    let merchantsProcessed = 0;

    for (const rule of rules) {
      try {
        // Validate percentages
        const totalPercentage = rule.defaultAssignments.reduce((sum, a) => sum + a.percentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          errors.push(`Rule has invalid percentage total: ${totalPercentage}%`);
          continue;
        }

        // Build query for merchants matching criteria
        let query = db.select({
          merchantId: merchants.id,
          revenue: monthlyData.net
        })
        .from(merchants)
        .innerJoin(monthlyData, eq(merchants.id, monthlyData.merchantId))
        .where(eq(monthlyData.month, rule.month));

        // Add processor filter if specified
        if (rule.processorId) {
          query = query.where(eq(monthlyData.processorId, rule.processorId));
        }

        const merchantData = await query;
        
        // Filter by revenue range if specified
        let filteredMerchants = merchantData;
        if (rule.revenueRange) {
          filteredMerchants = merchantData.filter(m => {
            const revenue = parseFloat(m.revenue);
            return revenue >= rule.revenueRange.min && revenue <= rule.revenueRange.max;
          });
        }

        if (filteredMerchants.length === 0) {
          continue;
        }

        merchantsProcessed += filteredMerchants.length;

        // Remove existing assignments
        const merchantIds = filteredMerchants.map(m => m.merchantId);
        await db.delete(assignments)
          .where(and(
            inArray(assignments.merchantId, merchantIds),
            eq(assignments.month, rule.month)
          ));

        // Create new assignments
        const assignmentInserts = [];
        for (const merchantId of merchantIds) {
          for (const assignment of rule.defaultAssignments) {
            assignmentInserts.push({
              merchantId,
              roleId: assignment.roleId,
              percentage: assignment.percentage.toString(),
              month: rule.month
            });
          }
        }

        await db.insert(assignments).values(assignmentInserts);
        assignedCount += filteredMerchants.length;

      } catch (error) {
        console.error('Smart assignment error:', error);
        errors.push(`Error processing smart assignment rule: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      assignedCount,
      merchantsProcessed,
      errors
    };
  }

  // Assign by processor with default splits
  static async assignByProcessor(
    processorId: number, 
    month: string, 
    defaultAssignments: { roleId: number; percentage: number }[]
  ): Promise<{ success: boolean; assignedCount: number; errors: string[] }> {
    
    const smartRule: SmartAssignmentRule = {
      processorId,
      defaultAssignments,
      month
    };

    return await this.smartAssignByRevenue([smartRule]);
  }

  // Copy assignments from previous month
  static async copyPreviousMonthAssignments(
    fromMonth: string, 
    toMonth: string, 
    merchantIds?: number[]
  ): Promise<{ success: boolean; copiedCount: number; errors: string[] }> {
    try {
      // Get assignments from previous month
      let query = db.select({
        merchantId: assignments.merchantId,
        roleId: assignments.roleId,
        percentage: assignments.percentage
      })
      .from(assignments)
      .where(eq(assignments.month, fromMonth));

      if (merchantIds) {
        query = query.where(inArray(assignments.merchantId, merchantIds));
      }

      const previousAssignments = await query;
      
      if (previousAssignments.length === 0) {
        return { success: true, copiedCount: 0, errors: ['No assignments found in previous month'] };
      }

      // Remove existing assignments in target month
      let deleteQuery = db.delete(assignments).where(eq(assignments.month, toMonth));
      if (merchantIds) {
        deleteQuery = deleteQuery.where(inArray(assignments.merchantId, merchantIds));
      }
      await deleteQuery;

      // Insert copied assignments
      const newAssignments = previousAssignments.map(a => ({
        merchantId: a.merchantId,
        roleId: a.roleId,
        percentage: a.percentage,
        month: toMonth
      }));

      await db.insert(assignments).values(newAssignments);

      return {
        success: true,
        copiedCount: newAssignments.length,
        errors: []
      };

    } catch (error) {
      console.error('Copy assignments error:', error);
      return {
        success: false,
        copiedCount: 0,
        errors: [error.message]
      };
    }
  }

  // Get assignment templates for common scenarios
  static getAssignmentTemplates() {
    return {
      'Standard Sales Split': [
        { roleType: 'agent', percentage: 60 },
        { roleType: 'sales_manager', percentage: 25 },
        { roleType: 'partner', percentage: 15 }
      ],
      'High Performer Split': [
        { roleType: 'agent', percentage: 70 },
        { roleType: 'sales_manager', percentage: 20 },
        { roleType: 'company', percentage: 10 }
      ],
      'Team Leader Split': [
        { roleType: 'agent', percentage: 50 },
        { roleType: 'sales_manager', percentage: 30 },
        { roleType: 'partner', percentage: 15 },
        { roleType: 'association', percentage: 5 }
      ],
      'New Agent Split': [
        { roleType: 'agent', percentage: 40 },
        { roleType: 'sales_manager', percentage: 35 },
        { roleType: 'partner', percentage: 25 }
      ]
    };
  }

  // Get unassigned merchants summary
  static async getUnassignedSummary(month: string): Promise<{
    totalUnassigned: number;
    unassignedRevenue: number;
    byProcessor: { processorName: string; count: number; revenue: number }[];
  }> {
    
    // Get all merchants with monthly data but no assignments
    const unassignedQuery = `
      SELECT 
        m.id,
        md.net as revenue,
        p.name as processor_name
      FROM merchants m
      INNER JOIN monthly_data md ON m.id = md.merchant_id
      INNER JOIN processors p ON md.processor_id = p.id
      LEFT JOIN assignments a ON m.id = a.merchant_id AND a.month = $1
      WHERE md.month = $1 AND a.id IS NULL
    `;

    const result = await db.execute({ 
      sql: unassignedQuery, 
      args: [month] 
    });

    const unassigned = result.rows as any[];
    const totalUnassigned = unassigned.length;
    const unassignedRevenue = unassigned.reduce((sum, row) => sum + parseFloat(row.revenue || '0'), 0);

    // Group by processor
    const byProcessor = unassigned.reduce((acc, row) => {
      const existing = acc.find(p => p.processorName === row.processor_name);
      if (existing) {
        existing.count++;
        existing.revenue += parseFloat(row.revenue || '0');
      } else {
        acc.push({
          processorName: row.processor_name,
          count: 1,
          revenue: parseFloat(row.revenue || '0')
        });
      }
      return acc;
    }, [] as { processorName: string; count: number; revenue: number }[]);

    return {
      totalUnassigned,
      unassignedRevenue,
      byProcessor
    };
  }
}