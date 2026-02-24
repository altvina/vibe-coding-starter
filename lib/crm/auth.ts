import 'server-only';

import { NextRequest, NextResponse } from 'next/server';

/** Roles that may access CRM (internal staff only). */
export const CRM_ALLOWED_ROLES = ['staff_admin', 'super_admin'] as const;
export type CrmAllowedRole = (typeof CRM_ALLOWED_ROLES)[number];

export function isCrmAllowedRole(role: string | null): role is CrmAllowedRole {
  return role !== null && CRM_ALLOWED_ROLES.includes(role as CrmAllowedRole);
}

/**
 * Gets the current user's role from the request.
 * Integrates with existing dashboard: role is passed as query param (e.g. from dashboard API) or header.
 * In production, replace with session/JWT and real users table lookup.
 */
export function getRoleFromRequest(request: NextRequest): string | null {
  const header = request.headers.get('x-dashboard-role');
  if (header) return header;
  const url = new URL(request.url);
  return url.searchParams.get('role');
}

/**
 * Guard: returns 403 JSON if the request is not from a Staff+ user.
 * Use at the start of every CRM API route.
 */
export function requireStaffRole(request: NextRequest): NextResponse | null {
  const role = getRoleFromRequest(request);
  if (!isCrmAllowedRole(role)) {
    return NextResponse.json(
      { error: 'Forbidden. CRM is internal-only; Staff or Admin role required.' },
      { status: 403 }
    );
  }
  return null;
}
