import { db } from "../db";
import { 
  fileUploads, 
  midRoleAssignments, 
  uploadProgress,
  processors,
  monthlyData,
  merchants,
  roles,
  assignments,
  auditIssues,
  masterLeadSheets,
  roleAssignmentWorkflow,
  masterDataset
} from "../../shared/schema";
import { eq, and, desc, sum, sql, isNotNull, isNull } from "drizzle-orm";
import { CSVParser } from "./csvParser";
import fs from "fs";
import XLSX from "xlsx";
import { ProcessorMappingService } from "./ProcessorMappingService";
import { parse } from "csv-parse/sync";

export class ResidualsWorkflowService {
  
  // Step 1: Initialize Upload Progress Tracking with Real Data Status
  static async initializeUploadTracking(month: string) {
    const processorList = await db.select().from(processors);
    
    // Check which processors already have data for this month
    const existingData = await db
      .select({
        processorId: monthlyData.processorId,
        recordCount: sql<number>`count(*)`,
        totalRevenue: sql<number>`sum(${monthlyData.income}::numeric)`
      })
      .from(monthlyData)
      .where(eq(monthlyData.month, month))
      .groupBy(monthlyData.processorId);

    const dataMap = new Map(existingData.map(d => [d.processorId, d]));
    
    const progressEntries = processorList.map(processor => {
      const hasData = dataMap.has(processor.id);
      const data = dataMap.get(processor.id);
      
      return {
        month,
        year: month.split('-')[0],
        processorId: processor.id,
        processorName: processor.name,
        uploadStatus: hasData ? "validated" as const : "needs_upload" as const,
        leadSheetStatus: hasData ? "validated" as const : "needs_upload" as const,
        compilationStatus: hasData ? "compiled" as const : "pending" as const,
        assignmentStatus: "pending" as const,
        auditStatus: hasData ? "passed" as const : "pending" as const,
        recordCount: data?.recordCount || 0,
        fileName: hasData ? `${processor.name}_${month}.csv` : null,
        fileSize: hasData ? Math.floor((data?.recordCount || 0) * 150) : null, // Estimate file size
      };
    });

    // Insert or update progress tracking
    for (const entry of progressEntries) {
      await db.insert(uploadProgress)
        .values(entry)
        .onConflictDoNothing();
    }

    return progressEntries;
  }

  // Process Lead Sheet Upload and Extract Column I Data
  static async processLeadSheet(filePath: string, month: string, originalFilename?: string) {
    try {
      let leadData: any[];
      
      // Check file extension from original filename first, then file path
      const filename = originalFilename || filePath;
      const fileExtension = filename.toLowerCase().split('.').pop();
      
      console.log('Processing file:', { filePath, originalFilename, fileExtension });
      
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);
        
        // Convert to lead data format
        leadData = rawData.map((record: any) => ({
          merchantId: (record['Existing MID'] || record['MID'] || '').toString().trim(),
          legalName: record['Legal Name'] || '',
          dba: record['DBA'] || '',
          branchNumber: record['Partner Branch Number'] || record['Branch Number'] || '',
          status: record['Status'] || '',
          statusCategory: record['Status Category'] || '',
          currentProcessor: record['Current Processor'] || '',
          partnerName: record['Partner Name'] || '',
          salesReps: record['Sales Reps'] || '',
          assignedUsers: record['Assigned Users'] || '',
        }));
      } else {
        // Parse CSV file
        const csvContent = fs.readFileSync(filePath, 'utf-8');
        leadData = CSVParser.parseLeadSheet(csvContent);
      }
      
      // Process each merchant from the lead sheet
      let newMerchantCount = 0;
      let updatedMerchantCount = 0;
      let centennialTaggedCount = 0;
      
