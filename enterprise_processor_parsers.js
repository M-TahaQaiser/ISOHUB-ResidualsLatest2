// Enterprise Processor-Specific Parsing System
import XLSX from 'xlsx';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

class EnterpriseParsingEngine {
  
  // Processor-specific schemas with validation rules
  static PROCESSOR_SCHEMAS = {
    'Clearent': {
      file_format: 'CSV',
      revenue_field: 'Net',
      volume_field: 'Sales Amount',
      transaction_field: 'Transactions',
      mid_field: 'Merchant ID',
      name_field: 'Merchant',
      revenue_range: [0, 10000],
      signature: ['Merchant ID', 'Merchant', 'Transactions', 'Sales Amount', 'Net']
    },
    
    'TRX': {
      file_format: 'XLSX',
      revenue_field: 'Agent Residual',  // CRITICAL: Column 37
      volume_field: 'Net Sales Amount',
      transaction_field: 'Net Sales Count',
      mid_field: 'Client',
      name_field: 'Dba',
      revenue_range: [0, 1000],  // TRX residuals are small amounts
      signature: ['Client', 'Dba', 'Agent Residual', 'Net Sales Amount']
    },
    
    'Shift4': {
      file_format: 'XLSX',
      revenue_field: 'Payout Amount',
      volume_field: 'Processing Volume',
      transaction_field: 'Transaction Count',
      mid_field: 'MID',
      name_field: 'Business Name',
      revenue_range: [0, 50000],
      signature: ['MID', 'Business Name', 'Payout Amount']
    },
    
    'Global Payments TSYS': {
      file_format: 'CSV',
      revenue_field: 'Net Income',
      volume_field: 'Monthly Volume',
      transaction_field: 'Transaction Count',
      mid_field: 'Merchant ID',
      name_field: 'Merchant Name',
      revenue_range: [0, 15000],
      signature: ['Merchant ID', 'Net Income', 'Monthly Volume']
    },
    
    'Micamp Solutions': {
      file_format: 'CSV',
      revenue_field: 'Net',
      volume_field: 'Sales Amount',
      transaction_field: 'Transactions',
      mid_field: 'Merchant ID',
      name_field: 'Merchant',
      revenue_range: [0, 8000],
      signature: ['Merchant ID', 'Merchant', 'Net', 'Sales Amount']
    }
  };

  // Detect processor type from file structure
  static detectProcessor(headers, fileName = '') {
    let bestMatch = null;
    let bestScore = 0;
    
    Object.entries(this.PROCESSOR_SCHEMAS).forEach(([processor, schema]) => {
      let score = 0;
      schema.signature.forEach(sig => {
        if (headers.some(h => h.toLowerCase().includes(sig.toLowerCase()))) {
          score++;
        }
      });
      
      const matchRatio = score / schema.signature.length;
      if (matchRatio > bestScore && matchRatio > 0.6) {
        bestScore = matchRatio;
        bestMatch = processor;
      }
    });
    
    // Filename hints
    if (fileName.toLowerCase().includes('trx')) bestMatch = 'TRX';
    if (fileName.toLowerCase().includes('clearent')) bestMatch = 'Clearent';
    if (fileName.toLowerCase().includes('shift4')) bestMatch = 'Shift4';
    if (fileName.toLowerCase().includes('micamp')) bestMatch = 'Micamp Solutions';
    if (fileName.toLowerCase().includes('tsys')) bestMatch = 'Global Payments TSYS';
    
    return { processor: bestMatch, confidence: bestScore };
  }

  // Validate revenue amounts based on processor
  static validateRevenue(processor, revenue, merchant) {
    const schema = this.PROCESSOR_SCHEMAS[processor];
    if (!schema) return { valid: false, reason: 'Unknown processor' };
    
    const [min, max] = schema.revenue_range;
    if (revenue < min || revenue > max) {
      return {
        valid: false,
        reason: `${merchant}: Revenue $${revenue} outside expected range $${min}-$${max} for ${processor}`,
        suggested_fix: 'Check field mapping - may be using volume/gross instead of net residual',
        severity: revenue > max * 10 ? 'CRITICAL' : 'HIGH'
      };
    }
    
    return { valid: true };
  }

