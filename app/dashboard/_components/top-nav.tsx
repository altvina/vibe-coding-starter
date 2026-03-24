'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, ChevronDown, LayoutGrid, Sparkles, LogOut, UserCircle2 } from 'lucide-react';

import CustomLink from '@/components/shared/Link';
import { Button } from '@/components/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shared/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { useDashboardWorkspace } from '@/app/dashboard/dashboard-workspace-context';
import { dashboardRoles, getDashboardRoleLabel } from '@/app/dashboard/dashboard-roles';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/shared/ui/command';
import { groupForHref, iconForHref } from '@/app/dashboard/_components/nav-rail';

export function TopNav({
  tabs,
  user,
  workspaces,
  leadingMobileSlot,
  utilitySlot,
}: {
  tabs: Array<{ id: string; label: string; href: string }>;
  user?: { name: string; email: string; initials: string };
  workspaces?: Array<{ id: string; name: string }>;
  leadingMobileSlot?: ReactNode;
  utilitySlot?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, setRole } = useDashboardRole();
  const { activeWorkspaceId, setActiveWorkspaceId } = useDashboardWorkspace();
  const workspaceLabel =
    workspaces?.find((w) => w.id === activeWorkspaceId)?.name ?? 'Workspace';

  const [appsOpen, setAppsOpen] = useState(false);

  const appItems = useMemo(() => {
    const preferredHrefOrder = [
      '/dashboard',
      '/dashboard/integrations',
      '/dashboard/projects',
      '/dashboard/updates',
      '/dashboard/chat',
      '/dashboard/crm',
      '/dashboard/people',
      '/dashboard/inbox',
      '/dashboard/analytics',
      '/dashboard/workspace-admin',
      '/dashboard/super-admin',
      '/dashboard/module-access',
    ];
    const byHref = new Map(tabs.map((t) => [t.href, t]));
    const preferred = preferredHrefOrder.map((h) => byHref.get(h)).filter(Boolean) as Array<{
      id: string;
      label: string;
      href: string;
    }>;
    const remaining = tabs.filter((t) => !preferred.some((p) => p.href === t.href));
    const remainingSorted = [...remaining].sort((a, b) => a.label.localeCompare(b.label));
    return [...preferred, ...remainingSorted];
  }, [tabs]);

  const groupedApps = useMemo(() => {
    const groups = new Map<string, typeof appItems>();
    appItems.forEach((i) => {
      const key = groupForHref(i.href);
      groups.set(key, [...(groups.get(key) ?? []), i]);
    });
    return [
      ['Home', groups.get('Home') ?? []],
      ['Work', groups.get('Work') ?? []],
      ['Collaboration', groups.get('Collaboration') ?? []],
      ['Admin', groups.get('Admin') ?? []],
    ].filter(([, items]) => items.length) as Array<[string, typeof appItems]>;
  }, [appItems]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const isCmdK = isMac && e.metaKey && e.key.toLowerCase() === 'k';
      const isCtrlK = !isMac && e.ctrlKey && e.key.toLowerCase() === 'k';
      if (isCmdK || isCtrlK) {
        e.preventDefault();
        setAppsOpen(true);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-2xl border p-3',
          'backdrop-blur-2xl backdrop-saturate-150',
          'bg-white/65 dark:bg-slate-950/70',
          'border-white/25 shadow-lg shadow-black/5 dark:border-white/10 dark:shadow-black/20',
          'transition-all duration-300 ease-out',
        )}
      >
      <div className="flex min-w-0 items-center gap-3">
        <div className="lg:hidden">{leadingMobileSlot}</div>

        <CustomLink
          href="/"
          className={cn(
            'flex items-center gap-2 rounded-xl px-2 py-1 font-semibold',
            dashboardTokens.focusRing,
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white dark:bg-primary-400 dark:text-slate-950">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="hidden sm:block">Altvina</span>
        </CustomLink>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className={cn(
              'h-10 gap-2 rounded-full px-3 transition-all duration-300 ease-out active:scale-95',
              dashboardTokens.surface,
              dashboardTokens.border,
              dashboardTokens.focusRing,
            )}
            aria-label="Open app navigation"
            onClick={() => setAppsOpen(true)}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Apps</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'hidden h-10 gap-2 rounded-full px-3 sm:inline-flex',
                  dashboardTokens.surface,
                  dashboardTokens.border,
                  dashboardTokens.focusRing,
                )}
                aria-label="Select workspace"
              >
                <span className="max-w-[10rem] truncate text-sm font-semibold">
                  {workspaceLabel}
                </span>
                <ChevronDown className={cn('h-4 w-4', dashboardTokens.textSubtle)} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(workspaces ?? []).map((w) => (
                <DropdownMenuItem
                  key={w.id}
                  onSelect={() => setActiveWorkspaceId(w.id)}
                >
                  {w.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  'h-10 w-10 rounded-xl sm:hidden',
                  dashboardTokens.surface,
                  dashboardTokens.border,
                  dashboardTokens.focusRing,
                )}
                aria-label="Select workspace"
              >
                <Building2 className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(workspaces ?? []).map((w) => (
                <DropdownMenuItem
                  key={w.id}
                  onSelect={() => setActiveWorkspaceId(w.id)}
                >
                  {w.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {utilitySlot}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-10 gap-3 rounded-xl px-3',
                dashboardTokens.surface,
                dashboardTokens.border,
                dashboardTokens.focusRing,
              )}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {user?.initials ?? '—'}
              </span>
              <span className="hidden text-left sm:block">
                <div className="text-sm font-semibold leading-none">
                  {user?.name ?? 'Loading…'}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                    {user?.email ?? ' '}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {getDashboardRoleLabel(role)}
                  </span>
                </div>
              </span>
              <ChevronDown className={cn('h-4 w-4', dashboardTokens.textSubtle)} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCircle2 />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Role</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={role}
              onValueChange={(value) => {
                const found = dashboardRoles.find((r) => r.id === value);
                if (found) {
                  setRole(found.id);
                }
              }}
            >
              {dashboardRoles.map((r) => (
                <DropdownMenuRadioItem key={r.id} value={r.id}>
                  {r.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>

      <CommandDialog open={appsOpen} onOpenChange={setAppsOpen}>
        <CommandInput placeholder="Search apps… (⌘K / Ctrl+K)" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          {groupedApps.map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((i) => {
                const active =
                  i.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname?.startsWith(i.href);
                const Icon = iconForHref(i.href);
                return (
                  <CommandItem
                    key={i.href}
                    onSelect={() => {
                      setAppsOpen(false);
                      router.push(i.href);
                    }}
                    className={cn(active ? 'bg-accent' : undefined)}
                  >
                    <Icon />
                    <span className="font-semibold">{i.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {i.href.replace('/dashboard', '') || '/'}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

