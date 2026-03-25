'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, LayoutList, Plus, Rows3 } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
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
import { cn } from '@/lib/utils';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import {
  actionRequestGroupTypes,
  actionRequestLinkTypes,
  actionRequestOpenStatuses,
  actionRequestPipelineColumnOrder,
  actionRequestPriorities,
  actionRequestPriorityLabel,
  actionRequestStatusLabel,
  actionRequestTaskForLabel,
  actionRequestTaskForTypes,
  actionRequestStatuses,
  sortActionRequests,
  type ActionRequestRecord,
} from '@/lib/action-requests';
import { toast } from 'sonner';
import CustomLink from '@/components/shared/Link';

type ViewMode = 'pipeline' | 'table';

type ActionRequestDraft = {
  workspaceId: string;
  title: string;
  description: string;
  taskForType: ActionRequestRecord['taskForType'];
  targetId: string;
  targetLabel: string;
  contextLabel: string;
  priority: ActionRequestRecord['priority'];
  dueDate: string;
  status: ActionRequestRecord['status'];
  linkType: ActionRequestRecord['linkType'];
  linkTarget: string;
};

function newActionRequestDraft(workspaceId: string): ActionRequestDraft {
  return {
    workspaceId,
    title: '',
    description: '',
    taskForType: 'person',
    targetId: '',
    targetLabel: '',
    contextLabel: '',
    priority: 'medium',
    dueDate: '',
    status: 'active',
    linkType: 'custom',
    linkTarget: '/dashboard',
  };
}

