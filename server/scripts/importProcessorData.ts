#!/usr/bin/env tsx
/**
 * Bulk Processor Data Import Script
 * 
 * Usage:
 *   npx tsx server/scripts/importProcessorData.ts <csv-file> <processor-name> <month> [agency-id]
 * 
 * Example:
 *   npx tsx server/scripts/importProcessorData.ts ./data/trx-jan-2025.csv "TRX" "2025-01" 1
 */

import { BulkDataImportService } from '../services/BulkDataImportService';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: npx tsx server/scripts/importProcessorData.ts <csv-file> <processor-name> <month> [agency-id]');
    console.error('Example: npx tsx server/scripts/importProcessorData.ts ./data/trx-jan-2025.csv "TRX" "2025-01" 1');
    process.exit(1);
  }

  const [filePath, processorName, month, agencyIdStr] = args;
  const agencyId = agencyIdStr ? parseInt(agencyIdStr) : 1;

  // Validate file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  // Validate month format (YYYY-MM)
  if (!/^\d{4}-\d{2}$/.test(month)) {
    console.error(`❌ Invalid month format. Expected YYYY-MM, got: ${month}`);
    process.exit(1);
  }

  console.log('\n📦 Bulk Data Import');
  console.log('==================');
  console.log(`File: ${filePath}`);
  console.log(`Processor: ${processorName}`);
  console.log(`Month: ${month}`);
  console.log(`Agency ID: ${agencyId}`);
  console.log('');

  try {
    const result = await BulkDataImportService.importProcessorData(
      filePath,
      processorName,
      month,
      agencyId
    );

    console.log('\n✅ Import Complete');
    console.log('==================');
    console.log(`Records Imported: ${result.recordsImported}`);
    console.log(`Success: ${result.success}`);
    
    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`);
      result.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more errors`);
      }
    }

    process.exit(result.success ? 0 : 1);
  } catch (error: any) {
    console.error('\n❌ Import Failed');
    console.error(error.message);
    process.exit(1);
  }
}

main();
