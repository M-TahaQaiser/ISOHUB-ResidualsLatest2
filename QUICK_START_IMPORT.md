# Quick Start: Import Google Sheets Data to Tracers Organization

## ✅ System Ready!

Your bulk import system is fully configured and tested. Follow these steps to import all your processor data.

---

## Step 1: Export Google Sheets as CSV Files

For each Google Sheet, export each month's data as a separate CSV file:

### How to Export:
1. Open the Google Sheet
2. Click on the specific month tab (e.g., "January", "February")
3. **File → Download → Comma Separated Values (.csv)**
4. Save with format: `{processor}-{month}-2025.csv`

### Your Google Sheets:

| Processor | Google Sheet URL |
|-----------|-----------------|
| **TRX** | https://docs.google.com/spreadsheets/d/16fiJXrTvJFBDORS_lhaI6HGK3_wc5ri4ReIOCzAr52M/ |
| **Shift4** | https://docs.google.com/spreadsheets/d/1OmYOGay2rbAq77wLHtfE0nikj0uimLsXwzaTEImdQ4U/ |
| **Rectangle Health** | https://docs.google.com/spreadsheets/d/1yYfTVlhWZ1QS1Lx1Z5-Hroqt8nujnssVmUyK_GjwEOA/ |
| **Payment Advisors** | https://docs.google.com/spreadsheets/d/1PmJho-wFdSZbEAHkkR12i9tdkLTd2imZO5pj-r7_Zt4/ |
| **PayBright** | https://docs.google.com/spreadsheets/d/1WCMYZRSqdurdX61tENToqTIMkX6oE4edASvUCdQi-aQ/ |
| **MiCamp** | https://docs.google.com/spreadsheets/d/1NPvWsJ-xHEd80aUNNgW56oFx81gMlGTcJnlZM6A0Gfw/ |
| **Merchant Lynx** | https://docs.google.com/spreadsheets/d/193xDW8uzW4Fwnx_PtDjlqsSmFExEt1yYMYM7nsQVnks/ |
| **Global TSYS** | https://docs.google.com/spreadsheets/d/1XaIVHdVPvNhz6XZVxisnhHJJt7DghEMvFEO6zWl4d-E/ |
| **Fiserv** | https://docs.google.com/spreadsheets/d/1hvV2UyCdXIi4YzRou_ZQG501E9xqEMG9v_RMYp-ryv0/ |
| **Clearent** | https://docs.google.com/spreadsheets/d/1vAgpos-yxtWe7yRCOr18h3UACkQhlSdZdE6cH5wPKXM/ |

---

## Step 2: Organize Your CSV Files

Create a folder and organize your exports:

```
data-imports/
├── trx-january-2025.csv
├── trx-february-2025.csv
├── shift4-january-2025.csv
├── shift4-february-2025.csv
├── clearent-january-2025.csv
└── ... (all your CSV files)
```

**Tip:** Save all CSV files to `data-imports/` folder in the project directory.

---

## Step 3: Import Data (Choose Your Method)

### 🎯 Method A: Interactive Import (Easiest)

```bash
./bulk-import-helper.sh --interactive
```

Then follow the prompts:
1. Enter CSV file path
2. Enter processor name
3. Enter month (YYYY-MM format)
4. Repeat for each file

### 📁 Method B: Single File Import

```bash
./bulk-import-helper.sh <csv-file> <processor-name> <month>
```

**Examples:**
```bash
# Import TRX January 2025
./bulk-import-helper.sh data-imports/trx-january-2025.csv "TRX" "2025-01"

# Import Shift4 February 2025
./bulk-import-helper.sh data-imports/shift4-february-2025.csv "Shift4" "2025-02"

# Import Clearent March 2025
./bulk-import-helper.sh data-imports/clearent-march-2025.csv "Clearent" "2025-03"
```

### 🚀 Method C: Batch Script (For Multiple Files)

Create a file `import-all.sh`:

```bash
#!/bin/bash

# Import all processor data for Tracers organization

# TRX 2025
./bulk-import-helper.sh data-imports/trx-january-2025.csv "TRX" "2025-01"
./bulk-import-helper.sh data-imports/trx-february-2025.csv "TRX" "2025-02"
./bulk-import-helper.sh data-imports/trx-march-2025.csv "TRX" "2025-03"

# Shift4 2025
./bulk-import-helper.sh data-imports/shift4-january-2025.csv "Shift4" "2025-01"
./bulk-import-helper.sh data-imports/shift4-february-2025.csv "Shift4" "2025-02"

# Rectangle Health 2025
./bulk-import-helper.sh data-imports/rectangle-health-january-2025.csv "Rectangle Health" "2025-01"

# Payment Advisors 2025
./bulk-import-helper.sh data-imports/payment-advisors-january-2025.csv "Payment Advisors" "2025-01"

# PayBright 2025
./bulk-import-helper.sh data-imports/paybright-january-2025.csv "PayBright" "2025-01"

# MiCamp 2025
./bulk-import-helper.sh data-imports/micamp-january-2025.csv "MiCamp" "2025-01"

# Merchant Lynx 2025
./bulk-import-helper.sh data-imports/merchant-lynx-january-2025.csv "Merchant Lynx" "2025-01"

# Global TSYS 2025
./bulk-import-helper.sh data-imports/global-tsys-january-2025.csv "Global Payments TSYS" "2025-01"

# Fiserv 2025
./bulk-import-helper.sh data-imports/fiserv-january-2025.csv "First Data/Fiserv" "2025-01"

# Clearent 2025
./bulk-import-helper.sh data-imports/clearent-january-2025.csv "Clearent" "2025-01"

echo "✅ All imports complete!"
```

