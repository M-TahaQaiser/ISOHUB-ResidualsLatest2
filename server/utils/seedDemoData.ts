import { db } from '../db';
import { sql } from 'drizzle-orm';

const DEMO_PROCESSORS = [
  { name: 'First Data/Fiserv' },
  { name: 'TSYS/Global Payments' },
  { name: 'Elavon' },
  { name: 'WorldPay' },
  { name: 'Square' },
  { name: 'Stripe' },
  { name: 'Chase Paymentech' },
  { name: 'Heartland' },
  { name: 'Paysafe' },
];

const DEMO_MERCHANTS = [
  { name: 'Acme Electronics', mid: 'MID-ACM-001' },
  { name: 'Blue Ridge Coffee', mid: 'MID-BRC-002' },
  { name: 'Cascade Auto Parts', mid: 'MID-CAP-003' },
  { name: 'Digital Solutions Inc', mid: 'MID-DSI-004' },
  { name: 'Elite Fitness Center', mid: 'MID-EFC-005' },
  { name: 'Fresh Market Grocery', mid: 'MID-FMG-006' },
  { name: 'Global Travel Services', mid: 'MID-GTS-007' },
  { name: 'Highland Medical Group', mid: 'MID-HMG-008' },
  { name: 'Iron Mountain Hardware', mid: 'MID-IMH-009' },
  { name: 'Jade Garden Restaurant', mid: 'MID-JGR-010' },
  { name: 'Kingston Law Firm', mid: 'MID-KLF-011' },
  { name: 'Lakeside Marina', mid: 'MID-LSM-012' },
  { name: 'Metro Dental Care', mid: 'MID-MDC-013' },
  { name: 'Noble Wine & Spirits', mid: 'MID-NWS-014' },
  { name: 'Oak Street Bakery', mid: 'MID-OSB-015' },
  { name: 'Pacific Coast Plumbing', mid: 'MID-PCP-016' },
  { name: 'Quality Auto Service', mid: 'MID-QAS-017' },
  { name: 'Riverside Pet Hospital', mid: 'MID-RPH-018' },
  { name: 'Summit Insurance Agency', mid: 'MID-SIA-019' },
  { name: 'Titan Construction LLC', mid: 'MID-TCL-020' },
  { name: 'Urban Salon & Spa', mid: 'MID-USS-021' },
  { name: 'Valley Tech Solutions', mid: 'MID-VTS-022' },
  { name: 'Westside Accounting', mid: 'MID-WSA-023' },
  { name: 'Xpress Delivery Co', mid: 'MID-XDC-024' },
  { name: 'Yellow Cab Service', mid: 'MID-YCS-025' },
  { name: 'Zenith Marketing Group', mid: 'MID-ZMG-026' },
  { name: 'Alpine Sports Store', mid: 'MID-APS-027' },
  { name: 'Beacon Hill Pharmacy', mid: 'MID-BHP-028' },
  { name: 'Crystal Clear Windows', mid: 'MID-CCW-029' },
  { name: 'Diamond Auto Dealers', mid: 'MID-DAD-030' },
  { name: 'Eastwood Catering', mid: 'MID-EWC-031' },
  { name: 'First Choice Realty', mid: 'MID-FCR-032' },
  { name: 'Golden Gate Imports', mid: 'MID-GGI-033' },
  { name: 'Harbor View Hotel', mid: 'MID-HVH-034' },
  { name: 'Innovative Design Studio', mid: 'MID-IDS-035' },
  { name: 'Jupiter Electronics', mid: 'MID-JUE-036' },
  { name: 'Keystone Security', mid: 'MID-KSS-037' },
  { name: 'Liberty Tax Services', mid: 'MID-LTS-038' },
  { name: 'Magnolia Event Planning', mid: 'MID-MEP-039' },
  { name: 'Northstar IT Services', mid: 'MID-NIT-040' },
];

