'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronRight, Filter, Layers3 } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import { Checkbox } from '@/components/shared/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/shared/ui/accordion';
import { cn } from '@/lib/utils';

import type { WorkspaceSubtask, WorkspaceTask } from '@/app/dashboard/dashboard-context';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { useDashboardWorkspace } from '@/app/dashboard/dashboard-workspace-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';

type SubtaskOverrides = Record<string, boolean>;

const EMPTY_MEMBERS: Array<{ id: string; displayName: string; role: 'client' | 'expert' | 'staff' }> = [];
const EMPTY_PROJECTS: Array<{ id: string; name: string; status: 'active' | 'review' | 'done' }> = [];
const EMPTY_TASKS: WorkspaceTask[] = [];
const EMPTY_SUBTASKS: WorkspaceSubtask[] = [];

function subtaskStorageKey(workspaceId: string) {
  return `altvina.dashboard.subtasks.${workspaceId}` as const;
}

function loadSubtaskOverrides(workspaceId: string): SubtaskOverrides {
  try {
    const raw = window.localStorage.getItem(subtaskStorageKey(workspaceId));
    if (!raw) return {};
    return JSON.parse(raw) as SubtaskOverrides;
  } catch (e) {
    void e;
    return {};
  }
}

function saveSubtaskOverrides(workspaceId: string, value: SubtaskOverrides) {
  try {
    window.localStorage.setItem(subtaskStorageKey(workspaceId), JSON.stringify(value));
  } catch (e) {
    void e;
  }
}

function statusLabel(status: WorkspaceTask['status']) {
  if (status === 'todo') return 'To do';
  if (status === 'doing') return 'Doing';
  if (status === 'blocked') return 'Blocked';
  if (status === 'review') return 'In review';
  return 'Done';
}

