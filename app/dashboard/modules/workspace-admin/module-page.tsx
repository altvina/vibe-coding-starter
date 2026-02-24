'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Switch } from '@/components/shared/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/shared/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/shared/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Settings2 } from 'lucide-react';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { useDashboardWorkspace } from '@/app/dashboard/dashboard-workspace-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import {
  defaultWorkspaceConfig,
  loadWorkspaceConfigFromLocalStorage,
  saveWorkspaceConfigToLocalStorage,
  setWorkspaceConfigCookie,
  type WorkspaceAudience,
  type WorkspaceConfigV1,
} from '@/app/dashboard/modules/workspace-admin/workspace-config';

function getOverride(
  config: WorkspaceConfigV1,
  workspaceId: string,
  memberId: string,
  audience: WorkspaceAudience,
) {
  return config.workspaces[workspaceId]?.memberOverrides?.[memberId]?.[audience];
}

function setOverride(args: {
  config: WorkspaceConfigV1;
  workspaceId: string;
  memberId: string;
  audience: WorkspaceAudience;
  patch: Partial<NonNullable<ReturnType<typeof getOverride>>>;
}): WorkspaceConfigV1 {
  const prev = args.config;
  const ws = prev.workspaces[args.workspaceId] ?? { memberOverrides: {}, projectMembershipOverrides: {} };
  const member = ws.memberOverrides[args.memberId] ?? {};
  const audiencePrev = member[args.audience] ?? {};

  return {
    ...prev,
    workspaces: {
      ...prev.workspaces,
      [args.workspaceId]: {
        ...ws,
        memberOverrides: {
          ...ws.memberOverrides,
          [args.memberId]: {
            ...member,
            [args.audience]: { ...audiencePrev, ...args.patch },
          },
        },
      },
    },
  };
}

function getProjectRoleOverride(args: {
  config: WorkspaceConfigV1;
  workspaceId: string;
  projectId: string;
  memberId: string;
}) {
  return (
    args.config.workspaces[args.workspaceId]?.projectMembershipOverrides?.[args.projectId]?.[
      args.memberId
    ]?.engagementRole ?? ''
  );
}

function setProjectRoleOverride(args: {
  config: WorkspaceConfigV1;
  workspaceId: string;
  projectId: string;
  memberId: string;
  engagementRole: string;
}): WorkspaceConfigV1 {
  const prev = args.config;
  const ws = prev.workspaces[args.workspaceId] ?? { memberOverrides: {}, projectMembershipOverrides: {} };
  const projects = ws.projectMembershipOverrides ?? {};
  const project = projects[args.projectId] ?? {};
  return {
    ...prev,
    workspaces: {
      ...prev.workspaces,
      [args.workspaceId]: {
        ...ws,
        projectMembershipOverrides: {
          ...projects,
          [args.projectId]: {
            ...project,
            [args.memberId]: { engagementRole: args.engagementRole },
          },
        },
      },
    },
  };
}

type WorkspaceMember = { id: string; displayName: string; role: string; title?: string | null };