const DEMO_AGENTS = [
  'John Smith',
  'Sarah Johnson',
  'Michael Davis',
  'Emily Wilson',
  'Robert Brown',
  'Jennifer Martinez',
  'David Anderson',
  'Lisa Thompson',
];

const DEMO_PARTNERS = [
  'Premier Partners LLC',
  'Cardinal Solutions',
  'Summit Financial Group',
  'Horizon Partners',
];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateMonthlyMetrics(baseVolume: number, month: string, merchantIndex: number) {
  const [year, monthNum] = month.split('-').map(Number);
  
  const seasonalFactors: Record<number, number> = {
    1: 0.85, 2: 0.80, 3: 0.90, 4: 0.95, 5: 1.00, 6: 1.05,
    7: 1.02, 8: 0.98, 9: 1.00, 10: 1.05, 11: 1.20, 12: 1.35,
  };
  
  const seasonalFactor = seasonalFactors[monthNum] || 1.0;
  const growthFactor = 1 + ((year - 2024) * 0.08) + ((monthNum - 1) * 0.005);
  const randomVariation = randomBetween(0.85, 1.15);
  
  const salesAmount = baseVolume * seasonalFactor * growthFactor * randomVariation;
  const transactions = Math.round(salesAmount / randomBetween(45, 85));
  
  const effectiveRate = randomBetween(0.018, 0.032);
  const income = salesAmount * effectiveRate;
  const costRate = randomBetween(0.35, 0.55);
  const expenses = income * costRate;
  const net = income - expenses;
  
  const bps = (income / salesAmount) * 10000;
  const repNet = net * 0.40;
  
  return {
    transactions: Math.round(transactions),
    salesAmount: salesAmount.toFixed(2),
    income: income.toFixed(2),
    expenses: expenses.toFixed(2),
    net: net.toFixed(2),
    bps: bps.toFixed(4),
    percentage: (effectiveRate * 100).toFixed(4),
    repNet: repNet.toFixed(2),
  };
}

function generateMonthsRange(startYear: number, startMonth: number, endYear: number, endMonth: number): string[] {
  const months: string[] = [];
  let year = startYear;
  let month = startMonth;
  
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  
  return months;
}

