import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  let body: { pipeline_id: string; name: string; order_index?: number; default_probability?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.pipeline_id || !body.name) {
    return NextResponse.json({ error: 'pipeline_id and name are required' }, { status: 400 });
  }

  try {
    const row = await withCrmDb(async (client) => {
      const orderIndex = body.order_index ?? ((await client.query(
        `SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM crm_stages WHERE pipeline_id = $1`,
        [body.pipeline_id]
      )).rows[0].next);
      const r = await client.query(
        `INSERT INTO crm_stages (pipeline_id, name, order_index, default_probability)
         VALUES ($1, $2, $3, $4)
         RETURNING id, pipeline_id, name, order_index, default_probability, created_at, updated_at`,
        [body.pipeline_id, body.name.trim(), orderIndex, body.default_probability ?? 50]
      );
      return r.rows[0];
    });
    return NextResponse.json(row);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
