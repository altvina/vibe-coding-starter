'use client';

import { ArrowUpRight, ExternalLink } from 'lucide-react';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { resolveWorkspaceLaunch } from '@/app/dashboard/modules/integrations/integrations-stub';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

function attentionLabelFromMessage(args: { subject: string; preview: string; index: number }) {
  const normalized = `${args.subject} ${args.preview}`.toLowerCase();
  if (normalized.includes('@') || normalized.includes('mention')) {
    return 'Mention';
  }
  if (normalized.includes('reply') || normalized.includes('confirm') || normalized.includes('?')) {
    return 'Awaiting response';
  }
  if (args.index === 0) {
    return 'Unread';
  }
  return 'Needs review';
}

export function InboxBridgeWidget({ data }: { data: DashboardApiResponse }) {
  const chatGateway = resolveWorkspaceLaunch('chat', data.activeWorkspaceId);
  const chatHref = chatGateway?.url ?? '/dashboard/chat';
  const external = Boolean(chatGateway?.url);
  const actionableMessages = data.inboxPreview.messages.slice(0, 5);

  return (
    <DashboardCard
      title="Inbox"
      action={
        <Button asChild variant="outline" className={cn('h-9 rounded-full px-3 text-xs', dashboardTokens.focusRing)}>
          <a
            href={chatHref}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
          >
            Open chat
            <ExternalLink className="ml-1 h-3.5 w-3.5" />
          </a>
        </Button>
      }
    >
      <div className={cn('text-sm', dashboardTokens.textMuted)}>
        Where communication needs attention or response.
      </div>
      {actionableMessages.length ? (
        <div className="mt-4 space-y-3">
          {actionableMessages.map((message, index) => (
            <a
              key={message.id}
              href={chatHref}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className={cn(
                'group block rounded-xl border p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40',
                dashboardTokens.border,
                dashboardTokens.focusRing,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="line-clamp-1 text-sm font-semibold">{message.subject}</div>
                  <div className={cn('mt-1 text-xs', dashboardTokens.textSubtle)}>
                    {message.from} • Direct message
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={cn('text-xs', dashboardTokens.textSubtle)}>{message.time}</div>
                  <div
                    className={cn(
                      'mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200',
                    )}
                  >
                    {attentionLabelFromMessage({
                      subject: message.subject,
                      preview: message.preview,
                      index,
                    })}
                  </div>
                </div>
              </div>
              <div className={cn('mt-2 line-clamp-2 text-xs', dashboardTokens.textMuted)}>
                {message.preview}
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                Open chat
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            'mt-4 rounded-xl border px-3 py-2 text-sm',
            dashboardTokens.border,
            dashboardTokens.textMuted,
          )}
        >
          You&apos;re caught up.
        </div>
      )}
    </DashboardCard>
  );
}
