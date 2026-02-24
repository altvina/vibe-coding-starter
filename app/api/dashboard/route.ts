import { NextResponse, type NextRequest } from 'next/server';

import {
  dashboardKpis,
  revenueAnalytics,
  progressDonut,
  sidebarAssistant,
  performanceEvaluation,
  promoLearning,
} from '@/app/dashboard/dashboard-data';
import { capabilitiesForRole } from '@/app/dashboard/dashboard-permissions';
import {
  defaultDashboardRole,
  isDashboardRole,
  type DashboardRole,
} from '@/app/dashboard/dashboard-roles';
import { WORKSPACE_CONFIG_COOKIE_KEY } from '@/app/dashboard/modules/workspace-admin/workspace-config';

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

type WorkspaceConfigV1 = {
  version: 1;
  workspaces: Record<
    string,
    {
      memberOverrides: Record<
        string,
        Partial<
          Record<
            'client' | 'expert',
            {
              visible?: boolean;
              alias?: string;
              showTitle?: boolean;
              showBio?: boolean;
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
  const roleParam = req.nextUrl.searchParams.get('role');
  const role: DashboardRole = isDashboardRole(roleParam)
    ? roleParam
    : defaultDashboardRole;
  const capabilities = capabilitiesForRole(role);
  const workspaceIdParam = req.nextUrl.searchParams.get('workspaceId');
  const workspaceConfig = readWorkspaceConfig(req);

  const CURRENT_MEMBER_ID_BY_ROLE: Record<DashboardRole, string> = {
    client: 'm-client-1',
    expert: 'm-expert-1',
    staff_admin: 'm-staff-1',
    super_admin: 'm-super-1',
  };

  function hasMember(seed: WorkspaceSeed, memberId: string) {
    return seed.members.some((m) => m.id === memberId);
  }

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

  const baseVisibleWorkspaceSeeds =
    role === 'super_admin'
      ? workspaceSeeds
      : workspaceSeeds.filter((w) => w.id !== 'ws-superadmin');

  const associatedWorkspaceSeeds =
    role === 'client' || role === 'expert'
      ? baseVisibleWorkspaceSeeds.filter((w) => hasMember(w, CURRENT_MEMBER_ID_BY_ROLE[role]))
      : baseVisibleWorkspaceSeeds;

  if (!associatedWorkspaceSeeds.length) {
    return NextResponse.json(
      { error: 'No workspaces available for this user.' },
      { status: 404 },
    );
  }

  const workspaces = associatedWorkspaceSeeds.map((w) => ({
    id: w.id,
    name: w.name,
    clientLabel: w.clientLabel,
  }));

  const defaultWorkspaceIdByRole: Record<DashboardRole, string> = {
    client: 'ws-acme',
    expert: 'ws-acme',
    staff_admin: 'ws-acme',
    super_admin: 'ws-superadmin',
  };

  const preferredDefaultWorkspaceId = defaultWorkspaceIdByRole[role];
  const fallbackDefaultWorkspaceId =
    workspaces.some((w) => w.id === preferredDefaultWorkspaceId)
      ? preferredDefaultWorkspaceId
      : workspaces[0]?.id ?? preferredDefaultWorkspaceId;

  if (workspaceIdParam && !workspaces.some((w) => w.id === workspaceIdParam)) {
    return NextResponse.json(
      { error: 'Workspace access denied for this user.' },
      { status: 403 },
    );
  }

  const activeWorkspaceId =
    workspaceIdParam && workspaces.some((w) => w.id === workspaceIdParam)
      ? workspaceIdParam
      : fallbackDefaultWorkspaceId;

  const workspaceSeed =
    associatedWorkspaceSeeds.find((w) => w.id === activeWorkspaceId) ??
    associatedWorkspaceSeeds[0];

  const currentMemberId = (() => {
    const preferred = CURRENT_MEMBER_ID_BY_ROLE[role];
    if (role === 'client' || role === 'expert' || role === 'super_admin') {
      return preferred;
    }

    // staff_admin: prefer stable staff identity when present; else use the staff member for the workspace.
    return (
      (preferred && hasMember(workspaceSeed, preferred) ? preferred : null) ??
      seedMemberByRole(workspaceSeed, 'staff')?.id ??
      workspaceSeed.members[0]?.id ??
      'unknown'
    );
  })();

  function seedMemberByRole(seed: WorkspaceSeed, memberRole: 'client' | 'expert' | 'staff') {
    return seed.members.find((m) => m.role === memberRole) ?? null;
  }

  function memberOverride(memberId: string, audience: 'client' | 'expert') {
    return workspaceConfig?.workspaces?.[activeWorkspaceId]?.memberOverrides?.[memberId]?.[audience] ?? null;
  }

  function projectRoleOverride(args: { projectId: string; memberId: string }) {
    return (
      workspaceConfig?.workspaces?.[activeWorkspaceId]?.projectMembershipOverrides?.[args.projectId]?.[args.memberId]
        ?.engagementRole ?? null
    );
  }

  function buildProjectMemberships(seed: WorkspaceSeed) {
    const base = seed.projectMemberships?.length
      ? seed.projectMemberships
      : (() => {
          const seen = new Set<string>();
          const rows: Array<{ projectId: string; memberId: string; engagementRole: string }> = [];
          seed.tasks.forEach((t) => {
            t.assigneeIds.forEach((memberId) => {
              const key = `${t.projectId}:${memberId}`;
              if (seen.has(key)) return;
              seen.add(key);
              const member = seed.members.find((m) => m.id === memberId);
              const fallbackRole =
                member?.role === 'expert'
                  ? 'Expert'
                  : member?.role === 'staff'
                    ? 'Altvina'
                    : 'Client';
              rows.push({ projectId: t.projectId, memberId, engagementRole: fallbackRole });
            });
          });
          return rows;
        })();

    return base.map((m) => ({
      ...m,
      engagementRole: projectRoleOverride({ projectId: m.projectId, memberId: m.memberId }) ?? m.engagementRole,
    }));
  }

  function maskMembers(seed: WorkspaceSeed): WorkspaceSeed['members'] {
    if (role === 'staff_admin' || role === 'super_admin') {
      return seed.members.map((m) => ({
        ...m,
      }));
    }

    if (role === 'client') {
      let expertIndex = 0;
      return seed.members
        .filter((m) => m.role !== 'client' || m.id === currentMemberId)
        .flatMap((m) => {
          const o = memberOverride(m.id, 'client');
          if (o?.visible === false && m.id !== currentMemberId) {
            return [];
          }

          const base = { ...m, email: undefined };
          if (m.role === 'expert') {
            expertIndex += 1;
            const titleHidden = o?.showTitle === false;
            const bioHidden = o?.showBio ? false : true;
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
                  (o?.alias?.trim() ? o.alias.trim() : null) ??
                  `Expert ${String.fromCharCode(64 + expertIndex)}`,
              },
            ];
          }
          if (m.role === 'staff') {
            const titleHidden = o?.showTitle === false;
            const bioHidden = o?.showBio ? false : true;
            return [
              {
                ...base,
                title: titleHidden ? undefined : base.title,
                bio: bioHidden ? undefined : base.bio,
                fieldMask: {
                  title: titleHidden || undefined,
                  bio: bioHidden || undefined,
                },
                displayName: o?.alias?.trim() ? o.alias.trim() : base.displayName,
              },
            ];
          }
          const titleHidden = o?.showTitle === false;
          const bioHidden = o?.showBio ? false : true;
          return [
            {
              ...base,
              title: titleHidden ? undefined : base.title,
              bio: bioHidden ? undefined : base.bio,
              fieldMask: {
                title: titleHidden || undefined,
                bio: bioHidden || undefined,
              },
              displayName: o?.alias?.trim() ? o.alias.trim() : base.displayName,
            },
          ];
        });
    }

    // expert role
    let clientIndex = 0;
    return seed.members
      .filter((m) => m.role !== 'client' || m.id === currentMemberId)
      .flatMap((m) => {
        const o = memberOverride(m.id, 'expert');
        if (o?.visible === false && m.id !== currentMemberId) {
          return [];
        }

        const base = { ...m, email: undefined };
        if (m.role === 'client') {
          clientIndex += 1;
          const titleHidden = o?.showTitle === false;
          const bioHidden = o?.showBio ? false : true;
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
                (o?.alias?.trim() ? o.alias.trim() : null) ??
                `Client ${String.fromCharCode(64 + clientIndex)}`,
            },
          ];
        }
        const titleHidden = o?.showTitle === false;
        const bioHidden = o?.showBio ? false : true;
        return [
          {
            ...base,
            title: titleHidden ? undefined : base.title,
            bio: bioHidden ? undefined : base.bio,
            fieldMask: {
              title: titleHidden || undefined,
              bio: bioHidden || undefined,
            },
            displayName: o?.alias?.trim() ? o.alias.trim() : base.displayName,
          },
        ];
      });
  }

  const maskedMembers = maskMembers(workspaceSeed);

  const members = maskedMembers.map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    displayName: m.displayName,
    username: m.username,
    role: m.role,
    headline: m.headline,
    title: m.title,
    bio: m.bio,
    location: m.location,
    phone: capabilities.canViewContactInfo ? m.phone : undefined,
    email: capabilities.canViewContactInfo ? m.email : undefined,
    linkedInUrl: m.linkedInUrl,
    website: m.website,
    skills: m.skills,
    fieldMask: m.fieldMask,
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

    if (role === 'staff_admin' || role === 'super_admin') {
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

    if (role === 'client') {
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

  const userByRole = {
    client: {
      name: 'Jordan Taylor',
      email: 'owner@acme-logistics.com',
      initials: 'JT',
    },
    expert: {
      name: 'Alex Morgan',
      email: 'expert@altvina.pro',
      initials: 'AM',
    },
    staff_admin: {
      name: 'Olivia Rodrigo',
      email: 'olivia@altvina.com',
      initials: 'OR',
    },
    super_admin: {
      name: 'Avery Admin',
      email: 'avery@altvina.com',
      initials: 'AA',
    },
  } satisfies Record<DashboardRole, { name: string; email: string; initials: string }>;

  const performanceByRole =
    capabilities.canSeeInternalNotes
      ? performanceEvaluation
      : {
          ...performanceEvaluation,
          note: '—',
        };

  const inboxByRole =
    role === 'expert'
      ? {
          ...inboxPreview,
          messages: inboxPreview.messages.map((m) => ({
            ...m,
            from: m.from === 'Acme Logistics' ? 'Client A' : m.from,
          })),
        }
      : inboxPreview;

  const currentUserName = userByRole[role].name;
  const firstName = currentUserName.trim().split(/\s+/)[0] ?? 'there';
  const sidebarAssistantForUser = {
    ...sidebarAssistant,
    greeting: `Hi, ${firstName}`,
  };

  return NextResponse.json({
    role,
    capabilities,
    user: userByRole[role],
    kpis: dashboardKpis,
    revenueAnalytics,
    progressDonut,
    manageProjects: manageProjectsByRole,
    sidebarAssistant: sidebarAssistantForUser,
    performanceEvaluation: performanceByRole,
    promoLearning,
    inboxPreview: inboxByRole,
    workspaces,
    activeWorkspaceId,
    workspace,
  });
}

