/**
 * ISOHUB Multi-Tenant Migration: 003 - Migrate Existing Data
 *
 * This script migrates data from existing tables to the new multi-tenant tables.
 *
 * IMPORTANT: Run this AFTER creating tables and enabling RLS.
 *
 * Usage:
 *   npx tsx migrations/003_migrate_existing_data.ts
 *
 * Options:
 *   --dry-run    Show what would be migrated without making changes
 *   --verbose    Show detailed progress
 */

import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql, eq } from 'drizzle-orm';

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

// Logging helpers
const log = (msg: string) => console.log(`[MIGRATION] ${msg}`);
const verbose = (msg: string) => VERBOSE && console.log(`[VERBOSE] ${msg}`);
const error = (msg: string) => console.error(`[ERROR] ${msg}`);

interface MigrationStats {
  agencies: number;
  users: number;
  processors: number;
  merchants: number;
  monthlyData: number;
  roleAssignments: number;
}

const stats: MigrationStats = {
  agencies: 0,
  users: 0,
  processors: 0,
  merchants: 0,
  monthlyData: 0,
  roleAssignments: 0,
};

async function migrateAgencies() {
  log('Migrating agencies...');

  // Get existing agencies from old table
  const oldAgencies = await db.execute(sql`
    SELECT * FROM agencies WHERE id IS NOT NULL
  `);

  if (oldAgencies.rows.length === 0) {
    log('No agencies to migrate. Creating default agency...');

    if (!DRY_RUN) {
      await db.execute(sql`
        INSERT INTO mt_agencies (id, name, slug, email, status, is_active)
        VALUES (
          gen_random_uuid(),
          'Default Agency',
          'default',
          'admin@isohub.io',
          'active',
          true
        )
        ON CONFLICT (slug) DO NOTHING
      `);
    }
    stats.agencies = 1;
    return;
  }

  for (const agency of oldAgencies.rows as any[]) {
    verbose(`Migrating agency: ${agency.company_name || agency.companyName}`);

    const slug = (agency.company_name || agency.companyName || 'agency')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);

    if (!DRY_RUN) {
      await db.execute(sql`
        INSERT INTO mt_agencies (
          id, name, slug, legal_name, email, phone, website,
          logo_url, primary_color, secondary_color, accent_color,
          status, is_active, created_at, updated_at
        )
        SELECT
          COALESCE(${agency.id}::uuid, gen_random_uuid()),
          COALESCE(${agency.company_name || agency.companyName}, 'Unknown Agency'),
          ${slug} || '-' || ${agency.id},
          ${agency.company_name || agency.companyName},
          COALESCE(${agency.email}, 'noemail@example.com'),
          ${agency.phone},
          ${agency.website},
          ${agency.logo_url || agency.logoUrl},
          COALESCE(${agency.primary_color || agency.primaryColor}, '#FFD700'),
          COALESCE(${agency.secondary_color || agency.secondaryColor}, '#000000'),
          COALESCE(${agency.accent_color || agency.accentColor}, '#FFFFFF'),
          COALESCE(${agency.status}::agency_status, 'active'),
          COALESCE(${agency.is_active}, true),
          COALESCE(${agency.created_at}::timestamp, NOW()),
          COALESCE(${agency.updated_at}::timestamp, NOW())
        ON CONFLICT (slug) DO NOTHING
      `);
    }

    stats.agencies++;
  }

  log(`Migrated ${stats.agencies} agencies`);
}

