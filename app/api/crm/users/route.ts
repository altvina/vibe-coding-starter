import { NextRequest, NextResponse } from 'next/server';

import { requireStaffRole } from '@/lib/crm/auth';
import { withCrmDb } from '@/lib/crm/db';

export const dynamic = 'force-dynamic';

/** Returns users that can be owners (staff+). For dropdowns and assignees. */
export async function GET(request: NextRequest) {
  const forbidden = requireStaffRole(request);
  if (forbidden) return forbidden;

  try {
    const rows = await withCrmDb(async (client) => {
      const r = await client.query(
        `SELECT id, name, email, role FROM users WHERE role IN ('staff_admin', 'super_admin') ORDER BY name`
      );
      return r.rows;
    });
    return NextResponse.json({ items: rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
