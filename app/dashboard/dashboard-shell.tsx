'use client';

import { useMemo } from 'react';
import { Menu, Bell, Settings } from 'lucide-react';

import { ThemeSwitch } from '@/components/shared/ThemeSwitch';
import { Button } from '@/components/shared/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/shared/ui/sheet';
import { cn } from '@/lib/utils';

import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { useModuleAccess } from '@/app/dashboard/module-access/module-access-context';
import { dashboardModules } from '@/app/dashboard/modules/registry';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { Sidebar } from '@/app/dashboard/_components/sidebar';
import { TopNav } from '@/app/dashboard/_components/top-nav';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { MobileBottomNav } from '@/app/dashboard/_components/mobile-bottom-nav';
import { NavRail } from '@/app/dashboard/_components/nav-rail';

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isLoading, error, refresh } = useDashboardData();
  const { role } = useDashboardRole();
  const { config } = useModuleAccess();

  const tabs = useMemo(() => {
    const enabled = new Set(config.enabledByRole[role] ?? []);
    const superWorkspaceOnly = new Set(['moduleAccess', 'superAdmin']);
    const isInSuperWorkspace = data?.activeWorkspaceId === 'ws-superadmin';
    const visibleModules = dashboardModules
      .filter((m) => m.allowedRoles.includes(role))
      .filter((m) => enabled.has(m.id))
      .filter((m) => (!superWorkspaceOnly.has(m.id) ? true : isInSuperWorkspace))
      .sort((a, b) => a.navOrder - b.navOrder);

    return [
      { id: 'overview', label: 'Overview', href: '/dashboard' },
      ...visibleModules.map((m) => ({
        id: m.id,
        label: m.label,
        href: m.href,
      })),
    ];
  }, [config.enabledByRole, data?.activeWorkspaceId, role]);

  return (
    <div
      className={cn(
        'min-h-dvh w-full',
        dashboardTokens.appBg,
        dashboardTokens.text,
      )}
    >
      <div className="flex w-full">
        <aside className="hidden shrink-0 lg:block lg:pl-3 lg:pt-3 lg:pb-3">
          <NavRail items={tabs} />
        </aside>

        <div className="flex w-full min-w-0 flex-col">
          <div className="mx-auto flex w-full max-w-7xl gap-4 px-3 py-3 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
            <aside className="hidden w-72 shrink-0 lg:block">
              <Sidebar
                assistant={data?.sidebarAssistant}
                performance={
                  data?.capabilities.canSeeInternalNotes
                    ? data?.performanceEvaluation
                    : undefined
                }
              />
            </aside>

            <main className="flex min-w-0 flex-1 flex-col gap-4 pb-24 lg:pb-0">
          <Sheet>
            <div className="sticky top-3 z-40">
              <TopNav
                tabs={tabs}
                user={data?.user}
                workspaces={data?.workspaces}
                leadingMobileSlot={
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        'h-10 w-10 rounded-xl',
                        dashboardTokens.surface,
                        dashboardTokens.border,
                        dashboardTokens.focusRing,
                      )}
                      aria-label="Open sidebar"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                }
                utilitySlot={
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex items-center justify-center rounded-xl border p-2 focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:ring-offset-2 focus-within:ring-offset-slate-100 dark:focus-within:ring-offset-slate-950',
                        dashboardTokens.surface,
                        dashboardTokens.border,
                      )}
                    >
                      <ThemeSwitch />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        'h-10 w-10 rounded-xl',
                        dashboardTokens.surface,
                        dashboardTokens.border,
                        dashboardTokens.focusRing,
                      )}
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        'h-10 w-10 rounded-xl',
                        dashboardTokens.surface,
                        dashboardTokens.border,
                        dashboardTokens.focusRing,
                      )}
                      aria-label="Settings"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </div>
                }
              />
            </div>

            <SheetContent
              side="left"
              className={cn(
                'w-80 border-r p-0',
                dashboardTokens.appBg,
                dashboardTokens.border,
              )}
            >
              <div className="h-full overflow-auto p-4">
                <Sidebar
                  navItems={tabs}
                  assistant={data?.sidebarAssistant}
                  performance={
                    data?.capabilities.canSeeInternalNotes
                      ? data?.performanceEvaluation
                      : undefined
                  }
                />
              </div>
            </SheetContent>
          </Sheet>

          {error ? (
            <DashboardCard title="Dashboard data unavailable">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className={cn('text-sm', dashboardTokens.textMuted)}>
                  {error}
                </div>
                <Button
                  type="button"
                  onClick={() => void refresh()}
                  className={cn(
                    'h-10 rounded-full bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700',
                    'dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300',
                    dashboardTokens.focusRing,
                  )}
                >
                  Retry
                </Button>
              </div>
            </DashboardCard>
          ) : null}

          {!data && isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(idx === 2 ? 'md:col-span-2 lg:col-span-4' : 'lg:col-span-4')}
                >
                  <div
                    className={cn(
                      'h-28 rounded-2xl border bg-white/60 p-5 shadow-sm animate-pulse',
                      'dark:bg-slate-900/60',
                      dashboardTokens.border,
                    )}
                  />
                </div>
              ))}
              <div className="lg:col-span-8">
                <div
                  className={cn(
                    'h-80 rounded-2xl border bg-white/60 p-5 shadow-sm animate-pulse',
                    'dark:bg-slate-900/60',
                    dashboardTokens.border,
                  )}
                />
              </div>
              <div className="lg:col-span-4">
                <div
                  className={cn(
                    'h-80 rounded-2xl border bg-white/60 p-5 shadow-sm animate-pulse',
                    'dark:bg-slate-900/60',
                    dashboardTokens.border,
                  )}
                />
              </div>
            </div>
          ) : null}

          <div className="min-w-0">{children}</div>
            </main>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <MobileBottomNav tabs={tabs} />
      </div>
    </div>
  );
}

