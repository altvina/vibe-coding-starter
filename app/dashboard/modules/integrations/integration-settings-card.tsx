'use client';

import { useEffect, useMemo, useState } from 'react';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import {
  loadIntegrationLaunchConfig,
  saveIntegrationLaunchConfig,
  type IntegrationLaunchConfig,
} from '@/app/dashboard/modules/integrations/integrations-stub';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { cn } from '@/lib/utils';

export function IntegrationSettingsCard() {
  const { data } = useDashboardData();
  const [config, setConfig] = useState<IntegrationLaunchConfig>(() => loadIntegrationLaunchConfig());

  useEffect(() => {
    setConfig(loadIntegrationLaunchConfig());
  }, []);

  const workspaceIds = useMemo(() => {
    return data?.workspaces.map((workspace) => workspace.id) ?? [];
  }, [data?.workspaces]);

  function save(next: IntegrationLaunchConfig) {
    setConfig(next);
    saveIntegrationLaunchConfig(next);
  }

  return (
    <DashboardCard title="Gateway launch URLs">
      <div className="space-y-4">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          Base URLs for chat and projects experiences. The dashboard is the entry point; these
          values power white-labeled gateway launches (SSO or delegated auth as you wire on the
          server).
        </p>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <label className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
              Chat gateway base URL
            </label>
            <Input
              value={config.baseUrls.chat}
              onChange={(event) =>
                save({
                  ...config,
                  baseUrls: {
                    ...config.baseUrls,
                    chat: event.target.value,
                  },
                })
              }
              placeholder="https://chat.your-brand.com"
              className={cn('rounded-xl', dashboardTokens.focusRing)}
            />
          </div>
          <div className="space-y-2">
            <label className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
              Projects gateway base URL
            </label>
            <Input
              value={config.baseUrls.projects}
              onChange={(event) =>
                save({
                  ...config,
                  baseUrls: {
                    ...config.baseUrls,
                    projects: event.target.value,
                  },
                })
              }
              placeholder="https://projects.your-brand.com"
              className={cn('rounded-xl', dashboardTokens.focusRing)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Workspace path mappings</h4>
          <p className={cn('text-xs', dashboardTokens.textSubtle)}>
            Slugs or path segments appended to each gateway URL for this workspace.
          </p>
          {workspaceIds.map((workspaceId) => {
            const current = config.workspaceMappings[workspaceId] ?? {
              chatTeamSlug: '',
              projectsWorkspaceSlug: '',
              projectsProjectSlug: '',
            };

            return (
              <div key={workspaceId} className={cn('rounded-xl border p-3', dashboardTokens.border)}>
                <div className={cn('mb-3 text-xs font-semibold', dashboardTokens.textSubtle)}>
                  {data?.workspaces.find((w) => w.id === workspaceId)?.name ?? workspaceId}
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <Input
                    value={current.chatTeamSlug}
                    onChange={(event) =>
                      save({
                        ...config,
                        workspaceMappings: {
                          ...config.workspaceMappings,
                          [workspaceId]: {
                            ...current,
                            chatTeamSlug: event.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Chat channel or team slug"
                    className={cn('rounded-xl', dashboardTokens.focusRing)}
                  />
                  <Input
                    value={current.projectsWorkspaceSlug}
                    onChange={(event) =>
                      save({
                        ...config,
                        workspaceMappings: {
                          ...config.workspaceMappings,
                          [workspaceId]: {
                            ...current,
                            projectsWorkspaceSlug: event.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Projects workspace key"
                    className={cn('rounded-xl', dashboardTokens.focusRing)}
                  />
                  <Input
                    value={current.projectsProjectSlug ?? ''}
                    onChange={(event) =>
                      save({
                        ...config,
                        workspaceMappings: {
                          ...config.workspaceMappings,
                          [workspaceId]: {
                            ...current,
                            projectsProjectSlug: event.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Default project key (optional)"
                    className={cn('rounded-xl', dashboardTokens.focusRing)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className={cn('rounded-full', dashboardTokens.focusRing)}
            onClick={() => {
              const reset = loadIntegrationLaunchConfig();
              setConfig(reset);
            }}
          >
            Reload saved settings
          </Button>
        </div>
      </div>
    </DashboardCard>
  );
}