function extractDueDateInput(value?: string | null) {
  if (!value) {
    return '';
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toISOString().slice(0, 10);
}

function toDraftValue(request: ActionRequestRecord): ActionRequestDraft {
  return {
    workspaceId: request.workspaceId,
    title: request.title,
    description: request.description ?? '',
    taskForType: request.taskForType,
    targetId: request.targetId ?? '',
    targetLabel: request.targetLabel ?? '',
    contextLabel: request.contextLabel ?? '',
    priority: request.priority,
    dueDate: extractDueDateInput(request.dueDate),
    status: request.status,
    linkType: request.linkType,
    linkTarget: request.linkTarget,
  };
}

function formatDueDate(value?: string | null) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function targetSummary(
  request: ActionRequestRecord,
  members: DashboardApiResponse['workspace']['members'],
  projects: DashboardApiResponse['workspace']['projects'],
  clientLabel: string,
) {
  if (request.taskForType === 'person') {
    const name = members.find((m) => m.id === request.targetId)?.displayName;
    return name ? `Assigned: ${name}` : 'Person';
  }
  if (request.taskForType === 'group') {
    if (request.targetId === 'clients') {
      return `For: All ${clientLabel}`;
    }
    if (request.targetId === 'experts') {
      return 'For: All experts';
    }
    if (request.targetId === 'staff') {
      return 'For: Altvina internal';
    }
    return 'For: Role / group';
  }
  if (request.taskForType === 'projectTeam') {
    const project = projects.find((p) => p.id === request.targetId);
    return project ? `For: ${project.name} team` : 'Project team';
  }
  if (request.taskForType === 'organization') {
    return 'For: Entire organization';
  }
  return actionRequestTaskForLabel[request.taskForType];
}

export function ActionRequestsSection({
  data,
  activeWorkspaceId,
  onChanged,
}: {
  data: DashboardApiResponse;
  activeWorkspaceId: string;
  onChanged?: () => void;
}) {
  const [requestsByWorkspace, setRequestsByWorkspace] = useState<
    Record<string, ActionRequestRecord[]>
  >({});
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActionRequestDraft>(() =>
    newActionRequestDraft(activeWorkspaceId),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tableSort, setTableSort] = useState<{ key: 'dueDate' | 'priority' | 'createdAt'; dir: 'asc' | 'desc' }>({
    key: 'dueDate',
    dir: 'asc',
  });

  const identityId = data.user.id;

  const clientLabelForWorkspace = useCallback(
    (workspaceId: string) =>
      data.workspaces.find((w) => w.id === workspaceId)?.clientLabel?.trim() ?? 'Client',
    [data.workspaces],
  );

  const loadWorkspaceRequests = useCallback(async (workspaceId: string) => {
    setIsLoadingList(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        identityId,
        workspaceId,
      });
      const res = await fetch(`/api/workspace-admin/action-requests?${params.toString()}`, {
        cache: 'no-store',
      });
      const json = (await res.json()) as { items: ActionRequestRecord[] } | { error?: string };
      if (!res.ok) {
        setLoadError((json as { error?: string }).error ?? 'Failed to load action requests.');
        return;
      }
      setRequestsByWorkspace((prev) => ({
        ...prev,
        [workspaceId]: (json as { items: ActionRequestRecord[] }).items,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error.';
      setLoadError(message);
    } finally {
      setIsLoadingList(false);
    }
  }, [identityId]);

  useEffect(() => {
    if (!editingId && !createOpen) {
      setDraft(newActionRequestDraft(activeWorkspaceId));
    }
  }, [activeWorkspaceId, editingId, createOpen]);

  useEffect(() => {
    void loadWorkspaceRequests(activeWorkspaceId);
  }, [activeWorkspaceId, loadWorkspaceRequests]);

  const requestsForWorkspace = useMemo(
    () => requestsByWorkspace[activeWorkspaceId] ?? [],
    [requestsByWorkspace, activeWorkspaceId],
  );

  const personCandidates = useMemo(
    () => (draft.workspaceId === activeWorkspaceId ? data.workspace.members : []),
    [activeWorkspaceId, data.workspace.members, draft.workspaceId],
  );

  const requestsByStatus = useMemo(() => {
    const map = new Map<ActionRequestRecord['status'], ActionRequestRecord[]>();
    for (const status of actionRequestPipelineColumnOrder) {
      map.set(status, []);
    }
    for (const row of requestsForWorkspace) {
      const list = map.get(row.status);
      if (list) {
        list.push(row);
      }
    }
    for (const [status, list] of map) {
      if (actionRequestOpenStatuses.includes(status)) {
        map.set(status, sortActionRequests(list));
      } else {
        map.set(status, sortActionRequests(list));
      }
    }
    return map;
  }, [requestsForWorkspace]);

  const tableRows = useMemo(() => {
    const rows = [...requestsForWorkspace];
    rows.sort((a, b) => {
      const dir = tableSort.dir === 'asc' ? 1 : -1;
      if (tableSort.key === 'priority') {
        const pr = { high: 3, medium: 2, low: 1 } as const;
        return (pr[b.priority] - pr[a.priority]) * dir;
      }
      if (tableSort.key === 'dueDate') {
        const ta = a.dueDate ? Date.parse(a.dueDate) : Number.POSITIVE_INFINITY;
        const tb = b.dueDate ? Date.parse(b.dueDate) : Number.POSITIVE_INFINITY;
        return (ta - tb) * dir;
      }
      return (Date.parse(b.createdAt) - Date.parse(a.createdAt)) * dir;
    });
    return rows;
  }, [requestsForWorkspace, tableSort]);

  const detailRequest = detailId ? requestsForWorkspace.find((r) => r.id === detailId) : null;

  function resetEditor() {
    setEditingId(null);
    setFormError(null);
    setDraft(newActionRequestDraft(activeWorkspaceId));
  }

  async function createOrUpdate() {
    setFormError(null);
    const title = draft.title.trim();
    const linkTarget = draft.linkTarget.trim();
    if (!title) {
      setFormError('Title is required.');
      return;
    }
    if (!linkTarget) {
      setFormError('Related link is required.');
      return;
    }

    setIsSaving(true);
    try {
      const derivedTargetLabel =
        draft.taskForType === 'group'
          ? draft.targetId === 'clients'
            ? `All ${clientLabelForWorkspace(draft.workspaceId)}`
            : draft.targetId === 'experts'
              ? 'All Experts'
              : draft.targetId === 'staff'
                ? 'All Altvina'
                : null
          : draft.taskForType === 'projectTeam'
            ? data.workspace.projects.find((project) => project.id === draft.targetId)?.name ?? null
            : draft.taskForType === 'organization'
              ? 'Entire organization'
              : null;
      const payload = {
        title,
        description: draft.description.trim() || null,
        taskForType: draft.taskForType,
        targetId: draft.targetId.trim() || null,
        targetLabel: draft.targetLabel.trim() || derivedTargetLabel,
        contextLabel: draft.contextLabel.trim() || null,
        priority: draft.priority,
        dueDate: draft.dueDate || null,
        status: draft.status,
        linkType: draft.linkType,
        linkTarget,
      };
      const params = new URLSearchParams({
        identityId,
        workspaceId: draft.workspaceId,
      });
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId ? { id: editingId, ...payload } : payload;
      const res = await fetch(`/api/workspace-admin/action-requests?${params.toString()}`, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFormError(json.error ?? 'Save failed.');
        return;
      }
      await loadWorkspaceRequests(draft.workspaceId);
      resetEditor();
      setCreateOpen(false);
      setDetailId(null);
      onChanged?.();
      toast.success(editingId ? 'Action request updated.' : 'Action request created.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error.';
      setFormError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function updateRequest(
    workspaceId: string,
    payload: Partial<ActionRequestRecord> & { id: string },
    successMessage: string,
    options?: { silent?: boolean; skipReload?: boolean },
  ) {
    try {
      const params = new URLSearchParams({
        identityId,
        workspaceId,
      });
      const res = await fetch(`/api/workspace-admin/action-requests?${params.toString()}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? 'Update failed.');
        return false;
      }
      if (!options?.skipReload) {
        await loadWorkspaceRequests(workspaceId);
      }
      onChanged?.();
      if (!options?.silent) {
        toast.success(successMessage);
      }
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error.';
      toast.error(message);
      return false;
    }
  }

  async function patchDetail(patch: Partial<ActionRequestRecord>) {
    if (!detailRequest) {
      return;
    }
    await updateRequest(
      detailRequest.workspaceId,
      { id: detailRequest.id, ...patch },
      'Updated.',
      { silent: true },
    );
  }

  function beginEdit(request: ActionRequestRecord) {
    setEditingId(request.id);
    setFormError(null);
    setDraft(toDraftValue(request));
    setCreateOpen(true);
  }

  const formWorkspaceProjects =
    draft.workspaceId === activeWorkspaceId ? data.workspace.projects : data.workspace.projects;

  return (
    <DashboardCard
      title="Action requests"
      className="overflow-hidden"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={cn(
              'flex rounded-lg border p-0.5',
              dashboardTokens.border,
              dashboardTokens.surfaceMuted,
            )}
          >
            <Button
              type="button"
              variant={viewMode === 'pipeline' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 gap-1 rounded-md px-2 text-xs"
              onClick={() => setViewMode('pipeline')}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Pipeline
            </Button>
            <Button
              type="button"
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 gap-1 rounded-md px-2 text-xs"
              onClick={() => setViewMode('table')}
            >
              <Rows3 className="h-3.5 w-3.5" />
              Table
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            className={cn(
              'h-8 gap-1 rounded-full bg-primary-600 px-3 text-xs font-semibold text-white hover:bg-primary-700',
              'dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300',
              dashboardTokens.focusRing,
            )}
            onClick={() => {
              resetEditor();
              setCreateOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New request
          </Button>
        </div>
      }
    >
      <p className={cn('mb-4 text-xs', dashboardTokens.textMuted)}>
        Operational dependencies for this workspace. Open items in the{' '}
        <span className="font-semibold">Action Required</span> overview widget.
      </p>

      {!requestsForWorkspace.length ? (
        <div className={cn('rounded-lg border px-4 py-8 text-center text-sm', dashboardTokens.border, dashboardTokens.textMuted)}>
          {isLoadingList ? 'Loading…' : loadError ?? 'No action requests yet.'}
        </div>
      ) : viewMode === 'pipeline' ? (
        <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 snap-x">
          {actionRequestPipelineColumnOrder.map((status) => (
            <div key={status} className="flex w-[240px] shrink-0 snap-start flex-col gap-2 sm:w-[260px]">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {actionRequestStatusLabel[status]}
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {(requestsByStatus.get(status) ?? []).length}
                </span>
              </div>
              <div
                className={cn(
                  'flex min-h-[200px] flex-col gap-2 rounded-xl border p-2',
                  dashboardTokens.border,
                  dashboardTokens.surfaceMuted,
                )}
              >
                {(requestsByStatus.get(status) ?? []).map((request) => {
                  const due = formatDueDate(request.dueDate);
                  const clientLabel = clientLabelForWorkspace(request.workspaceId);
                  const summary = targetSummary(
                    request,
                    data.workspace.members,
                    data.workspace.projects,
                    clientLabel,
                  );
                  return (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => setDetailId(request.id)}
                      className={cn(
                        'rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/40',
                        dashboardTokens.border,
                        dashboardTokens.focusRing,
                      )}
                    >
                      <div className="line-clamp-2 text-sm font-semibold leading-snug">{request.title}</div>
                      <div className={cn('mt-1 text-[11px]', dashboardTokens.textMuted)}>{summary}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                            request.priority === 'high'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                              : request.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
                          )}
                        >
                          {actionRequestPriorityLabel[request.priority]}
                        </span>
                        {due ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            {due}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className={cn('h-10 border-b text-[11px] font-semibold uppercase tracking-wide', dashboardTokens.border, dashboardTokens.textSubtle)}>
                <th className="px-3 py-2">Title</th>
                <th className="hidden px-3 py-2 sm:table-cell">Target</th>
                <th className="px-3 py-2">
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() =>
                      setTableSort((s) => ({
                        key: 'priority',
                        dir: s.key === 'priority' && s.dir === 'desc' ? 'asc' : 'desc',
                      }))
                    }
                  >
                    Priority
                  </button>
                </th>
                <th className="hidden px-3 py-2 md:table-cell">
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() =>
                      setTableSort((s) => ({
                        key: 'dueDate',
                        dir: s.key === 'dueDate' && s.dir === 'asc' ? 'desc' : 'asc',
                      }))
                    }
                  >
                    Due
                  </button>
                </th>
                <th className="hidden px-3 py-2 md:table-cell">Status</th>
                <th className="hidden px-3 py-2 lg:table-cell">Created by</th>
                <th className="hidden px-3 py-2 lg:table-cell">Workspace</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((request) => {
                const clientLabel = clientLabelForWorkspace(request.workspaceId);
                const summary = targetSummary(
                  request,
                  data.workspace.members,
                  data.workspace.projects,
                  clientLabel,
                );
                const wsName = data.workspaces.find((w) => w.id === request.workspaceId)?.name ?? request.workspaceId;
                return (
                  <tr
                    key={request.id}
                    className={cn('h-12 border-b hover:bg-muted/20', dashboardTokens.border)}
                  >
                    <td className="px-3 py-1 align-middle">
                      <button
                        type="button"
                        className={cn('line-clamp-2 max-w-[220px] text-left font-medium hover:underline', dashboardTokens.focusRing)}
                        onClick={() => setDetailId(request.id)}
                      >
                        {request.title}
                      </button>
                    </td>
                    <td className={cn('hidden max-w-[180px] truncate px-3 py-1 align-middle text-xs sm:table-cell', dashboardTokens.textMuted)}>
                      {summary}
                    </td>
                    <td className="px-3 py-1 align-middle text-xs">{actionRequestPriorityLabel[request.priority]}</td>
                    <td className="hidden px-3 py-1 align-middle text-xs md:table-cell">{formatDueDate(request.dueDate) ?? '—'}</td>
                    <td className="hidden px-3 py-1 align-middle text-xs md:table-cell">{actionRequestStatusLabel[request.status]}</td>
                    <td className={cn('hidden px-3 py-1 align-middle text-xs lg:table-cell', dashboardTokens.textMuted)}>
                      {request.createdBy}
                    </td>
                    <td className={cn('hidden px-3 py-1 align-middle text-xs lg:table-cell', dashboardTokens.textMuted)}>{wsName}</td>
                    <td className="px-3 py-1 text-right align-middle">
                      <Button type="button" variant="ghost" size="sm" className="h-8 rounded-md text-xs" onClick={() => beginEdit(request)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={createOpen} onOpenChange={(o) => !o && (setCreateOpen(false), resetEditor())}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit action request' : 'New action request'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-1 flex-col gap-4 pb-6">
            <div className="space-y-1">
              <label className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>Task for</label>
              <Select
                value={draft.taskForType}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    taskForType: value as ActionRequestDraft['taskForType'],
                    targetId: '',
                    targetLabel: '',
                  }))
                }
              >
                <SelectTrigger className={cn('h-10 rounded-lg text-sm', dashboardTokens.focusRing)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionRequestTaskForTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {actionRequestTaskForLabel[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {draft.taskForType === 'person' ? (
              <div className="space-y-1">
                <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Person</label>
                <Select
                  value={draft.targetId || '__none__'}
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      targetId: value === '__none__' ? '' : value,
                    }))
                  }
                  disabled={draft.workspaceId !== activeWorkspaceId}
                >
                  <SelectTrigger className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select person</SelectItem>
                    {personCandidates.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {draft.taskForType === 'group' ? (
              <div className="space-y-1">
                <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Group</label>
                <Select
                  value={draft.targetId || '__none__'}
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      targetId: value === '__none__' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select group</SelectItem>
                    {actionRequestGroupTypes.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group === 'clients'
                          ? clientLabelForWorkspace(draft.workspaceId)
                          : group === 'experts'
                            ? 'Experts'
                            : 'Altvina'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {draft.taskForType === 'projectTeam' ? (
              <div className="space-y-1">
                <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Project</label>
                <Select
                  value={draft.targetId || '__none__'}
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      targetId: value === '__none__' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select project</SelectItem>
                    {formWorkspaceProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-1">
              <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Title</label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}
              />
            </div>
            <div className="space-y-1">
              <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Description</label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                className={cn('min-h-20 rounded-lg text-sm', dashboardTokens.focusRing)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Priority</label>
                <Select
                  value={draft.priority}
                  onValueChange={(value) =>
                    setDraft((prev) => ({ ...prev, priority: value as ActionRequestDraft['priority'] }))
                  }
                >
                  <SelectTrigger className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {actionRequestPriorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {actionRequestPriorityLabel[priority]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Due date</label>
                <Input
                  type="date"
                  value={draft.dueDate}
                  onChange={(e) => setDraft((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Status</label>
              <Select
                value={draft.status}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, status: value as ActionRequestDraft['status'] }))
                }
              >
                <SelectTrigger className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionRequestStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {actionRequestStatusLabel[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Related link</label>
              <Input
                value={draft.linkTarget}
                onChange={(e) => setDraft((prev) => ({ ...prev, linkTarget: e.target.value }))}
                placeholder="/dashboard/projects"
                className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}
              />
            </div>
            <Collapsible>
              <CollapsibleTrigger className={cn('text-xs font-medium underline-offset-4 hover:underline', dashboardTokens.textSubtle)}>
                Advanced
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3">
                <div className="space-y-1">
                  <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Workspace</label>
                  <Select
                    value={draft.workspaceId}
                    onValueChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        workspaceId: value,
                        targetId: '',
                      }))
                    }
                  >
                    <SelectTrigger className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {data.workspaces.map((workspace) => (
                        <SelectItem key={workspace.id} value={workspace.id}>
                          {workspace.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Link type</label>
                  <Select
                    value={draft.linkType}
                    onValueChange={(value) =>
                      setDraft((prev) => ({ ...prev, linkType: value as ActionRequestDraft['linkType'] }))
                    }
                  >
                    <SelectTrigger className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionRequestLinkTypes.map((linkType) => (
                        <SelectItem key={linkType} value={linkType}>
                          {linkType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Context label</label>
                  <Input
                    value={draft.contextLabel}
                    onChange={(e) => setDraft((prev) => ({ ...prev, contextLabel: e.target.value }))}
                    className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
            {formError ? (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200">
                {formError}
              </div>
            ) : null}
            <div className="mt-auto flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 rounded-lg" onClick={() => (setCreateOpen(false), resetEditor())}>
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-lg"
                disabled={isSaving}
                onClick={() => void createOrUpdate()}
              >
                {editingId ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(detailRequest)} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
          {detailRequest ? (
            <>
              <SheetHeader>
                <SheetTitle className="pr-8">{detailRequest.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4 pb-6">
                <div className="space-y-1">
                  <div className={cn('text-[11px] font-semibold uppercase text-muted-foreground')}>Status</div>
                  <Select
                    value={detailRequest.status}
                    onValueChange={(value) =>
                      void patchDetail({ status: value as ActionRequestRecord['status'] })
                    }
                  >
                    <SelectTrigger className={cn('h-9 rounded-lg text-sm', dashboardTokens.focusRing)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionRequestStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {actionRequestStatusLabel[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className={cn('text-[11px] font-semibold uppercase text-muted-foreground')}>Target</div>
                  <p className={cn('mt-1 text-sm', dashboardTokens.textMuted)}>
                    {targetSummary(
                      detailRequest,
                      data.workspace.members,
                      data.workspace.projects,
                      clientLabelForWorkspace(detailRequest.workspaceId),
                    )}
                  </p>
                </div>
                {detailRequest.description ? (
                  <div>
                    <div className={cn('text-[11px] font-semibold uppercase text-muted-foreground')}>Description</div>
                    <p className={cn('mt-1 text-sm', dashboardTokens.textMuted)}>{detailRequest.description}</p>
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-muted-foreground">Priority</div>
                    <div>{actionRequestPriorityLabel[detailRequest.priority]}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-muted-foreground">Due</div>
                    <div>{formatDueDate(detailRequest.dueDate) ?? '—'}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-muted-foreground">Created</div>
                    <div>{formatDueDate(detailRequest.createdAt)}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-muted-foreground">Updated</div>
                    <div>{formatDueDate(detailRequest.updatedAt)}</div>
                  </div>
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-muted-foreground">Audit · </span>
                  <span className={dashboardTokens.textMuted}>
                    {detailRequest.createdBy} → {detailRequest.updatedBy}
                  </span>
                </div>
                <Button type="button" variant="outline" className="rounded-lg" asChild>
                  <CustomLink href={detailRequest.linkTarget}>Open related link</CustomLink>
                </Button>
                <Button
                  type="button"
                  className="rounded-lg"
                  onClick={() => {
                    beginEdit(detailRequest);
                    setDetailId(null);
                  }}
                >
                  Edit in form
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </DashboardCard>
  );
}
