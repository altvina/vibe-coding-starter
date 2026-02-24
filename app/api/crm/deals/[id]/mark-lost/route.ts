import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';
import { markDealLost } from '@/lib/crm/deal-lifecycle';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  const { id: dealId } = await params;
  let body: { lost_reason?: string };
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    body = {};
  }

  try {
    await withCrmDb(async (client) => markDealLost(client, dealId, body.lost_reason));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: message === 'Deal not found' ? 404 : 500 });
  }
}
