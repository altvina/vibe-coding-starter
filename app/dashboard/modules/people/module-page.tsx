'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mail, Plus, Save, Search, Trash2, User2 } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/shared/ui/avatar';
import { Textarea } from '@/components/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';
import { cn } from '@/lib/utils';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { useDashboardWorkspace } from '@/app/dashboard/dashboard-workspace-context';
import type { WorkspaceMember } from '@/app/dashboard/dashboard-context';
import {
  createMemberId,
  defaultPeopleStore,
  loadPeopleStore,
  mergeMembers,
  savePeopleStore,
} from '@/app/dashboard/modules/people/people-storage';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? 'A').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

const EMPTY_MEMBERS: Array<{
  id: string;
  displayName: string;
  role: 'client' | 'expert' | 'staff';
  title?: string;
  bio?: string;
  contactMask?: { email?: boolean; phone?: boolean };
  email?: string;
}> = [];

const EMPTY_PROJECTS: Array<{ id: string; name: string }> = [];
const EMPTY_TASKS: Array<{ id: string; projectId: string; assigneeIds: string[] }> = [];
const EMPTY_PROJECT_MEMBERSHIPS: Array<{ projectId: string; memberId: string; engagementRole: string }> = [];

function projectPillClasses(idx: number) {
  const i = idx % 3;
  if (i === 0) {
    return 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-200';
  }
  if (i === 1) {
    return 'bg-secondary-50 text-secondary-700 dark:bg-secondary-900/20 dark:text-secondary-200';
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

type MemberRole = WorkspaceMember['role'];

type EditableFields = {
  displayName: boolean;
  title: boolean;
  bio: boolean;
  email: boolean;
  role: boolean;
};

function editableFieldsFor(args: { viewerRole: string; isSelf: boolean }): EditableFields {
  const isStaff =
    args.viewerRole === 'staff_admin' || args.viewerRole === 'super_admin';

  if (isStaff) {
    return {
      displayName: true,
      title: true,
      bio: true,
      email: true,
      role: true,
    };
  }

  if (args.isSelf) {
    return {
      displayName: true,
      title: true,
      bio: true,
      email: true,
      role: false,
    };
  }

  return {
    displayName: false,
    title: false,
    bio: false,
    email: false,
    role: false,
  };
}

function labelForMemberRole(role: MemberRole) {
  if (role === 'client') return 'Client';
  if (role === 'expert') return 'Expert';
  return 'Staff';
}

export function PeopleModulePage() {
  const { data } = useDashboardData();
  const { activeWorkspaceId } = useDashboardWorkspace();
  const [query, setQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const baseMembers = data?.workspace.members ?? EMPTY_MEMBERS;
  const projects = data?.workspace.projects ?? EMPTY_PROJECTS;
  const tasks = data?.workspace.tasks ?? EMPTY_TASKS;
  const projectMemberships = data?.workspace.projectMemberships ?? EMPTY_PROJECT_MEMBERSHIPS;
  const [store, setStore] = useState(() => defaultPeopleStore());
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  const [createOpen, setCreateOpen] = useState(false);

  const viewerRole = data?.role ?? 'client';
  const isStaff = viewerRole === 'staff_admin' || viewerRole === 'super_admin';

  useEffect(() => {
    setStore(loadPeopleStore(activeWorkspaceId));
  }, [activeWorkspaceId]);

  function persist(next: ReturnType<typeof defaultPeopleStore>) {
    setStore(next);
    savePeopleStore(activeWorkspaceId, next);
  }

  const members = useMemo(
    () => mergeMembers({ base: baseMembers as WorkspaceMember[], store }),
    [baseMembers, store],
  );

  const projectById = useMemo(
    () => new Map(projects.map((p, idx) => [p.id, { ...p, idx }])),
    [projects],
  );

  const projectIdsByMemberId = useMemo(() => {
    const map = new Map<string, string[]>();
    if (projectMemberships.length) {
      projectMemberships.forEach((pm) => {
        const current = map.get(pm.memberId) ?? [];
        if (!current.includes(pm.projectId)) {
          map.set(pm.memberId, [...current, pm.projectId]);
        }
      });
      return map;
    }

    tasks.forEach((t) => {
      t.assigneeIds.forEach((memberId) => {
        const current = map.get(memberId) ?? [];
        if (!current.includes(t.projectId)) {
          map.set(memberId, [...current, t.projectId]);
        }
      });
    });
    return map;
  }, [projectMemberships, tasks]);

  const engagementRoleByMemberProject = useMemo(() => {
    const map = new Map<string, string>();
    projectMemberships.forEach((pm) => {
      map.set(`${pm.memberId}:${pm.projectId}`, pm.engagementRole);
    });
    return map;
  }, [projectMemberships]);

  const q = query.trim().toLowerCase();
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (!q) return true;
      return (
        m.displayName.toLowerCase().includes(q) ||
        (m.title ?? '').toLowerCase().includes(q)
      );
    });
  }, [members, q]);

  const selected = members.find((m) => m.id === selectedMemberId) ?? null;
  const selectedProjectIds = selected ? projectIdsByMemberId.get(selected.id) ?? [] : [];

  const currentMemberId = useMemo(() => {
    if (!data) return null;
    const role = data.role;
    const memberRole: MemberRole =
      role === 'staff_admin' || role === 'super_admin'
        ? 'staff'
        : role === 'expert'
          ? 'expert'
          : 'client';
    return members.find((m) => m.role === memberRole)?.id ?? null;
  }, [data, members]);

  const currentMember = currentMemberId
    ? members.find((m) => m.id === currentMemberId) ?? null
    : null;

  const [editDraft, setEditDraft] = useState<{
    id: string;
    displayName: string;
    title: string;
    bio: string;
    email: string;
    role: MemberRole;
  } | null>(null);

  useEffect(() => {
    if (!selected) {
      setDialogMode('view');
      setEditDraft(null);
      return;
    }

    setDialogMode('view');
    setEditDraft({
      id: selected.id,
      displayName: selected.displayName,
      title: selected.title ?? '',
      bio: selected.bio ?? '',
      email: selected.email ?? '',
      role: selected.role,
    });
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) {
    return null;
  }

  if (!data.capabilities.canViewMemberDirectory) {
    return (
      <DashboardCard title="People">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          People directory is not available for your role.
        </p>
      </DashboardCard>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-12">
          <DashboardCard title="People">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className={cn('text-sm', dashboardTokens.textMuted)}>
                Workspace members curated by Altvina.
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                <div className="relative w-full sm:max-w-sm">
                  <Search className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', dashboardTokens.textSubtle)} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search people…"
                    className={cn(
                      'h-10 w-full rounded-full border bg-white pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-500',
                      'dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-400',
                      dashboardTokens.border,
                      dashboardTokens.focusRing,
                    )}
                  />
                </div>

                {currentMember ? (
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-10 rounded-full px-4 text-sm font-semibold',
                      dashboardTokens.focusRing,
                      dashboardTokens.surface,
                      dashboardTokens.border,
                    )}
                    onClick={() => {
                      setSelectedMemberId(currentMember.id);
                      setDialogMode('edit');
                    }}
                  >
                    Edit my profile
                  </Button>
                ) : null}

                {isStaff ? (
                  <Button
                    type="button"
                    className={cn(
                      'h-10 rounded-full bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700',
                      'dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300',
                      dashboardTokens.focusRing,
                    )}
                    onClick={() => setCreateOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add person
                  </Button>
                ) : null}
              </div>
            </div>
          </DashboardCard>
        </div>

        <div className="lg:col-span-12">
          <DashboardCard title="Directory">
            <div className="space-y-2">
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMemberId(m.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40',
                    dashboardTokens.border,
                    dashboardTokens.focusRing,
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm font-semibold">
                        {initials(m.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{m.displayName}</div>
                      <div className={cn('truncate text-xs', dashboardTokens.textSubtle)}>
                        {m.title ?? '—'} • {m.role.toUpperCase()}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(projectIdsByMemberId.get(m.id) ?? []).slice(0, 2).map((projectId) => {
                          const p = projectById.get(projectId);
                          if (!p) return null;
                          const engagementRole =
                            engagementRoleByMemberProject.get(`${m.id}:${projectId}`) ?? '';
                          return (
                            <span
                              key={projectId}
                              className={cn(
                                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                                projectPillClasses(p.idx),
                              )}
                            >
                              {p.name}
                              {engagementRole ? (
                                <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold leading-none dark:bg-white/10">
                                  {engagementRole}
                                </span>
                              ) : null}
                            </span>
                          );
                        })}
                        {(projectIdsByMemberId.get(m.id) ?? []).length > 2 ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                              'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200',
                            )}
                          >
                            +{(projectIdsByMemberId.get(m.id) ?? []).length - 2}
                          </span>
                        ) : null}
                        {(projectIdsByMemberId.get(m.id) ?? []).length === 0 ? (
                          <span className={cn('text-xs', dashboardTokens.textSubtle)}>
                            No active projects
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <span className={cn('text-xs', dashboardTokens.textSubtle)}>
                    View
                  </span>
                </button>
              ))}
              {!filteredMembers.length ? (
                <div className={cn('text-sm', dashboardTokens.textMuted)}>
                  No matching members.
                </div>
              ) : null}
            </div>
          </DashboardCard>
        </div>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={() => setSelectedMemberId(null)}>
        <DialogContent className="sm:rounded-2xl">
          {selected ? (
            <DialogHeader>
              <DialogTitle>{selected.displayName}</DialogTitle>
              <DialogDescription>
                {selected.title ?? '—'} • {selected.role.toUpperCase()}
              </DialogDescription>
            </DialogHeader>
          ) : null}

          {selected && editDraft ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className={cn('text-sm', dashboardTokens.textMuted)}>
                  {dialogMode === 'edit' ? 'Edit profile fields.' : 'Profile details.'}
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const isSelf = selected.id === currentMemberId;
                    const fields = editableFieldsFor({ viewerRole, isSelf });
                    const canEditAnyField = Object.values(fields).some(Boolean);

                    return canEditAnyField ? (
                      <Button
                        type="button"
                        variant="outline"
                        className={cn('rounded-full', dashboardTokens.focusRing)}
                        onClick={() => setDialogMode((m) => (m === 'edit' ? 'view' : 'edit'))}
                      >
                        {dialogMode === 'edit' ? 'Cancel' : 'Edit'}
                      </Button>
                    ) : null;
                  })()}

                  {isStaff && selected.id !== currentMemberId ? (
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'rounded-full border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900/30 dark:text-rose-200 dark:hover:bg-rose-900/20',
                        dashboardTokens.focusRing,
                      )}
                      onClick={() => {
                        const next = { ...store };
                        if (next.created.some((m) => m.id === selected.id)) {
                          next.created = next.created.filter((m) => m.id !== selected.id);
                        } else {
                          next.deleted = Array.from(new Set([...next.deleted, selected.id]));
                        }
                        delete next.updated[selected.id];
                        persist(next);
                        setSelectedMemberId(null);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className={cn('rounded-2xl border p-4', dashboardTokens.border)}>
                <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                  Details
                </div>
                {(() => {
                  const isSelf = selected.id === currentMemberId;
                  const fields = editableFieldsFor({ viewerRole, isSelf });

                  if (dialogMode !== 'edit') {
                    return (
                      <div className="mt-3 space-y-2">
                        <div className="text-sm font-semibold">{selected.displayName}</div>
                        <div className={cn('text-sm', dashboardTokens.textMuted)}>
                          {selected.bio ?? 'Altvina-managed profile.'}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                          Display name
                        </div>
                        <Input
                          value={editDraft.displayName}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, displayName: e.target.value })
                          }
                          disabled={!fields.displayName}
                          className={cn('rounded-2xl', dashboardTokens.focusRing)}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                          Title
                        </div>
                        <Input
                          value={editDraft.title}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, title: e.target.value })
                          }
                          disabled={!fields.title}
                          className={cn('rounded-2xl', dashboardTokens.focusRing)}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                          Role
                        </div>
                        <Select
                          value={editDraft.role}
                          onValueChange={(value) =>
                            setEditDraft({ ...editDraft, role: value as MemberRole })
                          }
                          disabled={!fields.role}
                        >
                          <SelectTrigger className={cn('rounded-2xl', dashboardTokens.focusRing)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(['client', 'expert', 'staff'] as const).map((r) => (
                              <SelectItem key={r} value={r}>
                                {labelForMemberRole(r)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                          Bio
                        </div>
                        <Textarea
                          value={editDraft.bio}
                          onChange={(e) => setEditDraft({ ...editDraft, bio: e.target.value })}
                          disabled={!fields.bio}
                          className={cn('rounded-2xl', dashboardTokens.focusRing)}
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                          Email
                        </div>
                        <Input
                          value={editDraft.email}
                          onChange={(e) => setEditDraft({ ...editDraft, email: e.target.value })}
                          disabled={!fields.email}
                          className={cn('rounded-2xl', dashboardTokens.focusRing)}
                        />
                        <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                          Later we can lock fields per role (e.g., prevent email edits for non-staff).
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <Button
                          type="button"
                          className={cn(
                            'h-10 rounded-full bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700',
                            'dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300',
                            dashboardTokens.focusRing,
                          )}
                          onClick={() => {
                            const patch: Partial<WorkspaceMember> = {
                              displayName: editDraft.displayName.trim() || selected.displayName,
                              title: editDraft.title.trim() || undefined,
                              bio: editDraft.bio.trim() || undefined,
                              email: editDraft.email.trim() || undefined,
                              role: editDraft.role,
                            };

                            const next = { ...store, updated: { ...store.updated, [selected.id]: patch } };
                            persist(next);
                            setDialogMode('view');
                          }}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save changes
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className={cn('rounded-2xl border p-4', dashboardTokens.border)}>
                <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                  Projects
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedProjectIds.length ? (
                    selectedProjectIds.map((projectId) => {
                      const p = projectById.get(projectId);
                      if (!p) return null;
                      const engagementRole =
                        engagementRoleByMemberProject.get(`${selected.id}:${projectId}`) ?? '';
                      return (
                        <span
                          key={projectId}
                          className={cn(
                            'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                            projectPillClasses(p.idx),
                          )}
                        >
                          {p.name}
                          {engagementRole ? (
                            <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold leading-none dark:bg-white/10">
                              {engagementRole}
                            </span>
                          ) : null}
                        </span>
                      );
                    })
                  ) : (
                    <div className={cn('text-sm', dashboardTokens.textMuted)}>
                      No current project assignments.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <User2 className={cn('h-4 w-4', dashboardTokens.textSubtle)} />
                  <span className={cn('text-sm', dashboardTokens.textMuted)}>
                    Contact via Altvina
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className={cn('rounded-full', dashboardTokens.focusRing)}
                  disabled={!data.capabilities.canViewContactInfo || !selected.email}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {data.capabilities.canViewContactInfo && selected.email
                    ? selected.email
                    : 'Email hidden'}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add person</DialogTitle>
            <DialogDescription>
              Create a new member record for this workspace (simulation only).
            </DialogDescription>
          </DialogHeader>

          <CreateMemberForm
            onCancel={() => setCreateOpen(false)}
            onCreate={(member) => {
              const next = {
                ...store,
                created: [member, ...store.created],
              };
              persist(next);
              setCreateOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateMemberForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (member: WorkspaceMember) => void;
}) {
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('client');

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
          Display name
        </div>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={cn('rounded-2xl', dashboardTokens.focusRing)}
          placeholder="Full name"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
            Role
          </div>
          <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
            <SelectTrigger className={cn('rounded-2xl', dashboardTokens.focusRing)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['client', 'expert', 'staff'] as const).map((r) => (
                <SelectItem key={r} value={r}>
                  {labelForMemberRole(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
            Title
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={cn('rounded-2xl', dashboardTokens.focusRing)}
            placeholder="e.g., Ops Lead"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
          Email
        </div>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn('rounded-2xl', dashboardTokens.focusRing)}
          placeholder="name@company.com"
        />
      </div>

      <div className="space-y-2">
        <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
          Bio
        </div>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className={cn('rounded-2xl', dashboardTokens.focusRing)}
          placeholder="Short description…"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className={cn('rounded-full', dashboardTokens.focusRing)}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className={cn(
            'rounded-full bg-primary-600 text-white hover:bg-primary-700',
            'dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300',
            dashboardTokens.focusRing,
          )}
          disabled={displayName.trim().length < 2}
          onClick={() => {
            const nowIso = new Date().toISOString();
            onCreate({
              id: createMemberId(nowIso),
              displayName: displayName.trim(),
              role,
              title: title.trim() || undefined,
              bio: bio.trim() || undefined,
              email: email.trim() || undefined,
              contactMask: {},
            });
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create
        </Button>
      </div>
    </div>
  );
}

