import { NextResponse, type NextRequest } from 'next/server';

import {
  dashboardKpis,
  sidebarAssistant,
  promoLearning,
} from '@/app/dashboard/dashboard-data';
import {
  capabilitiesForMembership,
  type DashboardCapabilities,
} from '@/app/dashboard/dashboard-permissions';
import { getMembershipSeedsForIdentity, getMembershipsForIdentity } from '@/lib/auth/mock-memberships';
import { resolveDashboardIdentityForApiRequest } from '@/lib/auth/dashboard-request-identity';
import { WORKSPACE_CONFIG_COOKIE_KEY } from '@/app/dashboard/modules/workspace-admin/workspace-config';
import {
  readWorkspaceDirectoryFromCookieValue,
  WORKSPACE_DIRECTORY_COOKIE_KEY,
  type WorkspaceDirectoryV1,
} from '@/lib/dashboard/workspace-directory';
import {
  actionRequestOpenStatuses,
  type DashboardActionRequest,
} from '@/lib/action-requests';
import { listWorkspaceActionRequests } from '@/lib/server/action-requests-store';
import { permissionsForMembership } from '@/lib/auth/workspace-rbac';
import { guardWorkspaceAccess } from '@/lib/auth/require-workspace-access';
import type { WorkspaceMembership } from '@/lib/auth/workspace-types';
import { buildWorkspaceSeedWithViewer } from '@/lib/dashboard/build-workspace-seed-with-viewer';
import { applyMemberAliasesToWorkspaceSeed } from '@/lib/member-duplicates/apply-aliases';
import { getAppliedAliasesForWorkspace } from '@/lib/server/member-merge-proposals-store';
import {
  mergeDirectoryCustomWorkspaceSeeds,
  ownerDisplayForWorkspaceSeed,
  resolveWorkspaceSeedById,
  workspaceLifecycleFromDirectory,
  workspaceSeeds,
  type WorkspaceSeed,
} from '@/lib/dashboard/workspace-seeds';

const inboxPreview = {
  title: 'Inbox',
  messages: [
    {
      id: 'm1',
      from: 'Altvina Workspace',
      subject: 'Workspace initialized',
      preview: 'This workspace is ready for real project data.',
      time: '2h',
    },
  ],
} as const;

type WorkspaceConfigV1 = {
  version: 1;
  workspaces: Record<
    string,
    {
      settings?: {
        analyticsEnabled?: boolean;
      };
      memberOverrides: Record<
        string,
        Partial<
          Record<
            'client' | 'expert' | 'staff',
            {
              visible?: boolean;
              alias?: string;
              maskedName?: string;
              showTitle?: boolean;
              showBio?: boolean;
              displayMode?: 'full' | 'masked' | 'hidden';
            }
          >
        >
      >;
      projectMembershipOverrides?: Record<
        string,
        Record<
          string,
          {
            engagementRole?: string;
          }
        >
      >;
    }
  >;
};

function readWorkspaceConfig(req: NextRequest): WorkspaceConfigV1 | null {
  const raw = req.cookies.get(WORKSPACE_CONFIG_COOKIE_KEY)?.value;
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const json = JSON.parse(decoded) as WorkspaceConfigV1;
    if (json?.version !== 1) return null;
    return json;
  } catch (e) {
    void e;
    return null;
  }
}

