import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';
import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';

function SuperAdminWidget({ data }: { data: DashboardApiResponse }) {
  const superAdmins = data.workspace.members.filter(
    (m) =>
      m.role === 'staff' &&
      ((m.title ?? '').toLowerCase().includes('super admin') ||
        (m.title ?? '').toLowerCase().includes('owner')),
  );

  return (
    <DashboardCard title="Super Admin">
      <div className={cn('text-sm', dashboardTokens.textMuted)}>
        {`Super Admin access active • ${superAdmins.length} super admin user${superAdmins.length === 1 ? '' : 's'}`}
      </div>
    </DashboardCard>
  );
}

export const superAdminModule: DashboardModuleDefinition = {
  id: 'superAdmin',
  label: 'Super Admin',
  href: '/dashboard/super-admin',
  allowedRoles: ['admin'],
  navOrder: 95,
  widgets: [
    {
      id: 'superAdmin.summary',
      moduleId: 'superAdmin',
      title: 'Super Admin',
      href: '/dashboard/super-admin',
      allowedRoles: ['admin'],
      defaultSize: 'md',
      render: ({ data }) => <SuperAdminWidget data={data} />,
    },
  ],
};

