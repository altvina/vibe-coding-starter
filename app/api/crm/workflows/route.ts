import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';

export const dynamic = 'force-dynamic';

const TRIGGER_TYPES = ['deal_created', 'deal_stage_changed', 'deal_status_changed', 'activity_completed'];

export async function GET(request: NextRequest) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const trigger_type = url.searchParams.get('trigger_type') ?? '';

  try {
    const data = await withCrmDb(async (client) => {
      if (trigger_type && TRIGGER_TYPES.includes(trigger_type)) {
        const r = await client.query(
          `SELECT id, name, trigger_type, conditions_json, actions_json, is_active, created_by, created_at, updated_at
           FROM crm_workflow_rules WHERE trigger_type = $1 ORDER BY name`,
          [trigger_type]
        );
        return { items: r.rows };
      }
      const r = await client.query(
        `SELECT id, name, trigger_type, conditions_json, actions_json, is_active, created_by, created_at, updated_at
         FROM crm_workflow_rules ORDER BY trigger_type, name`
      );
      return { items: r.rows };
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const trigger_type = body.trigger_type as string;
  const created_by = typeof body.created_by === 'string' ? body.created_by : '';
  if (!name || !TRIGGER_TYPES.includes(trigger_type) || !created_by) {
    return NextResponse.json({ error: 'name, trigger_type, created_by required; trigger_type must be valid' }, { status: 400 });
  }

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `INSERT INTO crm_workflow_rules (name, trigger_type, conditions_json, actions_json, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, trigger_type, conditions_json, actions_json, is_active, created_by, created_at, updated_at`,
        [
          name,
          trigger_type,
          JSON.stringify(body.conditions_json ?? {}),
          JSON.stringify(Array.isArray(body.actions_json) ? body.actions_json : []),
          body.is_active !== false,
          created_by,
        ]
      );
      return r.rows[0];
    });
    return NextResponse.json(row);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