async function getAvailableColumns(tableName: string): Promise<string[]> {
  const result = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = ${tableName} AND table_schema = 'public'
  `);
  return (result.rows || []).map((r: any) => r.column_name);
}

export async function seedDemoData(agencyId: number = 1) {
  console.log('🌱 Starting demo data seed...');
  
  try {
    // Get available columns for merchants table to handle schema differences
    const merchantColumns = await getAvailableColumns('merchants');
    console.log(`[SeedDemo] Merchant columns available: ${merchantColumns.slice(0, 8).join(', ')}...`);
    
    // Seed processors using raw SQL
    let processorIds: number[] = [];
    const existingProcessorsResult = await db.execute(sql`
      SELECT id, name FROM processors WHERE is_active = true OR is_active IS NULL
    `);
    const existingProcessors = existingProcessorsResult.rows || [];
    
    if (existingProcessors.length < 9) {
      console.log('📦 Creating demo processors...');
      for (const proc of DEMO_PROCESSORS) {
        const existing = existingProcessors.find((p: any) => p.name === proc.name);
        if (existing) {
          processorIds.push((existing as any).id);
        } else {
          const result = await db.execute(sql`
            INSERT INTO processors (name, is_active) 
            VALUES (${proc.name}, true) 
            RETURNING id
          `);
          if (result.rows?.[0]) {
            processorIds.push((result.rows[0] as any).id);
          }
        }
      }
    } else {
      processorIds = existingProcessors.slice(0, 9).map((p: any) => p.id);
    }
    
    console.log(`✅ ${processorIds.length} processors ready`);

    // Seed merchants using raw SQL with only columns that exist
    const existingMerchantsResult = await db.execute(sql`
      SELECT id, mid, dba, legal_name FROM merchants LIMIT 100
    `);
    const existingMerchants = existingMerchantsResult.rows || [];
    
    let merchantsWithProcessors: { merchantId: number; merchantName: string; mid: string; processorId: number; baseVolume: number; startMonth: string }[] = [];
    
    if (existingMerchants.length < DEMO_MERCHANTS.length) {
      console.log('🏪 Creating demo merchants...');
      
      // Check what columns exist for insert
      const hasDba = merchantColumns.includes('dba');
      const hasLegalName = merchantColumns.includes('legal_name');
      const hasStatus = merchantColumns.includes('status');
      
      for (let i = 0; i < DEMO_MERCHANTS.length; i++) {
        const merchant = DEMO_MERCHANTS[i];
        const existing = existingMerchants.find((m: any) => m.mid === merchant.mid);
        
        const processorId = processorIds[i % processorIds.length];
        const startMonthOffset = Math.floor(Math.random() * 6);
        const startMonth = startMonthOffset === 0 ? '2024-01' : `2024-${String(startMonthOffset + 1).padStart(2, '0')}`;
        const baseVolume = randomBetween(15000, 250000);
        
        if (existing) {
          merchantsWithProcessors.push({
            merchantId: (existing as any).id,
            merchantName: (existing as any).dba || (existing as any).legal_name || merchant.name,
            mid: (existing as any).mid,
            processorId,
            baseVolume,
            startMonth,
          });
        } else {
          // Build insert query based on available columns
          let insertResult;
          if (hasDba && hasLegalName && hasStatus) {
            insertResult = await db.execute(sql`
              INSERT INTO merchants (mid, dba, legal_name, status)
              VALUES (${merchant.mid}, ${merchant.name}, ${merchant.name}, 'active')
              RETURNING id
            `);
          } else if (hasDba && hasLegalName) {
            insertResult = await db.execute(sql`
              INSERT INTO merchants (mid, dba, legal_name)
              VALUES (${merchant.mid}, ${merchant.name}, ${merchant.name})
              RETURNING id
            `);
          } else {
            // Minimal insert - just mid
            insertResult = await db.execute(sql`
              INSERT INTO merchants (mid)
              VALUES (${merchant.mid})
              RETURNING id
            `);
          }
          
          if (insertResult.rows?.[0]) {
            merchantsWithProcessors.push({
              merchantId: (insertResult.rows[0] as any).id,
              merchantName: merchant.name,
              mid: merchant.mid,
              processorId,
              baseVolume,
              startMonth,
            });
          }
        }
      }
    } else {
      for (let i = 0; i < existingMerchants.length && i < 40; i++) {
        const m = existingMerchants[i] as any;
        merchantsWithProcessors.push({
          merchantId: m.id,
          merchantName: m.dba || m.legal_name || `Merchant ${m.id}`,
          mid: m.mid,
          processorId: processorIds[i % processorIds.length],
          baseVolume: randomBetween(15000, 250000),
          startMonth: `2024-${String((i % 6) + 1).padStart(2, '0')}`,
        });
      }
    }
    
    console.log(`✅ ${merchantsWithProcessors.length} merchants ready`);

    // Seed monthly data
    console.log('📊 Generating 2-year monthly data (Jan 2024 - Oct 2025)...');
    const allMonths = generateMonthsRange(2024, 1, 2025, 10);
    let recordCount = 0;
    
    for (const { merchantId, processorId, baseVolume, startMonth } of merchantsWithProcessors) {
      const merchantMonths = allMonths.filter(m => m >= startMonth);
      
      for (const month of merchantMonths) {
        // Check if record exists
        const existingResult = await db.execute(sql`
          SELECT id FROM monthly_data 
          WHERE merchant_id = ${merchantId} 
            AND processor_id = ${processorId} 
            AND month = ${month}
          LIMIT 1
        `);
        
        if (!existingResult.rows?.length) {
          const metrics = generateMonthlyMetrics(baseVolume, month, merchantId);
          const agentName = DEMO_AGENTS[merchantId % DEMO_AGENTS.length];
          
          // Insert with columns that exist in production (including agency_id!)
          try {
            await db.execute(sql`
              INSERT INTO monthly_data (
                merchant_id, processor_id, month, transactions, sales_amount, 
                income, expenses, net, bps, percentage, rep_net, group_code, agency_id
              ) VALUES (
                ${merchantId}, ${processorId}, ${month}, ${metrics.transactions}, ${metrics.salesAmount},
                ${metrics.income}, ${metrics.expenses}, ${metrics.net}, ${metrics.bps}, 
                ${metrics.percentage}, ${metrics.repNet}, ${agentName}, ${agencyId}
              )
            `);
            recordCount++;
          } catch (insertError) {
            // If full insert fails, try minimal insert
            try {
              await db.execute(sql`
                INSERT INTO monthly_data (merchant_id, processor_id, month, net, agency_id)
                VALUES (${merchantId}, ${processorId}, ${month}, ${metrics.net}, ${agencyId})
              `);
              recordCount++;
            } catch (minimalError) {
              console.log(`[SeedDemo] Could not insert monthly data for ${merchantId}/${month}`);
            }
          }
        }
      }
    }
    
    console.log(`✅ Created ${recordCount} monthly data records`);

    // Seed role assignments
    console.log('👤 Creating role assignments...');
    let assignmentCount = 0;
    
    for (const { merchantId, merchantName, mid } of merchantsWithProcessors) {
      // Check if assignment exists
      const existingResult = await db.execute(sql`
        SELECT id FROM mid_role_assignments WHERE mid = ${mid} LIMIT 1
      `);
      
      if (!existingResult.rows?.length) {
        const agentIndex = merchantId % DEMO_AGENTS.length;
        const agentName = DEMO_AGENTS[agentIndex];
        const partnerName = DEMO_PARTNERS[merchantId % DEMO_PARTNERS.length];
        
        // Try full insert first, then minimal
        try {
          await db.execute(sql`
            INSERT INTO mid_role_assignments (
              mid, merchant_name, rep, rep_percentage, 
              partner, partner_percentage,
              sales_manager, sales_manager_percentage,
              company, company_percentage,
              assignment_status, first_assigned_month
            ) VALUES (
              ${mid}, ${merchantName}, ${agentName}, '40.00',
              ${partnerName}, '35.00',
              'Regional Manager', '10.00',
              'ISO Hub Inc', '15.00',
              'assigned', '2024-01'
            )
          `);
          assignmentCount++;
        } catch (insertError) {
          // Try minimal insert
          try {
            await db.execute(sql`
              INSERT INTO mid_role_assignments (mid, merchant_name, first_assigned_month)
              VALUES (${mid}, ${merchantName}, '2024-01')
            `);
            assignmentCount++;
          } catch (minimalError) {
            console.log(`[SeedDemo] Could not insert role assignment for ${mid}`);
          }
        }
      }
    }
    
    console.log(`✅ Created ${assignmentCount} role assignments`);
    
    console.log('🎉 Demo data seed complete!');
    console.log(`   📦 Processors: ${processorIds.length}`);
    console.log(`   🏪 Merchants: ${merchantsWithProcessors.length}`);
    console.log(`   📊 Monthly records: ${recordCount}`);
    console.log(`   👤 Role assignments: ${assignmentCount}`);
    
    return {
      success: true,
      processors: processorIds.length,
      merchants: merchantsWithProcessors.length,
      monthlyRecords: recordCount,
      roleAssignments: assignmentCount,
    };
  } catch (error) {
    console.error('❌ Demo data seed failed:', error);
    throw error;
  }
}

export async function clearDemoData() {
  console.log('🧹 Clearing demo data...');
  
  try {
    await db.execute(sql`DELETE FROM mid_role_assignments`);
    console.log('   ✅ Cleared role assignments');
    
    await db.execute(sql`DELETE FROM monthly_data`);
    console.log('   ✅ Cleared monthly data');
    
    console.log('🎉 Demo data cleared');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to clear demo data:', error);
    throw error;
  }
}
