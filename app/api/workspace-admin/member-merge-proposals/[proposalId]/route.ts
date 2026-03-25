import { NextResponse, type NextRequest } from 'next/server';

import { defaultDashboardIdentityId, isDashboardIdentityId } from '@/app/dashboard/dashboard-identities';
import {
  readWorkspaceDirectoryFromCookieValue,
  WORKSPACE_DIRECTORY_COOKIE_KEY,
} from '@/lib/dashboard/workspace-directory';
import { guardWorkspaceAccess } from '@/lib/auth/require-workspace-access';
import { getMembershipsForIdentity } from '@/lib/auth/mock-memberships';
import {
  cancelMemberMergeProposal,
  getMemberMergeProposal,
  recordMemberMergeDecision,
} from '@/lib/server/member-merge-proposals-store';

function invalid(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function readWorkspaceDirectory(req: NextRequest) {
  return readWorkspaceDirectoryFromCookieValue(
    req.cookies.get(WORKSPACE_DIRECTORY_COOKIE_KEY)?.value,
  );
}

type RouteParams = { params: Promise<{ proposalId: string }> };

export async function POST(req: NextRequest, ctx: RouteParams) {
  const { proposalId } = await ctx.params;
  const identityIdRaw = req.nextUrl.searchParams.get('identityId');
  const identityId = isDashboardIdentityId(identityIdRaw) ? identityIdRaw : defaultDashboardIdentityId;

  let body: { action?: string };
  try {
    body = (await req.json()) as { action?: string };
  } catch {
    return invalid('Invalid JSON body.');
  }

  const action = body.action;
  if (action !== 'approve' && action !== 'reject') {
    return invalid('action must be approve or reject.');
  }

  const proposal = getMemberMergeProposal(proposalId);
  if (!proposal) {
    return invalid('Proposal not found.', 404);
  }

  const directory = readWorkspaceDirectory(req);
  const memberships = getMembershipsForIdentity(identityId, directory);
  const guard = guardWorkspaceAccess({
    memberships,
    workspaceId: proposal.workspaceId,
    requireDashTool: true,
    requiredPermissions: ['canManageWorkspaceUsers'],
  });
  if (guard.response) {
    return guard.response;
  }

  const result =
    action === 'approve'
      ? recordMemberMergeDecision({
          proposalId,
          identityId,
          memberships,
          action: 'approve',
        })
      : recordMemberMergeDecision({
          proposalId,
          identityId,
          memberships,
          action: 'reject',
        });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 403 });
  }

  return NextResponse.json({ proposal: result.proposal });
}

export async function DELETE(req: NextRequest, ctx: RouteParams) {
  const { proposalId } = await ctx.params;
  const identityIdRaw = req.nextUrl.searchParams.get('identityId');
  const identityId = isDashboardIdentityId(identityIdRaw) ? identityIdRaw : defaultDashboardIdentityId;

  const proposal = getMemberMergeProposal(proposalId);
  if (!proposal) {
    return invalid('Proposal not found.', 404);
  }

  const directory = readWorkspaceDirectory(req);
  const memberships = getMembershipsForIdentity(identityId, directory);
  const guard = guardWorkspaceAccess({
    memberships,
    workspaceId: proposal.workspaceId,
    requireDashTool: true,
    requiredPermissions: ['canManageWorkspaceUsers'],
  });
  if (guard.response) {
    return guard.response;
  }

  const result = cancelMemberMergeProposal(proposalId);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ proposal: result.proposal });
}
