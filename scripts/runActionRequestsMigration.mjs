import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { Client } from 'pg';

async function loadDatabaseUrlFromEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  try {
    const raw = await readFile(envPath, 'utf8');
    const line = raw
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith('DATABASE_URL='));
    if (!line) return '';
    return line.slice('DATABASE_URL='.length).trim();
  } catch (error) {
    void error;
    return '';
  }
}

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL?.trim() || (await loadDatabaseUrlFromEnvFile());
  if (!databaseUrl) {
    console.error(
      'DATABASE_URL is not set. Add it to .env.local or your shell environment first.',
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    const { rows } = await client.query(`
      select 1
      from information_schema.tables
      where table_schema = 'public' and table_name = 'action_requests'
      limit 1
    `);
    const tableExists = rows.length > 0;

    await client.query('begin');
    if (!tableExists) {
      const p004 = path.resolve(process.cwd(), 'migrations/004_action_requests.sql');
      await client.query(await readFile(p004, 'utf8'));
      console.log('Applied migrations/004_action_requests.sql');
    } else {
      console.log('Skipping 004: public.action_requests already exists (avoid re-applying alters).');
    }

    const p005 = path.resolve(process.cwd(), 'migrations/005_action_request_pipeline_statuses.sql');
    await client.query(await readFile(p005, 'utf8'));
    console.log('Applied migrations/005_action_request_pipeline_statuses.sql');

    await client.query('commit');
    console.log('Action requests migrations finished successfully.');
  } catch (error) {
    await client.query('rollback').catch(() => {});
    console.error(
      error instanceof Error ? error.message : 'Failed to apply action requests migration.',
    );
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

await main();
