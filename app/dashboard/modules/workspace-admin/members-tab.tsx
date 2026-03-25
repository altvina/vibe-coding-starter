'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, Search, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import { Checkbox } from '@/components/shared/ui/checkbox';
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
import { Switch } from '@/components/shared/ui/switch';
import { cn } from '@/lib/utils';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import type { DashboardApiResponse, WorkspaceMember } from '@/app/dashboard/dashboard-context';
import {
  directoryMemberRoleCountLabel,
  directoryMemberRoleSingularLabel,
} from '@/app/dashboard/workspace-role-labels';
import {
  defaultWorkspaceConfig,
  loadWorkspaceConfigFromLocalStorage,
  saveWorkspaceConfigToLocalStorage,
  setWorkspaceConfigCookie,
  type WorkspaceAudience,
  type WorkspaceConfigV1,
  type WorkspaceDisplayMode,
} from '@/app/dashboard/modules/workspace-admin/workspace-config';
import {
  getMemberProfile,
  getOverride,
  getProjectRoleOverride,
  setMemberProfile,
  setOverride,
  setProjectRoleOverride,
} from '@/app/dashboard/modules/workspace-admin/workspace-admin-config-helpers';
import {
  normalizedDisplayMode as normMode,
  visibilityLabelForMode,
  visibilitySummaryLabel,
  workspaceAudiences,
} from '@/app/dashboard/modules/workspace-admin/member-visibility';

const VIEWS_KEY = 'altvina.admin.membersSavedViews' as const;

type MembersView = { id: string; name: string; payload: MembersViewPayload };
type MembersViewPayload = {
  q: string;
  role: string;
  org: string;
  visibility: string;
  active: string;
};

function chipClass(variant: 'neutral' | 'accent' | 'warn') {
  if (variant === 'accent') {
    return 'border-primary-300/50 bg-primary-500/10 text-primary-900 dark:border-primary-500/30 dark:text-primary-100';
  }
  if (variant === 'warn') {
    return 'border-amber-300/60 bg-amber-500/10 text-amber-900 dark:border-amber-500/35 dark:text-amber-100';
  }
  return cn('border-border/80 bg-muted/40', dashboardTokens.textSubtle);
}

function summaryChipVariant(summary: string): 'neutral' | 'accent' | 'warn' {
  if (summary === 'Visible to all') {
    return 'neutral';
  }
  if (summary === 'Mixed visibility' || summary.startsWith('Mixed')) {
    return 'warn';
  }
  return 'accent';
}

function applyVisibilityPreset(
  config: WorkspaceConfigV1,
  workspaceId: string,
  memberId: string,
  preset: 'all_visible' | 'hidden_clients' | 'masked_clients' | 'internal_only',
): WorkspaceConfigV1 {
  const modes: Record<WorkspaceAudience, WorkspaceDisplayMode> =
    preset === 'all_visible'
      ? { client: 'full', expert: 'full', staff: 'full' }
      : preset === 'hidden_clients'
        ? { client: 'hidden', expert: 'full', staff: 'full' }
        : preset === 'masked_clients'
          ? { client: 'masked', expert: 'full', staff: 'full' }
          : { client: 'hidden', expert: 'hidden', staff: 'full' };

  let next = config;
  for (const audience of workspaceAudiences) {
    const mode = modes[audience];
    next = setOverride({
      config: next,
      workspaceId,
      memberId,
      audience,
      patch: {
        displayMode: mode,
        visible: mode !== 'hidden',
      },
    });
  }
  return next;
}

function mergeMemberRow(
  member: WorkspaceMember,
  workspaceId: string,
  config: WorkspaceConfigV1,
): WorkspaceMember & { archived?: boolean; organizationLabel?: string } {
  const p = getMemberProfile(config, workspaceId, member.id);
  return {
    ...member,
    displayName: p?.displayName ?? member.displayName,
    title: p?.title ?? member.title,
    role: p?.role ?? member.role,
    bio: p?.bio ?? member.bio,
    archived: p?.archived ?? false,
    organizationLabel: p?.organizationLabel,
  };
}

