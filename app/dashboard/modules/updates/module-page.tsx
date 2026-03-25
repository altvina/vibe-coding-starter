'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, MessageCircle, Send, UsersRound, LayoutGrid, FolderKanban } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import { Checkbox } from '@/components/shared/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shared/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
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
  /** 'workspace' | projectId: which feed to view */
  const [feedFilter, setFeedFilter] = useState<'workspace' | string>('workspace');
  /** When posting: also post to workspace feed and/or these project feeds */
  const [postToWorkspaceFeed, setPostToWorkspaceFeed] = useState(true);
  const [postToProjectIds, setPostToProjectIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = loadStoredUpdates(activeWorkspaceId);
    setLocalUpdates(stored?.updates ?? []);
  }, [activeWorkspaceId]);

  useEffect(() => {
    setTargetWorkspaceIds([activeWorkspaceId]);
  }, [activeWorkspaceId]);

  const members = data?.workspace.members ?? EMPTY_MEMBERS;
  const projects = useMemo(() => data?.workspace.projects ?? [], [data?.workspace.projects]);
  const seedUpdates = data?.workspace.updates ?? EMPTY_UPDATES;
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const currentAuthorId = useMemo(() => {
    const role = data?.role;
    if (!role) return members[0]?.id ?? 'unknown';
    if (role === 'internal' || role === 'admin') {
      return members.find((m) => m.role === 'staff')?.id ?? members[0]?.id ?? 'unknown';
    }
    if (role === 'contractor') {
      return members.find((m) => m.role === 'expert')?.id ?? members[0]?.id ?? 'unknown';
    }
    return members.find((m) => m.role === 'client')?.id ?? members[0]?.id ?? 'unknown';
  }, [data?.role, members]);

  const allUpdates = useMemo(() => {
    const merged = [...localUpdates, ...seedUpdates];
    merged.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
    return merged;
  }, [localUpdates, seedUpdates]);

  const feed = useMemo(() => {
    if (feedFilter === 'workspace') {
      return allUpdates.filter((u) => !u.projectId);
    }
    return allUpdates.filter((u) => u.projectId === feedFilter);
  }, [allUpdates, feedFilter]);

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

  const feedFilterLabel =
    feedFilter === 'workspace' ? 'Workspace feed' : projectById.get(feedFilter)?.name ?? 'Project feed';

  function togglePostToProject(projectId: string) {
    setPostToProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="lg:col-span-12">
        <DashboardCard title="Quick team updates">
          <p className={cn('text-sm', dashboardTokens.textMuted)}>
            Post short updates to your workspace or a project feed. Choose the feed below to view or post to.
          </p>
          <Tabs
            value={feedFilter}
            onValueChange={(v) => setFeedFilter(v)}
            className="mt-4"
          >
            {/* Feed tabs wrap horizontally and scroll when there are many projects */}
            <TabsList className={cn('h-auto max-w-full flex-wrap gap-1 overflow-x-auto bg-muted/60 p-1 dark:bg-muted/40', dashboardTokens.border)}>
              <TabsTrigger
                value="workspace"
                className={cn('gap-2 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900', dashboardTokens.focusRing)}
              >
                <LayoutGrid className="h-4 w-4" />
                Workspace feed
              </TabsTrigger>
              {projects.map((p) => (
                <TabsTrigger
                  key={p.id}
                  value={p.id}
                  className={cn('gap-2 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900', dashboardTokens.focusRing)}
                >
                  <FolderKanban className="h-4 w-4" />
                  {p.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </DashboardCard>
      </div>

      <div className="lg:col-span-12">
        <DashboardCard title="Post an update">
          <div className="space-y-3">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={canPost ? 'What’s new? Share a quick update with the team…' : 'Posting is disabled for your role.'}
              disabled={!canPost}
              className={cn('min-h-24 rounded-2xl', dashboardTokens.focusRing)}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                  {canPost ? 'Post to teams and feeds:' : 'You can still read and comment.'}
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn('h-9 rounded-full px-3 text-xs font-semibold', dashboardTokens.focusRing)}
                      disabled={!canPost}
                    >
                      <UsersRound className="mr-2 h-4 w-4" />
                      {targetLabel}
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

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn('h-9 rounded-full px-3 text-xs font-semibold', dashboardTokens.focusRing)}
                      disabled={!canPost}
                    >
                      <FolderKanban className="mr-2 h-4 w-4" />
                      Feeds: {postToWorkspaceFeed ? 'Workspace' : ''}
                      {postToProjectIds.length ? ` + ${postToProjectIds.length} project(s)` : ''}
                      {!postToWorkspaceFeed && !postToProjectIds.length ? 'None' : ''}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className={cn('w-72 rounded-2xl border p-3', dashboardTokens.surface, dashboardTokens.border)}
                  >
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Show on feeds</div>
                      <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                        Your update will appear on the selected feeds for the chosen teams.
                      </div>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2">
                        <Checkbox
                          checked={postToWorkspaceFeed}
                          onCheckedChange={(c) => setPostToWorkspaceFeed(!!c)}
                        />
                        <span className="text-sm font-medium">Workspace feed</span>
                      </label>
                      {projects.map((p) => (
                        <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2">
                          <Checkbox
                            checked={postToProjectIds.includes(p.id)}
                            onCheckedChange={() => togglePostToProject(p.id)}
                          />
                          <span className="text-sm font-medium">{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                type="button"
                className="rounded-full"
                disabled={
                  !canPost ||
                  body.trim().length < 3 ||
                  targetWorkspaceIds.length === 0 ||
                  (!postToWorkspaceFeed && postToProjectIds.length === 0)
                }
                onClick={() => {
                  const nowIso = new Date().toISOString();
                  const authorName =
                    memberById.get(currentAuthorId)?.displayName ?? data.user.name ?? 'You';
                  const targets = targetWorkspaceIds.length ? targetWorkspaceIds : [activeWorkspaceId];
                  const toCreate: { projectId?: string }[] = [];
                  if (postToWorkspaceFeed) toCreate.push({});
                  postToProjectIds.forEach((id) => toCreate.push({ projectId: id }));

                  const newUpdates = toCreate.map(({ projectId }) =>
                    createLocalUpdate({
                      authorId: currentAuthorId,
                      authorName,
                      body: body.trim(),
                      nowIso,
                      projectId,
                    })
                  );
                  const nextLocal = [...newUpdates, ...localUpdates];

                  targets.forEach((workspaceId) => {
                    if (workspaceId === activeWorkspaceId) {
                      persistUpdates(nextLocal);
                      return;
                    }
                    newUpdates.forEach((u) => prependStoredUpdate(workspaceId, u));
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
        <DashboardCard title={feedFilterLabel}>
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
                        <div className={cn('flex items-center gap-2 text-xs', dashboardTokens.textSubtle)}>
                          {formatDateTime(u.createdAt)}
                          {u.projectId ? (
                            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                              {projectById.get(u.projectId)?.name ?? 'Project'}
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">Workspace</span>
                          )}
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
                {feedFilter === 'workspace'
                  ? 'No workspace updates yet. Post one above or switch to a project feed.'
                  : 'No updates on this project feed yet.'}
              </div>
            ) : null}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

