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

  args.base.forEach((m) => {
    if (deleted.has(m.id)) return;
    byId.set(m.id, m);
  });

  args.store.created.forEach((m) => {
    if (deleted.has(m.id)) return;
    byId.set(m.id, m);
  });

  Object.entries(args.store.updated).forEach(([id, patch]) => {
    const current = byId.get(id);
    if (!current) return;
    byId.set(id, { ...current, ...patch });
  });

  return Array.from(byId.values());
}

export function createMemberId(nowIso: string) {
  return `local-member-${nowIso}` as const;
}