async function migrateUsers() {
  log('Migrating users...');

  // Get default agency for users without agency
  const defaultAgencyResult = await db.execute(sql`
    SELECT id FROM mt_agencies WHERE slug LIKE 'default%' LIMIT 1
  `);
  const defaultAgencyId = (defaultAgencyResult.rows[0] as any)?.id;

  // Get agency ID mappings (old ID -> new UUID)
  const agencyMappings = await db.execute(sql`
    SELECT a.id as old_id, ma.id as new_id
    FROM agencies a
    LEFT JOIN mt_agencies ma ON ma.name = a.company_name OR ma.name = a."companyName"
  `);
  const agencyMap = new Map(
    (agencyMappings.rows as any[]).map(r => [r.old_id, r.new_id])
  );

  // Get existing users
  const oldUsers = await db.execute(sql`
    SELECT * FROM users WHERE id IS NOT NULL
  `);

  for (const user of oldUsers.rows as any[]) {
    verbose(`Migrating user: ${user.username}`);

    // Map old agencyId to new UUID
    const newAgencyId = user.agency_id || user.agencyId
      ? agencyMap.get(user.agency_id || user.agencyId) || defaultAgencyId
      : defaultAgencyId;

    // Map role to new enum
    const roleMapping: Record<string, string> = {
      'SuperAdmin': 'super_admin',
      'Admin': 'agency_admin',
      'Manager': 'agency_manager',
      'Users/Reps': 'rep',
      'rep': 'rep',
      'Partner': 'partner',
      'partner': 'partner',
      'viewer': 'viewer',
    };
    const newRole = roleMapping[user.role] || 'subaccount_user';

    if (!DRY_RUN) {
      await db.execute(sql`
        INSERT INTO mt_users (
          agency_id, username, email, password_hash,
          first_name, last_name, role,
          mfa_enabled, mfa_secret, failed_login_attempts, locked_until,
          last_login_at, is_temporary_password, is_active,
          created_at, updated_at
        )
        VALUES (
          ${newAgencyId}::uuid,
          ${user.username},
          ${user.email},
          COALESCE(${user.password}, ${user.password_hash}, ''),
          ${user.first_name || user.firstName},
          ${user.last_name || user.lastName},
          ${newRole}::user_role,
          COALESCE(${user.mfa_enabled || user.mfaEnabled}, false),
          ${user.mfa_secret || user.mfaSecret},
          COALESCE(${user.failed_login_attempts || user.failedLoginAttempts}, 0),
          ${user.locked_until || user.lockedUntil}::timestamp,
          ${user.last_login_at || user.lastLoginAt}::timestamp,
          COALESCE(${user.is_temporary_password || user.isTemporaryPassword}, false),
          COALESCE(${user.is_active || user.isActive}, true),
          COALESCE(${user.created_at || user.createdAt}::timestamp, NOW()),
          COALESCE(${user.updated_at || user.updatedAt}::timestamp, NOW())
        )
        ON CONFLICT (username) DO NOTHING
      `);
    }

    stats.users++;
  }

  log(`Migrated ${stats.users} users`);
}

async function migrateProcessors() {
  log('Migrating processors...');

  // Get default agency
  const defaultAgencyResult = await db.execute(sql`
    SELECT id FROM mt_agencies LIMIT 1
  `);
  const defaultAgencyId = (defaultAgencyResult.rows[0] as any)?.id;

  if (!defaultAgencyId) {
    error('No agency found. Cannot migrate processors.');
    return;
  }

  const oldProcessors = await db.execute(sql`
    SELECT * FROM processors WHERE id IS NOT NULL
  `);

  for (const processor of oldProcessors.rows as any[]) {
    verbose(`Migrating processor: ${processor.name}`);

    if (!DRY_RUN) {
      await db.execute(sql`
        INSERT INTO mt_processors (
          agency_id, name, description, is_active, created_at, updated_at
        )
        VALUES (
          ${defaultAgencyId}::uuid,
          ${processor.name},
          ${processor.description},
          COALESCE(${processor.is_active || processor.isActive}, true),
          COALESCE(${processor.created_at}::timestamp, NOW()),
          NOW()
        )
        ON CONFLICT (agency_id, name) DO NOTHING
      `);
    }

    stats.processors++;
  }

  log(`Migrated ${stats.processors} processors`);
}

async function migrateMerchants() {
  log('Migrating merchants...');

  // Get default agency
  const defaultAgencyResult = await db.execute(sql`
    SELECT id FROM mt_agencies LIMIT 1
  `);
  const defaultAgencyId = (defaultAgencyResult.rows[0] as any)?.id;

  if (!defaultAgencyId) {
    error('No agency found. Cannot migrate merchants.');
    return;
  }

  const oldMerchants = await db.execute(sql`
    SELECT * FROM merchants WHERE id IS NOT NULL
  `);

  for (const merchant of oldMerchants.rows as any[]) {
    verbose(`Migrating merchant: ${merchant.mid}`);

    if (!DRY_RUN) {
      await db.execute(sql`
        INSERT INTO mt_merchants (
          agency_id, mid, legal_name, dba, email, phone,
          status, created_at, updated_at
        )
        VALUES (
          ${defaultAgencyId}::uuid,
          ${merchant.mid},
          ${merchant.legal_name || merchant.legalName},
          ${merchant.dba},
          ${merchant.email},
          ${merchant.phone},
          'active'::merchant_status,
          COALESCE(${merchant.created_at}::timestamp, NOW()),
          NOW()
        )
        ON CONFLICT (agency_id, mid) DO NOTHING
      `);
    }

    stats.merchants++;
  }

  log(`Migrated ${stats.merchants} merchants`);
}

