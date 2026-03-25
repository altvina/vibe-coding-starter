'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Handshake,
  Home,
  LayoutGrid,
  MessageSquare,
  MoreHorizontal,
  UsersRound,
} from 'lucide-react';

import CustomLink from '@/components/shared/Link';
import { Button } from '@/components/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shared/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';

type Tab = { id: string; label: string; href: string };

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

function iconForHref(href: string) {
  if (href === '/dashboard') return Home;
  if (href.startsWith('/dashboard/apps')) return LayoutGrid;
  if (href.startsWith('/dashboard/chat')) return MessageSquare;
  if (href.startsWith('/dashboard/people')) return UsersRound;
  if (href.startsWith('/dashboard/analytics')) return BarChart3;
  if (href.startsWith('/dashboard/clients')) return Handshake;
  return Home;
}

export function MobileBottomNav({
  tabs,
  maxPrimary = 4,
}: {
  tabs: Tab[];
  maxPrimary?: number;
}) {
  const pathname = usePathname();

  const [primary, overflow] = useMemo(() => {
    const unique = tabs.filter(
      (t, idx) => tabs.findIndex((x) => x.href === t.href) === idx,
    );

    const preferredOrder = [
      '/dashboard',
      '/dashboard/apps',
      '/dashboard/projects',
      '/dashboard/people',
      '/dashboard/chat',
    ];

    const byHref = new Map(unique.map((t) => [t.href, t]));
    const preferred = preferredOrder.map((href) => byHref.get(href)).filter(Boolean) as Tab[];
    const remaining = unique.filter((t) => !preferred.some((p) => p.href === t.href));

    const kept = [...preferred, ...remaining].slice(0, maxPrimary);
    const rest = unique.filter((t) => !kept.some((k) => k.href === t.href));
    return [kept, rest] as const;
  }, [maxPrimary, tabs]);

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom,0px)]',
        dashboardTokens.surface,
        dashboardTokens.border,
      )}
      aria-label="Dashboard navigation"
    >
      <div className="mx-auto flex w-full max-w-7xl items-stretch justify-between px-2 py-1.5 sm:px-3 sm:py-2">
        {primary.map((t) => {
          const Icon = iconForHref(t.href);
          const active = isActivePath(pathname, t.href);
          return (
            <CustomLink
              key={t.href}
              href={t.href}
              className={cn(
                /* min-h-[44px] ensures accessible tap target on touch devices */
                'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] font-semibold sm:px-3 sm:py-2 sm:text-xs',
                dashboardTokens.focusRing,
                active
                  ? 'bg-primary-600 text-white dark:bg-primary-500 dark:text-primary-foreground'
                  : cn(
                      dashboardTokens.textMuted,
                      'hover:bg-accent/50 hover:text-foreground',
                    ),
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="leading-none">{t.label}</span>
            </CustomLink>
          );
        })}

        {overflow.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'ml-2 h-auto rounded-2xl px-3 py-2',
                  dashboardTokens.surface,
                  dashboardTokens.border,
                  dashboardTokens.focusRing,
                )}
                aria-label="More sections"
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="ml-2 text-xs font-semibold">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {overflow.map((t) => (
                <DropdownMenuItem key={t.href} asChild>
                  <CustomLink href={t.href}>{t.label}</CustomLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </nav>
  );
}

