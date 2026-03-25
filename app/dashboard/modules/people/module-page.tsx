'use client';

import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Globe, Link2, Lock, Mail, MapPin, Phone, Plus, Save, Search, Trash2, User2 } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
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
import type { DashboardApiResponse, WorkspaceMember } from '@/app/dashboard/dashboard-context';
import {
  directoryMemberRoleSingularLabel,
  engagementRoleDisplayLabel,
} from '@/app/dashboard/workspace-role-labels';
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

function splitDisplayName(displayName: string) {
  const cleaned = displayName.trim().replace(/\s+/g, ' ');
  if (!cleaned) return { firstName: '', lastName: '' };
  const parts = cleaned.split(' ');
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

function buildDisplayName(args: { firstName: string; lastName: string; fallback: string }) {
  const combined = `${args.firstName.trim()} ${args.lastName.trim()}`.trim();
  return combined || args.fallback;
}

const EMPTY_MEMBERS: Array<{
  id: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  username?: string;
  role: 'client' | 'expert' | 'staff';
  headline?: string;
  title?: string;
  bio?: string;
  location?: string;
  phone?: string;
  email?: string;
  linkedInUrl?: string;
  website?: string;
  skills?: string;
  contactMask?: { email?: boolean; phone?: boolean };
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
  firstName: boolean;
  lastName: boolean;
  username: boolean;
  headline: boolean;
  title: boolean;
  bio: boolean;
  location: boolean;
  phone: boolean;
  email: boolean;
  linkedInUrl: boolean;
  website: boolean;
  skills: boolean;
  role: boolean;
};

function editableFieldsFor(args: { viewerRole: string; isSelf: boolean }): EditableFields {
  const isStaff =
    args.viewerRole === 'internal' || args.viewerRole === 'admin';

  if (isStaff) {
    return {
      firstName: true,
      lastName: true,
      username: true,
      headline: true,
      title: true,
      bio: true,
      location: true,
      phone: true,
      email: true,
      linkedInUrl: true,
      website: true,
      skills: true,
      role: true,
    };
  }

  if (args.isSelf) {
    return {
      firstName: true,
      lastName: true,
      username: true,
      headline: true,
      title: true,
      bio: true,
      location: true,
      phone: true,
      email: true,
      linkedInUrl: true,
      website: true,
      skills: true,
      role: false,
    };
  }

  return {
    firstName: false,
    lastName: false,
    username: false,
    headline: false,
    title: false,
    bio: false,
    location: false,
    phone: false,
    email: false,
    linkedInUrl: false,
    website: false,
    skills: false,
    role: false,
  };
}

export function PeopleModulePage() {
  const { activeWorkspaceId } = useDashboardWorkspace();
  const { data, isLoading, error } = useDashboardData();
  const dataMatchesWorkspace = data?.activeWorkspaceId === activeWorkspaceId;

  if (error) {
    return (
      <DashboardCard title="People">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>{error}</p>
      </DashboardCard>
    );
  }

  if (!data || isLoading || !dataMatchesWorkspace) {
    return (
      <DashboardCard title="People">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>Loading directory…</p>
      </DashboardCard>
    );
  }

  return (
    <PeopleModulePageInner
      key={activeWorkspaceId}
      workspaceId={activeWorkspaceId}
      data={data}
    />
  );
}

function PeopleModulePageInner({
  workspaceId,
  data,
}: {
  workspaceId: string;
  data: DashboardApiResponse;
}) {
  const [directoryView, setDirectoryView] = useState<'grid' | 'table'>('grid');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | MemberRole>('all');
  const [projectFilter, setProjectFilter] = useState<'all' | string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'active' | 'masked' | 'hidden'>(
    'all',
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const baseMembers = data.workspace.members ?? EMPTY_MEMBERS;
  const projects = data.workspace.projects ?? EMPTY_PROJECTS;
  const tasks = data.workspace.tasks ?? EMPTY_TASKS;
  const projectMemberships = data.workspace.projectMemberships ?? EMPTY_PROJECT_MEMBERSHIPS;
  const [store, setStore] = useState(() => loadPeopleStore(workspaceId));
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  const [createOpen, setCreateOpen] = useState(false);

  const viewerRole = data.role;
  const isStaff = viewerRole === 'internal' || viewerRole === 'admin';
  const workspaceClientLabel =
    data.workspaces.find((w) => w.id === workspaceId)?.clientLabel?.trim() ?? 'Client';

  function persist(next: ReturnType<typeof defaultPeopleStore>) {
    setStore(next);
    savePeopleStore(workspaceId, next);
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
  function visibilityStatus(member: WorkspaceMember): 'active' | 'masked' | 'hidden' {
    if (member.fieldMask?.name) return 'hidden';
    if (member.fieldMask?.title || member.fieldMask?.bio) return 'masked';
    return 'active';
  }

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (projectFilter !== 'all') {
        const projectIds = projectIdsByMemberId.get(m.id) ?? [];
        if (!projectIds.includes(projectFilter)) return false;
      }
      if (visibilityFilter !== 'all' && visibilityStatus(m) !== visibilityFilter) return false;
      if (!q) return true;
      return (
        m.displayName.toLowerCase().includes(q) ||
        (m.username ?? '').toLowerCase().includes(q) ||
        (m.title ?? '').toLowerCase().includes(q) ||
        (m.bio ?? '').toLowerCase().includes(q)
      );
    });
  }, [members, projectFilter, projectIdsByMemberId, q, roleFilter, visibilityFilter]);

  const selected = members.find((m) => m.id === selectedMemberId) ?? null;
  const selectedProjectIds = selected ? projectIdsByMemberId.get(selected.id) ?? [] : [];

  const currentMemberId = useMemo(() => {
    const role = data.role;
    const memberRole: MemberRole =
      role === 'internal' || role === 'admin'
        ? 'staff'
        : role === 'contractor'
          ? 'expert'
          : 'client';
    return members.find((m) => m.role === memberRole)?.id ?? null;
  }, [data.role, members]);

  const currentMember = currentMemberId
    ? members.find((m) => m.id === currentMemberId) ?? null
    : null;

  const [editDraft, setEditDraft] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    headline: string;
    title: string;
    bio: string;
    location: string;
    phone: string;
    email: string;
    linkedInUrl: string;
    website: string;
    skills: string;
    role: MemberRole;
  } | null>(null);

  useEffect(() => {
    if (!selected) {
      setDialogMode('view');
      setEditDraft(null);
      return;
    }

    const split = splitDisplayName(selected.displayName);
    setDialogMode('view');
    setEditDraft({
      id: selected.id,
      firstName: selected.firstName ?? split.firstName,
      lastName: selected.lastName ?? split.lastName,
      username: selected.username ?? '',
      headline: selected.headline ?? '',
      title: selected.title ?? '',
      bio: selected.bio ?? '',
      location: selected.location ?? '',
      phone: selected.phone ?? '',
      email: selected.email ?? '',
      linkedInUrl: selected.linkedInUrl ?? '',
      website: selected.website ?? '',
      skills: selected.skills ?? '',
      role: selected.role,
    });
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
                Directory for people, roles, and visibility.
              </div>
              {/* Action bar wraps gracefully: search → view toggle → profile/add buttons */}
              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:items-center sm:justify-end">
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

                <div className="inline-flex rounded-full border p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={directoryView === 'grid' ? 'default' : 'ghost'}
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => setDirectoryView('grid')}
                  >
                    Grid
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={directoryView === 'table' ? 'default' : 'ghost'}
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => setDirectoryView('table')}
                  >
                    Table
                  </Button>
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
            {/* Filters wrap: 1→2→4 columns as width allows */}
            <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
                <SelectTrigger className={cn('h-9 rounded-lg text-xs', dashboardTokens.focusRing)}>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="client">
                    {directoryMemberRoleSingularLabel('client', { workspaceClientLabel })}
                  </SelectItem>
                  <SelectItem value="expert">
                    {directoryMemberRoleSingularLabel('expert', { workspaceClientLabel })}
                  </SelectItem>
                  <SelectItem value="staff">
                    {directoryMemberRoleSingularLabel('staff', { workspaceClientLabel })}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className={cn('h-9 rounded-lg text-xs', dashboardTokens.focusRing)}>
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={visibilityFilter} onValueChange={(value) => setVisibilityFilter(value as typeof visibilityFilter)}>
                <SelectTrigger className={cn('h-9 rounded-lg text-xs', dashboardTokens.focusRing)}>
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All visibility</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="masked">Masked</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
              <Select value="workspace">
                <SelectTrigger className={cn('h-9 rounded-lg text-xs', dashboardTokens.focusRing)}>
                  <SelectValue placeholder="Organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workspace">Current workspace</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={cn(directoryView === 'grid' ? 'grid grid-cols-1 gap-2 lg:grid-cols-2' : 'space-y-2')}>
              {filteredMembers.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'rounded-2xl border p-4',
                    dashboardTokens.border,
                    directoryView === 'table' ? 'flex items-center justify-between gap-4' : '',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm font-semibold">
                        {initials(m.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold">{m.displayName}</span>
                        <Badge variant="secondary" className="text-[10px] font-semibold">
                          {directoryMemberRoleSingularLabel(m.role, { workspaceClientLabel })}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {visibilityStatus(m).toUpperCase()}
                        </Badge>
                      </div>
                      <div className={cn('truncate text-xs', dashboardTokens.textSubtle)}>
                        {m.title ?? 'No title'} {m.headline ? `· ${m.headline}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 md:mt-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn('rounded-full text-xs', dashboardTokens.focusRing)}
                      onClick={() => {
                        setSelectedMemberId(m.id);
                        setDialogMode('view');
                      }}
                    >
                      View profile
                    </Button>
                    {isStaff ? (
                      <Button
                        type="button"
                        size="sm"
                        className={cn('rounded-full text-xs', dashboardTokens.focusRing)}
                        onClick={() => {
                          setSelectedMemberId(m.id);
                          setDialogMode('edit');
                        }}
                      >
                        Edit
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              {!filteredMembers.length ? (
                <div className={cn('text-sm', dashboardTokens.textMuted)}>
                  No matching members.
                </div>
              ) : null}
            </div>
          </DashboardCard>
        </div>

        {isStaff ? (
          <div className="lg:col-span-12">
            <DashboardCard title="Admin Management">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className={cn('rounded-xl border p-3', dashboardTokens.border, dashboardTokens.surfaceMuted)}>
                  <div className="text-sm font-semibold">Person management</div>
                  <div className={cn('mt-1 text-xs', dashboardTokens.textMuted)}>
                    Create, edit, and archive people from the directory.
                  </div>
                  <Button
                    type="button"
                    className={cn('mt-3 rounded-full text-xs', dashboardTokens.focusRing)}
                    onClick={() => setCreateOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create person
                  </Button>
                </div>
                <div className={cn('rounded-xl border p-3', dashboardTokens.border, dashboardTokens.surfaceMuted)}>
                  <div className="text-sm font-semibold">Assignments</div>
                  <div className={cn('mt-1 text-xs', dashboardTokens.textMuted)}>
                    Project-level and workspace role assignments are editable in each person profile
                    and workspace controls.
                  </div>
                </div>
              </div>
            </DashboardCard>
          </div>
        ) : null}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={() => setSelectedMemberId(null)}>
        <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-y-auto p-0 sm:rounded-2xl">
          {selected && editDraft ? (
            <ProfileScreen
              selected={selected}
              editDraft={editDraft}
              setEditDraft={setEditDraft}
              dialogMode={dialogMode}
              setDialogMode={setDialogMode}
              currentMemberId={currentMemberId}
              viewerRole={viewerRole}
              isStaff={isStaff}
              store={store}
              persist={persist}
              data={data}
              workspaceClientLabel={workspaceClientLabel}
              projectById={projectById}
              selectedProjectIds={selectedProjectIds}
              engagementRoleByMemberProject={engagementRoleByMemberProject}
              projectPillClasses={projectPillClasses}
              setSelectedMemberId={setSelectedMemberId}
              buildDisplayName={buildDisplayName}
            />
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
            workspaceClientLabel={workspaceClientLabel}
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

type ProfileScreenProps = {
  selected: WorkspaceMember;
  editDraft: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    headline: string;
    title: string;
    bio: string;
    location: string;
    phone: string;
    email: string;
    linkedInUrl: string;
    website: string;
    skills: string;
    role: MemberRole;
  };
  setEditDraft: React.Dispatch<React.SetStateAction<ProfileScreenProps['editDraft'] | null>>;
  dialogMode: 'view' | 'edit';
  setDialogMode: (m: 'view' | 'edit') => void;
  currentMemberId: string | null;
  viewerRole: string;
  isStaff: boolean;
  store: ReturnType<typeof defaultPeopleStore>;
  persist: (next: ReturnType<typeof defaultPeopleStore>) => void;
  data: NonNullable<ReturnType<typeof useDashboardData>['data']>;
  projectById: Map<string, { id: string; name: string; idx: number }>;
  selectedProjectIds: string[];
  engagementRoleByMemberProject: Map<string, string>;
  projectPillClasses: (idx: number) => string;
  setSelectedMemberId: (id: string | null) => void;
  buildDisplayName: (args: { firstName: string; lastName: string; fallback: string }) => string;
  workspaceClientLabel: string;
};

function VisibilityChip({ state }: { state: 'public' | 'private' | 'unset' }) {
  if (state === 'unset') {
    return (
      <Badge variant="outline" className="border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300">
        Not set
      </Badge>
    );
  }
  if (state === 'private') {
    return (
      <Badge variant="outline" className="border-amber-200 text-amber-800 dark:border-amber-900/40 dark:text-amber-200">
        <Lock className="mr-1 h-3.5 w-3.5" />
        Private
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-100">
      <Globe className="mr-1 h-3.5 w-3.5" />
      Public
    </Badge>
  );
}

function ProfileScreen({
  selected,
  editDraft,
  setEditDraft,
  dialogMode,
  setDialogMode,
  currentMemberId,
  viewerRole,
  isStaff,
  store,
  persist,
  data,
  projectById,
  selectedProjectIds,
  engagementRoleByMemberProject,
  projectPillClasses,
  setSelectedMemberId,
  buildDisplayName,
  workspaceClientLabel,
}: ProfileScreenProps) {
  const isSelf = selected.id === currentMemberId;
  const fields = editableFieldsFor({ viewerRole, isSelf });
  const canEdit = Object.values(fields).some(Boolean);

  return (
    <div className="flex flex-col">
      {/* Hero / cover */}
      <div className="relative h-24 shrink-0 rounded-t-2xl bg-gradient-to-br from-primary-500/20 via-slate-100 to-secondary-500/20 dark:from-primary-600/30 dark:via-slate-800 dark:to-secondary-600/30 sm:h-28" />
      <div className="relative px-5 pb-5 sm:px-6">
        <Avatar className="-mt-12 h-24 w-24 border-4 border-white shadow-lg dark:border-slate-900 sm:-mt-14 sm:h-28 sm:w-28">
          <AvatarFallback className="text-2xl font-semibold sm:text-3xl">
            {initials(selected.displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
              {selected.displayName}
            </h2>
            {(selected.headline || selected.title) && (
              <p className={cn('mt-0.5 text-sm font-medium', dashboardTokens.textMuted)}>
                {selected.headline || selected.title}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {selected.username ? (
                <span className={cn('text-sm', dashboardTokens.textSubtle)}>@{selected.username}</span>
              ) : null}
              <Badge variant="secondary" className="text-xs">
                {directoryMemberRoleSingularLabel(selected.role, { workspaceClientLabel })}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('rounded-full', dashboardTokens.focusRing)}
                onClick={() => setDialogMode(dialogMode === 'edit' ? 'view' : 'edit')}
              >
                {dialogMode === 'edit' ? 'Cancel' : 'Edit profile'}
              </Button>
            )}
            {isStaff && selected.id !== currentMemberId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'rounded-full border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/30 dark:text-rose-200 dark:hover:bg-rose-900/20',
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
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 px-5 pb-6 sm:px-6">
        {dialogMode === 'edit' ? (
          <ProfileEditForm
            editDraft={editDraft}
            setEditDraft={setEditDraft}
            selected={selected}
            fields={fields}
            persist={persist}
            store={store}
            setDialogMode={setDialogMode}
            buildDisplayName={buildDisplayName}
            workspaceClientLabel={workspaceClientLabel}
          />
        ) : (
          <ProfileViewSections
            selected={selected}
            data={data}
            workspaceClientLabel={workspaceClientLabel}
            projectById={projectById}
            selectedProjectIds={selectedProjectIds}
            engagementRoleByMemberProject={engagementRoleByMemberProject}
            projectPillClasses={projectPillClasses}
          />
        )}
      </div>
    </div>
  );
}

function ProfileViewSections({
  selected,
  data,
  workspaceClientLabel,
  projectById,
  selectedProjectIds,
  engagementRoleByMemberProject,
  projectPillClasses,
}: {
  selected: WorkspaceMember;
  data: NonNullable<ReturnType<typeof useDashboardData>['data']>;
  workspaceClientLabel: string;
  projectById: Map<string, { id: string; name: string; idx: number }>;
  selectedProjectIds: string[];
  engagementRoleByMemberProject: Map<string, string>;
  projectPillClasses: (idx: number) => string;
}) {
  const nameVisibility = selected.fieldMask?.name ? 'private' : 'public';
  const titleVisibility =
    selected.fieldMask?.title ? 'private' : selected.title ? 'public' : 'unset';
  const bioVisibility =
    selected.fieldMask?.bio ? 'private' : selected.bio ? 'public' : 'unset';
  const emailVisibility =
    !selected.email ? 'unset' : !data.capabilities.canViewContactInfo || selected.contactMask?.email ? 'private' : 'public';

  return (
    <>
      {selected.bio ? (
        <section className={cn('rounded-2xl border p-4', dashboardTokens.border, dashboardTokens.surface)}>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">About</h3>
          <p className={cn('mt-2 text-sm leading-relaxed', dashboardTokens.textMuted)}>{selected.bio}</p>
          <div className="mt-2 flex justify-end">
            <VisibilityChip state={bioVisibility} />
          </div>
        </section>
      ) : null}

      <section className={cn('rounded-2xl border p-4', dashboardTokens.border, dashboardTokens.surface)}>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
          <Briefcase className="h-4 w-4" />
          Contact & info
        </h3>
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Full name</span>
            <VisibilityChip state={nameVisibility} />
          </div>
          {selected.title ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Title</span>
              <VisibilityChip state={titleVisibility} />
            </div>
          ) : null}
          {selected.location ? (
            <div className="flex items-center gap-2">
              <MapPin className={cn('h-4 w-4', dashboardTokens.textSubtle)} />
              <span className="text-sm">{selected.location}</span>
            </div>
          ) : null}
          {data.capabilities.canViewContactInfo && selected.email ? (
            <a
              href={`mailto:${selected.email}`}
              className="flex items-center gap-2 text-sm text-primary-600 hover:underline dark:text-primary-400"
            >
              <Mail className="h-4 w-4" />
              {selected.email}
            </a>
          ) : selected.email ? (
            <div className="flex items-center gap-2">
              <Mail className={cn('h-4 w-4', dashboardTokens.textSubtle)} />
              <VisibilityChip state={emailVisibility} />
            </div>
          ) : null}
          {data.capabilities.canViewContactInfo && selected.phone ? (
            <a
              href={`tel:${selected.phone}`}
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
            >
              <Phone className="h-4 w-4" />
              {selected.phone}
            </a>
          ) : null}
          {selected.linkedInUrl ? (
            <a
              href={selected.linkedInUrl.startsWith('http') ? selected.linkedInUrl : `https://${selected.linkedInUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary-600 hover:underline dark:text-primary-400"
            >
              <Link2 className="h-4 w-4" />
              LinkedIn
            </a>
          ) : null}
          {selected.website ? (
            <a
              href={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary-600 hover:underline dark:text-primary-400"
            >
              <Globe className="h-4 w-4" />
              {selected.website}
            </a>
          ) : null}
        </div>
      </section>

      {selected.skills ? (
        <section className={cn('rounded-2xl border p-4', dashboardTokens.border, dashboardTokens.surface)}>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Skills & expertise</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {selected.skills.split(/[,;]/).map((s, i) => (
              <span
                key={i}
                className={cn(
                  'rounded-full bg-slate-100 px-3 py-1 text-xs font-medium dark:bg-slate-800',
                  dashboardTokens.text,
                )}
              >
                {s.trim()}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className={cn('rounded-2xl border p-4', dashboardTokens.border, dashboardTokens.surface)}>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
          <Briefcase className="h-4 w-4" />
          Projects
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedProjectIds.length ? (
            selectedProjectIds.map((projectId) => {
              const p = projectById.get(projectId);
              if (!p) return null;
              const engagementRole = engagementRoleByMemberProject.get(`${selected.id}:${projectId}`) ?? '';
              return (
                <span
                  key={projectId}
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold',
                    projectPillClasses(p.idx),
                  )}
                >
                  {p.name}
                  {engagementRole ? (
                    <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-xs leading-none dark:bg-white/10">
                      {engagementRoleDisplayLabel(engagementRole, { workspaceClientLabel })}
                    </span>
                  ) : null}
                </span>
              );
            })
          ) : (
            <p className={cn('text-sm', dashboardTokens.textMuted)}>No project assignments yet.</p>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <User2 className={cn('h-4 w-4', dashboardTokens.textSubtle)} />
          <span className={cn('text-sm', dashboardTokens.textMuted)}>Contact via Altvina</span>
        </div>
        {data.capabilities.canViewContactInfo && selected.email ? (
          <Button type="button" variant="outline" size="sm" className={cn('rounded-full', dashboardTokens.focusRing)} asChild>
            <a href={`mailto:${selected.email}`}>
              <Mail className="mr-2 h-4 w-4" />
              {selected.email}
            </a>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn('rounded-full', dashboardTokens.focusRing)}
            disabled
          >
            <Mail className="mr-2 h-4 w-4" />
            Email hidden
          </Button>
        )}
      </div>
    </>
  );
}

function ProfileEditForm({
  editDraft,
  setEditDraft,
  selected,
  fields,
  persist,
  store,
  setDialogMode,
  buildDisplayName,
  workspaceClientLabel,
}: {
  editDraft: ProfileScreenProps['editDraft'];
  setEditDraft: ProfileScreenProps['setEditDraft'];
  selected: WorkspaceMember;
  fields: EditableFields;
  persist: (next: ReturnType<typeof defaultPeopleStore>) => void;
  store: ReturnType<typeof defaultPeopleStore>;
  setDialogMode: (m: 'view' | 'edit') => void;
  buildDisplayName: (args: { firstName: string; lastName: string; fallback: string }) => string;
  workspaceClientLabel: string;
}) {
  return (
    <div className="space-y-4">
      <section className={cn('rounded-2xl border p-4', dashboardTokens.border, dashboardTokens.surface)}>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Basic info</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>First name</label>
            <Input
              value={editDraft.firstName}
              onChange={(e) => setEditDraft((d) => (d ? { ...d, firstName: e.target.value } : d))}
              disabled={!fields.firstName}
              className={cn('rounded-xl', dashboardTokens.focusRing)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Last name</label>
            <Input
              value={editDraft.lastName}
              onChange={(e) => setEditDraft((d) => (d ? { ...d, lastName: e.target.value } : d))}
              disabled={!fields.lastName}
              className={cn('rounded-xl', dashboardTokens.focusRing)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Username</label>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm', dashboardTokens.textSubtle)}>@</span>
              <Input
                value={editDraft.username}
                onChange={(e) =>
                  setEditDraft((d) =>
                    d ? { ...d, username: e.target.value.replace(/^@/, '').replace(/[^a-z0-9._-]/gi, (c) => (c === ' ' ? '.' : '')) } : d
                  )
                }
                disabled={!fields.username}
                placeholder="jordan.taylor"
                className={cn('rounded-xl', dashboardTokens.focusRing)}
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Headline</label>
            <Input
              value={editDraft.headline}
              onChange={(e) => setEditDraft((d) => (d ? { ...d, headline: e.target.value } : d))}
              disabled={!fields.headline}
              placeholder="e.g. Fractional COO · Ops & automation"
              className={cn('rounded-xl', dashboardTokens.focusRing)}
            />
          </div>
          <div className="space-y-1.5">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Title</label>
            <Input
              value={editDraft.title}
              onChange={(e) => setEditDraft((d) => (d ? { ...d, title: e.target.value } : d))}
              disabled={!fields.title}
              placeholder="e.g. Ops Lead"
              className={cn('rounded-xl', dashboardTokens.focusRing)}
            />
          </div>
          <div className="space-y-1.5">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Role</label>
            <Select
              value={editDraft.role}
              onValueChange={(v) => setEditDraft((d) => (d ? { ...d, role: v as MemberRole } : d))}
              disabled={!fields.role}
            >
              <SelectTrigger className={cn('rounded-xl', dashboardTokens.focusRing)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['client', 'expert', 'staff'] as const).map((r) => (
                  <SelectItem key={r} value={r}>
                    {directoryMemberRoleSingularLabel(r, { workspaceClientLabel })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className={cn('rounded-2xl border p-4', dashboardTokens.border, dashboardTokens.surface)}>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">About & contact</h3>
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Bio</label>
            <Textarea
              value={editDraft.bio}
              onChange={(e) => setEditDraft((d) => (d ? { ...d, bio: e.target.value } : d))}
              disabled={!fields.bio}
              placeholder="Short professional summary…"
              rows={3}
              className={cn('rounded-xl', dashboardTokens.focusRing)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Location</label>
              <Input
                value={editDraft.location}
                onChange={(e) => setEditDraft((d) => (d ? { ...d, location: e.target.value } : d))}
                disabled={!fields.location}
                placeholder="e.g. San Francisco, CA"
                className={cn('rounded-xl', dashboardTokens.focusRing)}
              />
            </div>
            <div className="space-y-1.5">
              <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Phone</label>
              <Input
                value={editDraft.phone}
                onChange={(e) => setEditDraft((d) => (d ? { ...d, phone: e.target.value } : d))}
                disabled={!fields.phone}
                placeholder="+1 234 567 8900"
                className={cn('rounded-xl', dashboardTokens.focusRing)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Email</label>
            <Input
              type="email"
              value={editDraft.email}
              onChange={(e) => setEditDraft((d) => (d ? { ...d, email: e.target.value } : d))}
              disabled={!fields.email}
              placeholder="name@company.com"
              className={cn('rounded-xl', dashboardTokens.focusRing)}
            />
          </div>
          <div className="space-y-1.5">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>LinkedIn URL</label>
            <Input
              value={editDraft.linkedInUrl}
              onChange={(e) => setEditDraft((d) => (d ? { ...d, linkedInUrl: e.target.value } : d))}
              disabled={!fields.linkedInUrl}
              placeholder="https://linkedin.com/in/username"
              className={cn('rounded-xl', dashboardTokens.focusRing)}
            />
          </div>
          <div className="space-y-1.5">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Website</label>
            <Input
              value={editDraft.website}
              onChange={(e) => setEditDraft((d) => (d ? { ...d, website: e.target.value } : d))}
              disabled={!fields.website}
              placeholder="https://example.com"
              className={cn('rounded-xl', dashboardTokens.focusRing)}
            />
          </div>
          <div className="space-y-1.5">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>Skills</label>
            <Input
              value={editDraft.skills}
              onChange={(e) => setEditDraft((d) => (d ? { ...d, skills: e.target.value } : d))}
              disabled={!fields.skills}
              placeholder="e.g. Operations, Strategy, Analytics"
              className={cn('rounded-xl', dashboardTokens.focusRing)}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          className={cn(
            'rounded-full bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700',
            'dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300',
            dashboardTokens.focusRing,
          )}
          onClick={() => {
            const displayName = buildDisplayName({
              firstName: editDraft.firstName,
              lastName: editDraft.lastName,
              fallback: selected.displayName,
            });
            const usernameTrimmed = editDraft.username.trim().toLowerCase().replace(/\s+/g, '.');
            const patch: Partial<WorkspaceMember> = {
              firstName: editDraft.firstName.trim() || undefined,
              lastName: editDraft.lastName.trim() || undefined,
              displayName,
              username: usernameTrimmed || undefined,
              headline: editDraft.headline.trim() || undefined,
              title: editDraft.title.trim() || undefined,
              bio: editDraft.bio.trim() || undefined,
              location: editDraft.location.trim() || undefined,
              phone: editDraft.phone.trim() || undefined,
              email: editDraft.email.trim() || undefined,
              linkedInUrl: editDraft.linkedInUrl.trim() || undefined,
              website: editDraft.website.trim() || undefined,
              skills: editDraft.skills.trim() || undefined,
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
}

function slugUsername(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '');
}

function CreateMemberForm({
  workspaceClientLabel,
  onCancel,
  onCreate,
}: {
  workspaceClientLabel: string;
  onCancel: () => void;
  onCreate: (member: WorkspaceMember) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [headline, setHeadline] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [skills, setSkills] = useState('');
  const [role, setRole] = useState<MemberRole>('client');

  const suggestedUsername =
    firstName.trim() || lastName.trim()
      ? slugUsername(`${firstName} ${lastName}`.trim())
      : '';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
            First name
          </div>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={cn('rounded-2xl', dashboardTokens.focusRing)}
            placeholder="First"
          />
        </div>
        <div className="space-y-2">
          <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
            Last name
          </div>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={cn('rounded-2xl', dashboardTokens.focusRing)}
            placeholder="Last"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
          Username
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs', dashboardTokens.textSubtle)}>@</span>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/^@/, '').replace(/[^a-z0-9._-]/gi, (c) => (c === ' ' ? '.' : '')))}
            className={cn('rounded-2xl', dashboardTokens.focusRing)}
            placeholder={suggestedUsername || 'e.g. jordan.taylor'}
          />
        </div>
        <div className={cn('text-xs', dashboardTokens.textSubtle)}>
          Optional. Suggested from name; used for @mentions and profile links.
        </div>
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
                  {directoryMemberRoleSingularLabel(r, { workspaceClientLabel })}
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
          Headline
        </div>
        <Input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          className={cn('rounded-2xl', dashboardTokens.focusRing)}
          placeholder="e.g., Fractional COO · Ops & automation"
        />
      </div>

      <div className="space-y-2">
        <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
          Location
        </div>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={cn('rounded-2xl', dashboardTokens.focusRing)}
          placeholder="e.g., San Francisco, CA"
        />
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
          disabled={firstName.trim().length < 1 || lastName.trim().length < 1}
          onClick={() => {
            const nowIso = new Date().toISOString();
            const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
            const finalUsername = (username.trim() || suggestedUsername).trim().toLowerCase() || undefined;
            onCreate({
              id: createMemberId(nowIso),
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              displayName,
              username: finalUsername,
              headline: headline.trim() || undefined,
              role,
              title: title.trim() || undefined,
              bio: bio.trim() || undefined,
              location: location.trim() || undefined,
              phone: phone.trim() || undefined,
              email: email.trim() || undefined,
              linkedInUrl: linkedInUrl.trim() || undefined,
              website: website.trim() || undefined,
              skills: skills.trim() || undefined,
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

