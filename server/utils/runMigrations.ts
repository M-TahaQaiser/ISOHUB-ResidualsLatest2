import { pool } from '../db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Runs SQL migration files from the migrations directory.
 * Only runs migrations that haven't been applied yet (tracked by a migrations table).
 */
export async function runMigrations(): Promise<void> {
  console.log('🔄 Starting database migrations...');

  try {
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get list of applied migrations
    const { rows: appliedMigrations } = await pool.query(
      'SELECT name FROM _migrations'
    );
    const appliedSet = new Set(appliedMigrations.map(m => m.name));

    // Get migration files - try multiple paths
    // Go up from server/utils to project root, then into migrations
    const projectRoot = path.resolve(__dirname, '..', '..');
    const migrationsDir = path.join(projectRoot, 'migrations');

    console.log(`📁 Looking for migrations in: ${migrationsDir}`);

    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 No migrations directory found, skipping migrations');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('📁 No migration files found');
      return;
    }

    // Run pending migrations
    let appliedCount = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        continue; // Already applied
      }

      console.log(`🔄 Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      try {
        await pool.query(sql);
        await pool.query(
          'INSERT INTO _migrations (name) VALUES ($1)',
          [file]
        );
        appliedCount++;
        console.log(`✅ Migration applied: ${file}`);
      } catch (error: any) {
        console.error(`❌ Migration failed: ${file}`, error.message);
        // If the error is a missing relation (table) - log and skip so other migrations can run.
        // This is safer for local dev where some legacy tables may be intentionally absent.
        if (error && error.code === '42P01') {
          console.warn(`⚠️ Missing relation detected, marking ${file} as skipped and continuing`);
          // mark as applied so we don't repeatedly attempt the same migration
          try {
            await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
          } catch (_) {
            // ignore - if insert fails we still continue
          }
          continue;
        }
        throw error;
      }
    }

    if (appliedCount > 0) {
      console.log(`✅ Applied ${appliedCount} migration(s)`);
    } else {
      console.log('✅ All migrations are up to date');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}
