import 'server-only';

import { Pool, type FieldDef } from 'pg';

declare global {
   
  var __altvinaAdminSqlPool: Pool | undefined;
}

function getPool() {
  if (globalThis.__altvinaAdminSqlPool) return globalThis.__altvinaAdminSqlPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }

  globalThis.__altvinaAdminSqlPool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
  return globalThis.__altvinaAdminSqlPool;
}

function stripTrailingSemicolon(sql: string) {
  return sql.trim().replace(/;+\s*$/, '');
}

function startsWithAllowedReadOnly(sql: string) {
  return /^\s*(select|with|explain)\b/i.test(sql);
}

function startsWithWrite(sql: string) {
  return /^\s*(insert|update|delete|truncate|create|alter|drop|grant|revoke)\b/i.test(sql);
}

function enforceLimit(sql: string, maxRows: number) {
  const normalized = stripTrailingSemicolon(sql);
  if (!startsWithAllowedReadOnly(normalized)) return normalized;
  if (/\blimit\b/i.test(normalized)) return normalized;
  return `${normalized}\nLIMIT ${Math.max(1, Math.min(maxRows, 1000))}`;
}

export type AdminSqlRunResult = {
  rowCount: number;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  durationMs: number;
};

export async function runAdminSql(args: {
  sql: string;
  maxRows: number;
  allowWrites: boolean;
  timeoutMs: number;
}): Promise<AdminSqlRunResult> {
  const trimmed = args.sql.trim();
  if (!trimmed) {
    throw new Error('SQL is empty.');
  }
  if (trimmed.length > 50_000) {
    throw new Error('SQL is too large.');
  }

  const readOnly = startsWithAllowedReadOnly(trimmed);
  const write = startsWithWrite(trimmed);

  if (write && !args.allowWrites) {
    throw new Error('Write queries are disabled.');
  }
  if (!readOnly && !write) {
    throw new Error('Only SELECT/WITH/EXPLAIN queries are allowed by default.');
  }

  const sql = readOnly ? enforceLimit(trimmed, args.maxRows) : stripTrailingSemicolon(trimmed);
  const startedAt = performance.now();

  const pool = getPool();
  const client = await pool.connect();
  try {
    const timeout = Math.max(250, Math.min(args.timeoutMs, 15_000));
    await client.query(`SET statement_timeout TO ${timeout}`);

    const result = await client.query(sql);
    const fields = (result.fields ?? []) as FieldDef[];
    const columns = fields.map((f) => f.name);
    const durationMs = Math.round((performance.now() - startedAt) * 10) / 10;

    return {
      rowCount: result.rowCount ?? 0,
      columns,
      rows: (result.rows ?? []) as Array<Record<string, unknown>>,
      durationMs,
    };
  } finally {
    client.release();
  }
}

