'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

import CustomLink from '@/components/shared/Link';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { groupForHref, iconForHref } from '@/app/dashboard/_components/nav-rail';

type NavItem = { id: string; label: string; href: string };

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

const groupOrder = ['Home', 'Work', 'Collaboration', 'Admin'] as const;

const preferredHrefOrder = [
  '/dashboard',
  '/dashboard/projects',
  '/dashboard/updates',
  '/dashboard/people',
  '/dashboard/inbox',
  '/dashboard/analytics',
  '/dashboard/workspaces',
  '/dashboard/workspace-admin',
  '/dashboard/super-admin',
  '/dashboard/module-access',
] as const;

function orderItems(items: NavItem[]) {
  const byHref = new Map(items.map((i) => [i.href, i]));
  const preferred = preferredHrefOrder.map((h) => byHref.get(h)).filter(Boolean) as NavItem[];
  const remaining = items.filter((i) => !preferred.some((p) => p.href === i.href));
  const remainingSorted = [...remaining].sort((a, b) => a.label.localeCompare(b.label));
  return [...preferred, ...remainingSorted];
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  const grouped = useMemo(() => {
    const sorted = orderItems(items);
    const groups = new Map<string, NavItem[]>();
    sorted.forEach((i) => {
      const key = groupForHref(i.href);
      groups.set(key, [...(groups.get(key) ?? []), i]);
    });
    return groupOrder
      .map((g) => [g, groups.get(g) ?? []] as const)
      .filter(([, list]) => list.length);
  }, [items]);

  return (
    <div className="space-y-4">
      {grouped.map(([group, groupItems]) => (
        <div key={group} className="space-y-2">
          <div className={cn('px-2 text-xs font-semibold', dashboardTokens.textSubtle)}>
            {group}
          </div>
          <div className="space-y-1">
            {groupItems.map((i) => {
              const active = isActivePath(pathname, i.href);
              const Icon = iconForHref(i.href);
              return (
                <CustomLink
                  key={i.href}
                  href={i.href}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors',
                    dashboardTokens.border,
                    dashboardTokens.focusRing,
                    active
                      ? 'border-primary-600 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/10 dark:text-primary-200'
                      : cn(
                          dashboardTokens.surface,
                          dashboardTokens.textMuted,
                          'hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800/40 dark:hover:text-slate-50',
                        ),
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-2xl',
                      active
                        ? 'bg-primary-600 text-white dark:bg-primary-400 dark:text-slate-950'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 truncate">{i.label}</span>
                </CustomLink>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

