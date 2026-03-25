'use client';

import { ArrowUpRight, CalendarDays } from 'lucide-react';

import CustomLink from '@/components/shared/Link';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';
import {
  actionRequestLinkCtaLabel,
  actionRequestPriorityLabel,
  actionRequestTaskForLabel,
  sortActionRequests,
  type DashboardActionRequest,
} from '@/lib/action-requests';

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

export function ActionRequiredWidget({
  requests,
  activeWorkspaceName,
}: {
  requests: DashboardActionRequest[];
  activeWorkspaceName?: string;
}) {
  const actionableRequests = sortActionRequests(
    requests.filter(
      (request) =>
        ['active', 'in_progress', 'waiting'].includes(request.status) &&
        ['person', 'organization', 'group', 'projectTeam'].includes(request.taskForType),
    ),
  ).slice(0, 6);

  if (!actionableRequests.length) {
    return null;
  }

  return (
    <DashboardCard
      title="Action Required"
      className="border-rose-300/90 bg-rose-50/40 dark:border-rose-500/50 dark:bg-rose-950/10"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={cn('text-sm', dashboardTokens.textMuted)}>
          Active dependencies Altvina is waiting on right now.
        </div>
        <div
          className={cn(
            'rounded-full border px-2.5 py-1 text-xs font-semibold',
            dashboardTokens.border,
            dashboardTokens.textSubtle,
          )}
        >
          {actionableRequests.length} open
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {actionableRequests.map((request) => {
          const dueDate = formatDueDate(request.dueDate);
          const ctaLabel = actionRequestLinkCtaLabel[request.linkType];
          const requestedFromLabel = actionRequestTaskForLabel[request.taskForType];
          const priorityLabel = actionRequestPriorityLabel[request.priority];

          return (
            <CustomLink
              key={request.id}
              href={request.linkTarget}
              className={cn(
                'group block rounded-xl border bg-white/90 p-3 transition-colors hover:bg-white dark:bg-slate-950/40 dark:hover:bg-slate-950/70',
                dashboardTokens.border,
                dashboardTokens.focusRing,
                request.priority === 'high' ? 'border-rose-300/80 dark:border-rose-500/50' : undefined,
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="line-clamp-2 text-sm font-semibold">{request.title}</div>
                  <div className={cn('mt-1 text-xs', dashboardTokens.textSubtle)}>
                    For {requestedFromLabel}
                    {request.targetName ? `: ${request.targetName}` : ''}
                  </div>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    request.priority === 'high'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                      : request.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
                  )}
                >
                  {priorityLabel}
                </span>
              </div>
              <div className={cn('mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]', dashboardTokens.textMuted)}>
                {request.contextLabel ? <span>{request.contextLabel}</span> : null}
                {activeWorkspaceName ? <span>{activeWorkspaceName}</span> : null}
                {dueDate ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Due {dueDate}
                  </span>
                ) : null}
              </div>
              {request.description ? (
                <div className={cn('mt-2 line-clamp-2 text-xs', dashboardTokens.textMuted)}>
                  {request.description}
                </div>
              ) : null}
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                {ctaLabel}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </CustomLink>
          );
        })}
      </div>
    </DashboardCard>
  );
}
