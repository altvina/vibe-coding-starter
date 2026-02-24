'use client';

import { ArrowDownRight, ArrowUpRight, Briefcase, DollarSign, Users } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

import { type KpiDelta } from '@/app/dashboard/dashboard-data';
import { formatCurrencyIdr, formatDeltaPercent } from '@/app/dashboard/dashboard-format';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';

type Kpi = {
  id: string;
  label: string;
  value: number;
  valueFormat: 'currencyIdr' | 'number';
  subtext: string;
  delta: KpiDelta;
};

const kpiIconById: Record<string, typeof DollarSign> = {
  revenue: DollarSign,
  projectsOngoing: Briefcase,
  clients: Users,
};

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpiIconById[kpi.id] ?? DollarSign;
  const value =
    kpi.valueFormat === 'currencyIdr'
      ? formatCurrencyIdr(kpi.value)
      : new Intl.NumberFormat().format(kpi.value);

  const isPositive = kpi.delta.direction === 'up';

  return (
    <DashboardCard className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>
            {kpi.label}
          </div>
          <div className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight">
            {value}
          </div>
          <div className={cn('mt-1 text-xs', dashboardTokens.textSubtle)}>
            {kpi.subtext}
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-10 w-10 rounded-full',
            dashboardTokens.surfaceMuted,
            dashboardTokens.border,
            dashboardTokens.focusRing,
          )}
          aria-label={`${kpi.label} details`}
        >
          <Icon className={cn('h-5 w-5', dashboardTokens.chartInkText)} />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
            isPositive
              ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-200'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200',
          )}
        >
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          {formatDeltaPercent(kpi.delta.value)}
        </span>
        <span className={cn('text-xs', dashboardTokens.textSubtle)}>
          {kpi.delta.label}
        </span>
      </div>
    </DashboardCard>
  );
}

