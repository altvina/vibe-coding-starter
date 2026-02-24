'use client';

import { useEffect, useState } from 'react';
import { GripVertical, Maximize2, PencilRuler, X } from 'lucide-react';

import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { useModuleAccess } from '@/app/dashboard/module-access/module-access-context';
import { dashboardModules } from '@/app/dashboard/modules/registry';
import { WidgetBoard } from '@/app/dashboard/_components/widget-board';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';

export function OverviewContent() {
  const { data } = useDashboardData();
  const { role } = useDashboardRole();
  const { isModuleEnabled } = useModuleAccess();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    try {
      const key = 'altvina.dashboard.widgetHintsSeen';
      const seen = window.localStorage.getItem(key) === '1';
      setShowHint(!seen);
    } catch (e) {
      void e;
      setShowHint(true);
    }
  }, []);

  if (!data) {
    return null;
  }

  const widgets = dashboardModules
    .filter((m) => m.allowedRoles.includes(role))
    .filter((m) => isModuleEnabled({ role, moduleId: m.id }))
    .flatMap((m) => m.widgets)
    .filter((w) => w.allowedRoles.includes(role));

  if (!widgets.length) {
    return (
      <DashboardCard title="Overview">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          No widgets are enabled for this role. Staff can enable modules in{' '}
          <span className="font-semibold">Access</span>.
        </p>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardCard
        title="Overview"
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={mode === 'edit' ? 'default' : 'outline'}
              className={cn(
                'h-10 rounded-full px-4 text-sm font-semibold',
                dashboardTokens.focusRing,
                mode === 'edit'
                  ? 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300'
                  : cn(dashboardTokens.surface, dashboardTokens.border),
              )}
              onClick={() => setMode((m) => (m === 'edit' ? 'view' : 'edit'))}
            >
              <PencilRuler className="mr-2 h-4 w-4" />
              {mode === 'edit' ? 'Done' : 'Customize'}
            </Button>
          </div>
        }
      >
        <div className={cn('text-sm', dashboardTokens.textMuted)}>
          {mode === 'edit'
            ? 'Drag with the handle and resize with the diagonal icon.'
            : 'Your workspace snapshot. Customize layout anytime.'}
        </div>
      </DashboardCard>

      {showHint ? (
        <DashboardCard title="Tip">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className={cn('text-sm', dashboardTokens.textMuted)}>
              Tap <span className="font-semibold">Customize</span> to reorder and resize widgets.
              <span className="ml-2 inline-flex items-center gap-3">
                <span className="inline-flex items-center gap-2">
                  <GripVertical className="h-4 w-4" />
                  Drag
                </span>
                <span className="inline-flex items-center gap-2">
                  <Maximize2 className="h-4 w-4" />
                  Resize
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                className={cn(
                  'h-10 rounded-full bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700',
                  'dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300',
                  dashboardTokens.focusRing,
                )}
                onClick={() => {
                  setMode('edit');
                  setShowHint(false);
                  try {
                    window.localStorage.setItem('altvina.dashboard.widgetHintsSeen', '1');
                  } catch (e) {
                    void e;
                  }
                }}
              >
                Customize now
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  'h-10 w-10 rounded-full',
                  dashboardTokens.surface,
                  dashboardTokens.border,
                  dashboardTokens.focusRing,
                )}
                onClick={() => {
                  setShowHint(false);
                  try {
                    window.localStorage.setItem('altvina.dashboard.widgetHintsSeen', '1');
                  } catch (e) {
                    void e;
                  }
                }}
                aria-label="Dismiss tip"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DashboardCard>
      ) : null}

      <WidgetBoard role={role} widgets={widgets} data={data} mode={mode} />
    </div>
  );
}

