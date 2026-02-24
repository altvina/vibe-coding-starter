import type { DashboardRole } from '@/app/dashboard/dashboard-roles';

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

export function capabilitiesForRole(role: DashboardRole): DashboardCapabilities {
  if (role === 'client') {
    return {
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
    };
  }

  if (role === 'expert') {
    return {
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
    };
  }

  if (role === 'staff_admin') {
    return {
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
    };
  }

  return {
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
  };
}

