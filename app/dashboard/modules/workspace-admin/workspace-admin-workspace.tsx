'use client';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { useDashboardWorkspace } from '@/app/dashboard/dashboard-workspace-context';
import { WorkspaceAdminShell } from '@/app/dashboard/modules/workspace-admin/workspace-admin-shell';
import { cn } from '@/lib/utils';

export function WorkspaceAdminModulePage({ workspaceId: workspaceIdProp }: { workspaceId?: string }) {
  const { data, refresh } = useDashboardData();
  const { activeWorkspaceId } = useDashboardWorkspace();
  const workspaceId = workspaceIdProp ?? activeWorkspaceId;

  if (!data) {
    return null;
  }

  if (data.role !== 'internal' && data.role !== 'admin') {
    return (
      <DashboardCard title="Workspace Admin">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          This module is only available for Altvina/Admin.
        </p>
      </DashboardCard>
    );
  }

  return (
    <WorkspaceAdminShell
      workspaceId={workspaceId}
      data={data}
      onRefresh={() => {
        void refresh();
      }}
    />
  );
}
