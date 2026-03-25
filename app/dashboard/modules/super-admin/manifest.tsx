import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';
import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';

const superAdminWorkspaceId = 'ws-superadmin' as const;

function SuperAdminWidget({ data }: { data: DashboardApiResponse }) {
  const superAdmins = data.workspace.members.filter(
    (m) => m.role === 'staff' && (m.title ?? '').toLowerCase().includes('super admin'),
  );

  return (
    <DashboardCard title="Super Admin">
      <div className={cn('text-sm', dashboardTokens.textMuted)}>
        {data.activeWorkspaceId === superAdminWorkspaceId
          ? `Super admin workspace • ${superAdmins.length} super admin user${superAdmins.length === 1 ? '' : 's'}`
          : 'Switch to the Super Admin workspace to manage platform access.'}
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

