'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
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
  const { config } = useModuleAccess();
  const pathname = usePathname();
  const activeRole = data?.role ?? 'viewer';
  const shouldShowSidebarActionRequests = pathname === '/dashboard';

  const tabs = useMemo(() => {
    const enabled = new Set(config.enabledByRole[activeRole] ?? []);
    const visibleModules = dashboardModules
      .filter((m) => m.allowedRoles.includes(activeRole))
      .filter((m) => enabled.has(m.id))
      .filter((m) => m.id !== 'updates')
      .filter((m) => (m.id === 'analytics' ? data?.workspaceFeatures.analyticsEnabled : true))
      .sort((a, b) => a.navOrder - b.navOrder);

    const moduleTabs = visibleModules.map((m) => ({
      id: m.id,
      label: m.label,
      href: m.href,
    }));

    return [
      { id: 'overview', label: 'Overview', href: '/dashboard' },
      ...moduleTabs,
    ];
  }, [
    activeRole,
    config.enabledByRole,
    data?.activeWorkspaceId,
    data?.workspaceFeatures.analyticsEnabled,
  ]);

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
          {/* Narrower gutter on smaller screens, sidebar shrinks from 288→256px to give main more room */}
          <div className="mx-auto flex w-full max-w-7xl gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 lg:gap-6 lg:px-8 lg:py-6">
            <aside className="hidden w-64 shrink-0 lg:block xl:w-72">
              <Sidebar
                assistant={data?.sidebarAssistant}
                actionRequests={
                  shouldShowSidebarActionRequests ? data?.actionRequests : undefined
                }
                activeWorkspaceName={
                  data?.workspaces.find((workspace) => workspace.id === data.activeWorkspaceId)
                    ?.name
                }
              />
            </aside>

            {/* pb-24 gives clearance for MobileBottomNav + safe-area on iOS */}
            <main className="flex min-w-0 flex-1 flex-col gap-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
          <Sheet>
            <div className="sticky top-3 z-40">
              <TopNav
                tabs={tabs}
                user={data?.user}
                role={data?.role}
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
                        'flex items-center justify-center rounded-xl border p-2 focus-within:ring-2 focus-within:ring-ring/40 focus-within:ring-offset-2 focus-within:ring-offset-background',
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
                  actionRequests={
                    shouldShowSidebarActionRequests ? data?.actionRequests : undefined
                  }
                  activeWorkspaceName={
                    data?.workspaces.find((workspace) => workspace.id === data.activeWorkspaceId)
                      ?.name
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
                    'h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700',
                    dashboardTokens.focusRing,
                  )}
                >
                  Retry
                </Button>
              </div>
            </DashboardCard>
          ) : null}

          {!data && isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-12">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(idx === 2 ? 'sm:col-span-2 lg:col-span-4' : 'lg:col-span-4')}
                >
                  <div
                    className={cn(
                      'h-28 animate-pulse rounded-2xl border bg-card/80 p-5 shadow-[var(--elevation-soft)]',
                      dashboardTokens.border,
                    )}
                  />
                </div>
              ))}
              <div className="sm:col-span-2 lg:col-span-8">
                <div
                  className={cn(
                    'h-60 animate-pulse rounded-2xl border bg-card/80 p-5 shadow-[var(--elevation-soft)] sm:h-80',
                    dashboardTokens.border,
                  )}
                />
              </div>
              <div className="lg:col-span-4">
                <div
                  className={cn(
                    'h-60 animate-pulse rounded-2xl border bg-card/80 p-5 shadow-[var(--elevation-soft)] sm:h-80',
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

