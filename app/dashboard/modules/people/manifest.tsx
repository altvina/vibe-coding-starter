import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';
import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';
import { directoryMemberRoleCountLabel } from '@/app/dashboard/workspace-role-labels';

function PeopleWidget({ data }: { data: DashboardApiResponse }) {
  const total = data.workspace.members.length;
  const clients = data.workspace.members.filter((m) => m.role === 'client').length;
  const experts = data.workspace.members.filter((m) => m.role === 'expert').length;
  const staff = data.workspace.members.filter((m) => m.role === 'staff').length;
  const workspaceClientLabel =
    data.workspaces.find((w) => w.id === data.activeWorkspaceId)?.clientLabel?.trim() ?? 'Client';

  return (
    <DashboardCard title="People">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-3xl font-extrabold tabular-nums">{total}</div>
        <div className={cn('text-xs', dashboardTokens.textSubtle)}>
          in this workspace
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          {
            label: directoryMemberRoleCountLabel('client', { workspaceClientLabel }),
            value: clients,
          },
          {
            label: directoryMemberRoleCountLabel('expert', { workspaceClientLabel }),
            value: experts,
          },
          {
            label: directoryMemberRoleCountLabel('staff', { workspaceClientLabel }),
            value: staff,
          },
        ].map((x) => (
          <div key={x.label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <div className="text-sm font-semibold tabular-nums">{x.value}</div>
            <div className={cn('text-xs', dashboardTokens.textSubtle)}>{x.label}</div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

export const peopleModule: DashboardModuleDefinition = {
  id: 'people',
  label: 'People',
  href: '/dashboard/people',
  allowedRoles: ['client', 'contractor', 'internal', 'admin'],
  navOrder: 25,
  widgets: [
    {
      id: 'people.summary',
      moduleId: 'people',
      title: 'People',
      href: '/dashboard/people',
      allowedRoles: ['client', 'contractor', 'internal', 'admin'],
      defaultSize: 'md',
      render: ({ data }) => <PeopleWidget data={data} />,
    },
  ],
};

