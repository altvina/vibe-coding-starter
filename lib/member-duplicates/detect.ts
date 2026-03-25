import type { MemberMergeSignal } from '@/lib/member-duplicates/types';

export type MemberDuplicateCandidate = {
  canonicalMemberId: string;
  duplicateMemberId: string;
  signals: MemberMergeSignal[];
};

export type MemberForDuplicateDetection = {
  id: string;
  displayName: string;
  email?: string;
  username?: string;
  role: string;
};

function normEmail(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  return value.trim().toLowerCase();
}

function normName(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normUsername(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  return value.trim().toLowerCase();
}

function orderedPair(aId: string, bId: string): { canonicalMemberId: string; duplicateMemberId: string } {
  return aId <= bId
    ? { canonicalMemberId: aId, duplicateMemberId: bId }
    : { canonicalMemberId: bId, duplicateMemberId: aId };
}

/**
 * Heuristic duplicate detection for workspace rosters (same email, or same display name + username).
 */
export function detectMemberDuplicates(members: MemberForDuplicateDetection[]): MemberDuplicateCandidate[] {
  const out: MemberDuplicateCandidate[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      const a = members[i];
      const b = members[j];
      if (!a || !b) continue;

      const signals: MemberMergeSignal[] = [];
      const emailA = normEmail(a.email);
      const emailB = normEmail(b.email);
      if (emailA && emailB && emailA === emailB) {
        signals.push({ kind: 'email', detail: emailA });
      }

      const nameA = normName(a.displayName);
      const nameB = normName(b.displayName);
      const userA = normUsername(a.username);
      const userB = normUsername(b.username);
      if (nameA && nameB && nameA === nameB && userA && userB && userA === userB) {
        signals.push({
          kind: 'username',
          detail: `${userA} (${nameA})`,
        });
      }

      if (!signals.length) continue;

      const { canonicalMemberId, duplicateMemberId } = orderedPair(a.id, b.id);
      const key = `${canonicalMemberId}:${duplicateMemberId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ canonicalMemberId, duplicateMemberId, signals });
    }
  }

  return out;
}
