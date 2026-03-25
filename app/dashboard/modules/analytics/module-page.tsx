'use client';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { AnalyticsContent } from '@/app/dashboard/_components/analytics-content';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';

export function AnalyticsModulePage() {
  const { data } = useDashboardData();

  if (!data?.workspaceFeatures.analyticsEnabled) {
    return (
      <DashboardCard title="Analytics">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          Analytics is disabled for this workspace. Enable it in Workspace Admin.
        </p>
      </DashboardCard>
    );
  }

  return <AnalyticsContent />;
}

