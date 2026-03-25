import type {
  WorkspaceAudience,
  WorkspaceConfigV1,
  WorkspaceDisplayMode,
} from '@/app/dashboard/modules/workspace-admin/workspace-config';

export function getOverride(
  config: WorkspaceConfigV1,
  workspaceId: string,
  memberId: string,
  audience: WorkspaceAudience,
) {
  return config.workspaces[workspaceId]?.memberOverrides?.[memberId]?.[audience];
}

export function setOverride(args: {
  config: WorkspaceConfigV1;
  workspaceId: string;
  memberId: string;
  audience: WorkspaceAudience;
  patch: Partial<NonNullable<ReturnType<typeof getOverride>>>;
}): WorkspaceConfigV1 {
  const prev = args.config;
  const ws = prev.workspaces[args.workspaceId] ?? {
    memberOverrides: {},
    projectMembershipOverrides: {},
  };
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

export function getProjectRoleOverride(args: {
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

export function setProjectRoleOverride(args: {
  config: WorkspaceConfigV1;
  workspaceId: string;
  projectId: string;
  memberId: string;
  engagementRole: string;
}): WorkspaceConfigV1 {
  const prev = args.config;
  const ws = prev.workspaces[args.workspaceId] ?? {
    memberOverrides: {},
    projectMembershipOverrides: {},
  };
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

export function getMemberProfile(
  config: WorkspaceConfigV1,
  workspaceId: string,
  memberId: string,
) {
  return config.workspaces[workspaceId]?.memberProfiles?.[memberId];
}

export function setMemberProfile(args: {
  config: WorkspaceConfigV1;
  workspaceId: string;
  memberId: string;
  patch: Partial<NonNullable<ReturnType<typeof getMemberProfile>>>;
}): WorkspaceConfigV1 {
  const prev = args.config;
  const ws = prev.workspaces[args.workspaceId] ?? {
    memberOverrides: {},
    projectMembershipOverrides: {},
  };
  const profiles = ws.memberProfiles ?? {};
  const cur = profiles[args.memberId] ?? {};
  return {
    ...prev,
    workspaces: {
      ...prev.workspaces,
      [args.workspaceId]: {
        ...ws,
        memberProfiles: {
          ...profiles,
          [args.memberId]: { ...cur, ...args.patch },
        },
      },
    },
  };
}

export function normalizedDisplayMode(
  override: ReturnType<typeof getOverride>,
): WorkspaceDisplayMode {
  if (override?.displayMode) {
    return override.displayMode;
  }
  if (override?.visible === false) {
    return 'hidden';
  }
  return 'full';
}
