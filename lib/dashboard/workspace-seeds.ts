import { dashboardIdentitySeeds } from '@/app/dashboard/dashboard-identities';
import type { WorkspaceDirectoryV1 } from '@/lib/dashboard/workspace-directory';

export type WorkspaceSeedMember = {
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
};

export type WorkspaceSeed = {
  id: string;
  name: string;
  clientLabel: string;
  members: WorkspaceSeedMember[];
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

export const workspaceSeeds: WorkspaceSeed[] = [
  {
    id: 'ws-acme',
    name: 'Altvina Workspace',
    clientLabel: 'Altvina',
    members: [
      {
        id: 'm-jay-newcombe',
        firstName: 'Jay',
        lastName: 'Newcombe',
        displayName: 'Jay Newcombe',
        username: 'jay.newcombe',
        role: 'staff',
        title: 'Super Admin',
        bio: 'Highest-access workspace owner for Altvina.',
        email: 'jay@altvina.com',
      },
    ],
    updates: [
      {
        id: 'u-1',
        authorId: 'm-jay-newcombe',
        createdAt: '2026-02-23T10:00:00.000Z',
        body: 'Workspace is set up and ready for real data entry.',
        comments: [],
      },
    ],
    projects: [],
    tasks: [],
    subtasks: [],
  },
];

export function mergeDirectoryCustomWorkspaceSeeds(
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
      directory.ownerProfiles?.[entry.ownerIdentityId] ??
      dashboardIdentitySeeds.find((identity) => identity.id === entry.ownerIdentityId) ??
      { name: 'Workspace owner', email: 'owner@altvina.com' };
    const ownerEmail = owner.email?.trim() || 'owner@altvina.com';
    extras.push({
      id: entry.id,
      name: entry.name,
      clientLabel: entry.clientLabel,
      members: [
        {
          id: `m-${entry.id}-owner`,
          displayName: owner.name,
          username: ownerEmail.split('@')[0]?.replace(/[^a-z0-9._-]/gi, '.') ?? 'owner',
          role: 'staff',
          title: 'Workspace owner',
          bio: entry.description,
          email: ownerEmail,
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

export function applyWorkspaceDirectoryOverridesToSeed(
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

export function resolveWorkspaceSeedById(
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

export function workspaceLifecycleFromDirectory(
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

export function ownerDisplayForWorkspaceSeed(
  seed: WorkspaceSeed,
  directory: WorkspaceDirectoryV1 | null,
): { name: string; identityId: string | null } {
  const overrideOwner =
    directory?.seedOverrides?.[seed.id]?.ownerIdentityId ??
    directory?.customWorkspaces?.find((entry) => entry.id === seed.id)?.ownerIdentityId;
  if (overrideOwner) {
    const profile = directory?.ownerProfiles?.[overrideOwner];
    if (profile) {
      return { name: profile.name, identityId: overrideOwner };
    }
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
