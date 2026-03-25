import { NextResponse, type NextRequest } from 'next/server';

import { resolveDashboardIdentityForApiRequest } from '@/lib/auth/dashboard-request-identity';
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
  const { identityId } = resolveDashboardIdentityForApiRequest(req, 'optional');

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

  const proposal = await getMemberMergeProposal(proposalId);
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
      ? await recordMemberMergeDecision({
          proposalId,
          identityId,
          memberships,
          action: 'approve',
        })
      : await recordMemberMergeDecision({
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
  const { identityId } = resolveDashboardIdentityForApiRequest(req, 'optional');

  const proposal = await getMemberMergeProposal(proposalId);
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

  const result = await cancelMemberMergeProposal(proposalId);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ proposal: result.proposal });
}
