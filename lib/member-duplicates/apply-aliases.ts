import type { WorkspaceSeed, WorkspaceSeedMember } from '@/lib/dashboard/workspace-seeds';

function resolveId(id: string, aliases: Record<string, string>): string {
  const seen = new Set<string>();
  let cur = id;
  while (aliases[cur] && !seen.has(cur)) {
    seen.add(cur);
    cur = aliases[cur];
  }
  return cur;
}

function mergeSeedMemberFields(primary: WorkspaceSeedMember, secondary: WorkspaceSeedMember): WorkspaceSeedMember {
  return {
    ...secondary,
    ...primary,
    id: primary.id,
  };
}

/**
 * Collapse roster rows using approved merge aliases (duplicate id -> canonical id).
 */
export function applyMemberIdAliasesToSeedMembers(
  members: WorkspaceSeedMember[],
  aliases: Record<string, string>,
): WorkspaceSeedMember[] {
  if (!Object.keys(aliases).length) {
    return members.map((m) => ({ ...m }));
  }

  const byResolved = new Map<string, WorkspaceSeedMember>();
  for (const m of members) {
    const rid = resolveId(m.id, aliases);
    const row = { ...m, id: rid };
    const existing = byResolved.get(rid);
    if (!existing) {
      byResolved.set(rid, row);
    } else {
      byResolved.set(rid, mergeSeedMemberFields(existing, row));
    }
  }
  return Array.from(byResolved.values());
}

export function remapAuthorId(id: string, aliases: Record<string, string>): string {
  return resolveId(id, aliases);
}

export function remapAssigneeIds(ids: string[], aliases: Record<string, string>): string[] {
  const next = ids.map((id) => resolveId(id, aliases));
  return Array.from(new Set(next));
}

export function applyMemberAliasesToWorkspaceSeed(
  seed: WorkspaceSeed,
  aliases: Record<string, string>,
): WorkspaceSeed {
  if (!Object.keys(aliases).length) {
    return seed;
  }
  const members = applyMemberIdAliasesToSeedMembers(seed.members, aliases);
  return {
    ...seed,
    members,
    updates: seed.updates.map((u) => ({
      ...u,
      authorId: remapAuthorId(u.authorId, aliases),
      comments: u.comments.map((c) => ({
        ...c,
        authorId: remapAuthorId(c.authorId, aliases),
      })),
    })),
    projectMemberships: seed.projectMemberships?.map((pm) => ({
      ...pm,
      memberId: remapAuthorId(pm.memberId, aliases),
    })),
    tasks: seed.tasks.map((t) => ({
      ...t,
      assigneeIds: remapAssigneeIds(t.assigneeIds, aliases),
    })),
  };
}
