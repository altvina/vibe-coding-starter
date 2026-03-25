import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';

export const analyticsModule: DashboardModuleDefinition = {
  id: 'analytics',
  label: 'Analytics',
  href: '/dashboard/analytics',
  allowedRoles: ['client', 'contractor', 'internal', 'admin'],
  navOrder: 40,
  widgets: [],
};

