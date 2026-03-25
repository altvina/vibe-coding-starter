import type {
  WorkspaceMembership,
  WorkspacePermissionKey,
  WorkspacePermissions,
  WorkspaceRole,
  WorkspaceToolAccess,
} from '@/lib/auth/workspace-types';

export type AccessFailureReason =
  | 'missing_membership'
  | 'inactive_membership'
  | 'tool_denied'
  | 'permission_denied'
  | 'role_denied';

const roleRank: Record<WorkspaceRole, number> = {
  viewer: 0,
  client: 1,
  contractor: 2,
  internal: 3,
  admin: 4,
};

const baseToolAccessByRole: Record<WorkspaceRole, WorkspaceToolAccess> = {
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

const basePermissionsByRole: Record<WorkspaceRole, WorkspacePermissions> = {
  admin: {
    canSeeClientIdentity: true,
    canSeeExpertIdentity: true,
    canSeeInternalNotes: true,
    canAccessClientsSection: true,
    canViewAllProjects: true,
    canEditProjectStatus: true,
    canViewMemberDirectory: true,
    canViewMemberDetails: true,
    canViewContactInfo: true,
    canPostUpdates: true,
    canCommentOnUpdates: true,
    canEditTasks: true,
    canToggleSubtasks: true,
    canAccessDash: true,
    canAccessPlane: true,
    canAccessMattermost: true,
    canCreateTasks: true,
    canManageWorkspaceUsers: true,
  },
  internal: {
    canSeeClientIdentity: true,
    canSeeExpertIdentity: true,
    canSeeInternalNotes: true,
    canAccessClientsSection: true,
    canViewAllProjects: true,
    canEditProjectStatus: true,
    canViewMemberDirectory: true,
    canViewMemberDetails: true,
    canViewContactInfo: true,
    canPostUpdates: true,
    canCommentOnUpdates: true,
    canEditTasks: true,
    canToggleSubtasks: true,
    canAccessDash: true,
    canAccessPlane: true,
    canAccessMattermost: true,
    canCreateTasks: true,
    canManageWorkspaceUsers: true,
  },
  contractor: {
    canSeeClientIdentity: false,
    canSeeExpertIdentity: true,
    canSeeInternalNotes: false,
    canAccessClientsSection: false,
    canViewAllProjects: false,
    canEditProjectStatus: true,
    canViewMemberDirectory: true,
    canViewMemberDetails: true,
    canViewContactInfo: false,
    canPostUpdates: true,
    canCommentOnUpdates: true,
    canEditTasks: true,
    canToggleSubtasks: true,
    canAccessDash: true,
    canAccessPlane: true,
    canAccessMattermost: true,
    canCreateTasks: true,
    canManageWorkspaceUsers: false,
  },
  client: {
    canSeeClientIdentity: true,
    canSeeExpertIdentity: false,
    canSeeInternalNotes: false,
    canAccessClientsSection: false,
    canViewAllProjects: false,
    canEditProjectStatus: false,
    canViewMemberDirectory: true,
    canViewMemberDetails: true,
    canViewContactInfo: false,
    canPostUpdates: true,
    canCommentOnUpdates: true,
    canEditTasks: false,
    canToggleSubtasks: false,
    canAccessDash: true,
    canAccessPlane: false,
    canAccessMattermost: false,
    canCreateTasks: false,
    canManageWorkspaceUsers: false,
  },
  viewer: {
    canSeeClientIdentity: false,
    canSeeExpertIdentity: false,
    canSeeInternalNotes: false,
    canAccessClientsSection: false,
    canViewAllProjects: false,
    canEditProjectStatus: false,
    canViewMemberDirectory: true,
    canViewMemberDetails: true,
    canViewContactInfo: false,
    canPostUpdates: false,
    canCommentOnUpdates: true,
    canEditTasks: false,
    canToggleSubtasks: false,
    canAccessDash: true,
    canAccessPlane: false,
    canAccessMattermost: false,
    canCreateTasks: false,
    canManageWorkspaceUsers: false,
  },
};

function mergeToolAccess(
  role: WorkspaceRole,
  overrides: Partial<WorkspaceToolAccess> | undefined,
): WorkspaceToolAccess {
  return {
    ...baseToolAccessByRole[role],
    ...(overrides ?? {}),
  };
}

export function permissionsForMembership(
  membership: WorkspaceMembership,
): WorkspacePermissions {
  const mergedTools = mergeToolAccess(membership.role, membership.toolAccess);
  return {
    ...basePermissionsByRole[membership.role],
    canAccessDash: mergedTools.canAccessDash,
    canAccessPlane: mergedTools.canAccessPlane,
    canAccessMattermost: mergedTools.canAccessMattermost,
    canPostUpdates: mergedTools.canPostUpdates,
    canCreateTasks: mergedTools.canCreateTasks,
    canManageWorkspaceUsers: mergedTools.canManageWorkspaceUsers,
    ...(membership.permissionsOverride ?? {}),
  };
}

export function getActiveWorkspaceMembership(
  memberships: WorkspaceMembership[],
  workspaceId: string,
): WorkspaceMembership | null {
  return memberships.find((membership) => membership.workspaceId === workspaceId) ?? null;
}

export function isMembershipActive(membership: WorkspaceMembership | null): boolean {
  return membership?.status === 'active';
}

export function hasWorkspaceRole(
  memberships: WorkspaceMembership[],
  workspaceId: string,
  allowedRoles: WorkspaceRole[],
): boolean {
  const membership = getActiveWorkspaceMembership(memberships, workspaceId);
  if (!membership || membership.status !== 'active') {
    return false;
  }
  return allowedRoles.some((role) => roleRank[membership.role] >= roleRank[role]);
}

export function hasWorkspacePermission(
  memberships: WorkspaceMembership[],
  workspaceId: string,
  permissionKey: WorkspacePermissionKey,
): boolean {
  const membership = getActiveWorkspaceMembership(memberships, workspaceId);
  if (!membership || membership.status !== 'active') {
    return false;
  }
  return permissionsForMembership(membership)[permissionKey];
}

export function requireWorkspaceAccess(args: {
  memberships: WorkspaceMembership[];
  workspaceId: string;
  requiredRoles?: WorkspaceRole[];
  requiredPermissions?: WorkspacePermissionKey[];
  requireDashTool?: boolean;
}):
  | { ok: true; membership: WorkspaceMembership; permissions: WorkspacePermissions }
  | { ok: false; reason: AccessFailureReason } {
  const membership = getActiveWorkspaceMembership(args.memberships, args.workspaceId);
  if (!membership) {
    return { ok: false, reason: 'missing_membership' };
  }
  if (membership.status !== 'active') {
    return { ok: false, reason: 'inactive_membership' };
  }

  const permissions = permissionsForMembership(membership);
  if (args.requireDashTool && !permissions.canAccessDash) {
    return { ok: false, reason: 'tool_denied' };
  }

  if (
    args.requiredRoles?.length &&
    !args.requiredRoles.some((role) => roleRank[membership.role] >= roleRank[role])
  ) {
    return { ok: false, reason: 'role_denied' };
  }

  if (
    args.requiredPermissions?.length &&
    !args.requiredPermissions.every((permission) => permissions[permission])
  ) {
    return { ok: false, reason: 'permission_denied' };
  }

  return { ok: true, membership, permissions };
}

