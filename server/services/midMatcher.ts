import { storage } from '../storage';
import { CSVParser, ProcessorData, LeadData } from './csvParser';
import { InsertAuditIssue } from '@shared/schema';

export interface MatchResult {
  matched: number;
  created: number;
  updated: number;
  errors: string[];
}

export class MIDMatcher {
  static async matchProcessorData(
    processorData: ProcessorData[], 
    processorId: number, 
    month: string
  ): Promise<MatchResult> {
    const result: MatchResult = {
      matched: 0,
      created: 0,
      updated: 0,
      errors: []
    };

    for (const data of processorData) {
      try {
        if (!CSVParser.validateMID(data.merchantId)) {
          result.errors.push(`Invalid MID format: ${data.merchantId}`);
          continue;
        }

        const normalizedMID = CSVParser.normalizeMID(data.merchantId);
        let merchant = await storage.getMerchantByMid(normalizedMID);

        if (!merchant) {
          // Create new merchant with minimal data from processor file
          merchant = await storage.createMerchant({
            mid: normalizedMID,
            dba: data.merchantName || null,
            legalName: null,
            branchNumber: null,
            status: null,
            statusCategory: null,
            currentProcessor: null,
            partnerName: null,
          });
          result.created++;
        }

        // Check if monthly data already exists
        const existingData = await storage.getMonthlyDataByMerchant(merchant.id, month);
        const existingForProcessor = existingData.find(d => d.processorId === processorId);

        const monthlyData = CSVParser.createMonthlyData(data, merchant.id, processorId, month);

        if (existingForProcessor) {
          await storage.updateMonthlyData(existingForProcessor.id, monthlyData);
          result.updated++;
        } else {
          await storage.createMonthlyData(monthlyData);
          result.matched++;
        }

        // Check for audit issues
        await this.checkForAuditIssues(merchant.id, month);

      } catch (error) {
        result.errors.push(`Error processing MID ${data.merchantId}: ${error.message}`);
      }
    }

    return result;
  }

  static async matchLeadSheet(leadData: LeadData[]): Promise<MatchResult> {
    const result: MatchResult = {
      matched: 0,
      created: 0,
      updated: 0,
      errors: []
    };

    for (const lead of leadData) {
      try {
        if (!lead.merchantId || !CSVParser.validateMID(lead.merchantId)) {
          continue; // Skip records without valid MID
        }

        const normalizedMID = CSVParser.normalizeMID(lead.merchantId);
        const existingMerchant = await storage.getMerchantByMid(normalizedMID);

        if (existingMerchant) {
          // Update existing merchant with lead data
          const updatedMerchant = CSVParser.createMerchantFromLead(lead);
          await storage.updateMerchant(existingMerchant.id, {
            legalName: updatedMerchant.legalName || existingMerchant.legalName,
            dba: updatedMerchant.dba || existingMerchant.dba,
            branchNumber: updatedMerchant.branchNumber || existingMerchant.branchNumber,
            status: updatedMerchant.status || existingMerchant.status,
            statusCategory: updatedMerchant.statusCategory || existingMerchant.statusCategory,
            currentProcessor: updatedMerchant.currentProcessor || existingMerchant.currentProcessor,
            partnerName: updatedMerchant.partnerName || existingMerchant.partnerName,
          });
          result.updated++;
        } else {
          // Create new merchant from lead data
          const newMerchant = CSVParser.createMerchantFromLead(lead);
          newMerchant.mid = normalizedMID;
          await storage.createMerchant(newMerchant);
          result.created++;
        }

        result.matched++;
      } catch (error) {
        result.errors.push(`Error processing lead ${lead.merchantId}: ${error.message}`);
      }
    }

    return result;
  }

  static async checkForAuditIssues(merchantId: number, month: string): Promise<void> {
    try {
      // Check for missing assignments
      const assignments = await storage.getAssignments(merchantId, month);
      
      if (assignments.length === 0) {
        await storage.createAuditIssue({
          merchantId,
          month,
          issueType: 'missing_assignment',
          description: 'No role assignments configured',
          priority: 'medium',
          status: 'open',
        });
      } else {
        // Check if splits total 100%
        const totalPercentage = assignments.reduce((sum, assignment) => {
          return sum + parseFloat(assignment.percentage.toString());
        }, 0);

        if (Math.abs(totalPercentage - 100) > 0.01) {
          await storage.createAuditIssue({
            merchantId,
            month,
            issueType: 'split_error',
            description: `Percentage splits total ${totalPercentage.toFixed(2)}% (should be 100%)`,
            priority: 'high',
            status: 'open',
          });
        }
      }

      // Check for unmatched MIDs (merchants with no monthly data)
      const monthlyData = await storage.getMonthlyDataByMerchant(merchantId, month);
      if (monthlyData.length === 0) {
        await storage.createAuditIssue({
          merchantId,
          month,
          issueType: 'unmatched_mid',
          description: 'Merchant exists but has no revenue data for this month',
          priority: 'low',
          status: 'open',
        });
      }
    } catch (error) {
      console.error(`Error checking audit issues for merchant ${merchantId}:`, error);
    }
  }

  static async runFullAudit(month: string): Promise<{
    splitErrors: number;
    missingAssignments: number;
    unmatchedMids: number;
  }> {
    const monthlyData = await storage.getMonthlyData(month);
    const merchants = await storage.getMerchants();

    let splitErrors = 0;
    let missingAssignments = 0;
    let unmatchedMids = 0;

    // Check each merchant for issues
    for (const merchant of merchants) {
      const assignments = await storage.getAssignments(merchant.id, month);
      const merchantMonthlyData = await storage.getMonthlyDataByMerchant(merchant.id, month);

      if (assignments.length === 0 && merchantMonthlyData.length > 0) {
        missingAssignments++;
      }

      if (assignments.length > 0) {
        const totalPercentage = assignments.reduce((sum, assignment) => {
          return sum + parseFloat(assignment.percentage.toString());
        }, 0);

        if (Math.abs(totalPercentage - 100) > 0.01) {
          splitErrors++;
        }
      }

      if (merchantMonthlyData.length === 0) {
        unmatchedMids++;
      }
    }

    return { splitErrors, missingAssignments, unmatchedMids };
  }
}
