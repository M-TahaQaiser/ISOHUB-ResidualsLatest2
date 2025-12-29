import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import * as isoAISchema from "@shared/iso-ai-schema";
import * as mtSchema from "@shared/multi-tenant-schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, { schema: { ...schema, ...isoAISchema, ...mtSchema } });

// Multi-tenant context helper - sets tenant context for RLS policies
export async function setTenantContext(
  agencyId: string | null,
  subaccountId?: string | null,
  isSuperAdmin: boolean = false,
  isAgencyAdmin: boolean = false
): Promise<void> {
  await pool.query(`SELECT set_tenant_context($1::uuid, $2::uuid, $3::boolean, $4::boolean)`, [
    agencyId,
    subaccountId || null,
    isSuperAdmin,
    isAgencyAdmin
  ]);
}

// Helper to clear tenant context
export async function clearTenantContext(): Promise<void> {
  await pool.query(`SELECT set_tenant_context(NULL, NULL, false, false)`);
}

// Helper to execute queries with tenant context
export async function withTenantContext<T>(
  agencyId: string,
  subaccountId: string | null | undefined,
  isSuperAdmin: boolean,
  isAgencyAdmin: boolean,
  fn: () => Promise<T>
): Promise<T> {
  await setTenantContext(agencyId, subaccountId, isSuperAdmin, isAgencyAdmin);
  try {
    return await fn();
  } finally {
    await clearTenantContext();
  }
}

// Helper for super admin context (bypasses RLS)
export async function withSuperAdminContext<T>(fn: () => Promise<T>): Promise<T> {
  await setTenantContext(null, null, true, false);
  try {
    return await fn();
  } finally {
    await clearTenantContext();
  }
}

// Re-export multi-tenant schema for convenience
export { mtSchema };
