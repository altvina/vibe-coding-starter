'use client';

import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

import { formatCurrencyIdr } from '@/app/dashboard/dashboard-format';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';

type RevenueAnalytics = {
  title: string;
  highlightedPointId: string;
  points: Array<{
    id: string;
    weekLabel: string;
    monthLabel: string;
    value: number;
  }>;
};

export function RevenueAnalyticsCard({
  revenueAnalytics,
}: {
  revenueAnalytics: RevenueAnalytics;
}) {
  const [activePointId, setActivePointId] = useState<string | null>(
    revenueAnalytics.highlightedPointId,
  );

  const maxValue = useMemo(
    () => Math.max(...revenueAnalytics.points.map((p) => p.value)),
    [revenueAnalytics.points],
  );

  const activePoint = revenueAnalytics.points.find((p) => p.id === activePointId) ?? null;

  return (
    <DashboardCard
      title={revenueAnalytics.title}
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
          aria-label="View revenue analytics details"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className={cn('text-xs', dashboardTokens.textSubtle)}>
          Weekly revenue highlights
        </div>
        {activePoint ? (
          <div className={cn('text-xs font-semibold tabular-nums', dashboardTokens.textMuted)}>
            {activePoint.weekLabel}:{' '}
            <span className={dashboardTokens.text}>{formatCurrencyIdr(activePoint.value)}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-5 gap-3">
        {revenueAnalytics.points.map((p) => {
          const pct = maxValue === 0 ? 0 : (p.value / maxValue) * 100;
          const isHighlighted = p.id === revenueAnalytics.highlightedPointId;
          const isActive = p.id === activePointId;

          return (
            <div key={p.id} className="flex flex-col items-center gap-3">
              <button
                type="button"
                onMouseEnter={() => setActivePointId(p.id)}
                onMouseLeave={() => setActivePointId(revenueAnalytics.highlightedPointId)}
                onFocus={() => setActivePointId(p.id)}
                onBlur={() => setActivePointId(revenueAnalytics.highlightedPointId)}
                className={cn('relative w-full', dashboardTokens.focusRing)}
                aria-label={`${p.weekLabel}, ${formatCurrencyIdr(p.value)}`}
              >
                <div
                  className={cn(
                    'relative h-40 w-full rounded-full',
                    dashboardTokens.surfaceMuted,
                  )}
                >
                  <div
                    className={cn(
                      'absolute inset-x-0 bottom-0 rounded-full transition-colors',
                      isHighlighted
                        ? 'bg-primary-600 dark:bg-primary-400'
                        : dashboardTokens.chartInk,
                    )}
                    style={{ height: `${pct}%` }}
                  />
                </div>

                <div
                  className={cn(
                    'pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 transition-opacity',
                    isActive ? 'opacity-100' : undefined,
                  )}
                >
                  <div className="relative whitespace-nowrap rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-slate-950">
                    {formatCurrencyIdr(p.value)}
                    <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900 dark:bg-slate-950" />
                  </div>
                </div>
              </button>

              <div className="text-center">
                <div className={cn('text-xs font-semibold', dashboardTokens.textMuted)}>
                  {p.weekLabel}
                </div>
                <div className={cn('text-xs', dashboardTokens.textSubtle)}>{p.monthLabel}</div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}

