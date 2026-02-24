import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';
import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';

export const clientsModule: DashboardModuleDefinition = {
  id: 'clients',
  label: 'Clients',
  href: '/dashboard/clients',
  allowedRoles: ['staff_admin', 'super_admin'],
  navOrder: 20,
  widgets: [
    {
      id: 'clients.overview',
      moduleId: 'clients',
      title: 'Clients',
      href: '/dashboard/clients',
      allowedRoles: ['staff_admin', 'super_admin'],
      defaultSize: 'md',
      render: () => (
        <DashboardCard title="Clients">
          <div className={cn('text-sm', dashboardTokens.textMuted)}>
            Staff-only view of client relationships.
          </div>
        </DashboardCard>
      ),
    },
  ],
};

