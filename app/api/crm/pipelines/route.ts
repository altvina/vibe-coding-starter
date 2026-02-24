import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  try {
    const data = await withCrmDb(async (client) => {
      const pipelines = await client.query(
        `SELECT id, name, description, is_active, created_at, updated_at FROM crm_pipelines ORDER BY name`
      );
      const stages = await client.query(
        `SELECT id, pipeline_id, name, order_index, default_probability, created_at, updated_at
         FROM crm_stages ORDER BY pipeline_id, order_index`
      );
      return {
        pipelines: pipelines.rows,
        stages: stages.rows,
      };
    });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  let body: { name: string; description?: string; is_active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `INSERT INTO crm_pipelines (name, description, is_active) VALUES ($1, $2, $3)
         RETURNING id, name, description, is_active, created_at, updated_at`,
        [body.name.trim(), body.description?.trim() ?? null, body.is_active ?? true]
      );
      return r.rows[0];
    });
    return NextResponse.json(row);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
