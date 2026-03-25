import { NextResponse, type NextRequest } from 'next/server';

import { runAdminSql } from '@/lib/server/admin-sql';
import { isWorkspaceRole, type WorkspaceRole } from '@/lib/auth/workspace-types';

type SqlConfig = {
  enabled: boolean;
  allowWrites: boolean;
  requireToken: boolean;
};

function getConfig(): SqlConfig {
  const enabled = process.env.ADMIN_SQL_ENABLED === 'true';
  const allowWrites = process.env.ADMIN_SQL_ALLOW_WRITES === 'true';
  const requireToken =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.ADMIN_SQL_TOKEN?.trim());

  return { enabled, allowWrites, requireToken };
}

function getRole(req: NextRequest): WorkspaceRole | null {
  const roleParam = req.nextUrl.searchParams.get('role');
  if (!isWorkspaceRole(roleParam)) return null;
  return roleParam;
}

function isAdminRole(role: WorkspaceRole | null) {
  return role === 'internal' || role === 'admin';
}

function tokenOk(req: NextRequest) {
  const token = process.env.ADMIN_SQL_TOKEN?.trim();
  if (!token) return process.env.NODE_ENV !== 'production';
  return req.headers.get('x-admin-token') === token;
}

export async function GET(req: NextRequest) {
  const cfg = getConfig();
  const role = getRole(req);

  return NextResponse.json({
    ...cfg,
    role,
    allowed: cfg.enabled && isAdminRole(role),
  });
}

export async function POST(req: NextRequest) {
  const cfg = getConfig();
  if (!cfg.enabled) {
    return NextResponse.json(
      { error: 'Admin SQL is disabled.' },
      { status: 404 },
    );
  }

  const role = getRole(req);
  if (!isAdminRole(role)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  if (cfg.requireToken && !tokenOk(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    void error;
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const sql = (body as { sql?: unknown })?.sql;
  const maxRowsRaw = (body as { maxRows?: unknown })?.maxRows;
  const allowWritesRequested = (body as { allowWrites?: unknown })?.allowWrites;
  const confirmWrites = (body as { confirmWrites?: unknown })?.confirmWrites;

  if (typeof sql !== 'string') {
    return NextResponse.json({ error: 'Missing `sql`.' }, { status: 400 });
  }

  const maxRows =
    typeof maxRowsRaw === 'number' && Number.isFinite(maxRowsRaw)
      ? Math.max(1, Math.min(maxRowsRaw, 1000))
      : 200;

  const allowWrites =
    cfg.allowWrites &&
    allowWritesRequested === true &&
    confirmWrites === true;

  try {
    const result = await runAdminSql({
      sql,
      maxRows,
      allowWrites,
      timeoutMs: 5000,
    });
    return NextResponse.json({
      ...result,
      readOnly: !allowWrites,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'SQL execution failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

