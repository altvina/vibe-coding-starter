'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  AppWindow,
  BarChart3,
  Briefcase,
  Crown,
  Handshake,
  Home,
  Inbox,
  ListChecks,
  KeyRound,
  MessageSquare,
  Sparkles,
  SlidersHorizontal,
  UsersRound,
  Workflow,
  CircleDashed,
} from 'lucide-react';
import { motion, useReducedMotion, type Transition } from 'framer-motion';

import CustomLink from '@/components/shared/Link';
import { cn } from '@/lib/utils';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';

type NavItem = { id: string; label: string; href: string };

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

export function groupForHref(href: string) {
  if (href === '/dashboard') return 'Home';
  if (
    href.startsWith('/dashboard/projects') ||
    href.startsWith('/dashboard/analytics') ||
    href.startsWith('/dashboard/integrations')
  ) {
    return 'Work';
  }
  if (
    href.startsWith('/dashboard/updates') ||
    href.startsWith('/dashboard/chat') ||
    href.startsWith('/dashboard/crm') ||
    href.startsWith('/dashboard/inbox') ||
    href.startsWith('/dashboard/people')
  ) {
    return 'Collaboration';
  }
  return 'Admin';
}

export function iconForHref(href: string) {
  if (href === '/dashboard') return Home;
  if (href.startsWith('/dashboard/integrations')) return AppWindow;
  if (href.startsWith('/dashboard/projects')) return ListChecks;
  if (href.startsWith('/dashboard/updates')) return Workflow;
  if (href.startsWith('/dashboard/chat')) return MessageSquare;
  if (href.startsWith('/dashboard/people')) return UsersRound;
  if (href.startsWith('/dashboard/inbox')) return Inbox;
  if (href.startsWith('/dashboard/analytics')) return BarChart3;
  if (href.startsWith('/dashboard/clients')) return Handshake;
  if (href.startsWith('/dashboard/workspace-admin')) return SlidersHorizontal;
  if (href.startsWith('/dashboard/module-access')) return KeyRound;
  if (href.startsWith('/dashboard/super-admin')) return Crown;
  return CircleDashed;
}

const groupOrder = ['Home', 'Work', 'Collaboration', 'Admin'] as const;

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
] as const;

function orderItems(items: NavItem[]) {
  const byHref = new Map(items.map((i) => [i.href, i]));
  const preferred = preferredHrefOrder.map((h) => byHref.get(h)).filter(Boolean) as NavItem[];
  const remaining = items.filter((i) => !preferred.some((p) => p.href === i.href));
  const remainingSorted = [...remaining].sort((a, b) => a.label.localeCompare(b.label));
  return [...preferred, ...remainingSorted];
}

export function NavRail({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  const grouped = useMemo(() => {
    const ordered = orderItems(items);
    const groups = new Map<string, NavItem[]>();
    ordered.forEach((i) => {
      const key = groupForHref(i.href);
      groups.set(key, [...(groups.get(key) ?? []), i]);
    });
    return groupOrder
      .map((g) => [g, groups.get(g) ?? []] as const)
      .filter(([, list]) => list.length);
  }, [items]);

  return (
    <div
      className={cn(
        'flex h-full flex-col items-center gap-3 rounded-3xl border p-2',
        'transition-colors duration-300',
        dashboardTokens.surface,
        dashboardTokens.border,
      )}
    >
      <div className="mt-1 flex w-full flex-col items-center gap-2">
        <CustomLink
          href="/"
          className={cn(
            'group relative flex h-12 w-12 items-center justify-center rounded-2xl',
            'bg-primary-600 text-white shadow-sm transition-all duration-300 ease-out hover:shadow-md active:scale-95',
            'dark:bg-primary-400 dark:text-slate-950',
            dashboardTokens.focusRing,
          )}
          aria-label="Altvina home"
        >
          <Sparkles className="h-6 w-6" />
          <span
            className={cn(
              'pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 translate-x-1 rounded-2xl border px-3 py-2 text-xs font-semibold opacity-0 shadow-sm',
              'transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100',
              dashboardTokens.surface,
              dashboardTokens.border,
              dashboardTokens.text,
            )}
          >
            Altvina
          </span>
        </CustomLink>
      </div>

      <div className="w-full flex-1 space-y-3">
        {grouped.map(([group, list]) => (
          <div key={group} className="space-y-2">
            <div className="mx-auto h-px w-10 bg-slate-200/70 dark:bg-slate-700/60" />
            <div className="space-y-1">
              {list.map((i) => {
                const active = isActivePath(pathname, i.href);
                const Icon = iconForHref(i.href);
                const motionTransition: Transition = shouldReduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 520, damping: 42, mass: 0.7 };
                return (
                  <CustomLink
                    key={i.href}
                    href={i.href}
                    className={cn(
                      'group relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl',
                      'overflow-hidden transition-all duration-300 ease-out active:scale-95',
                      dashboardTokens.focusRing,
                      !active
                        ? cn(
                            'bg-slate-50 text-slate-700 hover:bg-slate-100',
                            'dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/60',
                          )
                        : 'text-white dark:text-slate-950',
                    )}
                    aria-label={i.label}
                    aria-current={active ? 'page' : undefined}
                  >
                    {active ? (
                      <motion.span
                        layoutId="nav-rail-active-pill"
                        className="absolute inset-0 rounded-2xl bg-primary-600 shadow-sm dark:bg-primary-400"
                        transition={motionTransition}
                      />
                    ) : null}
                    <span className="relative z-10">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span
                      className={cn(
                        'pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 translate-x-1 rounded-2xl border px-3 py-2 text-xs font-semibold opacity-0 shadow-sm',
                        'transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100',
                        dashboardTokens.surface,
                        dashboardTokens.border,
                        dashboardTokens.text,
                      )}
                    >
                      {i.label}
                    </span>
                  </CustomLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={cn('mb-1 text-xs font-semibold', dashboardTokens.textSubtle)}>
        Altvina
      </div>
    </div>
  );
}

