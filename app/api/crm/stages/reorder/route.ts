import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  let body: { stage_ids: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!Array.isArray(body.stage_ids) || body.stage_ids.length === 0) {
    return NextResponse.json({ error: 'stage_ids array is required' }, { status: 400 });
  }

  try {
    await withCrmDb(async (client) => {
      for (let i = 0; i < body.stage_ids.length; i++) {
        await client.query(
          `UPDATE crm_stages SET order_index = $2, updated_at = now() WHERE id = $1`,
          [body.stage_ids[i], i]
        );
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
