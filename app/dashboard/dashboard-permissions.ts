import { permissionsForMembership } from '@/lib/auth/workspace-rbac';
import type { WorkspaceMembership, WorkspaceRole } from '@/lib/auth/workspace-types';

export type DashboardCapabilities = {
  canSeeClientIdentity: boolean;
  canSeeExpertIdentity: boolean;
  canSeeInternalNotes: boolean;
  canAccessClientsSection: boolean;
  canViewAllProjects: boolean;
  canEditProjectStatus: boolean;
  canViewMemberDirectory: boolean;
  canViewMemberDetails: boolean;
  canViewContactInfo: boolean;
  canPostUpdates: boolean;
  canCommentOnUpdates: boolean;
  canEditTasks: boolean;
  canToggleSubtasks: boolean;
};

const fallbackByRole: Record<WorkspaceRole, DashboardCapabilities> = {
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
  },
};

export function capabilitiesForMembership(membership: WorkspaceMembership): DashboardCapabilities {
  const permissions = permissionsForMembership(membership);
  return {
    canSeeClientIdentity: permissions.canSeeClientIdentity,
    canSeeExpertIdentity: permissions.canSeeExpertIdentity,
    canSeeInternalNotes: permissions.canSeeInternalNotes,
    canAccessClientsSection: permissions.canAccessClientsSection,
    canViewAllProjects: permissions.canViewAllProjects,
    canEditProjectStatus: permissions.canEditProjectStatus,
    canViewMemberDirectory: permissions.canViewMemberDirectory,
    canViewMemberDetails: permissions.canViewMemberDetails,
    canViewContactInfo: permissions.canViewContactInfo,
    canPostUpdates: permissions.canPostUpdates,
    canCommentOnUpdates: permissions.canCommentOnUpdates,
    canEditTasks: permissions.canEditTasks,
    canToggleSubtasks: permissions.canToggleSubtasks,
  };
}

export function capabilitiesForRole(role: WorkspaceRole): DashboardCapabilities {
  return fallbackByRole[role];
}

