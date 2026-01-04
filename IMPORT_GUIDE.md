# Bulk Processor Data Import Guide

## Overview
This guide helps you import processor data from Google Sheets into the Tracers organization's Data Management system.

## Step 1: Export Google Sheets as CSV

For each Google Sheet, you need to export individual month sheets as CSV files:

### How to Export:
1. Open the Google Sheet
2. Click on the sheet tab (e.g., "January", "February", etc.)
3. Go to **File > Download > Comma Separated Values (.csv)**
4. Save with a descriptive name: `{processor}-{month}-2025.csv`
   - Example: `trx-january-2025.csv`, `shift4-february-2025.csv`

### Processor List:
1. **TRX 2025** - https://docs.google.com/spreadsheets/d/16fiJXrTvJFBDORS_lhaI6HGK3_wc5ri4ReIOCzAr52M/
2. **Shift4 2025** - https://docs.google.com/spreadsheets/d/1OmYOGay2rbAq77wLHtfE0nikj0uimLsXwzaTEImdQ4U/
3. **Rectangle Health 2025** - https://docs.google.com/spreadsheets/d/1yYfTVlhWZ1QS1Lx1Z5-Hroqt8nujnssVmUyK_GjwEOA/
4. **Payment Advisors 2025** - https://docs.google.com/spreadsheets/d/1PmJho-wFdSZbEAHkkR12i9tdkLTd2imZO5pj-r7_Zt4/
5. **PayBright 2025** - https://docs.google.com/spreadsheets/d/1WCMYZRSqdurdX61tENToqTIMkX6oE4edASvUCdQi-aQ/
6. **MiCamp 2025** - https://docs.google.com/spreadsheets/d/1NPvWsJ-xHEd80aUNNgW56oFx81gMlGTcJnlZM6A0Gfw/
7. **Merchant Lynx 2025** - https://docs.google.com/spreadsheets/d/193xDW8uzW4Fwnx_PtDjlqsSmFExEt1yYMYM7nsQVnks/
8. **Global TSYS 2025** - https://docs.google.com/spreadsheets/d/1XaIVHdVPvNhz6XZVxisnhHJJt7DghEMvFEO6zWl4d-E/
9. **Fiserv 2025** - https://docs.google.com/spreadsheets/d/1hvV2UyCdXIi4YzRou_ZQG501E9xqEMG9v_RMYp-ryv0/
10. **Clearent 2025** - https://docs.google.com/spreadsheets/d/1vAgpos-yxtWe7yRCOr18h3UACkQhlSdZdE6cH5wPKXM/

## Step 2: Organize CSV Files

Create a folder structure:
```
data-imports/
├── trx/
│   ├── trx-january-2025.csv
│   ├── trx-february-2025.csv
│   └── ...
├── shift4/
│   ├── shift4-january-2025.csv
│   └── ...
├── rectangle-health/
├── payment-advisors/
├── paybright/
├── micamp/
├── merchant-lynx/
├── global-tsys/
├── fiserv/
└── clearent/
```

## Step 3: Import Data

### Option A: Single File Import
```bash
npx tsx server/scripts/importProcessorData.ts <csv-file> <processor-name> <month> [agency-id]
```

**Examples:**
```bash
# Import TRX January 2025 data
npx tsx server/scripts/importProcessorData.ts ./data-imports/trx/trx-january-2025.csv "TRX" "2025-01" 1

# Import Shift4 February 2025 data
npx tsx server/scripts/importProcessorData.ts ./data-imports/shift4/shift4-february-2025.csv "Shift4" "2025-02" 1

# Import Clearent March 2025 data
npx tsx server/scripts/importProcessorData.ts ./data-imports/clearent/clearent-march-2025.csv "Clearent" "2025-03" 1
```

### Option B: Bulk Import Script
Create a file `bulk-import.sh`:

