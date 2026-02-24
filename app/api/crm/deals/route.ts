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
  const pipeline_id = url.searchParams.get('pipeline_id') ?? '';
  const stage_id = url.searchParams.get('stage_id') ?? '';
  const owner_id = url.searchParams.get('owner_id') ?? '';
  const status = url.searchParams.get('status') ?? '';
  const offset = (page - 1) * pageSize;

  try {
    const data = await withCrmDb(async (client) => {
      const conditions: string[] = [];
      const countArgs: unknown[] = [];
      let i = 1;
      if (pipeline_id) {
        conditions.push(`pipeline_id = $${i}`);
        countArgs.push(pipeline_id);
        i++;
      }
      if (stage_id) {
        conditions.push(`stage_id = $${i}`);
        countArgs.push(stage_id);
        i++;
      }
      if (owner_id) {
        conditions.push(`owner_id = $${i}`);
        countArgs.push(owner_id);
        i++;
      }
      if (status) {
        conditions.push(`status = $${i}`);
        countArgs.push(status);
        i++;
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const countResult = await client.query(
        `SELECT COUNT(*)::int AS total FROM crm_deals ${where}`,
        countArgs
      );
      const total = countResult.rows[0]?.total ?? 0;
      const listArgs = [...countArgs, pageSize, offset];
      const lim = countArgs.length + 1;
      const off = countArgs.length + 2;
      const listResult = await client.query(
        `SELECT id, title, person_id, organization_id, pipeline_id, stage_id, value, currency, status, owner_id,
                expected_close_date, won_at, lost_at, lost_reason, created_at, updated_at
         FROM crm_deals ${where} ORDER BY updated_at DESC LIMIT $${lim} OFFSET $${off}`,
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
  const pipeline_id = typeof body.pipeline_id === 'string' ? body.pipeline_id : '';
  const stage_id = typeof body.stage_id === 'string' ? body.stage_id : '';
  const owner_id = typeof body.owner_id === 'string' ? body.owner_id : '';
  if (!title || !pipeline_id || !owner_id) {
    return NextResponse.json({ error: 'title, pipeline_id, and owner_id are required' }, { status: 400 });
  }

  try {
    const row = await withCrmDb(async (client) => {
      let resolvedStageId = stage_id;
      if (!resolvedStageId) {
        const firstStage = await client.query(
          `SELECT id FROM crm_stages WHERE pipeline_id = $1 ORDER BY order_index ASC LIMIT 1`,
          [pipeline_id]
        );
        if (firstStage.rows.length === 0) throw new Error('Pipeline has no stages');
        resolvedStageId = firstStage.rows[0].id;
      }
      const r = await client.query(
        `INSERT INTO crm_deals (title, person_id, organization_id, pipeline_id, stage_id, value, currency, owner_id, expected_close_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, title, person_id, organization_id, pipeline_id, stage_id, value, currency, status, owner_id,
                   expected_close_date, won_at, lost_at, lost_reason, created_at, updated_at`,
        [
          title,
          body.person_id ?? null,
          body.organization_id ?? null,
          pipeline_id,
          resolvedStageId,
          body.value != null ? Number(body.value) : 0,
          typeof body.currency === 'string' ? body.currency : 'USD',
          owner_id,
          body.expected_close_date ?? null,
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
