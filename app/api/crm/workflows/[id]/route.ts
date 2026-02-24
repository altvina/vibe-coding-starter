import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  ['name', 'trigger_type', 'conditions_json', 'actions_json', 'is_active'].forEach((f) => {
    if (body[f] !== undefined) {
      setClauses.push(`${f} = $${i}`);
      values.push(f === 'conditions_json' || f === 'actions_json' ? JSON.stringify(body[f]) : body[f]);
      i++;
    }
  });
  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  setClauses.push('updated_at = now()');
  values.push(id);

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `UPDATE crm_workflow_rules SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
        values
      );
      return r.rows[0] ?? null;
    });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = requireStaffRole(_request);
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const r = await withCrmDb(async (client) => client.query(`DELETE FROM crm_workflow_rules WHERE id = $1 RETURNING id`, [id]));
    if (r.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