  // Multi-layer validation system
  static validateMerchantData(record, processor) {
    const validations = [];
    
    // Revenue validation
    const revenueCheck = this.validateRevenue(processor, record.revenue, record.name);
    if (!revenueCheck.valid) validations.push(revenueCheck);
    
    // Transaction consistency
    if (record.revenue > 0 && record.transactions === 0) {
      validations.push({
        valid: false,
        reason: `${record.name}: Revenue without transactions`,
        severity: 'HIGH'
      });
    }
    
    // Revenue per transaction sanity check
    if (record.transactions > 0) {
      const revPerTxn = record.revenue / record.transactions;
      if (revPerTxn > 50) {
        validations.push({
          valid: false,
          reason: `${record.name}: Revenue per transaction ($${revPerTxn.toFixed(2)}) unusually high`,
          severity: 'MEDIUM'
        });
      }
    }
    
    // MID format validation
    if (!record.mid || record.mid.toString().length < 5) {
      validations.push({
        valid: false,
        reason: `${record.name}: Invalid MID format`,
        severity: 'LOW'
      });
    }
    
    return validations;
  }

  // Process file with processor-specific logic
  static async processFile(filePath, detectedProcessor = null) {
    console.log(`\n🔍 PROCESSING FILE: ${filePath}`);
    console.log(`📊 DETECTED PROCESSOR: ${detectedProcessor || 'Auto-detecting...'}`);
    
    let data, headers;
    
    // File reading based on extension
    if (filePath.endsWith('.xlsx')) {
      const workbook = XLSX.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      data = XLSX.utils.sheet_to_json(worksheet);
      headers = Object.keys(data[0] || {});
    } else {
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      const lines = csvContent.split('\n');
      const dataLines = lines.slice(1); // Skip potential title row
      
      data = parse(dataLines.join('\n'), {
        columns: true,
        skip_empty_lines: true
      });
      headers = Object.keys(data[0] || {});
    }
    
    // Processor detection
    const detection = this.detectProcessor(headers, filePath);
    const processor = detectedProcessor || detection.processor;
    
    if (!processor) {
      throw new Error(`Could not detect processor type for ${filePath}`);
    }
    
    console.log(`✅ PROCESSOR CONFIRMED: ${processor} (${(detection.confidence * 100).toFixed(1)}% confidence)`);
    
    const schema = this.PROCESSOR_SCHEMAS[processor];
    const results = {
      processor,
      total_records: data.length,
      valid_merchants: 0,
      validation_errors: [],
      merchants: []
    };
    
    // Process each record
    data.forEach((record, index) => {
      try {
        // Extract fields using processor schema
        const merchantData = {
          mid: this.extractField(record, schema.mid_field),
          name: this.extractField(record, schema.name_field),
          revenue: parseFloat(this.extractField(record, schema.revenue_field)) || 0,
          volume: parseFloat(this.extractField(record, schema.volume_field)) || 0,
          transactions: parseInt(this.extractField(record, schema.transaction_field)) || 0,
          processor
        };
        
        // Skip invalid records
        if (!merchantData.name || !merchantData.mid) return;
        
        // Validate merchant data
        const validationResults = this.validateMerchantData(merchantData, processor);
        
        if (validationResults.length > 0) {
          results.validation_errors.push(...validationResults);
          
          // Skip records with critical errors
          if (validationResults.some(v => v.severity === 'CRITICAL')) {
            console.log(`❌ CRITICAL ERROR: Skipping ${merchantData.name}`);
            return;
          }
        }
        
        if (merchantData.revenue > 0) {
          results.merchants.push(merchantData);
          results.valid_merchants++;
        }
        
      } catch (error) {
        console.error(`Error processing record ${index + 1}: ${error.message}`);
      }
    });
    
    return results;
  }

  // Helper to extract field value with fuzzy matching
  static extractField(record, fieldName) {
    // Exact match first
    if (record[fieldName] !== undefined) return record[fieldName];
    
    // Fuzzy matching for similar field names
    const keys = Object.keys(record);
    const fuzzyMatch = keys.find(key => 
      key.toLowerCase().includes(fieldName.toLowerCase()) ||
      fieldName.toLowerCase().includes(key.toLowerCase())
    );
    
    return fuzzyMatch ? record[fuzzyMatch] : null;
  }
}

export { EnterpriseParsingEngine };