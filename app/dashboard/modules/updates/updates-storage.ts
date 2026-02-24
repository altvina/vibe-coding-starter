import type { WorkspaceUpdate, WorkspaceUpdateComment } from '@/app/dashboard/dashboard-context';

export type StoredWorkspaceUpdates = {
  updates: WorkspaceUpdate[];
};

function storageKey(workspaceId: string) {
  return `altvina.dashboard.workspaceUpdates.${workspaceId}` as const;
}

export function loadStoredUpdates(workspaceId: string): StoredWorkspaceUpdates | null {
  try {
    const raw = window.localStorage.getItem(storageKey(workspaceId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredWorkspaceUpdates;
  } catch (e) {
    void e;
    return null;
  }
}

export function saveStoredUpdates(workspaceId: string, value: StoredWorkspaceUpdates) {
  try {
    window.localStorage.setItem(storageKey(workspaceId), JSON.stringify(value));
  } catch (e) {
    void e;
  }
}

export function createLocalUpdate(args: {
  authorId: string;
  body: string;
  nowIso: string;
}): WorkspaceUpdate {
  return {
    id: `local-u-${args.nowIso}`,
    authorId: args.authorId,
    createdAt: args.nowIso,
    body: args.body,
    comments: [],
  };
}

export function createLocalComment(args: {
  authorId: string;
  body: string;
  nowIso: string;
}): WorkspaceUpdateComment {
  return {
    id: `local-c-${args.nowIso}`,
    authorId: args.authorId,
    createdAt: args.nowIso,
    body: args.body,
  };
}