async function migrateMonthlyData() {
  log('Migrating monthly data...');

  // Get default agency
  const defaultAgencyResult = await db.execute(sql`
    SELECT id FROM mt_agencies LIMIT 1
  `);
  const defaultAgencyId = (defaultAgencyResult.rows[0] as any)?.id;

  if (!defaultAgencyId) {
    error('No agency found. Cannot migrate monthly data.');
    return;
  }

  // Get merchant ID mappings
  const merchantMappings = await db.execute(sql`
    SELECT m.id as old_id, mm.id as new_id
    FROM merchants m
    JOIN mt_merchants mm ON mm.mid = m.mid AND mm.agency_id = ${defaultAgencyId}::uuid
  `);
  const merchantMap = new Map(
    (merchantMappings.rows as any[]).map(r => [r.old_id, r.new_id])
  );

  // Get processor ID mappings
  const processorMappings = await db.execute(sql`
    SELECT p.id as old_id, mp.id as new_id
    FROM processors p
    JOIN mt_processors mp ON mp.name = p.name AND mp.agency_id = ${defaultAgencyId}::uuid
  `);
  const processorMap = new Map(
    (processorMappings.rows as any[]).map(r => [r.old_id, r.new_id])
  );

  const oldMonthlyData = await db.execute(sql`
    SELECT * FROM monthly_data WHERE id IS NOT NULL LIMIT 10000
  `);

  let skipped = 0;
  for (const data of oldMonthlyData.rows as any[]) {
    const merchantId = data.merchant_id || data.merchantId;
    const processorId = data.processor_id || data.processorId;

    const newMerchantId = merchantMap.get(merchantId);
    const newProcessorId = processorMap.get(processorId);

    if (!newMerchantId || !newProcessorId) {
      skipped++;
      continue;
    }

    verbose(`Migrating monthly data for merchant ${merchantId}, month ${data.month}`);

    if (!DRY_RUN) {
      await db.execute(sql`
        INSERT INTO mt_monthly_data (
          agency_id, merchant_id, processor_id, month,
          transactions, sales_amount, income, expenses, net,
          created_at, updated_at
        )
        VALUES (
          ${defaultAgencyId}::uuid,
          ${newMerchantId}::uuid,
          ${newProcessorId}::uuid,
          ${data.month},
          COALESCE(${data.transactions}, 0),
          COALESCE(${data.sales_amount || data.salesAmount}::decimal, 0),
          COALESCE(${data.income}::decimal, 0),
          COALESCE(${data.expenses}::decimal, 0),
          COALESCE(${data.net}::decimal, 0),
          COALESCE(${data.created_at}::timestamp, NOW()),
          NOW()
        )
        ON CONFLICT (agency_id, merchant_id, processor_id, month) DO NOTHING
      `);
    }

    stats.monthlyData++;
  }

  log(`Migrated ${stats.monthlyData} monthly data records (${skipped} skipped due to missing references)`);
}

async function main() {
  log('='.repeat(60));
  log('ISOHUB Multi-Tenant Data Migration');
  log('='.repeat(60));

  if (DRY_RUN) {
    log('DRY RUN MODE - No changes will be made');
  }

  try {
    // Run migrations in order
    await migrateAgencies();
    await migrateUsers();
    await migrateProcessors();
    await migrateMerchants();
    await migrateMonthlyData();

    log('='.repeat(60));
    log('Migration Summary:');
    log(`  Agencies: ${stats.agencies}`);
    log(`  Users: ${stats.users}`);
    log(`  Processors: ${stats.processors}`);
    log(`  Merchants: ${stats.merchants}`);
    log(`  Monthly Data: ${stats.monthlyData}`);
    log('='.repeat(60));

    if (DRY_RUN) {
      log('DRY RUN COMPLETE - No changes were made');
    } else {
      log('MIGRATION COMPLETE');
    }

  } catch (err) {
    error(`Migration failed: ${err}`);
    throw err;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
