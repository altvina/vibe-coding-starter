import type { NextRequest } from 'next/server';

import {
  dashboardIdentitySeeds,
  defaultDashboardIdentityId,
  isDashboardIdentityId,
  type DashboardIdentitySeed,
} from '@/app/dashboard/dashboard-identities';

export type DashboardIdentityResolution =
  | { ok: true; identityId: string; identity: DashboardIdentitySeed }
  | { ok: false; reason: 'invalid_identity_id' };

export type ResolvedDashboardIdentity = {
  identityId: string;
  identity: DashboardIdentitySeed;
};

/**
 * Resolves the acting user for dashboard-related API routes.
 *
 * **Today (dev / pre-auth):** reads `identityId` from the query string. That is
 * client-controlled and must not be trusted for security — it is only for local
 * iteration. Membership checks still gate workspace access, but the *who* is not
 * cryptographically proven.
 *
 * **Next (Google Sign-In + sessions):** replace the body of this function to:
 * 1. Read an HttpOnly session cookie (or validated server session).
 * 2. Load the row from `users` (and memberships from `workspace_memberships`).
 * 3. Return the same shape, or extend with `dbUserId: string` while you migrate.
 *
 * Keeping all call sites on this helper makes the auth cutover one place to change.
 */
export function resolveDashboardIdentityForApiRequest(
  req: NextRequest,
  mode: 'optional',
): ResolvedDashboardIdentity;
export function resolveDashboardIdentityForApiRequest(
  req: NextRequest,
  mode: 'required',
): DashboardIdentityResolution;
export function resolveDashboardIdentityForApiRequest(
  req: NextRequest,
  mode: 'optional' | 'required',
): ResolvedDashboardIdentity | DashboardIdentityResolution {
  const param = req.nextUrl.searchParams.get('identityId');

  if (mode === 'required') {
    if (!isDashboardIdentityId(param)) {
      return { ok: false, reason: 'invalid_identity_id' };
    }
    const identityId = param;
    const identity =
      dashboardIdentitySeeds.find((seed) => seed.id === identityId) ?? dashboardIdentitySeeds[0];
    return { ok: true, identityId, identity };
  }

  const identityId = isDashboardIdentityId(param) ? param : defaultDashboardIdentityId;
  const identity =
    dashboardIdentitySeeds.find((seed) => seed.id === identityId) ?? dashboardIdentitySeeds[0];
  return { identityId, identity };
}
