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
  const offset = (page - 1) * pageSize;

  try {
    const data = await withCrmDb(async (client) => {
      let where = '';
      const countArgs: unknown[] = [];
      if (search) {
        where = 'WHERE name ILIKE $1 OR industry ILIKE $1 OR city ILIKE $1';
        countArgs.push(`%${search}%`);
      }
      const countResult = await client.query(
        `SELECT COUNT(*)::int AS total FROM crm_organizations ${where}`,
        countArgs
      );
      const total = countResult.rows[0]?.total ?? 0;
      const listArgs = [...countArgs, pageSize, offset];
      const limitOff = search ? 'LIMIT $2 OFFSET $3' : 'LIMIT $1 OFFSET $2';
      const listResult = await client.query(
        `SELECT id, name, address, city, state, country, postal_code, industry, revenue, employee_count, website, created_at, updated_at
         FROM crm_organizations ${where} ORDER BY name ${limitOff}`,
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
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  try {
    const row = await withCrmDb(async (client) => {
      const r = await client.query(
        `INSERT INTO crm_organizations (name, address, city, state, country, postal_code, industry, revenue, employee_count, website)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, name, address, city, state, country, postal_code, industry, revenue, employee_count, website, created_at, updated_at`,
        [
          name,
          body.address ?? null,
          body.city ?? null,
          body.state ?? null,
          body.country ?? null,
          body.postal_code ?? null,
          body.industry ?? null,
          body.revenue != null ? Number(body.revenue) : null,
          body.employee_count != null ? Number(body.employee_count) : null,
          body.website ?? null,
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
