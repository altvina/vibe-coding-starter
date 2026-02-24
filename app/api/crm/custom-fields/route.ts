import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';

export const dynamic = 'force-dynamic';

const ENTITY_TYPES = ['organization', 'person', 'lead', 'deal', 'activity', 'product'];
const FIELD_TYPES = ['text', 'number', 'date', 'boolean', 'select'];

export async function GET(request: NextRequest) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const entity_type = url.searchParams.get('entity_type') ?? '';

  try {
    const data = await withCrmDb(async (client) => {
      if (entity_type && ENTITY_TYPES.includes(entity_type)) {
        const r = await client.query(
          `SELECT id, entity_type, name, label, field_type, options_json, is_required, order_index, created_by, created_at, updated_at
           FROM crm_custom_field_definitions WHERE entity_type = $1 ORDER BY order_index, name`,
          [entity_type]
        );
        return { items: r.rows };
      }
      const r = await client.query(
        `SELECT id, entity_type, name, label, field_type, options_json, is_required, order_index, created_by, created_at, updated_at
         FROM crm_custom_field_definitions ORDER BY entity_type, order_index, name`
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
  const entity_type = body.entity_type as string;
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, '_') : '';
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  const field_type = body.field_type as string;
  const created_by = typeof body.created_by === 'string' ? body.created_by : '';

  if (!ENTITY_TYPES.includes(entity_type) || !name || !label || !FIELD_TYPES.includes(field_type) || !created_by) {
    return NextResponse.json(
      { error: 'entity_type, name, label, field_type, created_by are required; valid entity_type and field_type' },
      { status: 400 }
    );
  }

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `INSERT INTO crm_custom_field_definitions (entity_type, name, label, field_type, options_json, is_required, order_index, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, entity_type, name, label, field_type, options_json, is_required, order_index, created_by, created_at, updated_at`,
        [
          entity_type,
          name,
          label,
          field_type,
          body.options_json ?? null,
          Boolean(body.is_required),
          typeof body.order_index === 'number' ? body.order_index : 0,
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
