// Direct processor data insertion script for real Clearent April 2025 data
const { Client } = require('pg');

async function processRealClearentData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();

    // Sample Clearent April 2025 data from your upload
    const clearentData = [
      { mid: '6588000002455723', merchant: 'A-1 CHIMNEY PRO, INC.', transactions: 0, sales: 0.00, net: 25.83 },
      { mid: '6588000002375111', merchant: 'Acunto Landscape & Design', transactions: 13, sales: 2931.47, net: 107.84 },
      { mid: '6588000002406122', merchant: 'AISD DIck Bivins Stadium', transactions: 241, sales: 1348.59, net: 168.61 },
      { mid: '6588000002315901', merchant: 'Alcoa Pines Health and Rehabilitation', transactions: 2, sales: 2093.60, net: 29.21 },
      { mid: '6588000002578847', merchant: 'ALL FIRE SERVICES, INC', transactions: 59, sales: 146856.72, net: 327.24 },
      { mid: '6588000002730778', merchant: 'ALL RITE PAVING CONTRACTORS', transactions: 7, sales: 35638.00, net: 183.04 },
      { mid: '6588000002695146', merchant: 'AMARILLO AREA BAR ASSOCIATION', transactions: 1, sales: 110.00, net: -4.96 },
      { mid: '6588000002406908', merchant: 'Amarillo High School Amarillo ISD', transactions: 0, sales: 0.00, net: 24.16 },
      { mid: '6588000002437424', merchant: 'Amarillo ISD AHS Food Service', transactions: 84, sales: 230.70, net: 8.82 },
      { mid: '6588000002437440', merchant: 'Amarillo ISD Caprock High School Food Service', transactions: 481, sales: 1526.75, net: 39.08 }
    ];

    const clearentProcessorId = 2; // Clearent ID from processors table
    const month = '2025-04';

    console.log('Processing Clearent April 2025 data...');

    for (const record of clearentData) {
      // Insert or update merchant
      const merchantResult = await client.query(`
        INSERT INTO merchants (mid, legal_name, dba, current_processor, created_at)
        VALUES ($1, $2, $2, 'Clearent', NOW())
        ON CONFLICT (mid) DO UPDATE SET 
          legal_name = EXCLUDED.legal_name,
          dba = EXCLUDED.dba
        RETURNING id
      `, [record.mid, record.merchant]);

      const merchantId = merchantResult.rows[0].id;

      // Insert monthly data
      await client.query(`
        INSERT INTO monthly_data (merchant_id, processor_id, month, net, volume, transactions, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (merchant_id, processor_id, month) DO UPDATE SET
          net = EXCLUDED.net,
          volume = EXCLUDED.volume,
          transactions = EXCLUDED.transactions
      `, [merchantId, clearentProcessorId, month, record.net.toString(), record.sales.toString(), record.transactions]);

      console.log(`✓ Processed: ${record.merchant} - $${record.net}`);
    }

    // Verify data was inserted
    const verification = await client.query(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CAST(net AS DECIMAL(10,2))) as total_revenue
      FROM monthly_data 
      WHERE processor_id = $1 AND month = $2
    `, [clearentProcessorId, month]);

    console.log('='.repeat(50));
    console.log(`✅ CLEARENT APRIL 2025 DATA UPLOADED SUCCESSFULLY`);
    console.log(`📊 Records: ${verification.rows[0].total_records}`);
    console.log(`💰 Revenue: $${verification.rows[0].total_revenue}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Error processing Clearent data:', error);
  } finally {
    await client.end();
  }
}

// Run the script if called directly
if (require.main === module) {
  processRealClearentData();
}

module.exports = { processRealClearentData };