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
import {
  dashboardIdentitySeeds,
  defaultDashboardIdentityId,
  isDashboardIdentityId,
} from '@/app/dashboard/dashboard-identities';
import {
  getMembershipSeedsForIdentity,
  getMembershipsForIdentity,
} from '@/lib/auth/mock-memberships';
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

const inboxPreview = {
  title: 'Inbox',
  messages: [
    {
      id: 'm1',
      from: 'Altvina Match Team',
      subject: 'We found 2 experts for your brief',
      preview: 'Reply to confirm availability and we’ll schedule intros.',
      time: '2h',
    },
    {
      id: 'm2',
      from: 'Acme Logistics',
      subject: 'Can we tighten the weekly reporting?',
      preview: 'Looking for a cleaner KPI snapshot for leadership.',
      time: '1d',
    },
    {
      id: 'm3',
      from: 'Horizon Health',
      subject: 'Automation scope follow-up',
      preview: 'We listed a few workflows—can you pick priorities?',
      time: '3d',
    },
  ],
} as const;

type WorkspaceSeed = {
  id: string;
  name: string;
  clientLabel: string;
  members: Array<{
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
    fieldMask?: { name?: boolean; title?: boolean; bio?: boolean };
  }>;
  updates: Array<{
    id: string;
    authorId: string;
    createdAt: string;
    body: string;
    comments: Array<{ id: string; authorId: string; createdAt: string; body: string }>;
  }>;
  projects: Array<{ id: string; name: string; status: 'active' | 'review' | 'done' }>;
  projectMemberships?: Array<{
    projectId: string;
    memberId: string;
    engagementRole: string;
  }>;
  tasks: Array<{
    id: string;
    projectId: string;
    title: string;
    status: 'todo' | 'doing' | 'blocked' | 'review' | 'done';
    dueOn?: string;
    assigneeIds: string[];
  }>;
  subtasks: Array<{ id: string; taskId: string; title: string; done: boolean }>;
};

