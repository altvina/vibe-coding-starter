#!/usr/bin/env node
/**
 * Run CRM SQL migrations in order.
 * Usage: node scripts/runCrmMigrations.mjs
 * Loads DATABASE_URL from .env.local if not set (e.g. when run via npm run crm:migrate).
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const migrationsDir = join(root, 'migrations');
const envLocalPath = join(root, '.env.local');

function loadEnvLocal() {
  if (process.env.DATABASE_URL) return;
  if (!existsSync(envLocalPath)) return;
  const content = readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) {
      const value = m[2].replace(/^["']|["']$/g, '').trim();
      if (!process.env[m[1]]) process.env[m[1]] = value;
    }
  }
}

loadEnvLocal();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required.');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const path = join(migrationsDir, file);
    const sql = readFileSync(path, 'utf8');
    console.log(`Running ${file}...`);
    try {
      await client.query(sql);
      console.log(`  OK`);
    } catch (err) {
      console.error(`  Error:`, err.message);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log('Migrations complete.');
}

main();
