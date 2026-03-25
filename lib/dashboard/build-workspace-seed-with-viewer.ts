import type { DashboardIdentitySeed } from '@/app/dashboard/dashboard-identities';
import type { WorkspaceSeed } from '@/lib/dashboard/workspace-seeds';
import type { WorkspaceRole } from '@/lib/auth/workspace-types';

/**
 * Mirrors dashboard API behavior: staff/admin viewers on custom workspaces get a roster row,
 * unless the same person is already represented by email (avoids duplicate cards).
 */
export function buildWorkspaceSeedWithViewer(args: {
  workspaceSeed: WorkspaceSeed;
  identity: DashboardIdentitySeed;
  identityId: string;
  activeWorkspaceId: string;
  activeRole: WorkspaceRole;
  hasCustomWorkspaceEntry: boolean;
  staffMemberIdOverride?: string;
}): WorkspaceSeed {
  if (
    !args.hasCustomWorkspaceEntry ||
    (args.activeRole !== 'admin' && args.activeRole !== 'internal')
  ) {
    return args.workspaceSeed;
  }

  const identityEmail = args.identity.email.trim().toLowerCase();
  const sameEmailMember = args.workspaceSeed.members.find(
    (m) => m.email?.trim().toLowerCase() === identityEmail,
  );

  const customViewerMemberId =
    args.staffMemberIdOverride ??
    sameEmailMember?.id ??
    `m-${args.activeWorkspaceId}-${args.identityId}`;

  if (args.workspaceSeed.members.some((member) => member.id === customViewerMemberId)) {
    return args.workspaceSeed;
  }

  return {
    ...args.workspaceSeed,
    members: [
      ...args.workspaceSeed.members,
      {
        id: customViewerMemberId,
        displayName: args.identity.name,
        username:
          args.identity.email.split('@')[0]?.replace(/[^a-z0-9._-]/gi, '.') ?? args.identityId,
        role: 'staff' as const,
        title: args.activeRole === 'admin' ? 'Workspace admin' : 'Altvina team',
        email: args.identity.email,
      },
    ],
  };
}
