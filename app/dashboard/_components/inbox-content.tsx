'use client';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';

export function InboxContent() {
  const { data } = useDashboardData();

  if (!data) {
    return null;
  }

  const inbox = data.inboxPreview;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="lg:col-span-12">
        <DashboardCard title={inbox.title}>
          <p className={cn('text-sm', dashboardTokens.textMuted)}>
            Simulated messages. Next step is adding threads and reply actions
            (still mock-backed) before choosing any real provider.
          </p>
        </DashboardCard>
      </div>

      <div className="lg:col-span-12">
        <DashboardCard title="Recent messages">
          <div className="space-y-3">
            {inbox.messages.map((m) => (
              <button
                key={m.id}
                type="button"
                className={cn(
                  'w-full rounded-2xl border p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40',
                  dashboardTokens.border,
                  dashboardTokens.focusRing,
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{m.subject}</div>
                    <div className={cn('mt-1 truncate text-xs', dashboardTokens.textSubtle)}>
                      From {m.from}
                    </div>
                  </div>
                  <div className={cn('shrink-0 text-xs tabular-nums', dashboardTokens.textSubtle)}>
                    {m.time}
                  </div>
                </div>
                <div className={cn('mt-2 text-sm', dashboardTokens.textMuted)}>
                  {m.preview}
                </div>
              </button>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

