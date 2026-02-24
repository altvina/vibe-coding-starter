'use client';

import type { WorkspaceMember } from '@/app/dashboard/dashboard-context';

type PeopleStoreV1 = {
  version: 1;
  created: WorkspaceMember[];
  updated: Record<string, Partial<WorkspaceMember>>;
  deleted: string[];
};

const VERSION = 1 as const;

function storageKey(workspaceId: string) {
  return `altvina.dashboard.workspacePeople.${workspaceId}` as const;
}

export function defaultPeopleStore(): PeopleStoreV1 {
  return { version: VERSION, created: [], updated: {}, deleted: [] };
}

export function loadPeopleStore(workspaceId: string): PeopleStoreV1 {
  try {
    const raw = window.localStorage.getItem(storageKey(workspaceId));
    if (!raw) return defaultPeopleStore();
    const parsed = JSON.parse(raw) as PeopleStoreV1;
    if (parsed?.version !== VERSION) return defaultPeopleStore();
    return parsed;
  } catch (e) {
    void e;
    return defaultPeopleStore();
  }
}

export function savePeopleStore(workspaceId: string, store: PeopleStoreV1) {
  try {
    window.localStorage.setItem(storageKey(workspaceId), JSON.stringify(store));
  } catch (e) {
    void e;
  }
}

export function mergeMembers(args: {
  base: WorkspaceMember[];
  store: PeopleStoreV1;
}): WorkspaceMember[] {
  const deleted = new Set(args.store.deleted);
  const byId = new Map<string, WorkspaceMember>();

  function splitDisplayName(displayName: string) {
    const cleaned = displayName.trim().replace(/\s+/g, ' ');
    if (!cleaned) return { firstName: '', lastName: '' };
    const parts = cleaned.split(' ');
    const firstName = parts[0] ?? '';
    const lastName = parts.slice(1).join(' ');
    return { firstName, lastName };
  }

  /** Derive a URL-safe username from a name (e.g. "Jordan Taylor" -> "jordan.taylor"). */
  function deriveUsername(name: string, memberId: string): string {
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9._-]/g, '');
    return slug || memberId.replace(/^local-member-/, 'user.');
  }

  function normalizeMember(member: WorkspaceMember): WorkspaceMember {
    const first = member.firstName?.trim() ?? '';
    const last = member.lastName?.trim() ?? '';
    let normalized: WorkspaceMember;
    if (first || last) {
      const displayName = `${first} ${last}`.trim() || member.displayName;
      normalized = { ...member, firstName: first || undefined, lastName: last || undefined, displayName };
    } else {
      const split = splitDisplayName(member.displayName);
      normalized = {
        ...member,
        firstName: split.firstName || undefined,
        lastName: split.lastName || undefined,
        displayName: member.displayName,
      };
    }
    if (!normalized.username?.trim()) {
      normalized = { ...normalized, username: deriveUsername(normalized.displayName, normalized.id) };
    }
    return normalized;
  }

  args.base.forEach((m) => {
    if (deleted.has(m.id)) return;
    byId.set(m.id, normalizeMember(m));
  });

  args.store.created.forEach((m) => {
    if (deleted.has(m.id)) return;
    byId.set(m.id, normalizeMember(m));
  });

  Object.entries(args.store.updated).forEach(([id, patch]) => {
    const current = byId.get(id);
    if (!current) return;
    byId.set(id, normalizeMember({ ...current, ...patch }));
  });

  return Array.from(byId.values());
}

export function createMemberId(nowIso: string) {
  return `local-member-${nowIso}` as const;
}

