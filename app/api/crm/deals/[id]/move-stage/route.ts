import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';
import { moveDealToStage } from '@/lib/crm/deal-lifecycle';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  const { id: dealId } = await params;
  let body: { stage_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.stage_id) return NextResponse.json({ error: 'stage_id is required' }, { status: 400 });

  try {
    const result = await withCrmDb(async (client) => moveDealToStage(client, dealId, body.stage_id));
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    const status = message === 'Deal not found' || message === 'Stage not found' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
