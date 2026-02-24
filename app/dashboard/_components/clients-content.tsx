'use client';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? '').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase()
  );
}

export function ClientsContent() {
  const { data } = useDashboardData();

  if (!data) {
    return null;
  }

  if (!data.capabilities.canAccessClientsSection) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-12">
          <DashboardCard title="Clients">
            <p className={cn('text-sm', dashboardTokens.textMuted)}>
              This section is only available to Altvina staff/admin in the
              simulation.
            </p>
          </DashboardCard>
        </div>
      </div>
    );
  }

  const clients = Array.from(
    data.manageProjects.rows.reduce<
      Map<string, { name: string; handle: string; count: number }>
    >((acc, row) => {
      const existing = acc.get(row.client.name);
      acc.set(row.client.name, {
        name: row.client.name,
        handle: row.client.handle,
        count: (existing?.count ?? 0) + 1,
      });
      return acc;
    }, new Map()).values(),
  ).sort((a, b) => b.count - a.count);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="lg:col-span-12">
        <DashboardCard title="Clients">
          <p className={cn('text-sm', dashboardTokens.textMuted)}>
            Simulated clients derived from current projects. Next step is adding
            client profiles and a details drawer (still mock-backed).
          </p>
        </DashboardCard>
      </div>

      <div className="lg:col-span-12">
        <DashboardCard title="Active clients">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((c) => (
              <div
                key={c.name}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-2xl border p-4',
                  dashboardTokens.border,
                  dashboardTokens.surfaceMuted,
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {getInitials(c.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{c.name}</div>
                    <div className={cn('truncate text-xs', dashboardTokens.textSubtle)}>
                      {c.handle}
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    'shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold tabular-nums text-slate-700 dark:bg-slate-900 dark:text-slate-200',
                    dashboardTokens.border,
                  )}
                >
                  {c.count} project{c.count === 1 ? '' : 's'}
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