      for (const record of leadData) {
        if (record.merchantId && record.merchantId.trim() !== '') {
          // Check if merchant exists
          const existingMerchant = await db.select().from(merchants)
            .where(eq(merchants.mid, record.merchantId))
            .limit(1);
          
          // Determine if this is a Centennial partner based on branch ID
          const isCentennialPartner = record.branchNumber && record.branchNumber.trim() !== '';
          
          if (existingMerchant.length === 0) {
            // Create new merchant
            await db.insert(merchants).values({
              mid: record.merchantId,
              legalName: record.legalName || 'Unknown',
              dba: record.dba || record.legalName || 'Unknown',
              status: record.status === 'Active' ? 'active' : 'inactive',
              currentProcessor: record.currentProcessor || null,
              branchId: record.branchNumber || null,
              partnerType: isCentennialPartner ? 'Centennial' : null,
              notes: isCentennialPartner ? `Centennial Bank Partner (Branch: ${record.branchNumber})` : null
            });
            newMerchantCount++;
            if (isCentennialPartner) centennialTaggedCount++;
          } else {
            // Update existing merchant with branch ID and partner type if provided
            const updates: any = {};
            
            if (record.branchNumber && !existingMerchant[0].branchId) {
              updates.branchId = record.branchNumber;
              updates.partnerType = 'Centennial';
              updates.notes = `Centennial Bank Partner (Branch: ${record.branchNumber})`;
              centennialTaggedCount++;
            }
            
            if (record.legalName && !existingMerchant[0].legalName) {
              updates.legalName = record.legalName;
            }
            
            if (record.dba && !existingMerchant[0].dba) {
              updates.dba = record.dba;
            }
            
            if (Object.keys(updates).length > 0) {
              await db.update(merchants)
                .set(updates)
                .where(eq(merchants.id, existingMerchant[0].id));
              updatedMerchantCount++;
            }
          }
        }
      }
      
      // Extract Column I users (assigned users/sales reps from lead sheet)
      const columnIUsers = leadData
        .map(record => record.assignedUsers || record.salesReps || '')
        .filter(users => users.trim().length > 0)
        .flatMap(users => users.split(/[,;|]/).map((u: string) => u.trim()))
        .filter((user, index, arr) => arr.indexOf(user) === index); // Remove duplicates

      // Save to master_lead_sheets table
      const [leadSheetRecord] = await db.insert(masterLeadSheets).values({
        fileName: filePath.split('/').pop() || 'lead_sheet.csv',
        month,
        totalRecords: leadData.length,
        newMerchants: newMerchantCount,
        reappearingMerchants: updatedMerchantCount,
        status: 'completed',
      }).returning();
      
      console.log(`Lead sheet processed: ${newMerchantCount} new merchants, ${updatedMerchantCount} updated, ${centennialTaggedCount} Centennial partners tagged`);

