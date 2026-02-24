import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('page_size') ?? '20', 10)));
  const status = url.searchParams.get('status') ?? '';
  const owner_id = url.searchParams.get('owner_id') ?? '';
  const offset = (page - 1) * pageSize;

  try {
    const data = await withCrmDb(async (client) => {
      const conditions: string[] = [];
      const countArgs: unknown[] = [];
      let i = 1;
      if (status) {
        conditions.push(`status = $${i}`);
        countArgs.push(status);
        i++;
      }
      if (owner_id) {
        conditions.push(`owner_id = $${i}`);
        countArgs.push(owner_id);
        i++;
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const countResult = await client.query(
        `SELECT COUNT(*)::int AS total FROM crm_leads ${where}`,
        countArgs
      );
      const total = countResult.rows[0]?.total ?? 0;
      const listArgs = [...countArgs, pageSize, offset];
      const lim = countArgs.length + 1;
      const off = countArgs.length + 2;
      const listResult = await client.query(
        `SELECT id, person_id, organization_id, source, status, owner_id, title, notes, created_at, updated_at
         FROM crm_leads ${where} ORDER BY created_at DESC LIMIT $${lim} OFFSET $${off}`,
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
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const owner_id = typeof body.owner_id === 'string' ? body.owner_id : '';
  if (!title || !owner_id) return NextResponse.json({ error: 'title and owner_id are required' }, { status: 400 });
  const status = ['new', 'working', 'qualified', 'unqualified'].includes(String(body.status)) ? body.status : 'new';

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `INSERT INTO crm_leads (person_id, organization_id, source, status, owner_id, title, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, person_id, organization_id, source, status, owner_id, title, notes, created_at, updated_at`,
        [
          body.person_id ?? null,
          body.organization_id ?? null,
          body.source ?? null,
          status,
          owner_id,
          title,
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
