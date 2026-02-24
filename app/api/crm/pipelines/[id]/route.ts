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
  let body: { name?: string; description?: string; is_active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `UPDATE crm_pipelines SET
          name = COALESCE($2, name),
          description = COALESCE($3, description),
          is_active = COALESCE($4, is_active),
          updated_at = now()
         WHERE id = $1
         RETURNING id, name, description, is_active, created_at, updated_at`,
        [id, body.name?.trim(), body.description !== undefined ? body.description : null, body.is_active]
      );
      if (r.rows.length === 0) return null;
      return r.rows[0];
    });
    if (!row) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
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
    const deleted = await withCrmDb(async (client) => {
      const r = await client.query(`DELETE FROM crm_pipelines WHERE id = $1 RETURNING id`, [id]);
      return r.rowCount ?? 0;
    });
    if (deleted === 0) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
