import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';
import { convertLeadToDeal } from '@/lib/crm/lead-convert';
import type { ConvertLeadToDealBody } from '@/lib/crm/types';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  const { id: leadId } = await params;
  let body: ConvertLeadToDealBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.pipeline_id || !body.owner_id) {
    return NextResponse.json({ error: 'pipeline_id and owner_id are required' }, { status: 400 });
  }

  try {
    const result = await withCrmDb(async (client) => {
      await client.query('BEGIN');
      try {
        const out = await convertLeadToDeal(client, leadId, body);
        await client.query('COMMIT');
        return out;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: e instanceof Error && e.message === 'Lead not found' ? 404 : 500 });
  }
}
