'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, MessageCircle, Send, UsersRound } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import { Checkbox } from '@/components/shared/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shared/ui/popover';
import { Textarea } from '@/components/shared/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/shared/ui/avatar';
import { cn } from '@/lib/utils';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import type { WorkspaceUpdate } from '@/app/dashboard/dashboard-context';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { useDashboardWorkspace } from '@/app/dashboard/dashboard-workspace-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import {
  createLocalComment,
  createLocalUpdate,
  loadStoredUpdates,
  prependStoredUpdate,
  saveStoredUpdates,
} from '@/app/dashboard/modules/updates/updates-storage';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? 'A').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    void e;
    return iso;
  }
}

const EMPTY_MEMBERS: Array<{ id: string; displayName: string; role: 'client' | 'expert' | 'staff' }> = [];
const EMPTY_UPDATES: WorkspaceUpdate[] = [];

export function UpdatesModulePage() {
  const { data } = useDashboardData();
  const { activeWorkspaceId } = useDashboardWorkspace();
  const [body, setBody] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [localUpdates, setLocalUpdates] = useState<WorkspaceUpdate[]>([]);
  const [targetWorkspaceIds, setTargetWorkspaceIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = loadStoredUpdates(activeWorkspaceId);
    setLocalUpdates(stored?.updates ?? []);
  }, [activeWorkspaceId]);

  useEffect(() => {
    setTargetWorkspaceIds([activeWorkspaceId]);
  }, [activeWorkspaceId]);

  const members = data?.workspace.members ?? EMPTY_MEMBERS;
  const seedUpdates = data?.workspace.updates ?? EMPTY_UPDATES;
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const currentAuthorId = useMemo(() => {
    const role = data?.role;
    if (!role) return members[0]?.id ?? 'unknown';
    if (role === 'staff_admin' || role === 'super_admin') {
      return members.find((m) => m.role === 'staff')?.id ?? members[0]?.id ?? 'unknown';
    }
    return members.find((m) => m.role === role)?.id ?? members[0]?.id ?? 'unknown';
  }, [data?.role, members]);

  const feed = useMemo(() => {
    const merged = [...localUpdates, ...seedUpdates];
    merged.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
    return merged;
  }, [localUpdates, seedUpdates]);

  const canPost = data?.capabilities.canPostUpdates ?? false;
  const canComment = data?.capabilities.canCommentOnUpdates ?? false;

  function persistUpdates(next: typeof localUpdates) {
    setLocalUpdates(next);
    saveStoredUpdates(activeWorkspaceId, { updates: next });
  }

  const workspaces = useMemo(() => {
    const list = data?.workspaces ?? [];
    return list.length
      ? list
      : [{ id: activeWorkspaceId, name: 'This workspace', clientLabel: 'This workspace' }];
  }, [activeWorkspaceId, data?.workspaces]);
  const workspaceById = useMemo(() => new Map(workspaces.map((w) => [w.id, w] as const)), [workspaces]);

  const targetLabel = useMemo(() => {
    const targets = targetWorkspaceIds.length ? targetWorkspaceIds : [activeWorkspaceId];
    if (targets.length === workspaces.length) return 'All teams';
    if (targets.length === 1) {
      return workspaceById.get(targets[0])?.name ?? 'This team';
    }
    return `${targets.length} teams`;
  }, [activeWorkspaceId, targetWorkspaceIds, workspaceById, workspaces.length]);

  function toggleTarget(workspaceId: string) {
    setTargetWorkspaceIds((prev) => {
      if (prev.includes(workspaceId)) {
        return prev.filter((id) => id !== workspaceId);
      }
      return [...prev, workspaceId];
    });
  }

  if (!data) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="lg:col-span-12">
        <DashboardCard title="Updates">
          <div className={cn('text-sm', dashboardTokens.textMuted)}>
            Shared workspace updates. Altvina keeps comms structured and on-record.
          </div>
        </DashboardCard>
      </div>

      <div className="lg:col-span-12">
        <DashboardCard title="Post an update">
          <div className="space-y-3">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={canPost ? 'Write an update…' : 'Posting is disabled for your role.'}
              disabled={!canPost}
              className={cn('min-h-24 rounded-2xl', dashboardTokens.focusRing)}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                  {canPost
                    ? 'Use this for decisions, handoffs, and weekly snapshots.'
                    : 'You can still read and comment (if enabled).'}
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn('h-9 rounded-full px-3 text-xs font-semibold', dashboardTokens.focusRing)}
                      disabled={!canPost}
                    >
                      <UsersRound className="mr-2 h-4 w-4" />
                      Post to: {targetLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className={cn('w-80 rounded-2xl border p-3', dashboardTokens.surface, dashboardTokens.border)}
                  >
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">Choose teams</div>
                        <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                          Your update will appear on the selected team walls.
                        </div>
                      </div>

                      <div className="max-h-56 space-y-1 overflow-auto pr-1">
                        {workspaces.map((w) => {
                          const isActive = w.id === activeWorkspaceId;
                          const checked = targetWorkspaceIds.includes(w.id);
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => toggleTarget(w.id)}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                                dashboardTokens.border,
                                dashboardTokens.focusRing,
                                checked
                                  ? 'border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/10'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40',
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleTarget(w.id)}
                                onClick={(event) => event.stopPropagation()}
                                aria-label={`Post to ${w.name}`}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">
                                  {w.name}
                                  {isActive ? (
                                    <span className={cn('ml-2 text-xs font-semibold', dashboardTokens.textSubtle)}>
                                      Current
                                    </span>
                                  ) : null}
                                </div>
                                <div className={cn('truncate text-xs', dashboardTokens.textSubtle)}>
                                  {w.clientLabel}
                                </div>
                              </div>
                              {checked ? <Check className={cn('h-4 w-4', dashboardTokens.textSubtle)} /> : null}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={cn('rounded-full', dashboardTokens.focusRing)}
                          onClick={() => setTargetWorkspaceIds(workspaces.map((w) => w.id))}
                        >
                          All teams
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={cn('rounded-full', dashboardTokens.focusRing)}
                          onClick={() => setTargetWorkspaceIds([activeWorkspaceId])}
                        >
                          Only current
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                type="button"
                className="rounded-full"
                disabled={!canPost || body.trim().length < 3 || targetWorkspaceIds.length === 0}
                onClick={() => {
                  const nowIso = new Date().toISOString();
                  const authorName =
                    memberById.get(currentAuthorId)?.displayName ?? data.user.name ?? 'You';
                  const update = createLocalUpdate({
                    authorId: currentAuthorId,
                    authorName,
                    body: body.trim(),
                    nowIso,
                  });

                  const targets = targetWorkspaceIds.length ? targetWorkspaceIds : [activeWorkspaceId];
                  targets.forEach((workspaceId) => {
                    if (workspaceId === activeWorkspaceId) {
                      persistUpdates([update, ...localUpdates]);
                      return;
                    }
                    prependStoredUpdate(workspaceId, update);
                  });

                  setBody('');
                }}
              >
                <Send className="mr-2 h-4 w-4" />
                Post
              </Button>
            </div>
          </div>
        </DashboardCard>
      </div>

      <div className="lg:col-span-12">
        <DashboardCard title="Feed">
          <div className="space-y-4">
            {feed.map((u) => {
              const author =
                memberById.get(u.authorId)?.displayName ?? u.authorName ?? 'Unknown';
              const authorInitials = initials(author);
              const draft = commentDrafts[u.id] ?? '';

              return (
                <div
                  key={u.id}
                  className={cn('rounded-2xl border p-4', dashboardTokens.border)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs font-semibold">
                          {authorInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{author}</div>
                        <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                          {formatDateTime(u.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                      <MessageCircle className="mr-1 inline-block h-4 w-4" />
                      {u.comments.length}
                    </div>
                  </div>

                  <div className="mt-3 whitespace-pre-wrap text-sm">{u.body}</div>

                  {u.comments.length ? (
                    <div className="mt-4 space-y-2">
                      {u.comments.map((c) => {
                        const cAuthor =
                          memberById.get(c.authorId)?.displayName ??
                          c.authorName ??
                          'Unknown';
                        return (
                          <div key={c.id} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-xs font-semibold">{cAuthor}</div>
                              <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                                {formatDateTime(c.createdAt)}
                              </div>
                            </div>
                            <div className={cn('mt-1 text-sm', dashboardTokens.textMuted)}>
                              {c.body}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
                    <Textarea
                      value={draft}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))
                      }
                      placeholder={canComment ? 'Write a comment…' : 'Commenting is disabled for your role.'}
                      disabled={!canComment}
                      className={cn('min-h-16 flex-1 rounded-2xl', dashboardTokens.focusRing)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className={cn('rounded-full', dashboardTokens.focusRing)}
                      disabled={!canComment || draft.trim().length < 2}
                      onClick={() => {
                        const nowIso = new Date().toISOString();
                        const authorName =
                          memberById.get(currentAuthorId)?.displayName ?? data.user.name ?? 'You';
                        const comment = createLocalComment({
                          authorId: currentAuthorId,
                          authorName,
                          body: draft.trim(),
                          nowIso,
                        });

                        const next = localUpdates.map((x) => {
                          if (x.id !== u.id) return x;
                          return { ...x, comments: [...x.comments, comment] };
                        });

                        // If user is commenting on a seed update, we persist a shadow local copy.
                        if (!localUpdates.some((x) => x.id === u.id)) {
                          persistUpdates([{ ...u, comments: [...u.comments, comment] }, ...localUpdates]);
                        } else {
                          persistUpdates(next);
                        }

                        setCommentDrafts((prev) => ({ ...prev, [u.id]: '' }));
                      }}
                    >
                      Comment
                    </Button>
                  </div>
                </div>
              );
            })}

            {!feed.length ? (
              <div className={cn('text-sm', dashboardTokens.textMuted)}>
                No updates yet.
              </div>
            ) : null}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

