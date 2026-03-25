'use client';

import { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, CalendarDays, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

import CustomLink from '@/components/shared/Link';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';
import {
  actionRequestLinkCtaLabel,
  actionRequestPriorityLabel,
  actionRequestTaskForLabel,
  type DashboardActionRequest,
} from '@/lib/action-requests';

import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { SidebarNav } from '@/app/dashboard/_components/sidebar-nav';

type SidebarAssistant = {
  greeting: string;
  headline: string;
  placeholder: string;
  quickActions: Array<{ id: string; label: string }>;
};

export function Sidebar({
  assistant,
  navItems,
  actionRequests,
  activeWorkspaceName,
}: {
  assistant?: SidebarAssistant;
  navItems?: Array<{ id: string; label: string; href: string }>;
  actionRequests?: DashboardActionRequest[];
  activeWorkspaceName?: string;
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

  const sidebarAssistant = assistant ?? assistantFallback;
  const visibleActionRequests = actionRequests ?? [];

  function formatDueDate(value?: string | null) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(parsed);
  }

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

      {navItems?.length ? (
        <DashboardCard title="Navigation">
          <SidebarNav items={navItems} />
        </DashboardCard>
      ) : null}

      {visibleActionRequests.length ? (
        <DashboardCard title="Action Required">
          <div className={cn('text-xs', dashboardTokens.textMuted)}>
            Active dependencies Altvina is currently waiting on.
          </div>
          <div className="-mx-1 mt-3 overflow-x-auto pb-1">
            <div className="flex gap-3 px-1">
              {visibleActionRequests.map((request) => {
                const dueDate = formatDueDate(request.dueDate);
                const priorityLabel = actionRequestPriorityLabel[request.priority];
                const requestedFromLabel = actionRequestTaskForLabel[request.taskForType];
                const ctaLabel = actionRequestLinkCtaLabel[request.linkType];
                const isHighPriority = request.priority === 'high';
                const description = request.description?.trim();
                const context = request.contextLabel?.trim();
                const targetName = request.targetName?.trim();
                return (
                  <CustomLink
                    key={request.id}
                    href={request.linkTarget}
                    className={cn(
                      'group min-w-[238px] max-w-[238px] rounded-xl border p-3',
                      'transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50',
                      dashboardTokens.surface,
                      dashboardTokens.border,
                      dashboardTokens.focusRing,
                      isHighPriority
                        ? 'border-rose-300/90 dark:border-rose-500/50'
                        : undefined,
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          request.priority === 'high'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                            : request.priority === 'medium'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
                        )}
                      >
                        {priorityLabel}
                      </span>
                      <span className={cn('text-[11px] font-medium', dashboardTokens.textSubtle)}>
                        {requestedFromLabel}
                      </span>
                    </div>
                    <div className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">
                      {request.title}
                    </div>
                    <div className={cn('mt-2 space-y-1 text-[11px]', dashboardTokens.textMuted)}>
                      {targetName ? (
                        <div className="line-clamp-1">Assigned to: {targetName}</div>
                      ) : null}
                      {context ? <div className="line-clamp-1">{context}</div> : null}
                      {activeWorkspaceName ? (
                        <div className="line-clamp-1">{activeWorkspaceName}</div>
                      ) : null}
                      {dueDate ? (
                        <div className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Due {dueDate}
                        </div>
                      ) : null}
                    </div>
                    {description ? (
                      <div className={cn('mt-2 line-clamp-2 text-[11px]', dashboardTokens.textMuted)}>
                        {description}
                      </div>
                    ) : null}
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                      {ctaLabel}
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </CustomLink>
                );
              })}
            </div>
          </div>
        </DashboardCard>
      ) : null}

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

