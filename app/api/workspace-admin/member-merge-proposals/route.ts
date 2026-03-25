import { NextResponse, type NextRequest } from 'next/server';

import { isDashboardIdentityId } from '@/app/dashboard/dashboard-identities';
import { resolveDashboardIdentityForApiRequest } from '@/lib/auth/dashboard-request-identity';
import { detectMemberDuplicates } from '@/lib/member-duplicates/detect';
import type { MemberMergeApprovalMode } from '@/lib/member-duplicates/types';
import { getAdminWorkspaceRosterForScan } from '@/lib/dashboard/workspace-roster-for-admin';
import {
  readWorkspaceDirectoryFromCookieValue,
  WORKSPACE_DIRECTORY_COOKIE_KEY,
} from '@/lib/dashboard/workspace-directory';
import { guardWorkspaceAccess } from '@/lib/auth/require-workspace-access';
import { getMembershipsForIdentity } from '@/lib/auth/mock-memberships';
import {
  createMemberMergeProposalsFromScan,
  listMemberMergeProposalsForWorkspace,
  membersForDetectionFromSeedMembers,
} from '@/lib/server/member-merge-proposals-store';
import { workspaceRoleValues, type WorkspaceRole } from '@/lib/auth/workspace-types';

function invalid(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function readWorkspaceDirectory(req: NextRequest) {
  return readWorkspaceDirectoryFromCookieValue(
    req.cookies.get(WORKSPACE_DIRECTORY_COOKIE_KEY)?.value,
  );
}

const approvalModes: MemberMergeApprovalMode[] = ['assigned_user', 'first_authorized_responder'];

function parseBody(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function GET(req: NextRequest) {
  const { identityId } = resolveDashboardIdentityForApiRequest(req, 'optional');
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return invalid('workspaceId is required.');
  }

  const directory = readWorkspaceDirectory(req);
  const memberships = getMembershipsForIdentity(identityId, directory);
  const guard = guardWorkspaceAccess({
    memberships,
    workspaceId,
    requireDashTool: true,
    requiredPermissions: ['canManageWorkspaceUsers'],
  });
  if (guard.response) {
    return guard.response;
  }

  const proposals = await listMemberMergeProposalsForWorkspace(workspaceId);
  return NextResponse.json({ proposals });
}

export async function POST(req: NextRequest) {
  const { identityId, identity } = resolveDashboardIdentityForApiRequest(req, 'optional');
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return invalid('workspaceId is required.');
  }

  let body: Record<string, unknown>;
  try {
    const raw = (await req.json()) as unknown;
    const parsed = parseBody(raw);
    if (!parsed) {
      return invalid('Invalid JSON body.');
    }
    body = parsed;
  } catch {
    return invalid('Invalid JSON body.');
  }

  const action = typeof body.action === 'string' ? body.action : '';
  if (action !== 'scan') {
    return invalid('Unsupported action. Use scan.');
  }

  const approvalModeRaw = body.approvalMode;
  if (typeof approvalModeRaw !== 'string' || !approvalModes.includes(approvalModeRaw as MemberMergeApprovalMode)) {
    return invalid('approvalMode must be assigned_user or first_authorized_responder.');
  }
  const approvalMode = approvalModeRaw as MemberMergeApprovalMode;

  const assignedApproverIdentityId =
    typeof body.assignedApproverIdentityId === 'string' && isDashboardIdentityId(body.assignedApproverIdentityId)
      ? body.assignedApproverIdentityId
      : undefined;

  const authorizedApproverIdentityIds = Array.isArray(body.authorizedApproverIdentityIds)
    ? body.authorizedApproverIdentityIds.filter(
        (id): id is string => typeof id === 'string' && isDashboardIdentityId(id),
      )
    : undefined;

  const authorizedRoles = Array.isArray(body.authorizedRoles)
    ? body.authorizedRoles.filter(
        (r): r is WorkspaceRole =>
          typeof r === 'string' && (workspaceRoleValues as readonly string[]).includes(r),
      )
    : undefined;

  if (approvalMode === 'assigned_user' && !assignedApproverIdentityId) {
    return invalid('assignedApproverIdentityId is required when approvalMode is assigned_user.');
  }

  if (approvalMode === 'first_authorized_responder') {
    const hasGroup =
      (authorizedApproverIdentityIds?.length ?? 0) > 0 || (authorizedRoles?.length ?? 0) > 0;
    if (!hasGroup) {
      return invalid(
        'For first_authorized_responder, pass authorizedRoles and/or authorizedApproverIdentityIds.',
      );
    }
  }

  const directory = readWorkspaceDirectory(req);
  const memberships = getMembershipsForIdentity(identityId, directory);
  const guard = guardWorkspaceAccess({
    memberships,
    workspaceId,
    requireDashTool: true,
    requiredPermissions: ['canManageWorkspaceUsers'],
  });
  if (guard.response) {
    return guard.response;
  }

  const activeRole = guard.result.membership.role;

  const roster = await getAdminWorkspaceRosterForScan({
    workspaceId,
    directory,
    identity,
    identityId,
    activeRole,
  });

  const forDetection = membersForDetectionFromSeedMembers(roster);
  const candidates = detectMemberDuplicates(forDetection);

  const created = await createMemberMergeProposalsFromScan({
    workspaceId,
    candidates,
    approvalMode,
    assignedApproverIdentityId,
    authorizedApproverIdentityIds,
    authorizedRoles,
  });

  return NextResponse.json({
    scanned: candidates.length,
    proposalsCreated: created.length,
    proposals: await listMemberMergeProposalsForWorkspace(workspaceId),
  });
}