      return {
        recordCount: leadData.length,
        columnIUsers,
        leadSheetId: leadSheetRecord.id,
        newMerchants: newMerchantCount,
        updatedMerchants: updatedMerchantCount,
        centennialTagged: centennialTaggedCount
      };
    } catch (error: any) {
      console.error('Lead sheet processing failed:', error);
      throw new Error(`Failed to process lead sheet: ${error.message}`);
    }
  }

  // Query Previous Month's Assignments for Auto-Population
  static async getPreviousMonthAssignments(month: string) {
    try {
      // Calculate previous month
      const [year, monthNum] = month.split('-');
      const prevDate = new Date(parseInt(year), parseInt(monthNum) - 2, 1); // -2 because months are 0-indexed
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Get all assignments from the previous month
      const previousAssignments = await db
        .select({
          mid: midRoleAssignments.mid,
          merchantName: midRoleAssignments.merchantName,
          agent: midRoleAssignments.agent,
          agentPercentage: midRoleAssignments.agentPercentage,
          partner: midRoleAssignments.partner,
          partnerPercentage: midRoleAssignments.partnerPercentage,
          salesManager: midRoleAssignments.salesManager,
          salesManagerPercentage: midRoleAssignments.salesManagerPercentage,
          company: midRoleAssignments.company,
          companyPercentage: midRoleAssignments.companyPercentage,
          association: midRoleAssignments.association,
          associationPercentage: midRoleAssignments.associationPercentage,
          originalColumnI: midRoleAssignments.originalColumnI
        })
        .from(midRoleAssignments)
        .where(eq(midRoleAssignments.month, prevMonth));
      
      // Create a map for fast lookup
      const assignmentMap = new Map();
      previousAssignments.forEach(assignment => {
        assignmentMap.set(assignment.mid, assignment);
      });
      
      return assignmentMap;
    } catch (error: any) {
      console.error('Failed to get previous month assignments:', error);
      return new Map();
    }
  }
  
  // Validate that role assignments add up to 100%
  static async validateAssignmentSplits(month: string) {
    try {
      const errors: string[] = [];
      let invalidAssignments = 0;
      let validAssignments = 0;
      const auditIssuesCreated: string[] = [];
      
      // Get all assignments for this month
      const assignments = await db
        .select({
          mid: midRoleAssignments.mid,
          merchantName: midRoleAssignments.merchantName,
          agentPercentage: midRoleAssignments.agentPercentage,
          partnerPercentage: midRoleAssignments.partnerPercentage,
          salesManagerPercentage: midRoleAssignments.salesManagerPercentage,
          companyPercentage: midRoleAssignments.companyPercentage,
          associationPercentage: midRoleAssignments.associationPercentage,
          assignmentStatus: midRoleAssignments.assignmentStatus
        })
        .from(midRoleAssignments)
        .where(eq(midRoleAssignments.month, month));
      
      // Validate each assignment
      for (const assignment of assignments) {
        // Calculate total percentage
        const totalPercentage = 
          (assignment.agentPercentage || 0) +
          (assignment.partnerPercentage || 0) +
          (assignment.salesManagerPercentage || 0) +
          (assignment.companyPercentage || 0) +
          (assignment.associationPercentage || 0);
        
        // Check if total equals 100%
        if (Math.abs(totalPercentage - 100) > 0.01) { // Allow for small floating point errors
          invalidAssignments++;
          
          // Create an audit issue for this invalid split
          const issueDescription = `Role assignment splits for MID ${assignment.mid} (${assignment.merchantName}) do not equal 100%. Current total: ${totalPercentage}%`;
          
          // Check if audit issue already exists
          const existingIssue = await db
            .select()
            .from(auditIssues)
            .where(
              and(
                eq(auditIssues.month, month),
                eq(auditIssues.entityId, assignment.mid),
                eq(auditIssues.issueType, 'invalid_split')
              )
            )
            .limit(1);
          
          if (existingIssue.length === 0) {
            // Create new audit issue
            await db.insert(auditIssues).values({
              month: month,
              entityType: 'mid_assignment',
              entityId: assignment.mid,
              issueType: 'invalid_split',
              severity: 'critical',
              description: issueDescription,
              status: 'pending',
              createdBy: 'system_validation',
              createdAt: new Date()
            });
            
            auditIssuesCreated.push(assignment.mid);
          }
          
          errors.push(issueDescription);
          
          // Update assignment status to indicate validation failed
          await db
            .update(midRoleAssignments)
            .set({ 
              assignmentStatus: 'validation_failed' as const,
              lastUpdated: new Date()
            })
            .where(
              and(
                eq(midRoleAssignments.mid, assignment.mid),
                eq(midRoleAssignments.month, month)
              )
            );
        } else {
          validAssignments++;
          
          // Clear any existing audit issues for this MID
          await db
            .delete(auditIssues)
            .where(
              and(
                eq(auditIssues.month, month),
                eq(auditIssues.entityId, assignment.mid),
                eq(auditIssues.issueType, 'invalid_split')
              )
            );
          
          // Update assignment status if it was previously failed
          if (assignment.assignmentStatus === 'validation_failed') {
            await db
              .update(midRoleAssignments)
              .set({ 
                assignmentStatus: 'assigned' as const,
                lastUpdated: new Date()
              })
              .where(
                and(
                  eq(midRoleAssignments.mid, assignment.mid),
                  eq(midRoleAssignments.month, month)
                )
              );
          }
        }
      }
      
      return {
        success: true,
        totalAssignments: assignments.length,
        validAssignments,
        invalidAssignments,
        auditIssuesCreated: auditIssuesCreated.length,
        errors
      };
      
    } catch (error: any) {
      console.error('Failed to validate assignment splits:', error);
      throw new Error(`Failed to validate assignment splits: ${error.message}`);
    }
  }
  
  // Auto-populate assignments for existing MIDs
  static async autoPopulateAssignments(month: string) {
    try {
      const errors: string[] = [];
      let autoPopulated = 0;
      let newMIDs = 0;
      
      // Get previous month's assignments
      const previousAssignments = await this.getPreviousMonthAssignments(month);
      
      // Get all MIDs for the current month from master dataset
      const currentMIDs = await db
        .select({
          mid: masterDataset.mid,
          legalName: masterDataset.legalName,
          dba: masterDataset.dba
        })
        .from(masterDataset)
        .where(eq(masterDataset.month, month));
      
      // Process each current MID
      for (const current of currentMIDs) {
        const previousAssignment = previousAssignments.get(current.mid);
        
        if (previousAssignment) {
          // Check if assignment already exists for this month
          const existingAssignment = await db
            .select()
            .from(midRoleAssignments)
            .where(
              and(
                eq(midRoleAssignments.mid, current.mid),
                eq(midRoleAssignments.month, month)
              )
            )
            .limit(1);
          
          if (existingAssignment.length === 0) {
            // Auto-populate with previous month's assignment
            try {
              await db.insert(midRoleAssignments).values({
                mid: current.mid,
                merchantName: current.dba || current.legalName || previousAssignment.merchantName,
                month: month,
                agent: previousAssignment.agent,
                agentPercentage: previousAssignment.agentPercentage,
                partner: previousAssignment.partner,
                partnerPercentage: previousAssignment.partnerPercentage,
                salesManager: previousAssignment.salesManager,
                salesManagerPercentage: previousAssignment.salesManagerPercentage,
                company: previousAssignment.company,
                companyPercentage: previousAssignment.companyPercentage,
                association: previousAssignment.association,
                associationPercentage: previousAssignment.associationPercentage,
                originalColumnI: previousAssignment.originalColumnI,
                assignmentStatus: 'auto_populated' as const,
                createdBy: 'system',
                lastUpdated: new Date()
              });
              
              autoPopulated++;
            } catch (insertError: any) {
              errors.push(`Failed to auto-populate MID ${current.mid}: ${insertError.message}`);
            }
          }
        } else {
          newMIDs++;
        }
      }
      
      return {
        success: true,
        autoPopulated,
        newMIDs,
        totalMIDs: currentMIDs.length,
        errors
      };
      
    } catch (error: any) {
      console.error('Failed to auto-populate assignments:', error);
      throw new Error(`Failed to auto-populate assignments: ${error.message}`);
    }
  }

  // Build Cross-Reference between Processor and Lead Sheet Data  
  static async crossReferenceAndPopulateMasterDataset(month: string) {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];
      let matchedRecords = 0;
      let unmatchedRecords = 0;
      let masterRecordsCreated = 0;
      
      // Get all monthly data for this month
      const monthlyRecords = await db
        .select({
          id: monthlyData.id,
          merchantId: monthlyData.merchantId,
          processorId: monthlyData.processorId,
          month: monthlyData.month,
          transactions: monthlyData.transactions,
          salesAmount: monthlyData.salesAmount,
          income: monthlyData.income,
          expenses: monthlyData.expenses,
          net: monthlyData.net,
          bps: monthlyData.bps,
          percentage: monthlyData.percentage,
          repNet: monthlyData.repNet,
          approvalDate: monthlyData.approvalDate,
          groupCode: monthlyData.groupCode,
          merchant: {
            id: merchants.id,
            mid: merchants.mid,
            legalName: merchants.legalName,
            dba: merchants.dba,
            branchId: merchants.branchId,
            partnerType: merchants.partnerType,
            partnerName: merchants.partnerName
          }
        })
        .from(monthlyData)
        .leftJoin(merchants, eq(monthlyData.merchantId, merchants.id))
        .where(eq(monthlyData.month, month));
      
      // Get processor info for each record
      const processorMap = new Map();
      const processorList = await db.select().from(processors);
      processorList.forEach(p => processorMap.set(p.id, p.name));
      
      // Process each monthly record and create/update master dataset
      for (const record of monthlyRecords) {
        try {
          const processorName = processorMap.get(record.processorId) || 'Unknown';
          
          // Check if master dataset record exists
          const existingMaster = await db
            .select()
            .from(masterDataset)
            .where(
              and(
                eq(masterDataset.mid, record.merchant.mid),
                eq(masterDataset.month, month)
              )
            )
            .limit(1);
          
          // Prepare master dataset record
          const masterRecord = {
            mid: record.merchant.mid,
            month: month,
            legalName: record.merchant.legalName || '',
            dba: record.merchant.dba || '',
            processorName: processorName,
            transactions: record.transactions || 0,
            volume: record.salesAmount || '0',
            grossRevenue: record.income || '0',
            interchange: '0', // Will be calculated from processor-specific fields
            processingFees: record.expenses || '0',
            otherFees: '0',
            netRevenue: record.net || '0',
            residualPercentage: record.percentage || '0',
            residualAmount: record.repNet || '0',
            branchId: record.merchant.branchId || record.groupCode || null,
            partnerType: record.merchant.partnerType || null,
            partnerName: record.merchant.partnerName || null,
            assignmentStatus: 'pending' as const,
            uploadDate: new Date()
          };
          
          if (existingMaster.length === 0) {
            // Create new master dataset record
            await db.insert(masterDataset).values(masterRecord);
            masterRecordsCreated++;
          } else {
            // Update existing master dataset record with latest data
            await db
              .update(masterDataset)
              .set({
                ...masterRecord,
                uploadDate: new Date()
              })
              .where(eq(masterDataset.id, existingMaster[0].id));
          }
          
          // Track matching status
          if (record.merchant.branchId || record.groupCode) {
            matchedRecords++;
          } else {
            unmatchedRecords++;
          }
          
        } catch (recordError: any) {
          errors.push(`Error processing master dataset for MID ${record.merchant.mid}: ${recordError.message}`);
        }
      }
      
      // Update any merchants with missing branch IDs from master dataset
      const masterWithBranches = await db
        .select({
          mid: masterDataset.mid,
          branchId: masterDataset.branchId
        })
        .from(masterDataset)
        .where(
          and(
            eq(masterDataset.month, month),
            isNotNull(masterDataset.branchId)
          )
        );
      
      for (const master of masterWithBranches) {
        await db
          .update(merchants)
          .set({ branchId: master.branchId })
          .where(
            and(
              eq(merchants.mid, master.mid),
              isNull(merchants.branchId)
            )
          );
      }
      
      return {
        success: true,
        matchedRecords,
        unmatchedRecords,
        masterRecordsCreated,
        errors,
        warnings
      };
      
    } catch (error: any) {
      console.error('Cross-reference failed:', error);
      throw new Error(`Failed to cross-reference data: ${error.message}`);
    }
  }

  // Process Processor File Upload and Extract Data
  static async processProcessorFile(filePath: string, processorId: number, month: string, originalFilename?: string) {
    try {
      let rawData: any[];
      let validRecords = 0;
      let errors: string[] = [];
      let warnings: string[] = [];
      
      // Get processor info
      const processorInfo = await db.select().from(processors).where(eq(processors.id, processorId)).limit(1);
      const processorName = processorInfo[0]?.name || `Processor ${processorId}`;
      
      // Extract year from month (format: YYYY-MM)
      const [year, monthNum] = month.split('-');
      
      // Check file extension from original filename first, then file path
      const filename = originalFilename || filePath;
      const fileExtension = filename.toLowerCase().split('.').pop();
      
      console.log('Processing processor file:', { filePath, originalFilename, fileExtension, processorName });
      
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rawData = XLSX.utils.sheet_to_json(worksheet);
      } else {
        // Parse CSV file using robust CSV parser
        let csvContent = fs.readFileSync(filePath, 'utf-8');
        
        // Check if this is a Clearent file with a header row before column headers
        const lines = csvContent.split('\n');
        if (lines[0] && lines[0].includes('Residuals - Clearent')) {
          // Skip the first line which is just a title
          csvContent = lines.slice(1).join('\n');
        }
        
        // Use the csv-parse library for proper CSV parsing
        rawData = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_quotes: true,
          relax_column_count: true,
        });
      }
      
      // Get column headers for validation
      const headers = Object.keys(rawData[0] || {});
      
      // Validate mapping for this processor
      const validation = ProcessorMappingService.validateMapping(headers, processorName);
      if (!validation.isValid) {
        warnings.push(`Missing mappings for required fields: ${validation.missingFields.join(', ')}`);
        console.warn('Processor mapping validation warning:', validation);
      }
      
      // Process data using the mapping service
      const mappedData = ProcessorMappingService.processBatch(rawData, processorName, month, year);
      
      // Process and store the mapped data
      for (const data of mappedData) {
        try {
          if (!data.mid || data.mid.trim() === '' || data.mid === 'UNKNOWN') {
            errors.push(`Skipping record with missing Merchant ID: ${data.merchantName}`);
            continue;
          }
          
          // Create or find merchant
          let merchant = await db.select().from(merchants).where(eq(merchants.mid, data.mid)).limit(1);
          let merchantId: number;
          
          if (merchant.length === 0) {
            // Create new merchant
            const [newMerchant] = await db.insert(merchants).values({
              mid: data.mid,
              legalName: data.merchantName,
              dba: data.merchantDba || data.merchantName,
              status: 'active',
              currentProcessor: processorName,
              branchId: data.branchId || null
            }).returning();
            merchantId = newMerchant.id;
          } else {
            merchantId = merchant[0].id;
            
            // Update branch ID if provided
            if (data.branchId && !merchant[0].branchId) {
              await db.update(merchants)
                .set({ branchId: data.branchId })
                .where(eq(merchants.id, merchantId));
            }
          }
          
          // Create monthly data record with mapped fields
          await db.insert(monthlyData).values({
            merchantId,
            processorId,
            month,
            transactions: data.transactions || 0,
            salesAmount: data.volume?.toString() || '0',
            income: data.grossRevenue?.toString() || '0',
            expenses: ((data.interchange || 0) + (data.processingFees || 0) + (data.otherFees || 0)).toString(),
            net: data.netRevenue?.toString() || '0',
            bps: '0', // Calculate if needed based on volume
            percentage: '0', // Calculate if needed
            repNet: data.netRevenue?.toString() || '0',
            approvalDate: null,
            groupCode: data.branchId || null
          }).onConflictDoUpdate({
            target: [monthlyData.merchantId, monthlyData.processorId, monthlyData.month],
            set: {
              transactions: data.transactions || 0,
              salesAmount: data.volume?.toString() || '0',
              income: data.grossRevenue?.toString() || '0',
              expenses: ((data.interchange || 0) + (data.processingFees || 0) + (data.otherFees || 0)).toString(),
              net: data.netRevenue?.toString() || '0',
              repNet: data.netRevenue?.toString() || '0',
              groupCode: data.branchId || null
            }
          });
          
          validRecords++;
        } catch (recordError: any) {
          errors.push(`Error processing record ${data.mid}: ${recordError.message}`);
        }
      }
      
      // Auto-detect processor type if not matching well
      if (validRecords === 0 && mappedData.length > 0) {
        const detectedProcessor = ProcessorMappingService.detectProcessorType(headers);
        if (detectedProcessor && detectedProcessor !== processorName) {
          warnings.push(`Auto-detected processor type as '${detectedProcessor}' instead of '${processorName}'. Consider updating processor configuration.`);
        }
      }
      
      return {
        recordCount: rawData.length,
        validRecords,
        errors,
        warnings
      };
      
    } catch (error: any) {
      console.error('Processor file processing failed:', error);
      throw new Error(`Failed to process processor file: ${error.message}`);
    }
  }

  // Ensure Upload Progress Record Exists
  static async ensureUploadProgressRecord(month: string, processorId: number) {
    // Get processor name
    const processorData = await db.select().from(processors).where(eq(processors.id, processorId)).limit(1);
    const processorName = processorData[0]?.name || `Processor ${processorId}`;
    
    // Check if record exists
    const existingRecord = await db
      .select()
      .from(uploadProgress)
      .where(and(
        eq(uploadProgress.month, month),
        eq(uploadProgress.processorId, processorId)
      ))
      .limit(1);
    
    // Create record if it doesn't exist
    if (existingRecord.length === 0) {
      await db.insert(uploadProgress).values({
        month,
        processorId,
        processorName,
        uploadStatus: 'needs_upload',
        leadSheetStatus: 'needs_upload',
        compilationStatus: 'pending',
        assignmentStatus: 'pending',
        auditStatus: 'pending',
        lastUpdated: new Date()
      });
    }
  }

  // Step 2: Update Upload Status with Validation
  static async updateUploadStatus(
    month: string, 
    processorId: number, 
    type: 'processor' | 'lead_sheet',
    status: 'uploaded' | 'validated' | 'error',
    errorMessage?: string,
    validationResults?: any
  ) {
    const updateData: any = {
      lastUpdated: new Date(),
    };

    if (type === 'processor') {
      updateData.uploadStatus = status;
      // Update record count and other metrics from validation results
      if (validationResults) {
        updateData.recordCount = validationResults.recordCount || 0;
        updateData.fileName = `processor_${month}_${processorId}.csv`;
        updateData.fileSize = Math.floor((validationResults.recordCount || 0) * 150); // Estimate
      }
    } else {
      updateData.leadSheetStatus = status;
      if (validationResults) {
        updateData.recordCount = validationResults.recordCount || 0;
      }
    }

    console.log(`[DEBUG] Updating uploadProgress for month: ${month}, processorId: ${processorId}, updateData:`, updateData);
    
    const updateResult = await db.update(uploadProgress)
      .set(updateData)
      .where(and(
        eq(uploadProgress.month, month),
        eq(uploadProgress.processorId, processorId)
      ));
    
    console.log(`[DEBUG] Update result:`, updateResult);

    // Log validation results
    if (validationResults || errorMessage) {
      await db.insert(fileUploads).values({
        filename: `${type}_${month}_${processorId}`,
        processorId: type === 'processor' ? processorId : null,
        month,
        type,
        status,
        errorMessage,
        validationResults,
        recordsProcessed: validationResults?.recordCount || 0,
      });
    }
  }

  // Step 3: Compile Data into Master Dataset
  static async compileDataset(month: string) {
    try {
      // Get all monthly data for the specified month
      const monthlyRecords = await db
        .select({
          mid: merchants.mid,
          merchantName: merchants.legalName,
          revenue: monthlyData.income,
          processor: processors.name,
        })
        .from(monthlyData)
        .innerJoin(merchants, eq(monthlyData.merchantId, merchants.id))
        .innerJoin(processors, eq(monthlyData.processorId, processors.id))
        .where(eq(monthlyData.month, month));

      // Cross-reference and deduplicate merchants
      const masterEntries = monthlyRecords.map(record => ({
        mid: record.mid,
        merchantName: record.merchantName || 'Unknown Merchant',
        month,
        totalRevenue: record.revenue || '0',
        processor: record.processor,
        leadSheetUsers: null, // Will be populated from lead sheet upload
        assignmentStatus: 'pending' as const,
      }));

      // Insert into master dataset
      await db.insert(masterDataset)
        .values(masterEntries)
        .onConflictDoNothing();

      // Update compilation status
      await db.update(uploadProgress)
        .set({ 
          compilationStatus: 'compiled',
          lastUpdated: new Date()
        })
        .where(eq(uploadProgress.month, month));

      return masterEntries.length;
    } catch (error) {
      console.error('Dataset compilation failed:', error);
      
      await db.update(uploadProgress)
        .set({ 
          compilationStatus: 'error',
          lastUpdated: new Date()
        })
        .where(eq(uploadProgress.month, month));
      
      throw error;
    }
  }

  // Step 4: Process Column I Users into Role Assignments
  static async processColumnIAssignments(month: string, assignments: {
    mid: string,
    userId: string,
    roleType: string,
    percentage: number
  }[], assignedBy: string) {
    
    // Validate percentages total 100% per MID
    const midGroups = assignments.reduce((acc, assignment) => {
      if (!acc[assignment.mid]) {
        acc[assignment.mid] = 0;
      }
      acc[assignment.mid] += assignment.percentage;
      return acc;
    }, {} as Record<string, number>);

    // Check for percentage validation errors
    const errors: string[] = [];
    Object.entries(midGroups).forEach(([midId, total]) => {
      if (Math.abs(total - 100) > 0.01) {
        errors.push(`MID ${midId} assignments total ${total}%, must equal 100%`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Assignment validation failed: ${errors.join(', ')}`);
    }

    // Insert role assignments
    const roleAssignments = assignments.map(assignment => ({
      mid: assignment.mid,
      userId: assignment.userId,
      roleType: assignment.roleType,
      percentage: assignment.percentage.toString(),
      assignedBy,
      status: 'active' as const,
    }));

    await db.insert(roleAssignmentWorkflow).values(roleAssignments);

    // Update assignment status
    await db.update(uploadProgress)
      .set({ 
        assignmentStatus: 'assigned',
        lastUpdated: new Date()
      })
      .where(eq(uploadProgress.month, month));

    return roleAssignments.length;
  }

  // Step 5: Run Audit Validation
  static async runAuditValidation(month: string) {
    const issues: any[] = [];

    // Check for unassigned MIDs
    const unassignedMids = await db
      .select()
      .from(masterDataset)
      .where(and(
        eq(masterDataset.month, month),
        eq(masterDataset.assignmentStatus, 'pending')
      ));

    unassignedMids.forEach(mid => {
      issues.push({
        merchantId: null,
        month,
        issueType: 'missing_assignment',
        description: `MID ${mid.mid} (${mid.merchantName}) has no role assignments`,
        priority: 'high',
      });
    });

    // Check for percentage split errors
    const assignmentTotals = await db
      .select({
        mid: roleAssignmentWorkflow.mid,
        totalPercentage: sum(roleAssignmentWorkflow.percentage).as('totalPercentage')
      })
      .from(roleAssignmentWorkflow)
      .groupBy(roleAssignmentWorkflow.mid);

    assignmentTotals.forEach(total => {
      const percentage = parseFloat(total.totalPercentage || '0');
      if (Math.abs(percentage - 100) > 0.01) {
        issues.push({
          merchantId: null,
          month,
          issueType: 'split_error',
          description: `MID assignments total ${percentage}%, must equal 100%`,
          priority: 'high',
        });
      }
    });

    // Insert audit issues
    if (issues.length > 0) {
      await db.insert(auditIssues).values(issues);
    }

    // Update audit status
    const auditStatus = issues.length > 0 ? 'failed' : 'passed';
    await db.update(uploadProgress)
      .set({ 
        auditStatus,
        lastUpdated: new Date()
      })
      .where(eq(uploadProgress.month, month));

    return {
      status: auditStatus,
      issuesFound: issues.length,
      issues
    };
  }

  // Get Upload Progress Dashboard with Real Data
  static async getUploadProgress(month: string) {
    // Initialize tracking for this month if not exists
    await this.initializeUploadTracking(month);
    
    // Get current progress
    const progress = await db.select().from(uploadProgress).where(eq(uploadProgress.month, month));
    
    // Enrich with real-time data from monthly_data table
    const enrichedProgress = await Promise.all(progress.map(async (item) => {
      const realData = await db
        .select({
          recordCount: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${monthlyData.income}::numeric)`
        })
        .from(monthlyData)
        .where(and(
          eq(monthlyData.month, month),
          eq(monthlyData.processorId, item.processorId!)
        ));

      const data = realData[0];
      
      return {
        ...item,
        recordCount: data?.recordCount || 0,
        totalRevenue: data?.totalRevenue || 0,
        uploadStatus: data?.recordCount > 0 ? 'validated' : item.uploadStatus,
        leadSheetStatus: data?.recordCount > 0 ? 'validated' : item.leadSheetStatus,
        compilationStatus: data?.recordCount > 0 ? 'compiled' : item.compilationStatus,
        auditStatus: data?.recordCount > 0 ? 'passed' : item.auditStatus,
      };
    }));
    
    return enrichedProgress;
  }

  // Get Master Dataset for Assignments
  static async getMasterDatasetForAssignment(month: string) {
    return await db
      .select({
        id: masterDataset.id,
        mid: masterDataset.mid,
        merchantName: masterDataset.merchantName,
        totalRevenue: masterDataset.totalRevenue,
        processor: masterDataset.processor,
        leadSheetUsers: masterDataset.leadSheetUsers,
        assignmentStatus: masterDataset.assignmentStatus,
      })
      .from(masterDataset)
      .where(eq(masterDataset.month, month))
      .orderBy(masterDataset.merchantName);
  }

  // Get Permission-Based Reports
  static async getPermissionBasedReports(userId: string, roleType: string, month?: string) {
    if (roleType === 'agent') {
      // Agents only see their assigned MIDs and revenue
      return await db
        .select({
          mid: masterDataset.mid,
          merchantName: masterDataset.merchantName,
          month: masterDataset.month,
          totalRevenue: masterDataset.totalRevenue,
          agentRevenue: sql<string>`${masterDataset.totalRevenue} * ${roleAssignmentWorkflow.percentage} / 100`,
          percentage: roleAssignmentWorkflow.percentage,
        })
        .from(masterDataset)
        .innerJoin(roleAssignmentWorkflow, eq(masterDataset.mid, roleAssignmentWorkflow.mid))
        .where(and(
          eq(roleAssignmentWorkflow.userId, userId),
          month ? eq(masterDataset.month, month) : sql`1=1`
        ))
        .orderBy(desc(masterDataset.month), masterDataset.merchantName);
    } else {
      // Admin/Manager roles see all data
      return await db
        .select()
        .from(masterDataset)
        .where(month ? eq(masterDataset.month, month) : sql`1=1`)
        .orderBy(desc(masterDataset.month), masterDataset.merchantName);
    }
  }
}