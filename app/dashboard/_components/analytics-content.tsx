'use client';

import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { RevenueAnalyticsCard } from '@/app/dashboard/_components/revenue-analytics-card';
import { ProgressDonutCard } from '@/app/dashboard/_components/progress-donut-card';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useModuleAccess } from '@/app/dashboard/module-access/module-access-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';

export function AnalyticsContent() {
  const { data } = useDashboardData();
  const { isModuleEnabled } = useModuleAccess();

  if (!data) {
    return null;
  }

  const isEnabled = isModuleEnabled({ role: data.role, moduleId: 'analytics' });
  if (!isEnabled) {
    return (
      <DashboardCard title="Analytics">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          This module is currently disabled for your role.
        </p>
      </DashboardCard>
    );
  }

  const canSeeRevenue = data.role === 'staff_admin';

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {canSeeRevenue ? (
        <div className="lg:col-span-8">
          <RevenueAnalyticsCard revenueAnalytics={data.revenueAnalytics} />
        </div>
      ) : (
        <div className="lg:col-span-8">
          <DashboardCard title="Revenue analytics">
            <p className={cn('text-sm', dashboardTokens.textMuted)}>
              Revenue analytics are available to Staff/Admin only.
            </p>
          </DashboardCard>
        </div>
      )}
      <div className="lg:col-span-4">
        <ProgressDonutCard progressDonut={data.progressDonut} />
      </div>
    </div>
  );
}

