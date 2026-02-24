import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('page_size') ?? '50', 10)));
  const owner_id = url.searchParams.get('owner_id') ?? '';
  const deal_id = url.searchParams.get('deal_id') ?? '';
  const person_id = url.searchParams.get('person_id') ?? '';
  const organization_id = url.searchParams.get('organization_id') ?? '';
  const done = url.searchParams.get('done') ?? '';
  const offset = (page - 1) * pageSize;

  try {
    const data = await withCrmDb(async (client) => {
      const conditions: string[] = [];
      const countArgs: unknown[] = [];
      let i = 1;
      if (owner_id) {
        conditions.push(`owner_id = $${i}`);
        countArgs.push(owner_id);
        i++;
      }
      if (deal_id) {
        conditions.push(`deal_id = $${i}`);
        countArgs.push(deal_id);
        i++;
      }
      if (person_id) {
        conditions.push(`person_id = $${i}`);
        countArgs.push(person_id);
        i++;
      }
      if (organization_id) {
        conditions.push(`organization_id = $${i}`);
        countArgs.push(organization_id);
        i++;
      }
      if (done === 'true' || done === 'false') {
        conditions.push(`done = $${i}`);
        countArgs.push(done === 'true');
        i++;
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const countResult = await client.query(
        `SELECT COUNT(*)::int AS total FROM crm_activities ${where}`,
        countArgs
      );
      const total = countResult.rows[0]?.total ?? 0;
      const listArgs = [...countArgs, pageSize, offset];
      const lim = countArgs.length + 1;
      const off = countArgs.length + 2;
      const listResult = await client.query(
        `SELECT id, type, subject, deal_id, person_id, organization_id, owner_id, due_at, done, done_at, notes, created_at, updated_at
         FROM crm_activities ${where} ORDER BY due_at ASC NULLS LAST LIMIT $${lim} OFFSET $${off}`,
        listArgs
      );
      return { items: listResult.rows, total, page, page_size: pageSize };
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
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const owner_id = typeof body.owner_id === 'string' ? body.owner_id : '';
  const due_at = typeof body.due_at === 'string' ? body.due_at : null;
  if (!subject || !owner_id || !due_at) {
    return NextResponse.json({ error: 'subject, owner_id, and due_at are required' }, { status: 400 });
  }
  const type = ['call', 'meeting', 'email', 'task', 'other'].includes(String(body.type)) ? body.type : 'task';

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `INSERT INTO crm_activities (type, subject, deal_id, person_id, organization_id, owner_id, due_at, done, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8)
         RETURNING id, type, subject, deal_id, person_id, organization_id, owner_id, due_at, done, done_at, notes, created_at, updated_at`,
        [
          type,
          subject,
          body.deal_id ?? null,
          body.person_id ?? null,
          body.organization_id ?? null,
          owner_id,
          due_at,
          body.notes ?? null,
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
