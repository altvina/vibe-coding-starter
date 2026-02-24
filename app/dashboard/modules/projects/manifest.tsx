import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';
import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';

function ProjectsWidget({ data }: { data: DashboardApiResponse }) {
  const rows = data.manageProjects.rows.slice(0, 3);
  return (
    <DashboardCard title={data.manageProjects.title}>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {r.task.title}
              </div>
              <div className={cn('truncate text-xs', dashboardTokens.textSubtle)}>
                {r.client.name} • {r.dueOn}
              </div>
            </div>
            <div
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
                r.status === 'onReview'
                  ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-200'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
              )}
            >
              {r.status === 'onReview' ? 'On Review' : 'On Progress'}
            </div>
          </div>
        ))}
        {!rows.length ? (
          <div className={cn('text-sm', dashboardTokens.textMuted)}>
            No projects yet.
          </div>
        ) : null}
      </div>
    </DashboardCard>
  );
}

export const projectsModule: DashboardModuleDefinition = {
  id: 'projects',
  label: 'Projects',
  href: '/dashboard/projects',
  allowedRoles: ['client', 'expert', 'staff_admin', 'super_admin'],
  navOrder: 30,
  widgets: [
    {
      id: 'projects.summary',
      moduleId: 'projects',
      title: 'Projects',
      href: '/dashboard/projects',
      allowedRoles: ['client', 'expert', 'staff_admin', 'super_admin'],
      defaultSize: 'lg',
      render: ({ data }) => <ProjectsWidget data={data} />,
    },
  ],
};