Make it executable and run:
```bash
chmod +x import-all.sh
./import-all.sh
```

---

## Step 4: Verify Imports

After importing, verify your data:

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
    
    console.log('\\n📊 Imported Data Summary for Tracers Organization:\\n');
    console.log('Month       | Processor              | Records | Total Income');
    console.log('------------|------------------------|---------|-------------');
    result.rows.forEach(row => {
      const income = parseFloat(row.total_income).toFixed(2);
      console.log(\`\${row.month.padEnd(11)} | \${row.processor.padEnd(22)} | \${String(row.record_count).padStart(7)} | $\${income}\`);
    });
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
"
```

---

## Step 5: Check Dashboard

1. Go to **http://localhost:5000/data-management**
2. Select **Tracers** organization
3. Select the month you imported
4. You should see:
   - ✅ **Green "Lead Sheet"** tile (1/1)
   - ✅ **Green "Processors"** tile with count
   - All uploaded data in the workflow

5. Go to **Dashboard** to see:
   - Updated revenue charts
   - Merchant data
   - Real-time statistics

---

## CSV File Requirements

Your CSV files should contain these columns (any of these names will work):

### Required Columns:

**Merchant ID (MID):**
- `MID`, `Mid`, `Merchant ID`, `Account Number`, `DBA Number`

**Merchant Name:**
- `DBA`, `Merchant Name`, `Business Name`, `Legal Name`, `Name`

**Income/Revenue:**
- `Income`, `Revenue`, `Commission`, `Amount`, `Residual`, `Payout`, `Total`

### Example CSV Format:
```csv
MID,DBA,Income
12345,Coffee Shop Inc,1250.50
67890,Restaurant LLC,2340.75
```

---

## Processor Name Mapping

Use these **exact** processor names when importing:

| Your Sheet Name | Import Name |
|----------------|-------------|
| TRX 2025 | `TRX` |
| Shift4 2025 | `Shift4` |
| Rectangle Health 2025 | `Rectangle Health` |
| Payment Advisors 2025 | `Payment Advisors` |
| PayBright 2025 | `PayBright` |
| MiCamp 2025 | `MiCamp` |
| Merchant Lynx 2025 | `Merchant Lynx` |
| Global - TSYS 2025 | `Global Payments TSYS` |
| Fiserv 2025 | `First Data/Fiserv` |
| Clearent 2025 | `Clearent` |

**Note:** If a processor doesn't exist, it will be created automatically.

---

## Month Format

Always use **YYYY-MM** format:
- January 2025: `2025-01`
- February 2025: `2025-02`
- March 2025: `2025-03`
- December 2025: `2025-12`

---

## Troubleshooting

### ❌ "File not found"
- Check the file path is correct
- Use relative path from project root: `data-imports/filename.csv`

### ❌ "Missing MID" errors
- Ensure your CSV has a column with merchant IDs
- Check column names match expected formats (see requirements above)

### ❌ "Missing income data" errors
- Ensure your CSV has a revenue/income column
- Check for empty cells or invalid values (non-numeric)

### ❌ "Processor not found"
- Check processor name spelling
- Use exact names from the mapping table
- New processors will be created automatically

### ✅ Duplicate Records
- Safe to re-run imports - duplicates will update existing records
- The system uses UPSERT logic

---

## Real-Time Dashboard Updates

After importing:
1. **Data Management** page automatically updates
2. **Dashboard** charts reflect new data immediately
3. **Upload progress** shows validated status
4. **Workflow tiles** turn green

No page refresh needed - data appears in real-time!

---

## Support

Need help? Check:
1. Error messages in console output
2. CSV file format and column names
3. Month format (YYYY-MM)
4. Processor name spelling

---

## Summary

✅ **System is ready and tested**
✅ **Import script works perfectly**
✅ **Database schema configured**
✅ **Dashboard updates in real-time**

**Next Steps:**
1. Export your Google Sheets as CSV files
2. Save them to `data-imports/` folder
3. Run `./bulk-import-helper.sh --interactive`
4. Follow the prompts for each file
5. Verify in Data Management and Dashboard

**That's it!** Your data will be uploaded quickly and appear immediately in the dashboard.
