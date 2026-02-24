import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';

export const dynamic = 'force-dynamic';

/** GET: fetch custom field values for an entity. Query: entity_type, entity_id. */
export async function GET(request: NextRequest) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const entity_type = url.searchParams.get('entity_type') ?? '';
  const entity_id = url.searchParams.get('entity_id') ?? '';
  if (!entity_type || !entity_id) {
    return NextResponse.json({ error: 'entity_type and entity_id required' }, { status: 400 });
  }

  try {
    const rows = await withCrmDb(async (client) => {
      const r = await client.query(
        `SELECT v.id, v.definition_id, v.entity_type, v.entity_id, v.value_json, v.created_at, v.updated_at,
                d.name, d.label, d.field_type, d.options_json
         FROM crm_custom_field_values v
         JOIN crm_custom_field_definitions d ON d.id = v.definition_id
         WHERE v.entity_type = $1 AND v.entity_id = $2`,
        [entity_type, entity_id]
      );
      return r.rows;
    });
    return NextResponse.json({ items: rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST: set custom field value (upsert). Body: definition_id, entity_type, entity_id, value_json. */
export async function POST(request: NextRequest) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const definition_id = typeof body.definition_id === 'string' ? body.definition_id : '';
  const entity_type = typeof body.entity_type === 'string' ? body.entity_type : '';
  const entity_id = typeof body.entity_id === 'string' ? body.entity_id : '';
  if (!definition_id || !entity_type || !entity_id) {
    return NextResponse.json({ error: 'definition_id, entity_type, entity_id required' }, { status: 400 });
  }

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `INSERT INTO crm_custom_field_values (definition_id, entity_type, entity_id, value_json)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (definition_id, entity_id) DO UPDATE SET value_json = $4, updated_at = now()
         RETURNING id, definition_id, entity_type, entity_id, value_json, created_at, updated_at`,
        [definition_id, entity_type, entity_id, JSON.stringify(body.value_json ?? null)]
      );
      return r.rows[0];
    });
    return NextResponse.json(row);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
