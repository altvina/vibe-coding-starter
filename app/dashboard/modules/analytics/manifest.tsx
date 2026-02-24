import { formatCurrencyIdr } from '@/app/dashboard/dashboard-format';
import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { RevenueAnalyticsCard } from '@/app/dashboard/_components/revenue-analytics-card';
import { ProgressDonutCard } from '@/app/dashboard/_components/progress-donut-card';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';
import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';

function RevenueKpiWidget({ data }: { data: DashboardApiResponse }) {
  const revenueKpi = data.kpis.find((k) => k.id === 'revenue');
  const value = revenueKpi ? formatCurrencyIdr(revenueKpi.value) : '—';

  return (
    <DashboardCard title="Revenue">
      <div className="text-2xl font-extrabold tabular-nums">{value}</div>
      <div className={cn('mt-1 text-xs', dashboardTokens.textSubtle)}>
        {revenueKpi?.subtext ?? ' '}
      </div>
    </DashboardCard>
  );
}

export const analyticsModule: DashboardModuleDefinition = {
  id: 'analytics',
  label: 'Analytics',
  href: '/dashboard/analytics',
  allowedRoles: ['client', 'expert', 'staff_admin', 'super_admin'],
  navOrder: 40,
  widgets: [
    {
      id: 'analytics.revenueKpi',
      moduleId: 'analytics',
      title: 'Revenue',
      href: '/dashboard/analytics',
      allowedRoles: ['staff_admin', 'super_admin'],
      defaultSize: 'sm',
      render: ({ data }) => <RevenueKpiWidget data={data} />,
    },
    {
      id: 'analytics.revenueAnalytics',
      moduleId: 'analytics',
      title: 'Revenue Analytics',
      href: '/dashboard/analytics',
      allowedRoles: ['staff_admin', 'super_admin'],
      defaultSize: 'lg',
      render: ({ data }) => (
        <RevenueAnalyticsCard revenueAnalytics={data.revenueAnalytics} />
      ),
    },
    {
      id: 'analytics.progress',
      moduleId: 'analytics',
      title: 'Progress',
      href: '/dashboard/analytics',
      allowedRoles: ['client', 'expert', 'staff_admin', 'super_admin'],
      defaultSize: 'md',
      render: ({ data }) => (
        <ProgressDonutCard progressDonut={data.progressDonut} />
      ),
    },
  ],
};

