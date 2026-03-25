'use client';

import { ArrowUpRight, ExternalLink } from 'lucide-react';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { resolveWorkspaceLaunch } from '@/app/dashboard/modules/integrations/integrations-stub';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

type SnapshotItem = {
  id: string;
  title: string;
  statusTone: 'blocked' | 'review' | 'progress' | 'active';
  statusLabel: string;
  owner?: string;
  phase?: string;
  dueOn?: string;
  updatedAtLabel: string;
  href: string;
  external: boolean;
};

function formatRelativeTime(value?: string | null) {
  if (!value) {
    return 'Updated recently';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Updated recently';
  }
  const nowMs = Date.now();
  const diffMs = Math.max(0, nowMs - parsed.getTime());
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;

  if (diffMs < hourMs) {
    return 'Updated <1h ago';
  }
  if (diffMs < dayMs) {
    return `Updated ${Math.round(diffMs / hourMs)}h ago`;
  }
  return `Updated ${Math.round(diffMs / dayMs)}d ago`;
}

function firstAssigneeName(args: {
  assigneeIds: string[];
  data: DashboardApiResponse;
}) {
  const assignee = args.assigneeIds
    .map((id) => args.data.workspace.members.find((member) => member.id === id))
    .find(Boolean);
  return assignee?.displayName;
}

export function WorkSnapshotWidget({ data }: { data: DashboardApiResponse }) {
  const planeLaunch = resolveWorkspaceLaunch('projects', data.activeWorkspaceId);
  const planeHref = planeLaunch?.url ?? '/dashboard/projects';
  const external = Boolean(planeLaunch?.url);
  const latestWorkspaceUpdateAt = data.workspace.updates[0]?.createdAt;

  const activeProjectItems: SnapshotItem[] = data.workspace.projects
    .filter((project) => project.status === 'active' || project.status === 'review')
    .map((project) => {
      const projectOwnerId = data.workspace.projectMemberships.find(
        (membership) => membership.projectId === project.id,
      )?.memberId;
      const projectOwner = data.workspace.members.find((member) => member.id === projectOwnerId)?.displayName;

      const projectUpdate = data.workspace.updates.find((update) => update.projectId === project.id);
      return {
        id: `project-${project.id}`,
        title: project.name,
        statusTone: project.status === 'review' ? 'review' : 'active',
        statusLabel: project.status === 'review' ? 'In review' : 'Active project',
        owner: projectOwner,
        updatedAtLabel: formatRelativeTime(projectUpdate?.createdAt ?? latestWorkspaceUpdateAt),
        href: planeHref,
        external,
      };
    });

  const inMotionTaskItems: SnapshotItem[] = data.workspace.tasks
    .filter((task) => task.status === 'doing' || task.status === 'review' || task.status === 'blocked')
    .map((task) => {
      const parentProject = data.workspace.projects.find((project) => project.id === task.projectId);
      return {
        id: `task-${task.id}`,
        title: task.title,
        statusTone:
          task.status === 'blocked'
            ? 'blocked'
            : task.status === 'review'
              ? 'review'
              : 'progress',
        statusLabel:
          task.status === 'blocked'
            ? 'Blocked'
            : task.status === 'review'
              ? 'In review'
              : 'In progress',
        owner: firstAssigneeName({ assigneeIds: task.assigneeIds, data }),
        phase: parentProject?.name,
        dueOn: task.dueOn,
        updatedAtLabel: formatRelativeTime(latestWorkspaceUpdateAt),
        href: planeHref,
        external,
      };
    });

  const statusOrder: Record<SnapshotItem['statusTone'], number> = {
    blocked: 0,
    review: 1,
    progress: 2,
    active: 3,
  };
  const items = [...activeProjectItems, ...inMotionTaskItems]
    .sort((a, b) => statusOrder[a.statusTone] - statusOrder[b.statusTone])
    .slice(0, 5);

  return (
    <DashboardCard
      title="Work Snapshot"
      action={
        <Button asChild variant="outline" className={cn('h-9 rounded-full px-3 text-xs', dashboardTokens.focusRing)}>
          <a
            href={planeHref}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
          >
            Open in Plane
            <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </a>
        </Button>
      }
    >
      <div className={cn('text-sm', dashboardTokens.textMuted)}>
        What work is currently in motion.
      </div>
      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className={cn(
                'group block rounded-xl border p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40',
                dashboardTokens.border,
                dashboardTokens.focusRing,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="line-clamp-2 text-sm font-semibold">{item.title}</div>
                  <div className="mt-1">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        item.statusTone === 'blocked'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                          : item.statusTone === 'review'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                            : item.statusTone === 'progress'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
                      )}
                    >
                      {item.statusLabel}
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-primary-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-primary-300" />
              </div>
              <div className={cn('mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]', dashboardTokens.textMuted)}>
                {item.owner ? <span>Owner: {item.owner}</span> : null}
                {item.phase ? <span>Phase: {item.phase}</span> : null}
                {item.dueOn ? <span>Due: {item.dueOn}</span> : null}
                <span>{item.updatedAtLabel}</span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className={cn('mt-4 text-sm', dashboardTokens.textMuted)}>
          No active or in-review work right now.
        </div>
      )}
    </DashboardCard>
  );
}
