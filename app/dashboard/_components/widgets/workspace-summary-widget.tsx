'use client';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';
import { directoryMemberRoleCountLabel } from '@/app/dashboard/workspace-role-labels';

type SummaryMetric = {
  label: string;
  value: number;
};

export function WorkspaceSummaryWidget({ data }: { data: DashboardApiResponse }) {
  const clientsCount = data.workspace.members.filter((member) => member.role === 'client').length;
  const expertsCount = data.workspace.members.filter((member) => member.role === 'expert').length;
  const staffCount = data.workspace.members.filter((member) => member.role === 'staff').length;
  const activeProjectsCount = data.workspace.projects.filter(
    (project) => project.status === 'active' || project.status === 'review',
  ).length;
  const workspaceClientLabel =
    data.workspaces.find((w) => w.id === data.activeWorkspaceId)?.clientLabel?.trim() ?? 'Client';

  const metrics: SummaryMetric[] = [
    {
      label: directoryMemberRoleCountLabel('client', { workspaceClientLabel }),
      value: clientsCount,
    },
    { label: 'Active Projects', value: activeProjectsCount },
    {
      label: directoryMemberRoleCountLabel('expert', { workspaceClientLabel }),
      value: expertsCount,
    },
    {
      label: directoryMemberRoleCountLabel('staff', { workspaceClientLabel }),
      value: staffCount,
    },
  ];

  return (
    <DashboardCard title="Workspace Summary" className="opacity-95">
      <div className={cn('text-sm', dashboardTokens.textMuted)}>
        Current workspace shape at a glance.
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={cn(
              'rounded-xl border px-3 py-2',
              dashboardTokens.border,
              dashboardTokens.surfaceMuted,
            )}
          >
            <div className="text-lg font-bold tabular-nums">{metric.value}</div>
            <div className={cn('text-xs', dashboardTokens.textSubtle)}>{metric.label}</div>
          </div>
        ))}
      </div>
      <div className={cn('mt-3 text-[11px]', dashboardTokens.textSubtle)}>
        Future-ready for contracts, invoices, payments, and renewals.
      </div>
    </DashboardCard>
  );
}
