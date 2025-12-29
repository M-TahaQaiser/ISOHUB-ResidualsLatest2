# ISOHUB Multi-Tenant Database Migration

This directory contains migration scripts to transform ISOHUB from a single-tenant to a multi-tenant architecture.

## Migration Overview

The migration is split into three phases:

1. **001_create_multi_tenant_tables.sql** - Creates new `mt_*` prefixed tables with proper tenant columns
2. **002_enable_row_level_security.sql** - Enables RLS and creates isolation policies
3. **003_migrate_existing_data.ts** - Migrates data from old tables to new ones

## Prerequisites

Before running migrations:

1. **Backup your database** - This is critical!
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Set environment variables**:
   ```bash
   export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   export JWT_SECRET="your-32-char-minimum-secret-key"
   ```

3. **Install dependencies**:
   ```bash
   npm install pg drizzle-orm
   ```

## Running Migrations

### Step 1: Create Tables

```bash
psql $DATABASE_URL -f migrations/001_create_multi_tenant_tables.sql
```

### Step 2: Enable Row Level Security

```bash
psql $DATABASE_URL -f migrations/002_enable_row_level_security.sql
```

### Step 3: Migrate Data

First, do a dry run to see what will be migrated:

```bash
npx tsx migrations/003_migrate_existing_data.ts --dry-run --verbose
```

Then run the actual migration:

```bash
npx tsx migrations/003_migrate_existing_data.ts
```

## Verification

After migration, verify the data:

```sql
-- Check table counts
SELECT 'mt_agencies' as table_name, COUNT(*) FROM mt_agencies
UNION ALL SELECT 'mt_users', COUNT(*) FROM mt_users
UNION ALL SELECT 'mt_processors', COUNT(*) FROM mt_processors
UNION ALL SELECT 'mt_merchants', COUNT(*) FROM mt_merchants
UNION ALL SELECT 'mt_monthly_data', COUNT(*) FROM mt_monthly_data;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'mt_%';

-- Check policies exist
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'mt_%';
```

## Rollback

If something goes wrong, restore from backup:

```bash
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

Or drop the new tables:

```sql
DROP TABLE IF EXISTS mt_api_rate_limits CASCADE;
DROP TABLE IF EXISTS mt_audit_logs CASCADE;
DROP TABLE IF EXISTS mt_role_assignments CASCADE;
DROP TABLE IF EXISTS mt_monthly_data CASCADE;
DROP TABLE IF EXISTS mt_merchants CASCADE;
DROP TABLE IF EXISTS mt_processors CASCADE;
DROP TABLE IF EXISTS mt_user_subaccount_access CASCADE;
DROP TABLE IF EXISTS mt_users CASCADE;
DROP TABLE IF EXISTS mt_subaccounts CASCADE;
DROP TABLE IF EXISTS mt_agencies CASCADE;

DROP TYPE IF EXISTS agency_status CASCADE;
DROP TYPE IF EXISTS subscription_tier CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS merchant_status CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;
```

## Post-Migration Steps

1. Update application code to use new schema (see `shared/multi-tenant-schema.ts`)
2. Update connection middleware to set tenant context
3. Test all API endpoints with tenant isolation
4. Deprecate old tables (but keep them for reference during transition)

## Security Notes

- RLS policies are in `PERMISSIVE` mode by default
- The `set_tenant_context()` function must be called at the start of each request
- Super admins bypass tenant isolation - use sparingly
- Audit logs are always writable but filtered on read

## Test Environment Setup

Before running migrations on production, always test in a test environment first:

### Option 1: Quick Test Setup (Docker)

```bash
# Set up test database with Docker and run all checks
./scripts/test-environment-setup.sh --docker --all
```

### Option 2: Local PostgreSQL Test

```bash
# Set up test database on local PostgreSQL
./scripts/test-environment-setup.sh --local --clean --all
```

### Option 3: Manual Test Setup

```bash
# 1. Create test database
createdb isohub_test

# 2. Set test database URL
export DATABASE_URL="postgresql://localhost:5432/isohub_test"

# 3. Run migrations
psql $DATABASE_URL -f migrations/001_create_multi_tenant_tables.sql
psql $DATABASE_URL -f migrations/002_enable_row_level_security.sql

# 4. Run verification tests
npx tsx scripts/verify-multi-tenant.ts
```

### Verification Tests

Run the comprehensive verification script:

```bash
npx tsx scripts/verify-multi-tenant.ts
```

This tests:
- All required tables exist
- RLS is enabled on all tables
- RLS policies are correctly configured
- Tenant context function works
- Data isolation between agencies
- Foreign key constraints
- Audit logging functionality

## Support

For issues, contact the platform team or see the full audit report:
`MULTI_TENANT_SECURITY_AUDIT.md`
