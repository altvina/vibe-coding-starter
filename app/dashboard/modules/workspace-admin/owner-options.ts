'use client';

import { dashboardIdentitySeeds } from '@/app/dashboard/dashboard-identities';
import type { WorkspaceMember } from '@/app/dashboard/dashboard-context';
import type {
  WorkspaceDirectoryV1,
  WorkspaceOwnerProfile,
} from '@/lib/dashboard/workspace-directory';

const PEOPLE_STORAGE_PREFIX = 'altvina.dashboard.workspacePeople.';

type PeopleStoreLike = {
  created?: WorkspaceMember[];
  updated?: Record<string, Partial<WorkspaceMember>>;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase() || 'U';
}

function normalizeOwnerProfile(input: Partial<WorkspaceOwnerProfile>) {
  const name = input.name?.trim();
  if (!name) {
    return null;
  }
  return {
    name,
    email: input.email?.trim() || undefined,
    initials: input.initials?.trim() || initialsFromName(name),
  } satisfies WorkspaceOwnerProfile;
}

function ownerProfileFromMember(member: WorkspaceMember): WorkspaceOwnerProfile | null {
  return normalizeOwnerProfile({
    name:
      `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.displayName || member.email,
    email: member.email,
  });
}

function ownerProfileFromPatch(patch: Partial<WorkspaceMember>): WorkspaceOwnerProfile | null {
  return normalizeOwnerProfile({
    name:
      `${patch.firstName ?? ''} ${patch.lastName ?? ''}`.trim() ||
      patch.displayName ||
      patch.email,
    email: patch.email,
  });
}

function profileEquals(a: WorkspaceOwnerProfile | undefined, b: WorkspaceOwnerProfile | undefined) {
  if (!a || !b) {
    return false;
  }
  return a.name === b.name && a.email === b.email && a.initials === b.initials;
}

function parsePeopleStore(raw: string | null): PeopleStoreLike | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as PeopleStoreLike;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function collectOwnerProfilesFromBrowser(
  directory: WorkspaceDirectoryV1,
): WorkspaceDirectoryV1 {
  if (typeof window === 'undefined') {
    return directory;
  }

  const merged: Record<string, WorkspaceOwnerProfile> = { ...directory.ownerProfiles };
  let changed = false;

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(PEOPLE_STORAGE_PREFIX)) {
      continue;
    }
    const store = parsePeopleStore(window.localStorage.getItem(key));
    if (!store) {
      continue;
    }

    for (const member of store.created ?? []) {
      const profile = ownerProfileFromMember(member);
      if (!profile) {
        continue;
      }
      if (!profileEquals(merged[member.id], profile)) {
        merged[member.id] = profile;
        changed = true;
      }
    }

    for (const [memberId, patch] of Object.entries(store.updated ?? {})) {
      const profile = ownerProfileFromPatch(patch);
      if (!profile) {
        continue;
      }
      if (!profileEquals(merged[memberId], profile)) {
        merged[memberId] = profile;
        changed = true;
      }
    }
  }

  if (!changed) {
    return directory;
  }
  return {
    ...directory,
    ownerProfiles: merged,
  };
}

export function ownerOptionsFromDirectory(directory: WorkspaceDirectoryV1) {
  const dynamicOptions = Object.entries(directory.ownerProfiles).map(([id, profile]) => ({
    id,
    name: profile.name,
    email: profile.email,
  }));
  const seedOptions = dashboardIdentitySeeds.map((identity) => ({
    id: identity.id,
    name: identity.name,
    email: identity.email,
  }));

  const byId = new Map<string, { id: string; name: string; email?: string }>();
  [...seedOptions, ...dynamicOptions].forEach((option) => {
    byId.set(option.id, option);
  });
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}
