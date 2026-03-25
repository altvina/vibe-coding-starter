import type {
  WorkspaceAudience,
  WorkspaceAudienceOverrides,
  WorkspaceDisplayMode,
  WorkspaceMemberOverrides,
} from '@/app/dashboard/modules/workspace-admin/workspace-config';

export function normalizedDisplayMode(
  override: WorkspaceAudienceOverrides | undefined,
): WorkspaceDisplayMode {
  if (override?.displayMode) {
    return override.displayMode;
  }
  if (override?.visible === false) {
    return 'hidden';
  }
  return 'full';
}

export function visibilityLabelForMode(mode: WorkspaceDisplayMode) {
  if (mode === 'hidden') {
    return 'Hidden';
  }
  if (mode === 'masked') {
    return 'Masked identity';
  }
  return 'Full identity';
}

export function visibilitySummaryLabel(
  memberOverrides: WorkspaceMemberOverrides | undefined,
): string {
  if (!memberOverrides) {
    return 'Visible to all';
  }
  const c = normalizedDisplayMode(memberOverrides.client);
  const e = normalizedDisplayMode(memberOverrides.expert);
  const s = normalizedDisplayMode(memberOverrides.staff);

  if (c === 'full' && e === 'full' && s === 'full') {
    return 'Visible to all';
  }
  if (c === 'masked' && e === 'full' && s === 'full') {
    return 'Clients masked';
  }
  if (c === 'hidden' && e === 'full' && s === 'full') {
    return 'Hidden from clients';
  }
  if (e === 'hidden' && c === 'full' && s === 'full') {
    return 'Experts only';
  }
  if (s === 'hidden' && c === 'full' && e === 'full') {
    return 'Staff hidden';
  }
  if (c === 'hidden' && e === 'hidden' && s === 'full') {
    return 'Internal only';
  }
  return 'Mixed visibility';
}

export const workspaceAudiences: WorkspaceAudience[] = ['client', 'expert', 'staff'];
