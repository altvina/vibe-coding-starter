'use client';

import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { ActionRequiredWidget } from '@/app/dashboard/_components/widgets/action-required-widget';

export function OverviewContent() {
  const { data } = useDashboardData();

  if (!data) {
    return null;
  }
  const activeWorkspaceName =
    data.workspaces.find((workspace) => workspace.id === data.activeWorkspaceId)?.name;

  return (
    <div className="space-y-4 sm:space-y-6">
      <ActionRequiredWidget requests={data.actionRequests} activeWorkspaceName={activeWorkspaceName} />
    </div>
  );
}

