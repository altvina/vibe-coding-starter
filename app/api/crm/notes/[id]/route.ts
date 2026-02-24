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
  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (body.content === undefined) return NextResponse.json({ error: 'content required' }, { status: 400 });

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `UPDATE crm_notes SET content = $2, updated_at = now() WHERE id = $1 RETURNING *`,
        [id, body.content]
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
    const r = await withCrmDb(async (client) => client.query(`DELETE FROM crm_notes WHERE id = $1 RETURNING id`, [id]));
    if (r.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
