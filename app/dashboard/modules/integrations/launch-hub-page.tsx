'use client';

import { ExternalLink } from 'lucide-react';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { useDashboardWorkspace } from '@/app/dashboard/dashboard-workspace-context';
import {
  integrationToolConfigs,
  permissionKeyForTool,
  resolveWorkspaceLaunch,
  type IntegrationToolId,
} from '@/app/dashboard/modules/integrations/integrations-stub';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';

const launchOrder: IntegrationToolId[] = ['chat', 'projects'];

export function LaunchHubPage() {
  const { activeWorkspaceId } = useDashboardWorkspace();
  const { data } = useDashboardData();

  const workspaceName =
    data?.workspaces.find((workspace) => workspace.id === activeWorkspaceId)?.name ??
    'active workspace';
  const visibleToolIds = launchOrder.filter(
    (toolId) => data?.permissions[permissionKeyForTool(toolId)] ?? false,
  );

  return (
    <div className="space-y-4">
      <DashboardCard title="Apps">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          Manage connected apps, available apps, automations, and data sources for{' '}
          <span className="font-semibold">{workspaceName}</span>.
        </p>
      </DashboardCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard title="Connected Apps">
          <div className="space-y-2">
            {visibleToolIds.length ? (
              visibleToolIds.map((toolId) => {
                const tool = integrationToolConfigs[toolId];
                const launch = resolveWorkspaceLaunch(toolId, activeWorkspaceId);
                return (
                  <div
                    key={toolId}
                    className={cn(
                      'flex items-center justify-between rounded-xl border px-3 py-2',
                      dashboardTokens.border,
                      dashboardTokens.surfaceMuted,
                    )}
                  >
                    <div>
                      <div className="text-sm font-semibold">{tool.label}</div>
                      <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                        {launch ? 'Connected' : 'Not configured'}
                      </div>
                    </div>
                    {launch ? (
                      <Button asChild size="sm" className="rounded-full">
                        <a href={launch.url} target="_blank" rel="noopener noreferrer">
                          Launch
                        </a>
                      </Button>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <p className={cn('text-sm', dashboardTokens.textMuted)}>
                No connected apps are enabled for your role.
              </p>
            )}
          </div>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {visibleToolIds.map((toolId) => {
          const tool = integrationToolConfigs[toolId];
          const launch = resolveWorkspaceLaunch(toolId, activeWorkspaceId);
          const isPlaceholderLaunchUrl = launch?.url.includes('.example.com') ?? false;

          return (
            <DashboardCard key={toolId} title={tool.label}>
              <div className="space-y-3">
                <p className={cn('text-sm', dashboardTokens.textMuted)}>{tool.description}</p>
                {launch ? (
                  <>
                    <p className={cn('text-xs break-all', dashboardTokens.textSubtle)}>
                      {launch.url}
                    </p>
                    <Button asChild className="rounded-full">
                      <a href={launch.url} target="_blank" rel="noopener noreferrer">
                        Open {tool.label}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    {isPlaceholderLaunchUrl ? (
                      <p className={cn('text-xs', dashboardTokens.textSubtle)}>
                        Placeholder URL detected. Configure real endpoints in Super Admin control
                        center.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className={cn('text-sm', dashboardTokens.textMuted)}>
                    No workspace launch mapping configured yet.
                  </p>
                )}
              </div>
            </DashboardCard>
          );
        })}
      </div>
    </div>
  );
}