export async function GET(req: NextRequest) {
  const delay = req.nextUrl.searchParams.get('delay');
  const fail = req.nextUrl.searchParams.get('fail');
  const { identityId, identity } = resolveDashboardIdentityForApiRequest(req, 'optional');
  const workspaceIdParam = req.nextUrl.searchParams.get('workspaceId');
  const workspaceConfig = readWorkspaceConfig(req);
  const workspaceDirectory = readWorkspaceDirectoryFromCookieValue(
    req.cookies.get(WORKSPACE_DIRECTORY_COOKIE_KEY)?.value,
  );
  const mergedWorkspaceSeeds = mergeDirectoryCustomWorkspaceSeeds(workspaceSeeds, workspaceDirectory);

  if (fail === '1') {
    return NextResponse.json(
      { error: 'Simulated failure. Remove `?fail=1` to load data.' },
      { status: 500 },
    );
  }

  const delayMsRaw = delay ? Number(delay) : 0;
  const delayMs =
    Number.isFinite(delayMsRaw) && delayMsRaw > 0 ? Math.min(delayMsRaw, 3000) : 0;

  if (delayMs) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const membershipSeeds = getMembershipSeedsForIdentity(identityId, workspaceDirectory);
  const memberships = getMembershipsForIdentity(identityId, workspaceDirectory);
  let activeDashMemberships = memberships.filter(
    (membership) => membership.status === 'active' && membership.toolAccess.canAccessDash,
  );
  if (identityId !== 'u-admin') {
    activeDashMemberships = activeDashMemberships.filter(
      (membership) =>
        workspaceLifecycleFromDirectory(membership.workspaceId, workspaceDirectory) === 'active',
    );
  }
  if (!activeDashMemberships.length) {
    return NextResponse.json(
      { error: 'No workspaces available for this user.' },
      { status: 404 },
    );
  }

  const workspaces = activeDashMemberships
    .map((membership) =>
      resolveWorkspaceSeedById(membership.workspaceId, workspaceDirectory, mergedWorkspaceSeeds),
    )
    .filter((seed): seed is WorkspaceSeed => Boolean(seed))
    .map((seed) => {
      const owner = ownerDisplayForWorkspaceSeed(seed, workspaceDirectory);
      const customEntry = workspaceDirectory?.customWorkspaces?.find((entry) => entry.id === seed.id);
      return {
        id: seed.id,
        name: seed.name,
        slug: seed.name.toLowerCase().replace(/\s+/g, '-'),
        clientLabel: seed.clientLabel,
        memberCount: seed.members.length,
        ownerName: owner.name,
        ownerIdentityId:
          owner.identityId ??
          workspaceDirectory?.seedOverrides?.[seed.id]?.ownerIdentityId ??
          customEntry?.ownerIdentityId ??
          undefined,
        lifecycleStatus: workspaceLifecycleFromDirectory(seed.id, workspaceDirectory),
        description:
          customEntry?.description ?? workspaceDirectory?.seedOverrides?.[seed.id]?.description,
        createdAt: customEntry?.createdAt ?? '2026-01-01T00:00:00.000Z',
        source: customEntry ? 'custom' : 'seed',
      };
    });

  const defaultWorkspaceId =
    activeDashMemberships.find((membership) => membership.role === 'admin')?.workspaceId ??
    activeDashMemberships[0].workspaceId;
  const requestedWorkspaceId = workspaceIdParam ?? defaultWorkspaceId;
  const guard = guardWorkspaceAccess({
    memberships,
    workspaceId: requestedWorkspaceId,
    requireDashTool: true,
  });
  if (guard.response) {
    return guard.response;
  }

  const activeWorkspaceId = requestedWorkspaceId;
  const activeMembership =
    memberships.find(
      (membership) =>
        membership.workspaceId === activeWorkspaceId &&
        membership.status === 'active',
    ) ?? activeDashMemberships[0];
  const activeRole = activeMembership.role;
  const permissions = permissionsForMembership(activeMembership);
  const capabilities: DashboardCapabilities = capabilitiesForMembership(activeMembership);
  const workspaceSeed =
    resolveWorkspaceSeedById(activeWorkspaceId, workspaceDirectory, mergedWorkspaceSeeds) ??
    resolveWorkspaceSeedById(
      activeDashMemberships[0].workspaceId,
      workspaceDirectory,
      mergedWorkspaceSeeds,
    ) ??
    mergedWorkspaceSeeds[0];
  const customWorkspaceEntry = Boolean(
    workspaceDirectory?.customWorkspaces?.some((entry) => entry.id === activeWorkspaceId),
  );
  const staffMemberIdOverride = membershipSeeds.find(
    (seed) => seed.workspaceId === activeWorkspaceId,
  )?.memberIdByAudience?.staff;

  const workspaceSeedWithViewer = buildWorkspaceSeedWithViewer({
    workspaceSeed,
    identity,
    identityId,
    activeWorkspaceId,
    activeRole,
    hasCustomWorkspaceEntry: customWorkspaceEntry,
    staffMemberIdOverride,
  });

  let appliedAliases: Record<string, string> = {};
  try {
    appliedAliases = await getAppliedAliasesForWorkspace(activeWorkspaceId);
  } catch (error) {
    void error;
    appliedAliases = {};
  }
  const workspaceSeedResolved = applyMemberAliasesToWorkspaceSeed(
    workspaceSeedWithViewer,
    appliedAliases,
  );

  const availableWorkspaces = workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    clientLabel: workspace.clientLabel,
    metadata: { source: 'dash-seed' },
  }));

  function seedMemberByRole(seed: WorkspaceSeed, memberRole: 'client' | 'expert' | 'staff') {
    return seed.members.find((m) => m.role === memberRole) ?? null;
  }

  const currentAudienceRole: 'client' | 'expert' | 'staff' =
    activeRole === 'admin' || activeRole === 'internal'
      ? 'staff'
      : activeRole === 'contractor'
        ? 'expert'
        : 'client';

  const currentMemberId =
    membershipSeeds
      .find((seed) => seed.workspaceId === activeWorkspaceId)
      ?.memberIdByAudience?.[currentAudienceRole] ??
    seedMemberByRole(workspaceSeedResolved, currentAudienceRole)?.id ??
    workspaceSeedResolved.members[0]?.id ??
    'unknown';

  function memberOverride(memberId: string, audience: 'client' | 'expert' | 'staff') {
    return (
      workspaceConfig?.workspaces?.[activeWorkspaceId]?.memberOverrides?.[memberId]?.[audience] ??
      null
    );
  }

  function projectRoleOverride(args: { projectId: string; memberId: string }) {
    return (
      workspaceConfig?.workspaces?.[activeWorkspaceId]?.projectMembershipOverrides?.[
        args.projectId
      ]?.[args.memberId]?.engagementRole ?? null
    );
  }

  function buildProjectMemberships(seed: WorkspaceSeed) {
    const base = seed.projectMemberships?.length
      ? seed.projectMemberships
      : (() => {
          const seen = new Set<string>();
          const rows: Array<{ projectId: string; memberId: string; engagementRole: string }> =
            [];
          seed.tasks.forEach((task) => {
            task.assigneeIds.forEach((memberId) => {
              const key = `${task.projectId}:${memberId}`;
              if (seen.has(key)) return;
              seen.add(key);
              const member = seed.members.find((m) => m.id === memberId);
              const fallbackRole =
                member?.role === 'expert'
                  ? 'Expert'
                  : member?.role === 'staff'
                    ? 'Altvina'
                    : 'Client';
              rows.push({
                projectId: task.projectId,
                memberId,
                engagementRole: fallbackRole,
              });
            });
          });
          return rows;
        })();

    return base.map((membership) => ({
      ...membership,
      engagementRole:
        projectRoleOverride({
          projectId: membership.projectId,
          memberId: membership.memberId,
        }) ?? membership.engagementRole,
    }));
  }

  function maskMembers(seed: WorkspaceSeed): WorkspaceSeed['members'] {
    if (activeRole === 'admin' || activeRole === 'internal') {
      return seed.members.map((member) => ({ ...member }));
    }

    const audience: 'client' | 'expert' = activeRole === 'contractor' ? 'expert' : 'client';
    const roleCounters = { client: 0, expert: 0, staff: 0 } as Record<
      'client' | 'expert' | 'staff',
      number
    >;
    const roleLabel: Record<'client' | 'expert' | 'staff', string> = {
      client: workspaceSeedResolved.clientLabel,
      expert: 'Expert',
      staff: 'Altvina',
    };

    function normalizedMode(override: ReturnType<typeof memberOverride>) {
      if (override?.displayMode) {
        return override.displayMode;
      }
      if (override?.visible === false) {
        return 'hidden' as const;
      }
      return 'full' as const;
    }

    return seed.members
      .filter((member) => member.role !== 'client' || member.id === currentMemberId)
      .flatMap((member) => {
        const override = memberOverride(member.id, audience);
        const mode = normalizedMode(override);

        if (mode === 'hidden' && member.id !== currentMemberId) {
          return [];
        }

        const base = { ...member, email: undefined };
        if (mode === 'full' || member.id === currentMemberId) {
          return [base];
        }

        roleCounters[member.role] += 1;
        const roleIndex = roleCounters[member.role];
        const maskedName = override?.maskedName?.trim() || override?.alias?.trim();
        const titleHidden = override?.showTitle === false;
        const bioHidden = override?.showBio !== true;

        return [
          {
            ...base,
            title: titleHidden ? undefined : base.title,
            bio: bioHidden ? undefined : base.bio,
            firstName: undefined,
            lastName: undefined,
            fieldMask: {
              name: true,
              title: titleHidden || undefined,
              bio: bioHidden || undefined,
            },
            displayName:
              maskedName && maskedName.length > 0
                ? maskedName
                : `${roleLabel[member.role]} ${String.fromCharCode(64 + roleIndex)}`,
          },
        ];
      });
  }

  const maskedMembers = maskMembers(workspaceSeedResolved);
  const members = maskedMembers.map((member) => ({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    displayName: member.displayName,
    username: member.username,
    role: member.role,
    headline: member.headline,
    title: member.title,
    bio: member.bio,
    location: member.location,
    phone: capabilities.canViewContactInfo ? member.phone : undefined,
    email: capabilities.canViewContactInfo ? member.email : undefined,
    linkedInUrl: member.linkedInUrl,
    website: member.website,
    skills: member.skills,
    fieldMask: member.fieldMask,
    contactMask: {
      email: !capabilities.canViewContactInfo,
      phone: !capabilities.canViewContactInfo,
    },
  }));

  const updates = workspaceSeedResolved.updates.map((u) => ({
    id: u.id,
    authorId: u.authorId,
    createdAt: u.createdAt,
    body: u.body,
    comments: u.comments.map((c) => ({
      id: c.id,
      authorId: c.authorId,
      createdAt: c.createdAt,
      body: c.body,
    })),
  }));

  const workspace = {
    members,
    updates,
    projects: workspaceSeedResolved.projects,
    projectMemberships: buildProjectMemberships(workspaceSeedResolved),
    tasks: workspaceSeedResolved.tasks,
    subtasks: workspaceSeedResolved.subtasks,
  };

  let dashboardActionRequests: DashboardActionRequest[] = [];
  try {
    const serverRows = await listWorkspaceActionRequests({
      workspaceId: activeWorkspaceId,
      statuses: actionRequestOpenStatuses,
      limit: 10,
    });
    dashboardActionRequests = serverRows.map((request) => ({
      ...request,
      targetName:
        request.targetId != null
          ? workspaceSeedResolved.members.find((member) => member.id === request.targetId)
              ?.displayName ?? null
          : null,
    }));

    const membershipByProject = buildProjectMemberships(workspaceSeedResolved);
    const viewerProjectIds = new Set(
      membershipByProject
        .filter((membership) => membership.memberId === currentMemberId)
        .map((membership) => membership.projectId),
    );
    const isStaffViewer = activeRole === 'admin' || activeRole === 'internal';

    dashboardActionRequests = dashboardActionRequests.filter((request) => {
      if (isStaffViewer) return true;
      if (request.taskForType === 'organization') return true;
      if (request.taskForType === 'person') {
        return request.targetId != null && request.targetId === currentMemberId;
      }
      if (request.taskForType === 'group') {
        if (!request.targetId) return false;
        if (request.targetId === 'clients') return currentAudienceRole === 'client';
        if (request.targetId === 'experts') return currentAudienceRole === 'expert';
        if (request.targetId === 'staff') return currentAudienceRole === 'staff';
        return false;
      }
      if (request.taskForType === 'projectTeam') {
        return request.targetId != null && viewerProjectIds.has(request.targetId);
      }
      return false;
    });
  } catch (error) {
    void error;
    dashboardActionRequests = [];
  }

  const manageProjectsByRole = (() => {
    const rows = workspaceSeedResolved.tasks.map((t) => {
      const status =
        t.status === 'done'
          ? 'onReview'
          : t.status === 'blocked'
            ? 'onReview'
            : t.status === 'review'
              ? 'onReview'
              : t.status === 'doing'
              ? 'onProgress'
              : 'onProgress';

      return {
        id: `row-${t.id}`,
        client: {
          name: workspaceSeedResolved.clientLabel,
          handle: `@${workspaceSeedResolved.id}`,
        },
        task: {
          title: t.title,
          subtitle: `Project: ${workspaceSeedResolved.projects.find((p) => p.id === t.projectId)?.name ?? '—'}`,
        },
        dueOn: t.dueOn ?? '—',
        status,
        priority: t.status === 'blocked',
      };
    });

    if (permissions.canManageWorkspaceUsers || capabilities.canViewAllProjects) {
      return {
        title: 'Manage Projects',
        filters: [
          { id: 'priority', label: 'Priority' },
          { id: 'active', label: 'Active' },
          { id: 'draft', label: 'Draft' },
          { id: 'completed', label: 'Completed' },
        ],
        defaultFilterId: 'priority',
        rows,
      };
    }

    if (activeRole === 'client' || activeRole === 'viewer') {
      return {
        title: 'My Assignments',
        filters: [
          { id: 'priority', label: 'Priority' },
          { id: 'active', label: 'Active' },
          { id: 'draft', label: 'Draft' },
          { id: 'completed', label: 'Completed' },
        ],
        defaultFilterId: 'active',
        rows,
      };
    }

    return {
      title: 'My Assignments',
      filters: [
        { id: 'priority', label: 'Priority' },
        { id: 'active', label: 'Active' },
        { id: 'draft', label: 'Draft' },
        { id: 'completed', label: 'Completed' },
      ],
      defaultFilterId: 'active',
      rows,
    };
  })();

  const inboxByRole =
    activeRole === 'contractor'
      ? {
          ...inboxPreview,
          messages: inboxPreview.messages,
        }
      : inboxPreview;

  const currentUserName = identity.name;
  const firstName = currentUserName.trim().split(/\s+/)[0] ?? 'there';
  const sidebarAssistantForUser = {
    ...sidebarAssistant,
    greeting: `Hi, ${firstName}`,
  };

  return NextResponse.json({
    role: activeRole,
    permissions,
    capabilities,
    user: identity,
    memberships,
    activeMembership,
    availableWorkspaces,
    kpis: dashboardKpis,
    manageProjects: manageProjectsByRole,
    sidebarAssistant: sidebarAssistantForUser,
    promoLearning,
    inboxPreview: inboxByRole,
    workspaces,
    activeWorkspaceId,
    workspaceFeatures: {
      analyticsEnabled: Boolean(
        workspaceDirectory?.customWorkspaces?.find((entry) => entry.id === activeWorkspaceId)
          ?.analyticsEnabled ??
          workspaceConfig?.workspaces?.[activeWorkspaceId]?.settings?.analyticsEnabled ??
          false,
      ),
    },
    workspace,
    actionRequests: dashboardActionRequests,
  });
}

