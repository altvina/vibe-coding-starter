'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, RefreshCw, TriangleAlert } from 'lucide-react';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { useDashboardWorkspace } from '@/app/dashboard/dashboard-workspace-context';
import {
  permissionKeyForTool,
  resolveWorkspaceLaunch,
  type IntegrationToolId,
} from '@/app/dashboard/modules/integrations/integrations-stub';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

export function ToolLaunchSurface({ toolId }: { toolId: IntegrationToolId }) {
  const { activeWorkspaceId } = useDashboardWorkspace();
  const { data } = useDashboardData();
  const [showEmbeddedView, setShowEmbeddedView] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);
  const launch = resolveWorkspaceLaunch(toolId, activeWorkspaceId);
  const hasToolAccess = data?.permissions[permissionKeyForTool(toolId)] ?? false;
  const workspaceName =
    data?.workspaces.find((workspace) => workspace.id === activeWorkspaceId)?.name ??
    'active workspace';
  const isPlaceholderLaunchUrl = useMemo(() => {
    if (!launch) {
      return false;
    }
    try {
      const parsed = new URL(launch.url);
      return parsed.hostname.endsWith('example.com');
    } catch (e) {
      void e;
      return true;
    }
  }, [launch]);

  if (!launch) {
    return (
      <DashboardCard title="Workspace mapping required">
        <div className="space-y-3">
          <p className={cn('text-sm', dashboardTokens.textMuted)}>
            No launch mapping is configured for <strong>{workspaceName}</strong>.
          </p>
          <div
            className={cn(
              'flex items-start gap-2 rounded-xl border px-3 py-2',
              dashboardTokens.border,
              dashboardTokens.surfaceMuted,
            )}
          >
            <TriangleAlert className={cn('mt-0.5 h-4 w-4 shrink-0', dashboardTokens.textSubtle)} />
            <p className={cn('text-xs', dashboardTokens.textSubtle)}>
              Add this workspace to the launch mapping config before opening this tool.
            </p>
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (!hasToolAccess) {
    return (
      <DashboardCard title="Tool access denied">
        <div className="space-y-3">
          <p className={cn('text-sm', dashboardTokens.textMuted)}>
            Your workspace role does not include access to this tool.
          </p>
          <p className={cn('text-xs', dashboardTokens.textSubtle)}>
              Ask a workspace admin to update your access for this workspace.
          </p>
        </div>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardCard title={launch.tool.label}>
        <div className="space-y-4">
          <p className={cn('text-sm', dashboardTokens.textMuted)}>{launch.tool.description}</p>
          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2',
              dashboardTokens.border,
              dashboardTokens.surfaceMuted,
            )}
          >
            <p className={cn('text-xs', dashboardTokens.textSubtle)}>
              Workspace: <span className="font-semibold">{workspaceName}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className={cn('h-9 rounded-full px-3 text-xs font-semibold', dashboardTokens.focusRing)}
                onClick={() => {
                  setIframeFailed(false);
                  window.location.reload();
                }}
              >
                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                Reload
              </Button>
              {!isPlaceholderLaunchUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'h-9 rounded-full px-3 text-xs font-semibold',
                    dashboardTokens.focusRing,
                  )}
                  onClick={() => {
                    setIframeFailed(false);
                    setShowEmbeddedView((current) => !current);
                  }}
                >
                  {showEmbeddedView ? 'Hide embedded view' : 'Load embedded view'}
                </Button>
              ) : null}
              <Button asChild className="h-9 rounded-full px-3 text-xs font-semibold">
                <a href={launch.url} target="_blank" rel="noopener noreferrer">
                  Open tool
                  <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>
          <div
            className={cn(
              'rounded-xl border px-3 py-2 text-xs',
              dashboardTokens.border,
              dashboardTokens.textSubtle,
            )}
          >
            {isPlaceholderLaunchUrl
              ? 'Gateway URL is still a placeholder. Set real base URLs in the platform control center, then open in a new tab or load embedded view.'
              : 'If the gateway blocks embedding (e.g. X-Frame-Options), use Open tool to continue in a new tab.'}
          </div>
        </div>
      </DashboardCard>

      {showEmbeddedView && !isPlaceholderLaunchUrl ? (
        <>
          {iframeFailed ? (
            <DashboardCard title="Embedded view unavailable">
              <p className={cn('text-sm', dashboardTokens.textMuted)}>
                The embedded view could not be loaded. Continue with "Open tool" in a new tab.
              </p>
            </DashboardCard>
          ) : null}
          <div
            className={cn(
              'overflow-hidden rounded-2xl border bg-white dark:bg-slate-950',
              dashboardTokens.border,
            )}
          >
            <iframe
              title={`${launch.tool.label} workspace view`}
              src={launch.url}
              className="h-[calc(100vh-18rem)] min-h-[420px] w-full"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              onError={() => setIframeFailed(true)}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
