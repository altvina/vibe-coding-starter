import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';

export const allWorkspacesModule: DashboardModuleDefinition = {
  id: 'allWorkspaces',
  label: 'Workspaces',
  href: '/dashboard/workspaces',
  allowedRoles: ['internal', 'admin'],
  navOrder: 85,
  widgets: [],
};
