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
import { cn } from '@/lib/utils';

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
        <DashboardCard title="Member visibility + masking">
          <div className="space-y-6">
            {members.map((m) => {
              const client = getOverride(config, activeWorkspaceId, m.id, 'client');
              const expert = getOverride(config, activeWorkspaceId, m.id, 'expert');
              const clientVisible = client?.visible ?? true;
              const expertVisible = expert?.visible ?? true;

              return (
                <div
                  key={m.id}
                  className={cn('rounded-2xl border p-4', dashboardTokens.border)}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold">{m.displayName}</div>
                      <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                        {m.role.toUpperCase()} • {m.title ?? '—'}
                      </div>
                    </div>
                    <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                      Member ID: {m.id}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {([
                      { audience: 'client' as const, title: 'Client view' },
                      { audience: 'expert' as const, title: 'Expert view' },
                    ] as const).map((col) => {
                      const o = getOverride(config, activeWorkspaceId, m.id, col.audience);
                      const visible = (o?.visible ?? true) as boolean;
                      const alias = (o?.alias ?? '') as string;
                      const showTitle = (o?.showTitle ?? true) as boolean;
                      const showBio = (o?.showBio ?? false) as boolean;

                      return (
                        <div
                          key={col.audience}
                          className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold">{col.title}</div>
                            <div className="flex items-center gap-2">
                              <span className={cn('text-xs', dashboardTokens.textSubtle)}>
                                Visible
                              </span>
                              <Switch
                                checked={visible}
                                onCheckedChange={(checked) =>
                                  persist(
                                    setOverride({
                                      config,
                                      workspaceId: activeWorkspaceId,
                                      memberId: m.id,
                                      audience: col.audience,
                                      patch: { visible: checked },
                                    }),
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="mt-3 space-y-3">
                            <div className="space-y-1">
                              <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                                Masked display name (optional)
                              </div>
                              <Input
                                value={alias}
                                onChange={(e) =>
                                  persist(
                                    setOverride({
                                      config,
                                      workspaceId: activeWorkspaceId,
                                      memberId: m.id,
                                      audience: col.audience,
                                      patch: { alias: e.target.value },
                                    }),
                                  )
                                }
                                placeholder={col.audience === 'client' ? 'e.g., Expert A' : 'e.g., Client A'}
                                className={cn('rounded-2xl', dashboardTokens.focusRing)}
                                disabled={!visible}
                              />
                            </div>

                            <div className="flex flex-wrap gap-3">
                              <label className="flex items-center gap-2">
                                <Switch
                                  checked={showTitle}
                                  onCheckedChange={(checked) =>
                                    persist(
                                      setOverride({
                                        config,
                                        workspaceId: activeWorkspaceId,
                                        memberId: m.id,
                                        audience: col.audience,
                                        patch: { showTitle: checked },
                                      }),
                                    )
                                  }
                                  disabled={!visible}
                                />
                                <span className={cn('text-xs', dashboardTokens.textSubtle)}>
                                  Show title
                                </span>
                              </label>

                              <label className="flex items-center gap-2">
                                <Switch
                                  checked={showBio}
                                  onCheckedChange={(checked) =>
                                    persist(
                                      setOverride({
                                        config,
                                        workspaceId: activeWorkspaceId,
                                        memberId: m.id,
                                        audience: col.audience,
                                        patch: { showBio: checked },
                                      }),
                                    )
                                  }
                                  disabled={!visible}
                                />
                                <span className={cn('text-xs', dashboardTokens.textSubtle)}>
                                  Show bio
                                </span>
                              </label>
                            </div>

                            <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                              Effective: {col.audience === 'client' ? (clientVisible ? 'visible' : 'hidden') : (expertVisible ? 'visible' : 'hidden')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardCard>
      </div>

      <div className="lg:col-span-12">
        <DashboardCard title="Project-specific roles (per contract)">
          <div className={cn('text-sm', dashboardTokens.textMuted)}>
            Engagement roles are defined per project (e.g., the same person can be an Expert on one project and a Partner on another).
          </div>

          <div className="mt-4 space-y-6">
            {projects.map((p) => {
              const membersInProject = projectMemberships
                .filter((pm) => pm.projectId === p.id)
                .map((pm) => pm.memberId);
              const visibleMembers = members.filter((m) => membersInProject.includes(m.id));

              return (
                <div key={p.id} className={cn('rounded-2xl border p-4', dashboardTokens.border)}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                        Project ID: {p.id}
                      </div>
                    </div>
                    <div className={cn('text-xs tabular-nums', dashboardTokens.textSubtle)}>
                      {visibleMembers.length} members
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {visibleMembers.map((m) => {
                      const current =
                        getProjectRoleOverride({
                          config,
                          workspaceId: activeWorkspaceId,
                          projectId: p.id,
                          memberId: m.id,
                        }) ||
                        projectMemberships.find((pm) => pm.projectId === p.id && pm.memberId === m.id)
                          ?.engagementRole ||
                        (m.role === 'expert' ? 'Expert' : m.role === 'staff' ? 'Altvina' : 'Client');

                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{m.displayName}</div>
                            <div className={cn('truncate text-xs', dashboardTokens.textSubtle)}>
                              {m.role.toUpperCase()} • {m.title ?? '—'}
                            </div>
                          </div>

                          <div className="w-44">
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
                              <SelectTrigger className={cn('rounded-2xl', dashboardTokens.focusRing)}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['Client', 'Expert', 'Partner', 'Altvina', 'Observer'].map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}

                    {!visibleMembers.length ? (
                      <div className={cn('text-sm', dashboardTokens.textMuted)}>
                        No members are assigned to this project yet.
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {!projects.length ? (
              <div className={cn('text-sm', dashboardTokens.textMuted)}>
                No projects in this workspace yet.
              </div>
            ) : null}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}

