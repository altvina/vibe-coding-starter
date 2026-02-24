'use client';

import { useMemo, useRef, useState } from 'react';
import { ChevronRight, Sparkles, Star, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

import CustomLink from '@/components/shared/Link';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { AvatarGroup } from '@/app/dashboard/_components/avatar-group';
import { SidebarNav } from '@/app/dashboard/_components/sidebar-nav';

const sidebarAvatars = [
  { id: 'a1', initials: 'AR' },
  { id: 'a2', initials: 'LS' },
  { id: 'a3', initials: 'KT' },
  { id: 'a4', initials: 'JM' },
];

type SidebarAssistant = {
  greeting: string;
  headline: string;
  placeholder: string;
  quickActions: Array<{ id: string; label: string }>;
};

type PerformanceEvaluation = {
  title: string;
  rating: number;
  ratingLabel: string;
  note: string;
  distribution: Array<{
    id: string;
    label: string;
    pct: number;
    color: 'primary' | 'secondary' | 'ink';
  }>;
};

export function Sidebar({
  assistant,
  performance,
  navItems,
}: {
  assistant?: SidebarAssistant;
  performance?: PerformanceEvaluation;
  navItems?: Array<{ id: string; label: string; href: string }>;
}) {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const quickPromptByActionId = useMemo(() => {
    return {
      text: 'Draft a clear weekly status update for a client.',
      automation: 'Suggest a simple process automation plan for intake → triage → assignment.',
      schedule: 'Recommend a schedule cadence to reduce meetings and keep projects on track.',
      responses: 'Draft smart response templates for common client questions.',
    } satisfies Record<string, string>;
  }, []);

  async function submitAssistant(nextPrompt?: string) {
    const toSend = (nextPrompt ?? prompt).trim();
    if (!toSend) {
      toast.message('Try asking a specific question.', {
        description: 'Example: “Draft a weekly update for Acme Logistics.”',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: toSend }),
      });

      if (!res.ok) {
        const errorBody = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        toast.error(errorBody?.error ?? 'Assistant request failed.');
        return;
      }

      const data = (await res.json()) as {
        answer: string;
        suggestions?: string[];
      };

      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      toast.message('Altvina Concierge', { description: data.answer });
      setPrompt('');
    } catch (error) {
      void error;
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const assistantFallback = {
    greeting: 'Hi',
    headline: 'How can I help you?',
    placeholder: 'Ask something…',
    quickActions: [
      { id: 'text', label: 'Text Assistance' },
      { id: 'automation', label: 'Process Automation' },
      { id: 'schedule', label: 'Schedule Optimization' },
      { id: 'responses', label: 'Smart Responses' },
    ],
  } as const;

  const performanceFallback = {
    title: 'Performance Evaluation',
    rating: 0,
    ratingLabel: 'Average Rating',
    note: '—',
    distribution: [
      { id: 'excellent', label: 'Excellent', pct: 0, color: 'primary' },
      { id: 'good', label: 'Good', pct: 0, color: 'secondary' },
      { id: 'fair', label: 'Fair', pct: 0, color: 'ink' },
    ],
  } as const;

  const sidebarAssistant = assistant ?? assistantFallback;
  const performanceEvaluation = performance ?? performanceFallback;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <CustomLink
          href="/dashboard"
          className={cn(
            'flex items-center gap-2 rounded-xl px-2 py-1',
            dashboardTokens.focusRing,
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white dark:bg-primary-400 dark:text-slate-950">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold">Altvina</span>
        </CustomLink>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-10 w-10 rounded-xl',
            dashboardTokens.surface,
            dashboardTokens.border,
            dashboardTokens.focusRing,
          )}
          aria-label="Quick help"
        >
          <Wand2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <AvatarGroup avatars={sidebarAvatars} overflowCount={3} />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              'h-10 w-10 rounded-xl',
              dashboardTokens.surface,
              dashboardTokens.border,
              dashboardTokens.focusRing,
            )}
            aria-label="Invite experts"
          >
            <span className="text-sm font-semibold">+</span>
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
            aria-label="View activity"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {navItems?.length ? (
        <DashboardCard title="Navigation">
          <SidebarNav items={navItems} />
        </DashboardCard>
      ) : null}

      {performance ? (
        <DashboardCard
          title={performanceEvaluation.title}
          action={
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-full',
                dashboardTokens.surfaceMuted,
                dashboardTokens.border,
                dashboardTokens.focusRing,
              )}
              aria-label="View performance details"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          }
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              <Star className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-semibold tabular-nums">
                  {performanceEvaluation.rating
                    ? performanceEvaluation.rating.toFixed(1)
                    : '—'}
                </div>
                <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                  {performanceEvaluation.ratingLabel}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {performanceEvaluation.distribution.map((seg) => (
              <div key={seg.id} className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div className={cn('text-xs font-medium', dashboardTokens.textMuted)}>
                    {seg.label}
                  </div>
                  <div className={cn('text-xs tabular-nums', dashboardTokens.textSubtle)}>
                    {seg.pct}%
                  </div>
                </div>
                <div className={cn('h-2 w-full rounded-full', dashboardTokens.surfaceMuted)}>
                  <div
                    className={cn(
                      'h-2 rounded-full',
                      seg.color === 'primary'
                        ? 'bg-primary-600 dark:bg-primary-400'
                        : seg.color === 'secondary'
                          ? 'bg-secondary-600 dark:bg-secondary-400'
                          : 'bg-slate-700 dark:bg-slate-300',
                    )}
                    style={{ width: `${seg.pct}%` }}
                  />
                </div>
              </div>
            ))}
            <div className={cn('text-xs', dashboardTokens.textSubtle)}>
              {performanceEvaluation.note}
            </div>
          </div>
        </DashboardCard>
      ) : (
        <DashboardCard
          title="Next steps"
          action={
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-full',
                dashboardTokens.surfaceMuted,
                dashboardTokens.border,
                dashboardTokens.focusRing,
              )}
              aria-label="View next steps"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          }
        >
          <div className={cn('text-sm', dashboardTokens.textMuted)}>
            Keep collaboration controlled. Use Altvina as the conduit for
            decisions and updates.
          </div>
          <ul className={cn('mt-4 space-y-2 text-sm', dashboardTokens.textMuted)}>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-secondary-600 dark:bg-secondary-400" />
              Share your current priority and success metric.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-600 dark:bg-primary-400" />
              Confirm your next deliverable and due date.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-700 dark:bg-slate-300" />
              Ask the Concierge to draft a clean status update.
            </li>
          </ul>
        </DashboardCard>
      )}

      <div
        className={cn(
          'rounded-2xl p-5 text-white shadow-md',
          'bg-primary-600 dark:bg-primary-700',
        )}
      >
        <div className="space-y-1">
          <div className="text-sm font-semibold">{sidebarAssistant.greeting}</div>
          <div className="text-lg font-bold leading-snug">
            {sidebarAssistant.headline}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {sidebarAssistant.quickActions.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                const next = quickPromptByActionId[a.id] ?? a.label;
                setPrompt(next);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className={cn(
                'rounded-xl bg-white/10 p-3 text-left text-sm font-semibold transition-colors hover:bg-white/15 disabled:opacity-60',
                dashboardTokens.focusRing,
              )}
            >
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="leading-snug">{a.label}</div>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="sr-only" htmlFor="assistant-input">
            Ask Altvina
          </label>
          <div className="relative">
            <input
              id="assistant-input"
              type="text"
              placeholder={sidebarAssistant.placeholder}
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void submitAssistant();
                }
              }}
              disabled={isSubmitting}
              className={cn(
                'h-11 w-full rounded-xl bg-white px-4 pr-11 text-sm text-slate-900 placeholder:text-slate-500',
                'dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-400',
                dashboardTokens.focusRing,
                isSubmitting ? 'opacity-80' : undefined,
              )}
            />
            <button
              type="button"
              onClick={() => void submitAssistant()}
              disabled={isSubmitting}
              className={cn(
                'absolute inset-y-0 right-2 my-2 inline-flex w-9 items-center justify-center rounded-lg bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-60',
                'dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300',
                dashboardTokens.focusRing,
              )}
              aria-label="Send to assistant"
            >
              <Sparkles className="h-5 w-5" />
            </button>
          </div>
        </div>

        {suggestions.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((s) => (
              <button
                key={s}
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setPrompt(s);
                  void submitAssistant(s);
                }}
                className={cn(
                  'rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 transition-colors hover:bg-white/15 disabled:opacity-60',
                  dashboardTokens.focusRing,
                )}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