const workspaceSeeds: WorkspaceSeed[] = [
  {
    id: 'ws-superadmin',
    name: 'Super Admin',
    clientLabel: 'Platform',
    members: [
      {
        id: 'm-super-1',
        firstName: 'Avery',
        lastName: 'Admin',
        displayName: 'Avery Admin',
        username: 'avery.admin',
        role: 'staff',
        title: 'Super Admin',
        bio: 'Platform-wide administrator. Keep at least two super admins as backups.',
        email: 'avery@altvina.com',
      },
      {
        id: 'm-super-2',
        firstName: 'Morgan',
        lastName: 'Root',
        displayName: 'Morgan Root',
        username: 'morgan.root',
        role: 'staff',
        title: 'Super Admin',
        bio: 'Backup platform admin (simulation).',
        email: 'morgan@altvina.com',
      },
    ],
    updates: [
      {
        id: 'u-sa-1',
        authorId: 'm-super-1',
        createdAt: '2026-02-23T10:00:00.000Z',
        body: 'Super Admin workspace: manage platform-wide access and safety controls here.',
        comments: [],
      },
    ],
    projects: [],
    tasks: [],
    subtasks: [],
  },
  {
    id: 'ws-acme',
    name: 'Acme Logistics',
    clientLabel: 'Acme Logistics',
    members: [
      {
        id: 'm-client-1',
        firstName: 'Jordan',
        lastName: 'Taylor',
        displayName: 'Jordan Taylor',
        username: 'jordan.taylor',
        role: 'client',
        title: 'Owner',
        bio: 'Primary decision maker for the engagement.',
        email: 'owner@acme-logistics.com',
      },
      {
        id: 'm-client-2',
        firstName: 'Sam',
        lastName: 'Lee',
        displayName: 'Sam Lee',
        username: 'sam.lee',
        role: 'client',
        title: 'Ops Lead',
        bio: 'Owns day-to-day execution and handoffs.',
        email: 'ops@acme-logistics.com',
      },
      {
        id: 'm-expert-1',
        firstName: 'Alex',
        lastName: 'Morgan',
        displayName: 'Alex Morgan',
        username: 'alex.morgan',
        role: 'expert',
        headline: 'Fractional COO · Ops & process automation',
        title: 'Fractional COO',
        bio: 'Specializes in ops cadence + automation. 10+ years building teams and systems that scale.',
        location: 'San Francisco, CA',
        email: 'expert@altvina.pro',
        skills: 'Operations, Strategy, Process design, Analytics',
      },
      {
        id: 'm-staff-1',
        firstName: 'Olivia',
        lastName: 'Rodrigo',
        displayName: 'Olivia Rodrigo',
        username: 'olivia.rodrigo',
        role: 'staff',
        headline: 'Program Lead · Client success & delivery',
        title: 'Altvina Program Lead',
        bio: 'Manages scope, expectations, and comms. Keeps engagements on track and stakeholders aligned.',
        location: 'New York, NY',
        email: 'olivia@altvina.com',
        skills: 'Project management, Client relations, Operations',
      },
    ],
    updates: [
      {
        id: 'u-1',
        authorId: 'm-staff-1',
        createdAt: '2026-02-22T18:10:00.000Z',
        body: 'Welcome to the workspace. This feed is the shared conduit for updates—Altvina keeps things clear and controlled.',
        comments: [
          {
            id: 'c-1',
            authorId: 'm-client-1',
            createdAt: '2026-02-22T19:02:00.000Z',
            body: 'Sounds good—weekly snapshot works for us.',
          },
        ],
      },
      {
        id: 'u-2',
        authorId: 'm-expert-1',
        createdAt: '2026-02-23T16:30:00.000Z',
        body: 'Drafted the first cadence proposal. Next: confirm the top 3 workflows to automate.',
        comments: [],
      },
    ],
    projects: [
      { id: 'p-1', name: 'Ops Automation Sprint', status: 'active' },
      { id: 'p-2', name: 'Weekly Reporting Cadence', status: 'review' },
    ],
    projectMemberships: [
      { projectId: 'p-1', memberId: 'm-client-1', engagementRole: 'Client' },
      { projectId: 'p-1', memberId: 'm-client-2', engagementRole: 'Client' },
      { projectId: 'p-1', memberId: 'm-expert-1', engagementRole: 'Expert' },
      { projectId: 'p-1', memberId: 'm-staff-1', engagementRole: 'Altvina' },
      { projectId: 'p-2', memberId: 'm-client-1', engagementRole: 'Client' },
      { projectId: 'p-2', memberId: 'm-expert-1', engagementRole: 'Partner' },
      { projectId: 'p-2', memberId: 'm-staff-1', engagementRole: 'Altvina' },
    ],
    tasks: [
      {
        id: 't-1',
        projectId: 'p-1',
        title: 'Map intake → triage → assignment',
        status: 'doing',
        dueOn: 'Feb 27, 2026',
        assigneeIds: ['m-expert-1', 'm-staff-1'],
      },
      {
        id: 't-2',
        projectId: 'p-1',
        title: 'Select automation tools (low lift)',
        status: 'todo',
        dueOn: 'Feb 28, 2026',
        assigneeIds: ['m-staff-1'],
      },
      {
        id: 't-3',
        projectId: 'p-2',
        title: 'Agree weekly KPI snapshot format',
        status: 'review',
        dueOn: 'Mar 02, 2026',
        assigneeIds: ['m-client-1', 'm-staff-1'],
      },
    ],
    subtasks: [
      { id: 'st-1', taskId: 't-1', title: 'List current intake channels', done: true },
      { id: 'st-2', taskId: 't-1', title: 'Draft triage rules', done: false },
      { id: 'st-3', taskId: 't-3', title: 'Pick KPIs for week 1', done: false },
    ],
  },
  {
    id: 'ws-horizon',
    name: 'Horizon Health',
    clientLabel: 'Horizon Health',
    members: [
      { id: 'm-client-3', firstName: 'Casey', lastName: 'Nguyen', displayName: 'Casey Nguyen', username: 'casey.nguyen', role: 'client', title: 'Director', email: 'casey@horizon.example' },
      { id: 'm-expert-2', firstName: 'Taylor', lastName: 'Kim', displayName: 'Taylor Kim', username: 'taylor.kim', role: 'expert', title: 'Growth Ops', email: 'taylor@altvina.pro' },
      { id: 'm-staff-1', firstName: 'Olivia', lastName: 'Rodrigo', displayName: 'Olivia Rodrigo', username: 'olivia.rodrigo', role: 'staff', title: 'Altvina Program Lead', email: 'olivia@altvina.com' },
    ],
    updates: [
      {
        id: 'u-3',
        authorId: 'm-staff-1',
        createdAt: '2026-02-21T15:00:00.000Z',
        body: 'Kickoff complete. Next step: confirm the KPI baseline and target outcome.',
        comments: [],
      },
    ],
    projects: [{ id: 'p-3', name: 'Growth Analytics Audit', status: 'active' }],
    tasks: [
      {
        id: 't-4',
        projectId: 'p-3',
        title: 'Audit funnel + reporting gaps',
        status: 'doing',
        dueOn: 'Mar 05, 2026',
        assigneeIds: ['m-expert-2'],
      },
    ],
    subtasks: [{ id: 'st-4', taskId: 't-4', title: 'Collect existing dashboards', done: false }],
  },
  {
    id: 'ws-vertex',
    name: 'Vertex Retail',
    clientLabel: 'Vertex Retail',
    members: [
      { id: 'm-client-4', firstName: 'Riley', lastName: 'Park', displayName: 'Riley Park', username: 'riley.park', role: 'client', title: 'VP Ops', email: 'riley@vertex.example' },
      { id: 'm-expert-1', firstName: 'Alex', lastName: 'Morgan', displayName: 'Alex Morgan', username: 'alex.morgan', role: 'expert', title: 'Fractional COO', email: 'expert@altvina.pro' },
      { id: 'm-staff-2', firstName: 'Jordan', lastName: 'Smith', displayName: 'Jordan Smith', username: 'jordan.smith', role: 'staff', title: 'Altvina Ops', email: 'ops@altvina.com' },
    ],
    updates: [],
    projects: [{ id: 'p-4', name: 'PM Playbook Rollout', status: 'active' }],
    tasks: [
      {
        id: 't-5',
        projectId: 'p-4',
        title: 'Define rituals + templates',
        status: 'todo',
        dueOn: 'Mar 07, 2026',
        assigneeIds: ['m-expert-1', 'm-staff-2'],
      },
    ],
    subtasks: [{ id: 'st-5', taskId: 't-5', title: 'Draft weekly agenda', done: false }],
  },
];

