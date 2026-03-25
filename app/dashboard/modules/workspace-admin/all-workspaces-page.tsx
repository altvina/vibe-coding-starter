'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, Plus, Search } from 'lucide-react';

import CustomLink from '@/components/shared/Link';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shared/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/shared/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/shared/ui/collapsible';
import { Switch } from '@/components/shared/ui/switch';
import { cn } from '@/lib/utils';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { dashboardIdentitySeeds } from '@/app/dashboard/dashboard-identities';
import {
  defaultWorkspaceDirectory,
  type WorkspaceDirectoryV1,
  type WorkspaceLifecycleStatus,
} from '@/lib/dashboard/workspace-directory';
import {
  loadWorkspaceDirectoryFromBrowser,
  persistWorkspaceDirectory,
  syncWorkspaceDirectoryCookieFromStorage,
} from '@/app/dashboard/modules/workspace-admin/workspace-directory-client';
import { ChevronDown } from 'lucide-react';

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AllWorkspacesPage() {
  const { data, refresh } = useDashboardData();
  const [q, setQ] = useState('');
  const [directory, setDirectory] = useState<WorkspaceDirectoryV1>(() => defaultWorkspaceDirectory());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formOwner, setFormOwner] = useState('u-admin');
  const [formStatus, setFormStatus] = useState<WorkspaceLifecycleStatus>('active');
  const [formDescription, setFormDescription] = useState('');
  const [formAnalytics, setFormAnalytics] = useState(false);

  useEffect(() => {
    syncWorkspaceDirectoryCookieFromStorage();
    setDirectory(loadWorkspaceDirectoryFromBrowser());
  }, []);

  const persistDirectory = useCallback((next: WorkspaceDirectoryV1) => {
    setDirectory(next);
    persistWorkspaceDirectory(next);
    void refresh();
  }, [refresh]);

  const rows = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.workspaces.filter((w) => {
      const hay = `${w.name} ${w.clientLabel} ${w.ownerName ?? ''}`.toLowerCase();
      return !q.trim() || hay.includes(q.trim().toLowerCase());
    });
  }, [data, q]);

  const openCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormOwner('u-admin');
    setFormStatus('active');
    setFormDescription('');
    setFormAnalytics(false);
    setSheetOpen(true);
  };

  const openEdit = (id: string) => {
    const w = data?.workspaces.find((row) => row.id === id);
    if (!w) {
      return;
    }
    setEditingId(id);
    setFormName(w.name);
    setFormOwner(w.ownerIdentityId ?? 'u-admin');
    setFormStatus(w.lifecycleStatus ?? 'active');
    setFormDescription(w.description ?? '');
    const custom = directory.customWorkspaces.find((c) => c.id === id);
    setFormAnalytics(Boolean(custom?.analyticsEnabled));
    setSheetOpen(true);
  };

  const saveWorkspace = () => {
    const name = formName.trim();
    if (!name) {
      return;
    }
    if (editingId) {
      const customIdx = directory.customWorkspaces.findIndex((c) => c.id === editingId);
      if (customIdx >= 0) {
        const nextCustom = [...directory.customWorkspaces];
        nextCustom[customIdx] = {
          ...nextCustom[customIdx],
          name,
          clientLabel: name,
          ownerIdentityId: formOwner,
          status: formStatus,
          description: formDescription.trim() || undefined,
          analyticsEnabled: formAnalytics,
        };
        persistDirectory({ ...directory, customWorkspaces: nextCustom });
      } else {
        const prevOv = directory.seedOverrides[editingId] ?? {};
        persistDirectory({
          ...directory,
          seedOverrides: {
            ...directory.seedOverrides,
            [editingId]: {
              ...prevOv,
              name,
              clientLabel: name,
              ownerIdentityId: formOwner,
              status: formStatus,
              description: formDescription.trim() || undefined,
            },
          },
        });
      }
    } else {
      const id = `ws-dir-${crypto.randomUUID().slice(0, 10)}`;
      persistDirectory({
        ...directory,
        customWorkspaces: [
          ...directory.customWorkspaces,
          {
            id,
            name,
            clientLabel: name,
            ownerIdentityId: formOwner,
            status: formStatus,
            description: formDescription.trim() || undefined,
            createdAt: new Date().toISOString(),
            analyticsEnabled: formAnalytics,
          },
        ],
      });
    }
    setSheetOpen(false);
  };

  const archiveWorkspace = (id: string) => {
    const customIdx = directory.customWorkspaces.findIndex((c) => c.id === id);
    if (customIdx >= 0) {
      const nextCustom = [...directory.customWorkspaces];
      nextCustom[customIdx] = { ...nextCustom[customIdx], status: 'archived' };
      persistDirectory({ ...directory, customWorkspaces: nextCustom });
      return;
    }
    const prevOv = directory.seedOverrides[id] ?? {};
    persistDirectory({
      ...directory,
      seedOverrides: {
        ...directory.seedOverrides,
        [id]: { ...prevOv, status: 'archived' },
      },
    });
  };

  const deleteCustom = (id: string) => {
    persistDirectory({
      ...directory,
      customWorkspaces: directory.customWorkspaces.filter((c) => c.id !== id),
    });
  };

  if (!data) {
    return null;
  }

  if (data.role !== 'internal' && data.role !== 'admin') {
    return (
      <DashboardCard title="Workspaces">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>You do not have access to workspace administration.</p>
      </DashboardCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardCard title="All workspaces" className="overflow-hidden p-0">
        <div
          className={cn(
            'flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
            dashboardTokens.border,
          )}
        >
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Workspaces</h1>
            <p className={cn('text-xs', dashboardTokens.textMuted)}>
              Create, search, and open workspace admin for any workspace you can access.
            </p>
          </div>
          <Button
            type="button"
            className={cn(
              'h-9 gap-1 rounded-full bg-primary-600 px-4 text-xs font-semibold text-white hover:bg-primary-700',
              'dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300',
              dashboardTokens.focusRing,
            )}
            onClick={openCreate}
          >
            <Plus className="h-3.5 w-3.5" />
            Create workspace
          </Button>
        </div>
        <div className="flex flex-col gap-2 border-b px-4 py-2 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search workspaces…"
              className={cn('h-9 rounded-lg pl-8 text-sm', dashboardTokens.focusRing)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr
                className={cn(
                  'h-11 border-b text-[11px] font-semibold uppercase tracking-wide',
                  dashboardTokens.border,
                  dashboardTokens.textSubtle,
                )}
              >
                <th className="px-4 py-2">Workspace</th>
                <th className="px-4 py-2">Owner</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Members</th>
                <th className="px-4 py-2">Created</th>
                <th className="w-12 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr
                  key={w.id}
                  className={cn('h-[52px] border-b hover:bg-muted/25', dashboardTokens.border)}
                >
                  <td className="px-4 py-1 align-middle">
                    <div className="font-medium">{w.name}</div>
                    <div className={cn('text-[11px]', dashboardTokens.textMuted)}>
                      {w.source === 'custom' ? 'Custom' : 'Seed'} · {w.clientLabel}
                    </div>
                  </td>
                  <td className={cn('px-4 py-1 align-middle text-xs', dashboardTokens.textMuted)}>
                    {w.ownerName ?? '—'}
                  </td>
                  <td className="px-4 py-1 align-middle">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        w.lifecycleStatus === 'archived'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
                      )}
                    >
                      {w.lifecycleStatus === 'archived' ? 'Archived' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-1 text-right align-middle tabular-nums text-xs">{w.memberCount ?? '—'}</td>
                  <td className={cn('px-4 py-1 align-middle text-xs', dashboardTokens.textMuted)}>
                    {w.createdAt ? formatDate(w.createdAt) : '—'}
                  </td>
                  <td className="px-1 py-1 align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <CustomLink href={`/dashboard/workspace-admin/${w.id}?tab=members`}>
                            Open workspace admin
                          </CustomLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(w.id)}>Edit metadata</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => archiveWorkspace(w.id)}>Archive</DropdownMenuItem>
                        {w.source === 'custom' ? (
                          <DropdownMenuItem
                            className="text-rose-600 focus:text-rose-600"
                            onClick={() => deleteCustom(w.id)}
                          >
                            Remove custom workspace
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <div className={cn('px-4 py-10 text-center text-sm', dashboardTokens.textMuted)}>No workspaces match.</div>
          ) : null}
        </div>
      </DashboardCard>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit workspace' : 'Create workspace'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4 pb-6">
            <div className="space-y-1">
              <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Workspace name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className={cn('h-9 rounded-lg', dashboardTokens.focusRing)}
              />
            </div>
            <div className="space-y-1">
              <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Owner</label>
              <Select value={formOwner} onValueChange={setFormOwner}>
                <SelectTrigger className={cn('h-9 rounded-lg', dashboardTokens.focusRing)}>
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
              <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Status</label>
              <Select
                value={formStatus}
                onValueChange={(v) => setFormStatus(v as WorkspaceLifecycleStatus)}
              >
                <SelectTrigger className={cn('h-9 rounded-lg', dashboardTokens.focusRing)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Description</label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional"
                className={cn('h-9 rounded-lg', dashboardTokens.focusRing)}
              />
            </div>
            <Collapsible>
              <CollapsibleTrigger
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold',
                  dashboardTokens.border,
                )}
              >
                Feature toggles
                <ChevronDown className="h-4 w-4 opacity-60" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                  <span className={cn('text-xs', dashboardTokens.textSubtle)}>Analytics module</span>
                  <Switch checked={formAnalytics} onCheckedChange={setFormAnalytics} />
                </label>
              </CollapsibleContent>
            </Collapsible>
            <div className="mt-auto flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1 rounded-lg" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="button" className="flex-1 rounded-lg" onClick={saveWorkspace}>
                {editingId ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
