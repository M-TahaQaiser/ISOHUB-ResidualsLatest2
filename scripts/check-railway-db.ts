import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function checkDatabase() {
  console.log('🔍 Checking Railway Database Connection...\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL is set');
  console.log(`📍 Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);
  
  try {
    const client = postgres(databaseUrl);
    const db = drizzle(client);
    
    console.log('🔌 Testing connection...');
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful!\n');
    
    console.log('📋 Checking tables...');
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Found ${tables.length} tables:`);
    tables.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check for required tables
    const requiredTables = [
      'users',
      'agencies',
      'organizations',
      'residuals',
      'merchants',
      'sessions'
    ];
    
    const existingTables = tables.map((row: any) => row.table_name);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log('\n⚠️  Missing required tables:');
      missingTables.forEach(t => console.log(`  - ${t}`));
      console.log('\n💡 Run: npm run db:push');
    } else {
      console.log('\n✅ All required tables exist!');
    }
    
    // Check users table
    if (existingTables.includes('users')) {
      const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      console.log(`\n👥 Users in database: ${(userCount[0] as any).count}`);
    }
    
    // Check organizations table
    if (existingTables.includes('organizations')) {
      const orgCount = await db.execute(sql`SELECT COUNT(*) as count FROM organizations`);
      console.log(`🏢 Organizations in database: ${(orgCount[0] as any).count}`);
    }
    
    await client.end();
    console.log('\n✅ Database check complete!');
    
  } catch (error) {
    console.error('\n❌ Database check failed:');
    console.error(error);
    process.exit(1);
  }
}

checkDatabase();
