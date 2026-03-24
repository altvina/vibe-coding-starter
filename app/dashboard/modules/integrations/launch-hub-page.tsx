'use client';

import { ExternalLink } from 'lucide-react';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { useDashboardWorkspace } from '@/app/dashboard/dashboard-workspace-context';
import {
  integrationToolConfigs,
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

  return (
    <div className="space-y-4">
      <DashboardCard title="Launch Hub">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          Open external collaboration tools for <span className="font-semibold">{workspaceName}</span>.
        </p>
      </DashboardCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {launchOrder.map((toolId) => {
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
