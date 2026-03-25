'use client';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { useDashboardWorkspace } from '@/app/dashboard/dashboard-workspace-context';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';

export function LaunchHubPage() {
  const { activeWorkspaceId } = useDashboardWorkspace();
  const { data } = useDashboardData();

  const workspaceName =
    data?.workspaces.find((workspace) => workspace.id === activeWorkspaceId)?.name ??
    'active workspace';

  return (
    <div className="space-y-4">
      <DashboardCard title="Apps">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          One place for <span className="font-semibold">{workspaceName}</span>—connected capabilities,
          requests, and data. Use <span className="font-semibold">Chat</span> and{' '}
          <span className="font-semibold">Projects</span> in the main navigation to open your
          workspace tools; they launch through your gateway so credentials and branding stay
          consistent.
        </p>
      </DashboardCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title="Workspace tools">
          <p className={cn('text-sm', dashboardTokens.textMuted)}>
            Sidebar shortcuts open the chat and project experiences configured for this workspace.
            Gateway URLs and path mappings are managed in the platform control center (administrators
            only)—end users never need separate vendor logins from here.
          </p>
        </DashboardCard>

        <DashboardCard title="Available Apps">
          <div className="space-y-2">
            {['CRM Connector', 'Calendar Sync', 'File Storage Bridge'].map((app) => (
              <div
                key={app}
                className={cn(
                  'flex items-center justify-between rounded-xl border px-3 py-2',
                  dashboardTokens.border,
                  dashboardTokens.surfaceMuted,
                )}
              >
                <span className="text-sm font-medium">{app}</span>
                <Button type="button" variant="outline" size="sm" className="rounded-full">
                  Request access
                </Button>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title="Automations">
          <p className={cn('mb-3 text-sm', dashboardTokens.textMuted)}>
            Trigger workspace workflows from app events.
          </p>
          <div className="space-y-2">
            {['Inbox triage to project task', 'Client intake to workspace update'].map((item) => (
              <div
                key={item}
                className={cn(
                  'rounded-xl border px-3 py-2 text-sm',
                  dashboardTokens.border,
                  dashboardTokens.surfaceMuted,
                )}
              >
                {item}
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Data Sources">
          <p className={cn('mb-3 text-sm', dashboardTokens.textMuted)}>
            Keep reports and workflows in sync with source systems.
          </p>
          <div className="space-y-2">
            {['Project data', 'People directory', 'Inbox activity'].map((source) => (
              <div
                key={source}
                className={cn(
                  'rounded-xl border px-3 py-2 text-sm',
                  dashboardTokens.border,
                  dashboardTokens.surfaceMuted,
                )}
              >
                {source}
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
