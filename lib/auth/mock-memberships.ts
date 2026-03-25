import type { WorkspaceDirectoryV1 } from '@/lib/dashboard/workspace-directory';

import type { WorkspaceMembership, WorkspaceRole } from '@/lib/auth/workspace-types';

export type MembershipSeed = {
  workspaceId: string;
  role: WorkspaceRole;
  status: WorkspaceMembership['status'];
  toolAccess: WorkspaceMembership['toolAccess'];
  memberIdByAudience?: Partial<Record<'client' | 'expert' | 'staff', string>>;
};

const defaultToolAccessByRole: Record<WorkspaceRole, WorkspaceMembership['toolAccess']> = {
  admin: {
    canAccessDash: true,
    canAccessPlane: true,
    canAccessMattermost: true,
    canPostUpdates: true,
    canCreateTasks: true,
    canManageWorkspaceUsers: true,
  },
  internal: {
    canAccessDash: true,
    canAccessPlane: true,
    canAccessMattermost: true,
    canPostUpdates: true,
    canCreateTasks: true,
    canManageWorkspaceUsers: true,
  },
  contractor: {
    canAccessDash: true,
    canAccessPlane: true,
    canAccessMattermost: true,
    canPostUpdates: true,
    canCreateTasks: true,
    canManageWorkspaceUsers: false,
  },
  client: {
    canAccessDash: true,
    canAccessPlane: false,
    canAccessMattermost: false,
    canPostUpdates: true,
    canCreateTasks: false,
    canManageWorkspaceUsers: false,
  },
  viewer: {
    canAccessDash: true,
    canAccessPlane: false,
    canAccessMattermost: false,
    canPostUpdates: false,
    canCreateTasks: false,
    canManageWorkspaceUsers: false,
  },
};

const identityMembershipSeeds: Record<string, MembershipSeed[]> = {
  'u-admin': [
    {
      workspaceId: 'ws-acme',
      role: 'admin',
      status: 'active',
      toolAccess: defaultToolAccessByRole.admin,
      memberIdByAudience: {
        staff: 'm-jay-newcombe',
      },
    },
  ],
};

function appendCustomWorkspaceSeedsForPrivilegedUsers(
  identityId: string,
  baseSeeds: MembershipSeed[],
  directory: WorkspaceDirectoryV1 | null,
): MembershipSeed[] {
  const isPrivilegedIdentity = identityId === 'u-admin';
  if (!directory?.customWorkspaces?.length || !isPrivilegedIdentity) {
    return baseSeeds;
  }
  const seen = new Set(baseSeeds.map((seed) => seed.workspaceId));
  const additions = directory.customWorkspaces
    .filter((workspace) => workspace.status === 'active')
    .filter((workspace) => !seen.has(workspace.id))
    .map(
      (workspace): MembershipSeed => ({
        workspaceId: workspace.id,
        role: 'admin',
        status: 'active',
        memberIdByAudience: {
          staff: `m-${workspace.id}-${identityId}`,
        },
        toolAccess: defaultToolAccessByRole.admin,
      }),
    );
  return [...baseSeeds, ...additions];
}

export function getMembershipSeedsForIdentity(
  identityId: string,
  directory: WorkspaceDirectoryV1 | null = null,
): MembershipSeed[] {
  const base = identityMembershipSeeds[identityId] ?? [];
  return appendCustomWorkspaceSeedsForPrivilegedUsers(identityId, base, directory);
}

export function getMembershipsForIdentity(
  identityId: string,
  directory: WorkspaceDirectoryV1 | null = null,
): WorkspaceMembership[] {
  const seeds = getMembershipSeedsForIdentity(identityId, directory);
  return seeds.map((seed) => ({
    id: `${identityId}:${seed.workspaceId}`,
    userId: identityId,
    workspaceId: seed.workspaceId,
    role: seed.role,
    status: seed.status,
    toolAccess: seed.toolAccess,
    joinedAt: '2026-01-01T00:00:00.000Z',
  }));
}