```bash
#!/bin/bash

# Tracers Organization - Agency ID: 1

echo "Starting bulk import for Tracers organization..."

# TRX 2025
npx tsx server/scripts/importProcessorData.ts ./data-imports/trx/trx-january-2025.csv "TRX" "2025-01" 1
npx tsx server/scripts/importProcessorData.ts ./data-imports/trx/trx-february-2025.csv "TRX" "2025-02" 1
npx tsx server/scripts/importProcessorData.ts ./data-imports/trx/trx-march-2025.csv "TRX" "2025-03" 1

# Shift4 2025
npx tsx server/scripts/importProcessorData.ts ./data-imports/shift4/shift4-january-2025.csv "Shift4" "2025-01" 1
npx tsx server/scripts/importProcessorData.ts ./data-imports/shift4/shift4-february-2025.csv "Shift4" "2025-02" 1

# Rectangle Health 2025
npx tsx server/scripts/importProcessorData.ts ./data-imports/rectangle-health/rectangle-health-january-2025.csv "Rectangle Health" "2025-01" 1

# Payment Advisors 2025
npx tsx server/scripts/importProcessorData.ts ./data-imports/payment-advisors/payment-advisors-january-2025.csv "Payment Advisors" "2025-01" 1

# PayBright 2025
npx tsx server/scripts/importProcessorData.ts ./data-imports/paybright/paybright-january-2025.csv "PayBright" "2025-01" 1

# MiCamp 2025
npx tsx server/scripts/importProcessorData.ts ./data-imports/micamp/micamp-january-2025.csv "MiCamp" "2025-01" 1

# Merchant Lynx 2025
npx tsx server/scripts/importProcessorData.ts ./data-imports/merchant-lynx/merchant-lynx-january-2025.csv "Merchant Lynx" "2025-01" 1

# Global TSYS 2025
npx tsx server/scripts/importProcessorData.ts ./data-imports/global-tsys/global-tsys-january-2025.csv "Global Payments TSYS" "2025-01" 1

# Fiserv 2025
npx tsx server/scripts/importProcessorData.ts ./data-imports/fiserv/fiserv-january-2025.csv "First Data/Fiserv" "2025-01" 1

# Clearent 2025
npx tsx server/scripts/importProcessorData.ts ./data-imports/clearent/clearent-january-2025.csv "Clearent" "2025-01" 1

echo "Bulk import complete!"
```

Make it executable:
```bash
chmod +x bulk-import.sh
./bulk-import.sh
```

## Step 4: Verify Import

After importing, verify the data:

```bash
npx tsx -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/isohub' });

async function run() {
  const client = await pool.connect();
  try {
    const result = await client.query(\`
      SELECT 
        md.month,
        p.name as processor,
        COUNT(*) as record_count,
        SUM(md.income::numeric) as total_income
      FROM monthly_data md
      JOIN processors p ON md.processor_id = p.id
      WHERE md.agency_id = 1
      GROUP BY md.month, p.name
      ORDER BY md.month DESC, p.name
    \`);
    
    console.log('\\nImported Data Summary:');
    console.log('======================');
    result.rows.forEach(row => {
      console.log(\`\${row.month} - \${row.processor}: \${row.record_count} records, $\${parseFloat(row.total_income).toFixed(2)}\`);
    });
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
"
```

## CSV File Requirements

Your CSV files should contain columns with merchant and financial data. The import service automatically detects common column names:

### Required Columns (at least one of each):
- **MID**: `MID`, `Mid`, `Merchant ID`, `Account Number`, etc.
- **Merchant Name**: `DBA`, `Merchant Name`, `Business Name`, `Legal Name`, etc.
- **Income/Revenue**: `Income`, `Revenue`, `Commission`, `Amount`, `Residual`, `Payout`, etc.

### Example CSV Format:
```csv
MID,DBA,Income
12345,Coffee Shop Inc,1250.50
67890,Restaurant LLC,2340.75
```

## Processor Name Mapping

Use these exact processor names for import:

| Google Sheet Name | Import Processor Name |
|-------------------|----------------------|
| TRX 2025 | TRX |
| Shift4 2025 | Shift4 |
| Rectangle Health 2025 | Rectangle Health |
| Payment Advisors 2025 | Payment Advisors |
| PayBright 2025 | PayBright |
| MiCamp 2025 | MiCamp |
| Merchant Lynx 2025 | Merchant Lynx |
| Global - TSYS 2025 | Global Payments TSYS |
| Fiserv 2025 | First Data/Fiserv |
| Clearent 2025 | Clearent |

## Month Format

Use YYYY-MM format for months:
- January 2025: `2025-01`
- February 2025: `2025-02`
- March 2025: `2025-03`
- etc.

## Troubleshooting

### Issue: "Processor not found"
- Check processor name spelling
- Use exact names from the mapping table above
- New processors will be created automatically if needed

### Issue: "Missing MID"
- Ensure your CSV has a column with merchant IDs
- Check column names match expected formats

### Issue: "Missing income data"
- Ensure your CSV has a column with revenue/income/commission data
- Check for empty cells or invalid values

### Issue: "Duplicate records"
- The import uses UPSERT logic - duplicates will update existing records
- Safe to re-run imports

## Real-Time Dashboard Updates

After import:
1. Go to **Data Management** page
2. Select the month you imported
3. The workflow tiles will automatically show:
   - ✅ Green "Lead Sheet" (1/1)
   - ✅ Green "Processors" with uploaded count
   - Updated record counts
4. Dashboard charts will reflect the new data immediately

## Support

If you encounter issues:
1. Check the error messages in the console
2. Verify CSV file format and column names
3. Ensure month format is YYYY-MM
4. Check processor names match the mapping table