export function MembersWorkspaceTab({
  data,
  workspaceId,
  onWorkspaceRefresh,
}: {
  data: DashboardApiResponse;
  workspaceId: string;
  onWorkspaceRefresh: () => void;
}) {
  const [config, setConfig] = useState<WorkspaceConfigV1>(() => defaultWorkspaceConfig());
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [panelMemberId, setPanelMemberId] = useState<string | null>(null);
  const [savedViews, setSavedViews] = useState<MembersView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string>('default');

  useEffect(() => {
    const loaded = loadWorkspaceConfigFromLocalStorage();
    setConfig(loaded);
    setWorkspaceConfigCookie(loaded);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(VIEWS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MembersView[];
        if (Array.isArray(parsed)) {
          setSavedViews(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const workspaceClientLabel =
    data.workspaces.find((w) => w.id === workspaceId)?.clientLabel?.trim() ??
    data.workspaces.find((w) => w.id === workspaceId)?.name?.trim() ??
    'Client';

  const audiences: Array<{ id: WorkspaceAudience; label: string }> = useMemo(
    () => [
      { id: 'client', label: directoryMemberRoleCountLabel('client', { workspaceClientLabel }) },
      { id: 'expert', label: directoryMemberRoleCountLabel('expert', { workspaceClientLabel }) },
      { id: 'staff', label: directoryMemberRoleCountLabel('staff', { workspaceClientLabel }) },
    ],
    [workspaceClientLabel],
  );

  const projectEngagementRoleOptions = useMemo(
    () => [
      { value: 'Client', label: workspaceClientLabel },
      { value: 'Expert', label: 'Expert' },
      { value: 'Partner', label: 'Partner' },
      { value: 'Altvina', label: 'Altvina' },
      { value: 'Observer', label: 'Observer' },
    ],
    [workspaceClientLabel],
  );

  const members = useMemo(() => data.workspace.members ?? [], [data.workspace.members]);
  const projects = useMemo(() => data.workspace.projects ?? [], [data.workspace.projects]);
  const projectMemberships = useMemo(
    () => data.workspace.projectMemberships ?? [],
    [data.workspace.projectMemberships],
  );

  const rows = useMemo(
    () => members.map((m) => mergeMemberRow(m, workspaceId, config)),
    [members, workspaceId, config],
  );

  const orgOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const org =
        r.organizationLabel ??
        (r.role === 'client' ? workspaceClientLabel : r.role === 'staff' ? 'Altvina' : 'Expert network');
      set.add(org);
    });
    return Array.from(set).sort();
  }, [rows, workspaceClientLabel]);

  const filtered = useMemo(() => {
    return rows.filter((m) => {
      const hay = `${m.displayName} ${m.title ?? ''} ${m.email ?? ''}`.toLowerCase();
      if (q.trim() && !hay.includes(q.trim().toLowerCase())) {
        return false;
      }
      if (roleFilter !== 'all' && m.role !== roleFilter) {
        return false;
      }
      const org =
        m.organizationLabel ??
        (m.role === 'client' ? workspaceClientLabel : m.role === 'staff' ? 'Altvina' : 'Expert network');
      if (orgFilter !== 'all' && org !== orgFilter) {
        return false;
      }
      const summary = visibilitySummaryLabel(config.workspaces[workspaceId]?.memberOverrides?.[m.id]);
      if (visibilityFilter !== 'all' && summary !== visibilityFilter) {
        return false;
      }
      if (activeFilter === 'active' && m.archived) {
        return false;
      }
      if (activeFilter === 'archived' && !m.archived) {
        return false;
      }
      return true;
    });
  }, [
    rows,
    q,
    roleFilter,
    orgFilter,
    visibilityFilter,
    activeFilter,
    config.workspaces,
    workspaceId,
    workspaceClientLabel,
  ]);

  const persist = useCallback((next: WorkspaceConfigV1) => {
    setConfig(next);
    saveWorkspaceConfigToLocalStorage(next);
    setWorkspaceConfigCookie(next);
    void onWorkspaceRefresh();
  }, [onWorkspaceRefresh]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  };

  const selectAllVisible = () => {
    setSelected(new Set(filtered.map((m) => m.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const bulkApplyPreset = (preset: Parameters<typeof applyVisibilityPreset>[3]) => {
    let next = config;
    for (const id of selected) {
      next = applyVisibilityPreset(next, workspaceId, id, preset);
    }
    persist(next);
    clearSelection();
  };

  const bulkArchive = (archived: boolean) => {
    let next = config;
    for (const id of selected) {
      next = setMemberProfile({ config: next, workspaceId, memberId: id, patch: { archived } });
    }
    persist(next);
    clearSelection();
  };

  const saveCurrentView = () => {
    const name = window.prompt('Name this view');
    if (!name?.trim()) {
      return;
    }
    const payload: MembersViewPayload = {
      q,
      role: roleFilter,
      org: orgFilter,
      visibility: visibilityFilter,
      active: activeFilter,
    };
    const id = `v-${crypto.randomUUID()}`;
    const nextViews = [...savedViews, { id, name: name.trim(), payload }];
    setSavedViews(nextViews);
    try {
      window.localStorage.setItem(VIEWS_KEY, JSON.stringify(nextViews));
    } catch {
      /* ignore */
    }
    setActiveViewId(id);
  };

  const applyView = (id: string) => {
    setActiveViewId(id);
    if (id === 'default') {
      setQ('');
      setRoleFilter('all');
      setOrgFilter('all');
      setVisibilityFilter('all');
      setActiveFilter('all');
      return;
    }
    const v = savedViews.find((row) => row.id === id);
    if (!v) {
      return;
    }
    setQ(v.payload.q);
    setRoleFilter(v.payload.role);
    setOrgFilter(v.payload.org);
    setVisibilityFilter(v.payload.visibility);
    setActiveFilter(v.payload.active);
  };

  const panelMember = panelMemberId ? rows.find((m) => m.id === panelMemberId) : null;

  const visibilityOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((m) => {
      set.add(visibilitySummaryLabel(config.workspaces[workspaceId]?.memberOverrides?.[m.id]));
    });
    return Array.from(set).sort();
  }, [rows, config.workspaces, workspaceId]);

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 ? (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2',
            dashboardTokens.border,
            dashboardTokens.surfaceMuted,
          )}
        >
          <span className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
            {selected.size} selected
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Button type="button" variant="outline" size="sm" className="h-8 rounded-md text-xs" onClick={() => bulkApplyPreset('all_visible')}>
              Visible to all
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 rounded-md text-xs" onClick={() => bulkApplyPreset('masked_clients')}>
              Clients masked
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 rounded-md text-xs" onClick={() => bulkApplyPreset('hidden_clients')}>
              Hidden from clients
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 rounded-md text-xs" onClick={() => bulkApplyPreset('internal_only')}>
              Internal only
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 rounded-md text-xs" onClick={() => bulkArchive(true)}>
              Archive
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 rounded-md text-xs" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      <DashboardCard title="Members" className="overflow-hidden p-0">
        <div
          className={cn(
            'flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end',
            dashboardTokens.border,
          )}
        >
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search members…"
              className={cn('h-9 rounded-lg pl-8 text-sm', dashboardTokens.focusRing)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className={cn('h-9 w-full rounded-lg text-xs sm:w-[140px]', dashboardTokens.focusRing)}>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className={cn('h-9 w-full rounded-lg text-xs sm:w-[160px]', dashboardTokens.focusRing)}>
              <SelectValue placeholder="Organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All orgs</SelectItem>
              {orgOptions.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <SelectTrigger className={cn('h-9 w-full rounded-lg text-xs sm:w-[180px]', dashboardTokens.focusRing)}>
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visibility</SelectItem>
              {visibilityOptions.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className={cn('h-9 w-full rounded-lg text-xs sm:w-[130px]', dashboardTokens.focusRing)}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 opacity-50" />
            <Select value={activeViewId} onValueChange={applyView}>
              <SelectTrigger className={cn('h-9 w-[160px] rounded-lg text-xs', dashboardTokens.focusRing)}>
                <SelectValue placeholder="Saved view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                {savedViews.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" className="h-9 rounded-md text-xs" onClick={saveCurrentView}>
              Save view
            </Button>
          </div>
          <Button type="button" variant="outline" size="sm" className="h-9 rounded-md text-xs" onClick={selectAllVisible}>
            Select all
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr
                className={cn(
                  'h-11 border-b text-[11px] font-semibold uppercase tracking-wide',
                  dashboardTokens.border,
                  dashboardTokens.textSubtle,
                )}
              >
                <th className="w-10 px-3 py-2">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Organization</th>
                <th className="px-3 py-2">Visibility</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Projects</th>
                <th className="w-12 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const summary = visibilitySummaryLabel(
                  config.workspaces[workspaceId]?.memberOverrides?.[m.id],
                );
                const variant = summaryChipVariant(summary);
                const nProjects = projectMemberships.filter((pm) => pm.memberId === m.id).length;
                const org =
                  m.organizationLabel ??
                  (m.role === 'client'
                    ? workspaceClientLabel
                    : m.role === 'staff'
                      ? 'Altvina'
                      : 'Expert network');
                return (
                  <tr
                    key={m.id}
                    className={cn(
                      'h-[52px] border-b transition-colors hover:bg-muted/30',
                      dashboardTokens.border,
                    )}
                  >
                    <td className="px-3 py-1 align-middle">
                      <Checkbox
                        checked={selected.has(m.id)}
                        onCheckedChange={() => toggleSelect(m.id)}
                        aria-label={`Select ${m.displayName}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-3 py-1 align-middle">
                      <button
                        type="button"
                        className={cn(
                          'max-w-[220px] truncate text-left font-medium hover:underline',
                          dashboardTokens.focusRing,
                          'rounded-sm',
                        )}
                        onClick={() => setPanelMemberId(m.id)}
                      >
                        {m.displayName}
                      </button>
                      {m.title ? (
                        <div className={cn('truncate text-xs', dashboardTokens.textMuted)}>{m.title}</div>
                      ) : null}
                    </td>
                    <td className={cn('px-3 py-1 align-middle text-xs', dashboardTokens.textSubtle)}>
                      {directoryMemberRoleSingularLabel(m.role, { workspaceClientLabel })}
                    </td>
                    <td className={cn('max-w-[160px] truncate px-3 py-1 align-middle text-xs', dashboardTokens.textMuted)}>
                      {org}
                    </td>
                    <td className="px-3 py-1 align-middle">
                      <span
                        className={cn(
                          'inline-flex max-w-[200px] truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                          chipClass(variant),
                        )}
                      >
                        {summary}
                      </span>
                    </td>
                    <td className="px-3 py-1 align-middle">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          m.archived ? 'bg-muted text-muted-foreground' : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
                        )}
                      >
                        {m.archived ? 'Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="px-3 py-1 text-right align-middle text-xs tabular-nums">{nProjects}</td>
                    <td className="px-1 py-1 align-middle">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            aria-label={`Actions for ${m.displayName}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setPanelMemberId(m.id)}>Open details</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              persist(applyVisibilityPreset(config, workspaceId, m.id, 'all_visible'));
                            }}
                          >
                            Preset: visible to all
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              persist(setMemberProfile({ config, workspaceId, memberId: m.id, patch: { archived: true } }));
                            }}
                          >
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <div className={cn('px-4 py-10 text-center text-sm', dashboardTokens.textMuted)}>No members match filters.</div>
          ) : null}
        </div>
      </DashboardCard>

      <Sheet open={Boolean(panelMember)} onOpenChange={(o) => !o && setPanelMemberId(null)}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto border-l p-0 sm:max-w-md"
        >
          {panelMember ? (
            <MemberDetailPanelBody
              member={panelMember}
              workspaceId={workspaceId}
              workspaceClientLabel={workspaceClientLabel}
              audiences={audiences}
              projectEngagementRoleOptions={projectEngagementRoleOptions}
              projects={projects}
              projectMemberships={projectMemberships}
              config={config}
              persist={persist}
              onClose={() => setPanelMemberId(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MemberDetailPanelBody({
  member,
  workspaceId,
  workspaceClientLabel,
  audiences,
  projectEngagementRoleOptions,
  projects,
  projectMemberships,
  config,
  persist,
  onClose,
}: {
  member: WorkspaceMember & { archived?: boolean; organizationLabel?: string };
  workspaceId: string;
  workspaceClientLabel: string;
  audiences: Array<{ id: WorkspaceAudience; label: string }>;
  projectEngagementRoleOptions: Array<{ value: string; label: string }>;
  projects: DashboardApiResponse['workspace']['projects'];
  projectMemberships: DashboardApiResponse['workspace']['projectMemberships'];
  config: WorkspaceConfigV1;
  persist: (next: WorkspaceConfigV1) => void;
  onClose: () => void;
}) {
  const profile = getMemberProfile(config, workspaceId, member.id);

  const updateProfile = (patch: Parameters<typeof setMemberProfile>[0]['patch']) => {
    persist(setMemberProfile({ config, workspaceId, memberId: member.id, patch }));
  };

  const audienceSeesLabel = (id: WorkspaceAudience) =>
    id === 'client' ? workspaceClientLabel : id === 'expert' ? 'Expert' : 'Altvina';

  return (
    <>
      <SheetHeader className="border-b px-6 py-4 text-left">
        <SheetTitle className="text-base font-semibold">{member.displayName}</SheetTitle>
        <p className={cn('text-xs', dashboardTokens.textMuted)}>Member details & visibility</p>
      </SheetHeader>

      <div className="flex flex-col gap-6 px-6 py-5">
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Identity</h3>
          <div className="grid gap-2">
            <label className={cn('text-[11px] font-medium', dashboardTokens.textSubtle)}>Display name</label>
            <Input
              value={profile?.displayName ?? member.displayName}
              onChange={(e) => updateProfile({ displayName: e.target.value })}
              className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}
            />
            <label className={cn('text-[11px] font-medium', dashboardTokens.textSubtle)}>Title</label>
            <Input
              value={profile?.title ?? member.title ?? ''}
              onChange={(e) => updateProfile({ title: e.target.value })}
              className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}
            />
            <label className={cn('text-[11px] font-medium', dashboardTokens.textSubtle)}>Role</label>
            <Select
              value={profile?.role ?? member.role}
              onValueChange={(v) => updateProfile({ role: v as WorkspaceMember['role'] })}
            >
              <SelectTrigger className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
                <SelectItem value="staff">Staff / Altvina</SelectItem>
              </SelectContent>
            </Select>
            <label className={cn('text-[11px] font-medium', dashboardTokens.textSubtle)}>Organization label</label>
            <Input
              value={profile?.organizationLabel ?? ''}
              onChange={(e) => updateProfile({ organizationLabel: e.target.value || undefined })}
              placeholder="e.g. Acme Logistics"
              className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}
            />
            <label className={cn('text-[11px] font-medium', dashboardTokens.textSubtle)}>Bio</label>
            <Input
              value={profile?.bio ?? member.bio ?? ''}
              onChange={(e) => updateProfile({ bio: e.target.value })}
              className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}
            />
            <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <span className={cn('text-xs', dashboardTokens.textSubtle)}>Archived</span>
              <Switch checked={Boolean(profile?.archived)} onCheckedChange={(c) => updateProfile({ archived: c })} />
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Who can see this person?</h3>
          <p className={cn('text-[11px] leading-relaxed', dashboardTokens.textMuted)}>
            Use the rows below to set visibility and how they appear to each audience.
          </p>
          <div className="space-y-3">
            {audiences.map((audience) => {
              const override = getOverride(config, workspaceId, member.id, audience.id);
              const mode = normMode(override);
              return (
                <div
                  key={audience.id}
                  className={cn('space-y-2 rounded-lg border p-3', dashboardTokens.border, dashboardTokens.surfaceMuted)}
                >
                  <div className="text-xs font-semibold">{audience.label}</div>
                  <Select
                    value={mode}
                    onValueChange={(value) =>
                      persist(
                        setOverride({
                          config,
                          workspaceId,
                          memberId: member.id,
                          audience: audience.id,
                          patch: {
                            displayMode: value as WorkspaceDisplayMode,
                            visible: value !== 'hidden',
                          },
                        }),
                      )
                    }
                  >
                    <SelectTrigger className={cn('h-8 rounded-lg text-xs', dashboardTokens.focusRing)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full identity</SelectItem>
                      <SelectItem value="masked">Masked identity</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={(override?.maskedName ?? override?.alias ?? '') as string}
                    onChange={(event) =>
                      persist(
                        setOverride({
                          config,
                          workspaceId,
                          memberId: member.id,
                          audience: audience.id,
                          patch: {
                            maskedName: event.target.value,
                            alias: event.target.value,
                          },
                        }),
                      )
                    }
                    placeholder="Masked name"
                    className={cn('h-8 rounded-lg text-xs', dashboardTokens.focusRing)}
                    disabled={mode !== 'masked'}
                  />
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={override?.showTitle ?? true}
                        onCheckedChange={(checked) =>
                          persist(
                            setOverride({
                              config,
                              workspaceId,
                              memberId: member.id,
                              audience: audience.id,
                              patch: { showTitle: checked },
                            }),
                          )
                        }
                        disabled={mode === 'hidden'}
                      />
                      <span className={cn('text-[11px]', dashboardTokens.textSubtle)}>Show title</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={override?.showBio ?? false}
                        onCheckedChange={(checked) =>
                          persist(
                            setOverride({
                              config,
                              workspaceId,
                              memberId: member.id,
                              audience: audience.id,
                              patch: { showBio: checked },
                            }),
                          )
                        }
                        disabled={mode === 'hidden'}
                      />
                      <span className={cn('text-[11px]', dashboardTokens.textSubtle)}>Show bio</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</h3>
          <div className="grid gap-2">
            {audiences.map((audience) => {
              const override = getOverride(config, workspaceId, member.id, audience.id);
              const mode = normMode(override);
              const displayName =
                mode === 'masked'
                  ? (override?.maskedName ?? override?.alias ?? '').trim() ||
                    `${directoryMemberRoleSingularLabel(member.role, { workspaceClientLabel })} member`
                  : member.displayName;
              const titleVisible = mode !== 'hidden' && (override?.showTitle ?? true);
              const bioVisible = mode !== 'hidden' && (override?.showBio ?? false);
              return (
                <div key={audience.id} className={cn('rounded-lg border p-3', dashboardTokens.border)}>
                  <div className="mb-1 text-[11px] font-semibold">{audienceSeesLabel(audience.id)} sees</div>
                  {mode === 'hidden' ? (
                    <div className={cn('text-xs', dashboardTokens.textMuted)}>Hidden</div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold">{displayName}</div>
                      {titleVisible && member.title ? (
                        <div className={cn('text-xs', dashboardTokens.textSubtle)}>{member.title}</div>
                      ) : null}
                      {bioVisible && member.bio ? (
                        <div className={cn('line-clamp-2 text-xs', dashboardTokens.textMuted)}>{member.bio}</div>
                      ) : null}
                      <div className={cn('text-[10px]', dashboardTokens.textSubtle)}>{visibilityLabelForMode(mode)}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project-specific roles</h3>
          <div className="space-y-2">
            {projects.map((p) => {
              const inProject = projectMemberships.some((pm) => pm.projectId === p.id && pm.memberId === member.id);
              if (!inProject) {
                return null;
              }
              const current =
                getProjectRoleOverride({
                  config,
                  workspaceId,
                  projectId: p.id,
                  memberId: member.id,
                }) ||
                projectMemberships.find((pm) => pm.projectId === p.id && pm.memberId === member.id)?.engagementRole ||
                (member.role === 'expert' ? 'Expert' : member.role === 'staff' ? 'Altvina' : 'Client');
              return (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{p.name}</div>
                  </div>
                  <Select
                    value={current}
                    onValueChange={(value) =>
                      persist(
                        setProjectRoleOverride({
                          config,
                          workspaceId,
                          projectId: p.id,
                          memberId: member.id,
                          engagementRole: value,
                        }),
                      )
                    }
                  >
                    <SelectTrigger className={cn('h-8 w-[120px] rounded-md text-xs', dashboardTokens.focusRing)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projectEngagementRoleOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
            {projects.every(
              (p) => !projectMemberships.some((pm) => pm.projectId === p.id && pm.memberId === member.id),
            ) ? (
              <p className={cn('text-xs', dashboardTokens.textMuted)}>Not assigned to any projects.</p>
            ) : null}
          </div>
        </section>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1 rounded-lg" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}
