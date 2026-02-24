import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';
import { evaluateWorkflowRules } from '@/lib/crm/workflow-engine';

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
        `SELECT id, type, subject, deal_id, person_id, organization_id, owner_id, due_at, done, done_at, notes, created_at, updated_at
         FROM crm_activities WHERE id = $1`,
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

  const fields = ['type', 'subject', 'deal_id', 'person_id', 'organization_id', 'owner_id', 'due_at', 'done', 'notes'];
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const f of fields) {
    if (body[f] !== undefined) {
      setClauses.push(`${f} = $${i}`);
      if (f === 'done') {
        values.push(body[f]);
        i++;
        if (body[f] === true) setClauses.push('done_at = now()');
      } else {
        values.push(body[f]);
        i++;
      }
    }
  }
  if (setClauses.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  setClauses.push('updated_at = now()');
  values.push(id);

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `UPDATE crm_activities SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
        values
      );
      const updated = r.rows[0] ?? null;
      if (updated && body.done === true) {
        const dealId = updated.deal_id ?? undefined;
        await evaluateWorkflowRules(client, 'activity_completed', {
          activity_id: id,
          deal_id: dealId,
          owner_id: updated.owner_id,
        });
      }
      return updated;
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
    const r = await withCrmDb(async (client) => client.query(`DELETE FROM crm_activities WHERE id = $1 RETURNING id`, [id]));
    if (r.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
