'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, LayoutGrid } from 'lucide-react';

import CustomLink from '@/components/shared/Link';
import { Button } from '@/components/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { cn } from '@/lib/utils';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { useDashboardWorkspace } from '@/app/dashboard/dashboard-workspace-context';

import { ActionRequestsSection } from '@/app/dashboard/modules/workspace-admin/action-requests-section';
import { MemberMergeDuplicatesTab } from '@/app/dashboard/modules/workspace-admin/member-merge-duplicates-tab';
import { MembersWorkspaceTab } from '@/app/dashboard/modules/workspace-admin/members-tab';
import { WorkspaceSettingsTab } from '@/app/dashboard/modules/workspace-admin/workspace-settings-tab';
import { syncWorkspaceDirectoryCookieFromStorage } from '@/app/dashboard/modules/workspace-admin/workspace-directory-client';

const tabs = ['members', 'duplicates', 'requests', 'settings'] as const;
export type WorkspaceAdminTabId = (typeof tabs)[number];

function isTab(value: string | null): value is WorkspaceAdminTabId {
  return tabs.includes(value as WorkspaceAdminTabId);
}

export function WorkspaceAdminShell({
  workspaceId,
  data,
  onRefresh,
}: {
  workspaceId: string;
  data: DashboardApiResponse;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setActiveWorkspaceId } = useDashboardWorkspace();

  const tabParam = searchParams.get('tab');
  const activeTab: WorkspaceAdminTabId = isTab(tabParam) ? tabParam : 'members';

  useEffect(() => {
    syncWorkspaceDirectoryCookieFromStorage();
  }, []);

  useEffect(() => {
    if (workspaceId && workspaceId !== data.activeWorkspaceId) {
      setActiveWorkspaceId(workspaceId);
    }
  }, [workspaceId, data.activeWorkspaceId, setActiveWorkspaceId]);

  const workspaceLabel = useMemo(
    () => data.workspaces.find((w) => w.id === workspaceId)?.name ?? 'Workspace',
    [data.workspaces, workspaceId],
  );

  const setTab = useCallback(
    (next: WorkspaceAdminTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <header
        className={cn(
          'flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
          dashboardTokens.border,
          dashboardTokens.surfaceMuted,
        )}
      >
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn('-ml-2 h-8 w-fit gap-1 px-2 text-xs', dashboardTokens.focusRing)}
            asChild
          >
            <CustomLink href="/dashboard/workspaces">
              <ChevronLeft className="h-3.5 w-3.5" />
              All workspaces
            </CustomLink>
          </Button>
          <div className="hidden h-4 w-px bg-border/80 sm:block" aria-hidden />
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <LayoutGrid className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
            <h1 className="truncate text-base font-semibold tracking-tight">{workspaceLabel}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('text-[11px] font-medium uppercase tracking-wide', dashboardTokens.textSubtle)}>
            Workspace
          </span>
          <Select
            value={workspaceId}
            onValueChange={(id) => {
              setActiveWorkspaceId(id);
              router.push(`/dashboard/workspace-admin/${id}?tab=${activeTab}`);
            }}
          >
            <SelectTrigger
              className={cn('h-9 w-[min(100%,220px)] rounded-lg text-sm', dashboardTokens.focusRing)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.workspaces.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                  {w.lifecycleStatus === 'archived' ? ' (archived)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => isTab(v) && setTab(v)} className="flex min-h-0 flex-1 flex-col gap-3">
        {/* Tabs reflow from full-width stacked on mobile to inline on sm+ */}
        <TabsList
          className={cn(
            'flex h-auto w-full flex-wrap gap-1 rounded-lg border bg-muted/40 p-1 sm:inline-flex sm:h-9 sm:w-auto sm:flex-nowrap sm:gap-0 sm:p-0.5',
            dashboardTokens.border,
          )}
        >
          <TabsTrigger value="members" className="min-h-[36px] flex-1 rounded-md text-xs font-semibold sm:flex-none sm:text-sm">
            Members
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="min-h-[36px] flex-1 rounded-md text-xs font-semibold sm:flex-none sm:text-sm">
            Duplicates
          </TabsTrigger>
          <TabsTrigger value="requests" className="min-h-[36px] flex-1 rounded-md text-xs font-semibold sm:flex-none sm:text-sm">
            Requests
          </TabsTrigger>
          <TabsTrigger value="settings" className="min-h-[36px] flex-1 rounded-md text-xs font-semibold sm:flex-none sm:text-sm">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-0 min-h-0 flex-1 outline-none">
          <MembersWorkspaceTab data={data} workspaceId={workspaceId} onWorkspaceRefresh={onRefresh} />
        </TabsContent>

        <TabsContent value="duplicates" className="mt-0 min-h-0 flex-1 outline-none">
          <MemberMergeDuplicatesTab workspaceId={workspaceId} onWorkspaceRefresh={onRefresh} />
        </TabsContent>

        <TabsContent value="requests" className="mt-0 min-h-0 flex-1 outline-none">
          <ActionRequestsSection
            data={data}
            activeWorkspaceId={workspaceId}
            onChanged={() => {
              void onRefresh();
            }}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-0 min-h-0 flex-1 outline-none">
          <WorkspaceSettingsTab data={data} workspaceId={workspaceId} onWorkspaceRefresh={onRefresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
