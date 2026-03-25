import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';

export const moduleAccessModule: DashboardModuleDefinition = {
  id: 'moduleAccess',
  label: 'Access',
  href: '/dashboard/module-access',
  allowedRoles: ['admin'],
  navOrder: 90,
  widgets: [],
};

