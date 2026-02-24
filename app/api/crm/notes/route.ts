import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const deal_id = url.searchParams.get('deal_id') ?? '';
  const person_id = url.searchParams.get('person_id') ?? '';
  const organization_id = url.searchParams.get('organization_id') ?? '';
  if (!deal_id && !person_id && !organization_id) {
    return NextResponse.json({ error: 'One of deal_id, person_id, organization_id is required' }, { status: 400 });
  }

  try {
    const data = await withCrmDb(async (client) => {
      const conditions: string[] = [];
      const args: unknown[] = [];
      let i = 1;
      if (deal_id) {
        conditions.push(`deal_id = $${i}`);
        args.push(deal_id);
        i++;
      }
      if (person_id) {
        conditions.push(`person_id = $${i}`);
        args.push(person_id);
        i++;
      }
      if (organization_id) {
        conditions.push(`organization_id = $${i}`);
        args.push(organization_id);
        i++;
      }
      const where = `WHERE ${conditions.join(' OR ')}`;
      const r = await client.query(
        `SELECT id, deal_id, person_id, organization_id, author_id, content, created_at, updated_at
         FROM crm_notes ${where} ORDER BY created_at DESC`,
        args
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
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const author_id = typeof body.author_id === 'string' ? body.author_id : '';
  if (!content || !author_id) return NextResponse.json({ error: 'content and author_id are required' }, { status: 400 });

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `INSERT INTO crm_notes (deal_id, person_id, organization_id, author_id, content)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, deal_id, person_id, organization_id, author_id, content, created_at, updated_at`,
        [body.deal_id ?? null, body.person_id ?? null, body.organization_id ?? null, author_id, content]
      );
      return r.rows[0];
    });
    return NextResponse.json(row);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
