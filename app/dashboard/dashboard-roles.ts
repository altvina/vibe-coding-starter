export const dashboardRoleStorageKey = 'altvina.dashboard.role' as const;

export const dashboardRoles = [
  { id: 'client', label: 'Client' },
  { id: 'expert', label: 'Expert' },
  { id: 'staff_admin', label: 'Staff/Admin' },
  { id: 'super_admin', label: 'Super Admin' },
] as const;

export type DashboardRole = (typeof dashboardRoles)[number]['id'];

export const defaultDashboardRole: DashboardRole = 'staff_admin';

export function isDashboardRole(value: unknown): value is DashboardRole {
  return (
    typeof value === 'string' &&
    (value === 'client' ||
      value === 'expert' ||
      value === 'staff_admin' ||
      value === 'super_admin')
  );
}

export function getDashboardRoleLabel(role: DashboardRole) {
  return dashboardRoles.find((r) => r.id === role)?.label ?? 'Unknown';
}

