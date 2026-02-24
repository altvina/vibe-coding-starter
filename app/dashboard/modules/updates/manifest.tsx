import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';
import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';

function UpdatesWidget({ data }: { data: DashboardApiResponse }) {
  const latest = data.workspace.updates[0];
  const author =
    latest ? data.workspace.members.find((m) => m.id === latest.authorId)?.displayName : null;

  return (
    <DashboardCard title="Updates">
      {latest ? (
        <div className="space-y-2">
          <div className={cn('text-xs', dashboardTokens.textSubtle)}>
            Latest from {author ?? '—'}
          </div>
          <div className="line-clamp-3 text-sm">{latest.body}</div>
          <div className={cn('text-xs', dashboardTokens.textSubtle)}>
            {latest.comments.length} comments
          </div>
        </div>
      ) : (
        <div className={cn('text-sm', dashboardTokens.textMuted)}>
          No updates yet for this workspace.
        </div>
      )}
    </DashboardCard>
  );
}

export const updatesModule: DashboardModuleDefinition = {
  id: 'updates',
  label: 'Updates',
  href: '/dashboard/updates',
  allowedRoles: ['client', 'expert', 'staff_admin', 'super_admin'],
  navOrder: 30,
  widgets: [
    {
      id: 'updates.latest',
      moduleId: 'updates',
      title: 'Updates',
      href: '/dashboard/updates',
      allowedRoles: ['client', 'expert', 'staff_admin', 'super_admin'],
      defaultSize: 'lg',
      render: ({ data }) => <UpdatesWidget data={data} />,
    },
  ],
};