function mergeDirectoryCustomWorkspaceSeeds(
  baseSeeds: WorkspaceSeed[],
  directory: WorkspaceDirectoryV1 | null,
): WorkspaceSeed[] {
  if (!directory?.customWorkspaces?.length) {
    return baseSeeds;
  }
  const existing = new Set(baseSeeds.map((seed) => seed.id));
  const extras: WorkspaceSeed[] = [];
  for (const entry of directory.customWorkspaces) {
    if (existing.has(entry.id)) {
      continue;
    }
    existing.add(entry.id);
    const owner =
      dashboardIdentitySeeds.find((identity) => identity.id === entry.ownerIdentityId) ??
      dashboardIdentitySeeds[0];
    extras.push({
      id: entry.id,
      name: entry.name,
      clientLabel: entry.clientLabel,
      members: [
        {
          id: `m-${entry.id}-owner`,
          displayName: owner.name,
          username: owner.email.split('@')[0]?.replace(/[^a-z0-9._-]/gi, '.') ?? 'owner',
          role: 'staff',
          title: 'Workspace owner',
          bio: entry.description,
          email: owner.email,
        },
      ],
      updates: [],
      projects: [],
      tasks: [],
      subtasks: [],
    });
  }
  return [...baseSeeds, ...extras];
}

