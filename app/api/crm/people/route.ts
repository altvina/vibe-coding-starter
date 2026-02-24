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
  const search = url.searchParams.get('search')?.trim() ?? '';
  const organization_id = url.searchParams.get('organization_id') ?? '';
  const offset = (page - 1) * pageSize;

  try {
    const data = await withCrmDb(async (client) => {
      const conditions: string[] = [];
      const countArgs: unknown[] = [];
      let i = 1;
      if (search) {
        conditions.push(`(first_name ILIKE $${i} OR last_name ILIKE $${i} OR email ILIKE $${i})`);
        countArgs.push(`%${search}%`);
        i++;
      }
      if (organization_id) {
        conditions.push(`organization_id = $${i}`);
        countArgs.push(organization_id);
        i++;
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const countResult = await client.query(
        `SELECT COUNT(*)::int AS total FROM crm_people ${where}`,
        countArgs
      );
      const total = countResult.rows[0]?.total ?? 0;
      const listArgs = [...countArgs, pageSize, offset];
      const lim = countArgs.length + 1;
      const off = countArgs.length + 2;
      const listResult = await client.query(
        `SELECT id, organization_id, first_name, last_name, email, phone, job_title, created_at, updated_at
         FROM crm_people ${where} ORDER BY last_name, first_name LIMIT $${lim} OFFSET $${off}`,
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
  const firstName = typeof body.first_name === 'string' ? body.first_name.trim() : '';
  const lastName = typeof body.last_name === 'string' ? body.last_name.trim() : '';
  if (!firstName || !lastName) return NextResponse.json({ error: 'first_name and last_name are required' }, { status: 400 });

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `INSERT INTO crm_people (organization_id, first_name, last_name, email, phone, job_title)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, organization_id, first_name, last_name, email, phone, job_title, created_at, updated_at`,
        [
          body.organization_id ?? null,
          firstName,
          lastName,
          body.email ?? null,
          body.phone ?? null,
          body.job_title ?? null,
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
