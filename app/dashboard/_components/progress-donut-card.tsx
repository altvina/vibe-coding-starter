'use client';

import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';

function Donut({
  segments,
}: {
  segments: Array<{ id: string; label: string; pct: number; color: 'primary' | 'secondary' | 'ink' }>;
}) {
  const strokeWidth = 4;
  const radius = 15.9155;
  const circumference = 100;

  let offset = 25;

  return (
    <svg viewBox="0 0 42 42" className="h-40 w-40" role="img" aria-label="Progress donut">
      <circle
        cx="21"
        cy="21"
        r={radius}
        fill="transparent"
        strokeWidth={strokeWidth}
        className={cn('stroke-slate-100 dark:stroke-slate-800')}
      />

      {segments.map((seg) => {
        const dashArray = `${seg.pct} ${circumference - seg.pct}`;
        const strokeClass =
          seg.color === 'primary'
            ? 'stroke-primary-600 dark:stroke-primary-400'
            : seg.color === 'secondary'
              ? 'stroke-secondary-600 dark:stroke-secondary-400'
              : 'stroke-slate-700 dark:stroke-slate-200';

        const node = (
          <circle
            key={seg.id}
            cx="21"
            cy="21"
            r={radius}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={strokeClass}
          />
        );

        offset -= seg.pct;
        return node;
      })}
    </svg>
  );
}

type ProgressDonut = {
  title: string;
  center: { value: number; label: string };
  segments: Array<{ id: string; label: string; pct: number; color: 'primary' | 'secondary' | 'ink' }>;
};

export function ProgressDonutCard({
  progressDonut,
}: {
  progressDonut: ProgressDonut;
}) {
  return (
    <DashboardCard
      title={progressDonut.title}
      action={
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-8 w-8 rounded-full',
            dashboardTokens.surfaceMuted,
            dashboardTokens.border,
            dashboardTokens.focusRing,
          )}
          aria-label="View progress details"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      }
    >
      <div className="flex flex-col items-center">
        <div className="relative">
          <Donut segments={progressDonut.segments} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-3xl font-extrabold tabular-nums">
              {progressDonut.center.value}%
            </div>
            <div className={cn('text-xs', dashboardTokens.textSubtle)}>
              {progressDonut.center.label}
            </div>
          </div>
        </div>

        <div className="mt-4 grid w-full grid-cols-3 gap-3">
          {progressDonut.segments.map((seg) => (
            <div key={seg.id} className="space-y-1 text-center">
              <div className="flex items-center justify-center gap-2">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    seg.color === 'primary'
                      ? 'bg-primary-600 dark:bg-primary-400'
                      : seg.color === 'secondary'
                        ? 'bg-secondary-600 dark:bg-secondary-400'
                        : 'bg-slate-700 dark:bg-slate-200',
                  )}
                />
                <div className={cn('text-xs font-semibold', dashboardTokens.textMuted)}>
                  {seg.label}
                </div>
              </div>
              <div className={cn('text-xs tabular-nums', dashboardTokens.textSubtle)}>
                {seg.pct}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}