function applyWorkspaceDirectoryOverridesToSeed(
  seed: WorkspaceSeed,
  directory: WorkspaceDirectoryV1 | null,
): WorkspaceSeed {
  const override = directory?.seedOverrides?.[seed.id];
  if (!override) {
    return seed;
  }
  return {
    ...seed,
    name: override.name ?? seed.name,
    clientLabel: override.clientLabel ?? seed.clientLabel,
  };
}

function resolveWorkspaceSeedById(
  workspaceId: string,
  directory: WorkspaceDirectoryV1 | null,
  merged: WorkspaceSeed[],
): WorkspaceSeed | undefined {
  const raw = merged.find((seed) => seed.id === workspaceId);
  if (!raw) {
    return undefined;
  }
  return applyWorkspaceDirectoryOverridesToSeed(raw, directory);
}

function workspaceLifecycleFromDirectory(
  workspaceId: string,
  directory: WorkspaceDirectoryV1 | null,
): 'active' | 'archived' {
  const custom = directory?.customWorkspaces?.find((entry) => entry.id === workspaceId);
  if (custom) {
    return custom.status;
  }
  if (directory?.seedOverrides?.[workspaceId]?.status === 'archived') {
    return 'archived';
  }
  return 'active';
}

function ownerDisplayForWorkspaceSeed(
  seed: WorkspaceSeed,
  directory: WorkspaceDirectoryV1 | null,
): { name: string; identityId: string | null } {
  const overrideOwner =
    directory?.seedOverrides?.[seed.id]?.ownerIdentityId ??
    directory?.customWorkspaces?.find((entry) => entry.id === seed.id)?.ownerIdentityId;
  if (overrideOwner) {
    const match = dashboardIdentitySeeds.find((identity) => identity.id === overrideOwner);
    if (match) {
      return { name: match.name, identityId: match.id };
    }
  }
  const primaryClient = seed.members.find((member) => member.role === 'client');
  if (primaryClient) {
    return { name: primaryClient.displayName, identityId: null };
  }
  const staff = seed.members.find((member) => member.role === 'staff');
  return { name: staff?.displayName ?? '—', identityId: null };
}

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
  const identityIdParam = req.nextUrl.searchParams.get('identityId');
  const identityId = isDashboardIdentityId(identityIdParam)
    ? identityIdParam
    : defaultDashboardIdentityId;
  const identity =
    dashboardIdentitySeeds.find((seed) => seed.id === identityId) ??
    dashboardIdentitySeeds[0];
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
    seedMemberByRole(workspaceSeed, currentAudienceRole)?.id ??
    workspaceSeed.members[0]?.id ??
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
      client: workspaceSeed.clientLabel,
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

  const maskedMembers = maskMembers(workspaceSeed);
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

  const updates = workspaceSeed.updates.map((u) => ({
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
    projects: workspaceSeed.projects,
    projectMemberships: buildProjectMemberships(workspaceSeed),
    tasks: workspaceSeed.tasks,
    subtasks: workspaceSeed.subtasks,
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
          ? workspaceSeed.members.find((member) => member.id === request.targetId)
              ?.displayName ?? null
          : null,
    }));

    const membershipByProject = buildProjectMemberships(workspaceSeed);
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
    const rows = workspaceSeed.tasks.map((t) => {
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
        client: { name: workspaceSeed.clientLabel, handle: `@${workspaceSeed.id}` },
        task: { title: t.title, subtitle: `Project: ${workspaceSeed.projects.find((p) => p.id === t.projectId)?.name ?? '—'}` },
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
          messages: inboxPreview.messages.map((m) => ({
            ...m,
            from: m.from === 'Acme Logistics' ? 'Client A' : m.from,
          })),
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

