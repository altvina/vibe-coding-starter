import type { WorkspaceRole } from '@/lib/auth/workspace-types';

const DEFAULT_CLIENT_LABEL = 'Client';

export function membershipRoleDisplayLabel(
  role: WorkspaceRole | undefined,
  options?: { workspaceClientLabel?: string },
): string {
  if (!role) {
    return 'Unknown';
  }
  const workspaceClientLabel =
    options?.workspaceClientLabel?.trim() || DEFAULT_CLIENT_LABEL;
  switch (role) {
    case 'client':
      return workspaceClientLabel;
    case 'contractor':
      return 'Expert';
    case 'internal':
    case 'admin':
      return 'Altvina';
    case 'viewer':
      return 'Viewer';
    default:
      return role;
  }
}

/** `workspace.members[].role` personas */
export function directoryMemberRoleSingularLabel(
  role: 'client' | 'expert' | 'staff',
  options?: { workspaceClientLabel?: string },
): string {
  const workspaceClientLabel =
    options?.workspaceClientLabel?.trim() || DEFAULT_CLIENT_LABEL;
  switch (role) {
    case 'client':
      return workspaceClientLabel;
    case 'expert':
      return 'Expert';
    case 'staff':
      return 'Altvina';
    default:
      return role;
  }
}

/** Count / summary chips (e.g. People widget) */
export function directoryMemberRoleCountLabel(
  role: 'client' | 'expert' | 'staff',
  options?: { workspaceClientLabel?: string },
): string {
  const workspaceClientLabel =
    options?.workspaceClientLabel?.trim() || DEFAULT_CLIENT_LABEL;
  switch (role) {
    case 'client':
      return workspaceClientLabel;
    case 'expert':
      return 'Experts';
    case 'staff':
      return 'Altvina';
    default:
      return role;
  }
}

/** Stored project engagement values use fixed strings; map for display */
export function engagementRoleDisplayLabel(
  engagementRole: string,
  options?: { workspaceClientLabel?: string },
): string {
  const workspaceClientLabel =
    options?.workspaceClientLabel?.trim() || DEFAULT_CLIENT_LABEL;
  if (engagementRole === 'Client') {
    return workspaceClientLabel;
  }
  if (engagementRole === 'Staff') {
    return 'Altvina';
  }
  return engagementRole;
}
