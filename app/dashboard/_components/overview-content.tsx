'use client';

import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { ActionRequiredWidget } from '@/app/dashboard/_components/widgets/action-required-widget';
import { InboxBridgeWidget } from '@/app/dashboard/_components/widgets/inbox-bridge-widget';
import { WorkSnapshotWidget } from '@/app/dashboard/_components/widgets/work-snapshot-widget';
import { WorkspaceSummaryWidget } from '@/app/dashboard/_components/widgets/workspace-summary-widget';

export function OverviewContent() {
  const { data } = useDashboardData();

  if (!data) {
    return null;
  }
  const activeWorkspaceName =
    data.workspaces.find((workspace) => workspace.id === data.activeWorkspaceId)?.name;

  return (
    <div className="space-y-6">
      <ActionRequiredWidget requests={data.actionRequests} activeWorkspaceName={activeWorkspaceName} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <WorkSnapshotWidget data={data} />
          <InboxBridgeWidget data={data} />
        </div>

        <div className="xl:col-span-4">
          <WorkspaceSummaryWidget data={data} />
        </div>
      </div>
    </div>
  );
}