function statusBadgeClasses(status: WorkspaceTask['status']) {
  if (status === 'done') {
    return 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-200';
  }
  if (status === 'review') {
    return 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200';
  }
  if (status === 'blocked') {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200';
  }
  if (status === 'doing') {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200';
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

export function ProjectsHierarchyPage() {
  const { data } = useDashboardData();
  const { activeWorkspaceId } = useDashboardWorkspace();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<WorkspaceTask['status'] | 'all'>('all');
  const [taskDetailsId, setTaskDetailsId] = useState<string | null>(null);
  const [subtaskOverrides, setSubtaskOverrides] = useState<SubtaskOverrides>({});

  useEffect(() => {
    setSubtaskOverrides(loadSubtaskOverrides(activeWorkspaceId));
  }, [activeWorkspaceId]);

  const members = data?.workspace.members ?? EMPTY_MEMBERS;
  const projects = data?.workspace.projects ?? EMPTY_PROJECTS;
  const tasks = data?.workspace.tasks ?? EMPTY_TASKS;
  const subtasks = data?.workspace.subtasks ?? EMPTY_SUBTASKS;
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const currentMemberId = useMemo(() => {
    const role = data?.role;
    if (!role) return members[0]?.id ?? 'unknown';
    if (role === 'internal' || role === 'admin') {
      return members.find((m) => m.role === 'staff')?.id ?? members[0]?.id ?? 'unknown';
    }
    if (role === 'contractor') {
      return members.find((m) => m.role === 'expert')?.id ?? members[0]?.id ?? 'unknown';
    }
    return members.find((m) => m.role === 'client')?.id ?? members[0]?.id ?? 'unknown';
  }, [data?.role, members]);

  const effectiveSelectedProjectId = selectedProjectId ?? projects[0]?.id ?? null;

  const canToggle = data?.capabilities.canToggleSubtasks ?? false;
  const canEditTasks = data?.capabilities.canEditTasks ?? false;

  const visibleTasks = useMemo(() => {
    const forProject = effectiveSelectedProjectId
      ? tasks.filter((t) => t.projectId === effectiveSelectedProjectId)
      : tasks;

    const byRole =
      data?.role === 'contractor'
        ? forProject.filter((t) => t.assigneeIds.includes(currentMemberId))
        : forProject;

    const byStatus =
      statusFilter === 'all' ? byRole : byRole.filter((t) => t.status === statusFilter);

    return byStatus;
  }, [currentMemberId, data?.role, effectiveSelectedProjectId, statusFilter, tasks]);

  const subtasksByTaskId = useMemo(() => {
    const map = new Map<string, WorkspaceSubtask[]>();
    subtasks.forEach((st) => {
      const next = map.get(st.taskId) ?? [];
      next.push(st);
      map.set(st.taskId, next);
    });
    return map;
  }, [subtasks]);

  const selectedTask =
    taskDetailsId ? tasks.find((t) => t.id === taskDetailsId) ?? null : null;

  const selectedTaskSubtasks = selectedTask
    ? subtasksByTaskId.get(selectedTask.id) ?? []
    : [];

  function isSubtaskDone(st: WorkspaceSubtask) {
    return subtaskOverrides[st.id] ?? st.done;
  }

  function setSubtaskDone(st: WorkspaceSubtask, done: boolean) {
    const next = { ...subtaskOverrides, [st.id]: done };
    setSubtaskOverrides(next);
    saveSubtaskOverrides(activeWorkspaceId, next);
  }

  if (!data) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <DashboardCard title="Projects">
            <div className={cn('text-sm', dashboardTokens.textMuted)}>
              Select a project to see tasks and subtasks.
            </div>

            <div className="mt-4 space-y-2">
              {projects.map((p) => {
                const isActive = p.id === effectiveSelectedProjectId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProjectId(p.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40',
                      dashboardTokens.border,
                      dashboardTokens.focusRing,
                      isActive
                        ? 'border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/10'
                        : dashboardTokens.surface,
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{p.name}</div>
                      <div className={cn('mt-1 text-xs', dashboardTokens.textSubtle)}>
                        Status: {p.status.toUpperCase()}
                      </div>
                    </div>
                    <ChevronRight className={cn('h-4 w-4 shrink-0', dashboardTokens.textSubtle)} />
                  </button>
                );
              })}

              {!projects.length ? (
                <div className={cn('text-sm', dashboardTokens.textMuted)}>
                  No projects yet for this workspace.
                </div>
              ) : null}
            </div>
          </DashboardCard>
        </div>

        <div className="lg:col-span-8">
          <DashboardCard
            title="Tasks"
            action={
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className={cn('hidden text-xs sm:inline-flex', dashboardTokens.textSubtle)}>
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </span>
                {(['all', 'todo', 'doing', 'blocked', 'review', 'done'] as const).map((s) => {
                  const isActive = statusFilter === s;
                  const label = s === 'all' ? 'All' : statusLabel(s);
                  return (
                    <Button
                      key={s}
                      type="button"
                      variant="outline"
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        'h-9 rounded-full px-3 text-xs font-semibold',
                        dashboardTokens.focusRing,
                        isActive
                          ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-700 hover:text-white dark:border-primary-400 dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300'
                          : cn(
                              dashboardTokens.surface,
                              dashboardTokens.border,
                              dashboardTokens.textMuted,
                              'hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50',
                            ),
                      )}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            }
          >
            <div className={cn('text-sm', dashboardTokens.textMuted)}>
              {data.role === 'client'
                ? 'Read-only view. Altvina manages execution with your expert team.'
                : canEditTasks
                  ? 'Toggle subtasks as you execute. Keep updates in the Updates feed.'
                  : 'Read-only view for your role.'}
            </div>

            <div className="mt-4">
              <Accordion type="single" collapsible className="space-y-3">
                {visibleTasks.map((t) => {
                  const tSubtasks = subtasksByTaskId.get(t.id) ?? [];
                  const doneCount = tSubtasks.filter((st) => isSubtaskDone(st)).length;
                  const assignees = t.assigneeIds
                    .map((id) => memberById.get(id)?.displayName)
                    .filter(Boolean) as string[];

                  return (
                    <AccordionItem
                      key={t.id}
                      value={t.id}
                      className={cn('rounded-2xl border px-4', dashboardTokens.border)}
                    >
                      <AccordionTrigger className="py-4 hover:no-underline">
                        <div className="flex w-full min-w-0 items-center justify-between gap-3 pr-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{t.title}</div>
                            <div className={cn('mt-1 flex flex-wrap items-center gap-2 text-xs', dashboardTokens.textSubtle)}>
                              <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', statusBadgeClasses(t.status))}>
                                {statusLabel(t.status)}
                              </span>
                              {t.dueOn ? (
                                <span className="inline-flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span className="tabular-nums">{t.dueOn}</span>
                                </span>
                              ) : null}
                              {assignees.length ? (
                                <span className="inline-flex items-center gap-2">
                                  <Layers3 className="h-4 w-4" />
                                  <span className="truncate">
                                    {assignees.join(', ')}
                                  </span>
                                </span>
                              ) : null}
                              <span className="tabular-nums">
                                {doneCount}/{tSubtasks.length} subtasks
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn('h-9 rounded-full px-3 text-xs font-semibold', dashboardTokens.focusRing)}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setTaskDetailsId(t.id);
                            }}
                          >
                            Details
                          </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="space-y-2">
                          {tSubtasks.map((st) => {
                            const done = isSubtaskDone(st);
                            return (
                              <label
                                key={st.id}
                                className={cn(
                                  'flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900',
                                  !canToggle ? 'cursor-not-allowed opacity-70' : '',
                                )}
                              >
                                <Checkbox
                                  checked={done}
                                  disabled={!canToggle}
                                  onCheckedChange={(checked) => setSubtaskDone(st, Boolean(checked))}
                                />
                                <span className={cn('text-sm', done ? 'line-through' : '')}>
                                  {st.title}
                                </span>
                              </label>
                            );
                          })}
                          {!tSubtasks.length ? (
                            <div className={cn('text-sm', dashboardTokens.textMuted)}>
                              No subtasks yet.
                            </div>
                          ) : null}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              {!visibleTasks.length ? (
                <div className={cn('mt-4 rounded-2xl border p-4 text-sm', dashboardTokens.border, dashboardTokens.textMuted)}>
                  No tasks match this view.
                </div>
              ) : null}
            </div>
          </DashboardCard>
        </div>
      </div>

      <Dialog open={Boolean(selectedTask)} onOpenChange={() => setTaskDetailsId(null)}>
        <DialogContent className="sm:rounded-2xl">
          {selectedTask ? (
            <DialogHeader>
              <DialogTitle>{selectedTask.title}</DialogTitle>
              <DialogDescription>
                {projects.find((p) => p.id === selectedTask.projectId)?.name ?? '—'}
              </DialogDescription>
            </DialogHeader>
          ) : null}

          {selectedTask ? (
            <div className="space-y-4">
              <div className={cn('rounded-2xl border p-4', dashboardTokens.border)}>
                <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                  Status
                </div>
                <div className="mt-2">
                  <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', statusBadgeClasses(selectedTask.status))}>
                    {statusLabel(selectedTask.status)}
                  </span>
                </div>
              </div>

              <div className={cn('rounded-2xl border p-4', dashboardTokens.border)}>
                <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                  Subtasks
                </div>
                <div className={cn('mt-2 text-sm', dashboardTokens.textMuted)}>
                  {selectedTaskSubtasks.filter((st) => isSubtaskDone(st)).length}/
                  {selectedTaskSubtasks.length} completed
                </div>
              </div>

              <Button
                type="button"
                className={cn(
                  'h-10 rounded-full bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700',
                  'dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300',
                  dashboardTokens.focusRing,
                )}
                onClick={() => setTaskDetailsId(null)}
              >
                Done
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