function MemberOptionsPopover({
  member,
  audience,
  config,
  workspaceId,
  onSave,
  children,
}: {
  member: WorkspaceMember;
  audience: WorkspaceAudience;
  config: WorkspaceConfigV1;
  workspaceId: string;
  onSave: (next: WorkspaceConfigV1) => void;
  children: React.ReactNode;
}) {
  const o = getOverride(config, workspaceId, member.id, audience);
  const visible = (o?.visible ?? true) as boolean;
  const alias = (o?.alias ?? '') as string;
  const showTitle = (o?.showTitle ?? true) as boolean;
  const showBio = (o?.showBio ?? false) as boolean;
  const audienceLabel = audience === 'client' ? 'Client view' : 'Expert view';

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className={cn('w-80', dashboardTokens.border)}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
              {audienceLabel} · {member.displayName}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className={cn('text-xs', dashboardTokens.textSubtle)}>Visible</span>
            <Switch
              checked={visible}
              onCheckedChange={(checked) =>
                onSave(
                  setOverride({
                    config,
                    workspaceId,
                    memberId: member.id,
                    audience,
                    patch: { visible: checked },
                  }),
                )
              }
            />
          </div>
          <div className="space-y-1">
            <label className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>
              Masked display name (optional)
            </label>
            <Input
              value={alias}
              onChange={(e) =>
                onSave(
                  setOverride({
                    config,
                    workspaceId,
                    memberId: member.id,
                    audience,
                    patch: { alias: e.target.value },
                  }),
                )
              }
              placeholder={audience === 'client' ? 'e.g., Expert A' : 'e.g., Client A'}
              className={cn('h-8 rounded-lg text-sm', dashboardTokens.focusRing)}
              disabled={!visible}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2">
              <Switch
                checked={showTitle}
                onCheckedChange={(checked) =>
                  onSave(
                    setOverride({
                      config,
                      workspaceId,
                      memberId: member.id,
                      audience,
                      patch: { showTitle: checked },
                    }),
                  )
                }
                disabled={!visible}
              />
              <span className={cn('text-xs', dashboardTokens.textSubtle)}>Show title</span>
            </label>
            <label className="flex items-center gap-2">
              <Switch
                checked={showBio}
                onCheckedChange={(checked) =>
                  onSave(
                    setOverride({
                      config,
                      workspaceId,
                      memberId: member.id,
                      audience,
                      patch: { showBio: checked },
                    }),
                  )
                }
                disabled={!visible}
              />
              <span className={cn('text-xs', dashboardTokens.textSubtle)}>Show bio</span>
            </label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function WorkspaceAdminModulePage() {
  const { data } = useDashboardData();
  const { activeWorkspaceId } = useDashboardWorkspace();
  const [config, setConfig] = useState<WorkspaceConfigV1>(() => defaultWorkspaceConfig());

  useEffect(() => {
    const loaded = loadWorkspaceConfigFromLocalStorage();
    setConfig(loaded);
    setWorkspaceConfigCookie(loaded);
  }, []);

  const workspaceLabel =
    data?.workspaces.find((w) => w.id === activeWorkspaceId)?.name ?? 'Workspace';

  const members = useMemo(() => data?.workspace.members ?? [], [data]);
  const projects = useMemo(() => data?.workspace.projects ?? [], [data]);
  const projectMemberships = useMemo(() => data?.workspace.projectMemberships ?? [], [data]);

  if (!data) return null;

  if (data.role !== 'staff_admin' && data.role !== 'super_admin') {
    return (
      <DashboardCard title="Workspace Admin">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          This module is only available for Staff/Admin.
        </p>
      </DashboardCard>
    );
  }

  function persist(next: WorkspaceConfigV1) {
    setConfig(next);
    saveWorkspaceConfigToLocalStorage(next);
    setWorkspaceConfigCookie(next);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="lg:col-span-12">
        <DashboardCard title="Workspace Admin">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold">{workspaceLabel}</div>
              <div className={cn('text-sm', dashboardTokens.textMuted)}>
                Control who appears in the directory and how identities are masked.
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className={cn('rounded-full', dashboardTokens.focusRing)}
              onClick={() => persist(defaultWorkspaceConfig())}
            >
              Reset rules
            </Button>
          </div>
        </DashboardCard>
      </div>

      <div className="lg:col-span-12">
        <DashboardCard title="Member visibility & masking">
          <Tabs defaultValue="member" className="mt-0">
            <TabsList className={cn('mb-4 h-9 rounded-lg', dashboardTokens.surfaceMuted)}>
              <TabsTrigger value="member" className="text-xs sm:text-sm">
                By member
              </TabsTrigger>
              <TabsTrigger value="audience" className="text-xs sm:text-sm">
                By audience
              </TabsTrigger>
            </TabsList>
            <p className={cn('mb-4 text-xs', dashboardTokens.textMuted)}>
              Toggle visibility per audience (Client / Expert). Use <strong>Options</strong> to set
              a masked name or show title/bio for that audience.
            </p>

            <TabsContent value="member" className="mt-0">
              <div className="space-y-2">
                <div
                  className={cn(
                    'grid grid-cols-[1fr_auto_auto] gap-2 rounded-lg px-3 py-2 text-xs font-medium',
                    dashboardTokens.textSubtle,
                  )}
                >
                  <span>Member</span>
                  <span className="text-center">Client</span>
                  <span className="text-center">Expert</span>
                </div>
                {members.map((m) => {
                  const clientO = getOverride(config, activeWorkspaceId, m.id, 'client');
                  const expertO = getOverride(config, activeWorkspaceId, m.id, 'expert');
                  const clientVisible = clientO?.visible ?? true;
                  const expertVisible = expertO?.visible ?? true;
                  const memberRow: WorkspaceMember = {
                    id: m.id,
                    displayName: m.displayName,
                    role: m.role,
                    title: m.title,
                  };
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'grid grid-cols-1 gap-3 rounded-xl border py-3 px-3 sm:grid-cols-[1fr_auto_auto] sm:gap-2',
                        dashboardTokens.border,
                        dashboardTokens.surfaceMuted,
                      )}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{m.displayName}</div>
                        <div className={cn('text-xs truncate', dashboardTokens.textSubtle)}>
                          {m.role.toUpperCase()}
                          {m.title ? ` · ${m.title}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center justify-start gap-2 sm:justify-center">
                        <Switch
                          checked={clientVisible}
                          onCheckedChange={(checked) =>
                            persist(
                              setOverride({
                                config,
                                workspaceId: activeWorkspaceId,
                                memberId: m.id,
                                audience: 'client',
                                patch: { visible: checked },
                              }),
                            )
                          }
                        />
                        <MemberOptionsPopover
                          member={memberRow}
                          audience="client"
                          config={config}
                          workspaceId={activeWorkspaceId}
                          onSave={persist}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            aria-label="Client view options"
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                        </MemberOptionsPopover>
                      </div>
                      <div className="flex items-center justify-start gap-2 sm:justify-center">
                        <Switch
                          checked={expertVisible}
                          onCheckedChange={(checked) =>
                            persist(
                              setOverride({
                                config,
                                workspaceId: activeWorkspaceId,
                                memberId: m.id,
                                audience: 'expert',
                                patch: { visible: checked },
                              }),
                            )
                          }
                        />
                        <MemberOptionsPopover
                          member={memberRow}
                          audience="expert"
                          config={config}
                          workspaceId={activeWorkspaceId}
                          onSave={persist}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            aria-label="Expert view options"
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                        </MemberOptionsPopover>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="audience" className="mt-0">
              <div className="space-y-6">
                {(['client', 'expert'] as const).map((audience) => {
                  const label = audience === 'client' ? 'Client view' : 'Expert view';
                  return (
                    <div key={audience} className={cn('rounded-xl border p-4', dashboardTokens.border)}>
                      <h3 className={cn('mb-3 text-sm font-semibold', dashboardTokens.text)}>
                        {label}
                      </h3>
                      <div className="space-y-2">
                        {members.map((m) => {
                          const o = getOverride(config, activeWorkspaceId, m.id, audience);
                          const visible = (o?.visible ?? true) as boolean;
                          const memberRow: WorkspaceMember = {
                            id: m.id,
                            displayName: m.displayName,
                            role: m.role,
                            title: m.title,
                          };
                          return (
                            <div
                              key={m.id}
                              className={cn(
                                'flex flex-wrap items-center justify-between gap-2 rounded-lg py-2 px-3',
                                dashboardTokens.surfaceMuted,
                              )}
                            >
                              <div className="min-w-0">
                                <span className="text-sm font-medium truncate block">
                                  {m.displayName}
                                </span>
                                <span className={cn('text-xs', dashboardTokens.textSubtle)}>
                                  {m.role.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={visible}
                                  onCheckedChange={(checked) =>
                                    persist(
                                      setOverride({
                                        config,
                                        workspaceId: activeWorkspaceId,
                                        memberId: m.id,
                                        audience,
                                        patch: { visible: checked },
                                      }),
                                    )
                                  }
                                />
                                <MemberOptionsPopover
                                  member={memberRow}
                                  audience={audience}
                                  config={config}
                                  workspaceId={activeWorkspaceId}
                                  onSave={persist}
                                >
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1.5 pl-2 pr-2 text-muted-foreground hover:text-foreground"
                                    aria-label={`Options for ${m.displayName} in ${label}`}
                                  >
                                    <Settings2 className="h-3.5 w-3.5" />
                                    <span className="text-xs">Options</span>
                                  </Button>
                                </MemberOptionsPopover>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </DashboardCard>
      </div>

      <div className="lg:col-span-12">
        <DashboardCard title="Project-specific roles">
          <p className={cn('mb-4 text-sm', dashboardTokens.textMuted)}>
            Set engagement roles per project (e.g. Expert on one, Partner on another). Expand a
            project to edit.
          </p>
          <div className="space-y-2">
            {projects.map((p) => {
              const membersInProject = projectMemberships
                .filter((pm) => pm.projectId === p.id)
                .map((pm) => pm.memberId);
              const visibleMembers = members.filter((m) => membersInProject.includes(m.id));

              return (
                <Collapsible key={p.id} defaultOpen={false} className="group">
                  <CollapsibleTrigger
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors hover:opacity-90',
                      dashboardTokens.border,
                      dashboardTokens.surfaceMuted,
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{p.name}</div>
                        <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                          {visibleMembers.length} member{visibleMembers.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50 group-data-[state=open]:hidden" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-2 pl-6">
                      {visibleMembers.length === 0 ? (
                        <p className={cn('py-2 text-sm', dashboardTokens.textMuted)}>
                          No members assigned to this project yet.
                        </p>
                      ) : (
                        visibleMembers.map((m) => {
                          const current =
                            getProjectRoleOverride({
                              config,
                              workspaceId: activeWorkspaceId,
                              projectId: p.id,
                              memberId: m.id,
                            }) ||
                            projectMemberships.find(
                              (pm) => pm.projectId === p.id && pm.memberId === m.id,
                            )?.engagementRole ||
                            (m.role === 'expert'
                              ? 'Expert'
                              : m.role === 'staff'
                                ? 'Altvina'
                                : 'Client');

                          return (
                            <div
                              key={m.id}
                              className={cn(
                                'flex items-center justify-between gap-3 rounded-lg border py-2 px-3',
                                dashboardTokens.border,
                                dashboardTokens.surface,
                              )}
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{m.displayName}</div>
                                <div className={cn('truncate text-xs', dashboardTokens.textSubtle)}>
                                  {m.role.toUpperCase()}
                                  {m.title ? ` · ${m.title}` : ''}
                                </div>
                              </div>
                              <div className="w-40 shrink-0">
                                <Select
                                  value={current}
                                  onValueChange={(value) =>
                                    persist(
                                      setProjectRoleOverride({
                                        config,
                                        workspaceId: activeWorkspaceId,
                                        projectId: p.id,
                                        memberId: m.id,
                                        engagementRole: value,
                                      }),
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    className={cn('h-8 rounded-lg text-xs', dashboardTokens.focusRing)}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {['Client', 'Expert', 'Partner', 'Altvina', 'Observer'].map(
                                      (opt) => (
                                        <SelectItem key={opt} value={opt}>
                                          {opt}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
            {projects.length === 0 && (
              <p className={cn('py-4 text-sm', dashboardTokens.textMuted)}>
                No projects in this workspace yet.
              </p>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
