'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Switch } from '@/components/shared/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/shared/ui/collapsible';
import { cn } from '@/lib/utils';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { dashboardIdentitySeeds } from '@/app/dashboard/dashboard-identities';
import {
  defaultWorkspaceConfig,
  loadWorkspaceConfigFromLocalStorage,
  saveWorkspaceConfigToLocalStorage,
  setWorkspaceConfigCookie,
  type WorkspaceConfigV1,
} from '@/app/dashboard/modules/workspace-admin/workspace-config';
import { defaultWorkspaceDirectory, type WorkspaceDirectoryV1 } from '@/lib/dashboard/workspace-directory';
import {
  loadWorkspaceDirectoryFromBrowser,
  persistWorkspaceDirectory,
} from '@/app/dashboard/modules/workspace-admin/workspace-directory-client';
import { ChevronDown } from 'lucide-react';

export function WorkspaceSettingsTab({
  data,
  workspaceId,
  onWorkspaceRefresh,
}: {
  data: DashboardApiResponse;
  workspaceId: string;
  onWorkspaceRefresh: () => void;
}) {
  const [config, setConfig] = useState<WorkspaceConfigV1>(() => defaultWorkspaceConfig());
  const [directory, setDirectory] = useState<WorkspaceDirectoryV1>(() => defaultWorkspaceDirectory());

  useEffect(() => {
    setConfig(loadWorkspaceConfigFromLocalStorage());
    setDirectory(loadWorkspaceDirectoryFromBrowser());
  }, []);

  const summary = useMemo(
    () => data.workspaces.find((w) => w.id === workspaceId),
    [data.workspaces, workspaceId],
  );

  const customEntry = useMemo(
    () => directory.customWorkspaces.find((w) => w.id === workspaceId),
    [directory.customWorkspaces, workspaceId],
  );

  const isCustom = summary?.source === 'custom' || Boolean(customEntry);

  const persistConfig = useCallback(
    (next: WorkspaceConfigV1) => {
      setConfig(next);
      saveWorkspaceConfigToLocalStorage(next);
      setWorkspaceConfigCookie(next);
      void onWorkspaceRefresh();
    },
    [onWorkspaceRefresh],
  );

  const persistDirectory = useCallback(
    (next: WorkspaceDirectoryV1) => {
      setDirectory(next);
      persistWorkspaceDirectory(next);
      void onWorkspaceRefresh();
    },
    [onWorkspaceRefresh],
  );

  const seedName = summary?.name ?? 'Workspace';
  const seedDescription =
    customEntry?.description ?? directory.seedOverrides[workspaceId]?.description ?? '';

  const ownerIdentityId =
    summary?.ownerIdentityId ??
    directory.seedOverrides[workspaceId]?.ownerIdentityId ??
    customEntry?.ownerIdentityId ??
    'u-admin';

  const lifecycleStatus =
    summary?.lifecycleStatus ??
    directory.seedOverrides[workspaceId]?.status ??
    customEntry?.status ??
    'active';

  const analyticsEnabled = Boolean(
    customEntry?.analyticsEnabled ??
      config.workspaces[workspaceId]?.settings?.analyticsEnabled ??
      false,
  );

  const setAnalytics = (checked: boolean) => {
    if (isCustom) {
      const nextCustom = directory.customWorkspaces.map((w) =>
        w.id === workspaceId ? { ...w, analyticsEnabled: checked } : w,
      );
      persistDirectory({ ...directory, customWorkspaces: nextCustom });
      return;
    }
    const ws = config.workspaces[workspaceId] ?? {
      memberOverrides: {},
      projectMembershipOverrides: {},
    };
    persistConfig({
      ...config,
      workspaces: {
        ...config.workspaces,
        [workspaceId]: {
          ...ws,
          settings: {
            ...(ws.settings ?? {}),
            analyticsEnabled: checked,
          },
        },
      },
    });
  };

  const updateSeedMeta = (patch: {
    name?: string;
    description?: string;
    ownerIdentityId?: string;
    status?: 'active' | 'archived';
  }) => {
    if (isCustom) {
      const nextCustom = directory.customWorkspaces.map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              name: patch.name ?? w.name,
              description: patch.description ?? w.description,
              ownerIdentityId: patch.ownerIdentityId ?? w.ownerIdentityId,
              status: patch.status ?? w.status,
            }
          : w,
      );
      persistDirectory({ ...directory, customWorkspaces: nextCustom });
      return;
    }
    const prevOv = directory.seedOverrides[workspaceId] ?? {};
    persistDirectory({
      ...directory,
      seedOverrides: {
        ...directory.seedOverrides,
        [workspaceId]: {
          ...prevOv,
          name: patch.name ?? prevOv.name,
          description: patch.description ?? prevOv.description,
          ownerIdentityId: patch.ownerIdentityId ?? prevOv.ownerIdentityId,
          status: patch.status ?? prevOv.status,
        },
      },
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DashboardCard title="Workspace metadata" className="h-fit">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Display name</label>
            <Input
              defaultValue={seedName}
              key={`${workspaceId}-name-${seedName}`}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v) {
                  updateSeedMeta({ name: v });
                }
              }}
              className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}
            />
          </div>
          <div className="space-y-1">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Description</label>
            <Input
              defaultValue={seedDescription ?? ''}
              key={`${workspaceId}-desc-${seedDescription}`}
              onBlur={(e) => updateSeedMeta({ description: e.target.value.trim() || undefined })}
              placeholder="Optional"
              className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}
            />
          </div>
          <div className="space-y-1">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Workspace owner</label>
            <Select
              value={ownerIdentityId}
              onValueChange={(v) => updateSeedMeta({ ownerIdentityId: v })}
            >
              <SelectTrigger className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dashboardIdentitySeeds.map((identity) => (
                  <SelectItem key={identity.id} value={identity.id}>
                    {identity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Lifecycle status</label>
            <Select
              value={lifecycleStatus}
              onValueChange={(v) => updateSeedMeta({ status: v as 'active' | 'archived' })}
            >
              <SelectTrigger className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className={cn('text-[11px] leading-relaxed', dashboardTokens.textMuted)}>
            Metadata is stored in your browser directory overlay and merged on the next dashboard load. Seed
            workspaces keep underlying demo data; overrides change labels and admin views.
          </p>
        </div>
      </DashboardCard>

      <DashboardCard title="Modules & permissions" className="h-fit">
        <div
          className={cn(
            'flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between',
            dashboardTokens.border,
            dashboardTokens.surfaceMuted,
          )}
        >
          <div>
            <div className="text-sm font-semibold">Analytics</div>
            <div className={cn('text-xs', dashboardTokens.textMuted)}>
              Show Analytics in the primary navigation for this workspace only when enabled.
            </div>
          </div>
          <Switch checked={analyticsEnabled} onCheckedChange={setAnalytics} />
        </div>

        <Collapsible className="mt-4">
          <CollapsibleTrigger
            className={cn(
              'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-semibold',
              dashboardTokens.border,
            )}
          >
            Advanced
            <ChevronDown className="h-4 w-4 opacity-60" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className={cn('rounded-lg border p-3 text-xs', dashboardTokens.border, dashboardTokens.surfaceMuted)}>
              <p className={cn('mb-3', dashboardTokens.textMuted)}>
                Reset visibility rules stored locally for every workspace (irreversible in this demo).
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-md"
                onClick={() => persistConfig(defaultWorkspaceConfig())}
              >
                Reset all visibility rules
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </DashboardCard>
    </div>
  );
}
