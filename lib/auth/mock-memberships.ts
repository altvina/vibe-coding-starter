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
    { workspaceId: 'ws-superadmin', role: 'admin', status: 'active', toolAccess: defaultToolAccessByRole.admin },
    { workspaceId: 'ws-acme', role: 'admin', status: 'active', toolAccess: defaultToolAccessByRole.admin },
    { workspaceId: 'ws-horizon', role: 'admin', status: 'active', toolAccess: defaultToolAccessByRole.admin },
    { workspaceId: 'ws-vertex', role: 'admin', status: 'active', toolAccess: defaultToolAccessByRole.admin },
  ],
  'u-internal': [
    {
      workspaceId: 'ws-acme',
      role: 'internal',
      status: 'active',
      toolAccess: defaultToolAccessByRole.internal,
      memberIdByAudience: { staff: 'm-staff-1' },
    },
    {
      workspaceId: 'ws-horizon',
      role: 'internal',
      status: 'active',
      toolAccess: defaultToolAccessByRole.internal,
      memberIdByAudience: { staff: 'm-staff-1' },
    },
    {
      workspaceId: 'ws-vertex',
      role: 'internal',
      status: 'invited',
      toolAccess: defaultToolAccessByRole.internal,
      memberIdByAudience: { staff: 'm-staff-2' },
    },
  ],
  'u-contractor': [
    {
      workspaceId: 'ws-acme',
      role: 'contractor',
      status: 'active',
      toolAccess: defaultToolAccessByRole.contractor,
      memberIdByAudience: { expert: 'm-expert-1' },
    },
    {
      workspaceId: 'ws-vertex',
      role: 'contractor',
      status: 'active',
      toolAccess: {
        ...defaultToolAccessByRole.contractor,
        canManageWorkspaceUsers: false,
      },
      memberIdByAudience: { expert: 'm-expert-1' },
    },
    {
      workspaceId: 'ws-horizon',
      role: 'contractor',
      status: 'removed',
      toolAccess: defaultToolAccessByRole.contractor,
      memberIdByAudience: { expert: 'm-expert-2' },
    },
  ],
  'u-client': [
    {
      workspaceId: 'ws-acme',
      role: 'client',
      status: 'active',
      toolAccess: defaultToolAccessByRole.client,
      memberIdByAudience: { client: 'm-client-1' },
    },
  ],
  'u-viewer': [
    {
      workspaceId: 'ws-acme',
      role: 'viewer',
      status: 'active',
      toolAccess: defaultToolAccessByRole.viewer,
      memberIdByAudience: { client: 'm-client-2' },
    },
    {
      workspaceId: 'ws-horizon',
      role: 'viewer',
      status: 'suspended',
      toolAccess: defaultToolAccessByRole.viewer,
      memberIdByAudience: { client: 'm-client-3' },
    },
  ],
};

function appendCustomWorkspaceSeedsForAdmin(
  identityId: string,
  baseSeeds: MembershipSeed[],
  directory: WorkspaceDirectoryV1 | null,
): MembershipSeed[] {
  if (!directory?.customWorkspaces?.length || identityId !== 'u-admin') {
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
  return appendCustomWorkspaceSeedsForAdmin(identityId, base, directory);
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
