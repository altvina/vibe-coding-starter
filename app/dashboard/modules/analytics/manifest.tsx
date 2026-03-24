import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';

export const analyticsModule: DashboardModuleDefinition = {
  id: 'analytics',
  label: 'Analytics',
  href: '/dashboard/analytics',
  allowedRoles: ['client', 'expert', 'staff_admin', 'super_admin'],
  navOrder: 40,
  widgets: [],
};

