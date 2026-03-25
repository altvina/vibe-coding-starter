import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';
import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';

function WorkspaceAdminWidget({ data }: { data: DashboardApiResponse }) {
  return (
    <DashboardCard title="Workspace Admin">
      <div className={cn('text-sm', dashboardTokens.textMuted)}>
        Curate membership visibility and masking rules per workspace.
      </div>
    </DashboardCard>
  );
}

export const workspaceAdminModule: DashboardModuleDefinition = {
  id: 'workspaceAdmin',
  label: 'Workspace Admin',
  href: '/dashboard/workspace-admin',
  allowedRoles: ['internal', 'admin'],
  navOrder: 90,
  widgets: [
    {
      id: 'workspaceAdmin.summary',
      moduleId: 'workspaceAdmin',
      title: 'Workspace Admin',
      href: '/dashboard/workspace-admin',
      allowedRoles: ['internal', 'admin'],
      defaultSize: 'md',
      render: ({ data }) => <WorkspaceAdminWidget data={data} />,
    },
  ],
};

