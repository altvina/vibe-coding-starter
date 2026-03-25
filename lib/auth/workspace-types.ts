export const workspaceRoleValues = [
  'admin',
  'internal',
  'contractor',
  'client',
  'viewer',
] as const;

export type WorkspaceRole = (typeof workspaceRoleValues)[number];

export const workspaceMembershipStatusValues = [
  'active',
  'invited',
  'suspended',
  'removed',
] as const;

export type WorkspaceMembershipStatus = (typeof workspaceMembershipStatusValues)[number];

export type WorkspaceToolAccess = {
  canAccessDash: boolean;
  canAccessPlane: boolean;
  canAccessMattermost: boolean;
  canPostUpdates: boolean;
  canCreateTasks: boolean;
  canManageWorkspaceUsers: boolean;
};

export const workspacePermissionKeys = [
  'canSeeClientIdentity',
  'canSeeExpertIdentity',
  'canSeeInternalNotes',
  'canAccessClientsSection',
  'canViewAllProjects',
  'canEditProjectStatus',
  'canViewMemberDirectory',
  'canViewMemberDetails',
  'canViewContactInfo',
  'canPostUpdates',
  'canCommentOnUpdates',
  'canEditTasks',
  'canToggleSubtasks',
  'canAccessDash',
  'canAccessPlane',
  'canAccessMattermost',
  'canCreateTasks',
  'canManageWorkspaceUsers',
] as const;

export type WorkspacePermissionKey = (typeof workspacePermissionKeys)[number];

export type WorkspacePermissions = Record<WorkspacePermissionKey, boolean>;

export type WorkspaceMembership = {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  status: WorkspaceMembershipStatus;
  toolAccess: WorkspaceToolAccess;
  permissionsOverride?: Partial<WorkspacePermissions>;
  joinedAt: string;
};

export type DashboardIdentity = {
  id: string;
  name: string;
  email: string;
  initials: string;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  clientLabel: string;
  metadata?: Record<string, unknown>;
};

export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return typeof value === 'string' && workspaceRoleValues.includes(value as WorkspaceRole);
}

export function isWorkspaceMembershipStatus(
  value: unknown,
): value is WorkspaceMembershipStatus {
  return (
    typeof value === 'string' &&
    workspaceMembershipStatusValues.includes(value as WorkspaceMembershipStatus)
  );
}

