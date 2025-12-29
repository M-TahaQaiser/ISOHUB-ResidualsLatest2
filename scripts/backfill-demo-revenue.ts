import { db } from "../server/db";
import { merchants, monthlyData, processors } from "../shared/schema";
import { eq, and } from "drizzle-orm";

const DEMO_AGENCY_ID = 2;

const PROCESSOR_MAP: Record<string, number> = {
  "Global": 4,
  "TRX": 397,
  "MiCamp": 3,
  "Shift4": 393,
  "Merchant Lynx": 5,
  "Fiserv Omaha": 398,
  "Payment Advisors": 1,
  "Rectangle Health": 399,
  "Clearent": 2,
};

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

async function backfillDemoRevenue() {
  console.log("Fetching demo merchants...");
  
  const demoMerchants = await db
    .select()
    .from(merchants)
    .where(eq(merchants.agencyId, DEMO_AGENCY_ID));
  
  console.log(`Found ${demoMerchants.length} demo merchants`);
  
  const months = [
    "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12",
    "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
    "2025-07", "2025-08", "2025-09", "2025-10", "2025-11"
  ];
  
  let inserted = 0;
  let skipped = 0;
  
  for (const merchant of demoMerchants) {
    if (!merchant.currentProcessor) continue;
    
    const processorId = PROCESSOR_MAP[merchant.currentProcessor];
    if (!processorId) {
      console.log(`Unknown processor: ${merchant.currentProcessor}`);
      continue;
    }
    
    const isActive = merchant.status === "Active";
    
    for (const month of months) {
      try {
        const existing = await db
          .select()
          .from(monthlyData)
          .where(
            and(
              eq(monthlyData.merchantId, merchant.id),
              eq(monthlyData.month, month)
            )
          )
          .limit(1);
        
        if (existing.length > 0) {
          skipped++;
          continue;
        }
        
        if (!isActive && Math.random() > 0.3) {
          continue;
        }
        
        const transactions = randomBetween(50, 2000);
        const avgTicket = randomDecimal(15, 150);
        const salesAmount = transactions * avgTicket;
        const bps = randomDecimal(15, 45);
        const income = (salesAmount * bps) / 10000;
        const expenses = income * randomDecimal(0.1, 0.3);
        const net = income - expenses;
        const agentNet = net * randomDecimal(0.4, 0.7);
        
        await db.insert(monthlyData).values({
          merchantId: merchant.id,
          processorId: processorId,
          month: month,
          transactions: transactions,
          salesAmount: String(Math.round(salesAmount * 100) / 100),
          income: String(Math.round(income * 100) / 100),
          expenses: String(Math.round(expenses * 100) / 100),
          net: String(Math.round(net * 100) / 100),
          bps: String(bps),
          agentNet: String(Math.round(agentNet * 100) / 100),
          agencyId: DEMO_AGENCY_ID,
        });
        
        inserted++;
        
        if (inserted % 500 === 0) {
          console.log(`Inserted ${inserted} monthly records...`);
        }
      } catch (err: any) {
        console.error(`Error for merchant ${merchant.mid} month ${month}: ${err.message}`);
      }
    }
  }
  
  console.log(`\nBackfill complete!`);
  console.log(`  Inserted: ${inserted} monthly records`);
  console.log(`  Skipped (existing): ${skipped}`);
  console.log(`\nAll data isolated to DEMO agency (agencyId: ${DEMO_AGENCY_ID})`);
}

backfillDemoRevenue().catch(console.error).finally(() => process.exit());
