import 'server-only';

import { Pool } from 'pg';

declare global {
  var __altvinaCrmPool: Pool | undefined;
}

export function getCrmPool(): Pool {
  if (globalThis.__altvinaCrmPool) return globalThis.__altvinaCrmPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for CRM.');
  }
  globalThis.__altvinaCrmPool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  return globalThis.__altvinaCrmPool;
}

export async function withCrmDb<T>(fn: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
  const pool = getCrmPool();
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
