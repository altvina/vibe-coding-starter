import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = requireStaffRole(_request);
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `SELECT id, person_id, organization_id, source, status, owner_id, title, notes, created_at, updated_at FROM crm_leads WHERE id = $1`,
        [id]
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

  const fields = ['person_id', 'organization_id', 'source', 'status', 'owner_id', 'title', 'notes'];
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const f of fields) {
    if (body[f] !== undefined) {
      setClauses.push(`${f} = $${i}`);
      values.push(body[f]);
      i++;
    }
  }
  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  setClauses.push('updated_at = now()');
  values.push(id);

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `UPDATE crm_leads SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
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
