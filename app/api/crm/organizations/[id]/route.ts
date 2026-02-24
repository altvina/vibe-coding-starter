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
        `SELECT id, name, address, city, state, country, postal_code, industry, revenue, employee_count, website, created_at, updated_at
         FROM crm_organizations WHERE id = $1`,
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

  const fields = [
    'name', 'address', 'city', 'state', 'country', 'postal_code', 'industry',
    'revenue', 'employee_count', 'website',
  ];
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const f of fields) {
    if (body[f] !== undefined) {
      setClauses.push(`${f} = $${i}`);
      values.push(f === 'revenue' || f === 'employee_count' ? Number(body[f]) : body[f]);
      i++;
    }
  }
  if (setClauses.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }
  setClauses.push('updated_at = now()');
  values.push(id);

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `UPDATE crm_organizations SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
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
    const r = await withCrmDb(async (client) => {
      return client.query(`DELETE FROM crm_organizations WHERE id = $1 RETURNING id`, [id]);
    });
    if (r.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
