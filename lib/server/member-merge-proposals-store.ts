import 'server-only';

import { randomUUID } from 'node:crypto';

import { hasWorkspaceRole } from '@/lib/auth/workspace-rbac';
import type { WorkspaceMembership, WorkspaceRole } from '@/lib/auth/workspace-types';
import type { MemberForDuplicateDetection, MemberDuplicateCandidate } from '@/lib/member-duplicates/detect';
import type { MemberMergeApprovalMode, MemberMergeProposalRecord } from '@/lib/member-duplicates/types';

declare global {
  var __altvinaMemberMergeProposals: MemberMergeProposalRecord[] | undefined;
  var __altvinaMemberMergeAliases: Record<string, Record<string, string>> | undefined;
}

function proposalList(): MemberMergeProposalRecord[] {
  if (!globalThis.__altvinaMemberMergeProposals) {
    globalThis.__altvinaMemberMergeProposals = [];
  }
  return globalThis.__altvinaMemberMergeProposals;
}

function aliasMap(): Record<string, Record<string, string>> {
  if (!globalThis.__altvinaMemberMergeAliases) {
    globalThis.__altvinaMemberMergeAliases = {};
  }
  return globalThis.__altvinaMemberMergeAliases;
}

export function getAppliedAliasesForWorkspace(workspaceId: string): Record<string, string> {
  const row = aliasMap()[workspaceId];
  return row ? { ...row } : {};
}

function proposalKey(workspaceId: string, canonicalId: string, duplicateId: string) {
  return `${workspaceId}:${canonicalId}:${duplicateId}`;
}

function existingKeysForWorkspace(workspaceId: string): Set<string> {
  const keys = new Set<string>();
  for (const p of proposalList()) {
    if (p.workspaceId !== workspaceId) continue;
    if (p.status === 'rejected' || p.status === 'cancelled') continue;
    keys.add(proposalKey(p.workspaceId, p.canonicalMemberId, p.duplicateMemberId));
  }
  return keys;
}

export function listMemberMergeProposalsForWorkspace(workspaceId: string): MemberMergeProposalRecord[] {
  return proposalList()
    .filter((p) => p.workspaceId === workspaceId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getMemberMergeProposal(proposalId: string): MemberMergeProposalRecord | undefined {
  return proposalList().find((p) => p.id === proposalId);
}

export type CreateMemberMergeProposalsArgs = {
  workspaceId: string;
  candidates: MemberDuplicateCandidate[];
  approvalMode: MemberMergeApprovalMode;
  assignedApproverIdentityId?: string;
  authorizedApproverIdentityIds?: string[];
  authorizedRoles?: WorkspaceRole[];
};

/**
 * Inserts pending proposals for candidates that are not already covered by an open or resolved proposal.
 */
export function createMemberMergeProposalsFromScan(
  args: CreateMemberMergeProposalsArgs,
): MemberMergeProposalRecord[] {
  const existing = existingKeysForWorkspace(args.workspaceId);
  const created: MemberMergeProposalRecord[] = [];
  const now = new Date().toISOString();

  for (const c of args.candidates) {
    const key = proposalKey(args.workspaceId, c.canonicalMemberId, c.duplicateMemberId);
    if (existing.has(key)) continue;

    const dup: MemberMergeProposalRecord = {
      id: randomUUID(),
      workspaceId: args.workspaceId,
      createdAt: now,
      canonicalMemberId: c.canonicalMemberId,
      duplicateMemberId: c.duplicateMemberId,
      signals: c.signals,
      approvalMode: args.approvalMode,
      assignedApproverIdentityId: args.assignedApproverIdentityId,
      authorizedApproverIdentityIds: args.authorizedApproverIdentityIds,
      authorizedRoles: args.authorizedRoles,
      status: 'pending',
      decisions: [],
    };
    proposalList().push(dup);
    existing.add(key);
    created.push(dup);
  }

  return created;
}

function isApproverForFirstResponder(args: {
  identityId: string;
  memberships: WorkspaceMembership[];
  workspaceId: string;
  proposal: MemberMergeProposalRecord;
}): boolean {
  const { proposal } = args;
  if (proposal.authorizedApproverIdentityIds?.includes(args.identityId)) {
    return true;
  }
  if (proposal.authorizedRoles?.length) {
    return hasWorkspaceRole(args.memberships, args.workspaceId, proposal.authorizedRoles);
  }
  return false;
}

function canActOnProposal(args: {
  identityId: string;
  memberships: WorkspaceMembership[];
  proposal: MemberMergeProposalRecord;
}): { ok: true } | { ok: false; reason: string } {
  const { proposal } = args;
  if (proposal.status !== 'pending') {
    return { ok: false, reason: 'This proposal is no longer pending.' };
  }

  if (proposal.approvalMode === 'assigned_user') {
    if (!proposal.assignedApproverIdentityId) {
      return { ok: false, reason: 'Assigned approver is not configured for this proposal.' };
    }
    if (proposal.assignedApproverIdentityId !== args.identityId) {
      return { ok: false, reason: 'Only the assigned approver can resolve this proposal.' };
    }
    return { ok: true };
  }

  if (!isApproverForFirstResponder({ ...args, workspaceId: proposal.workspaceId })) {
    return { ok: false, reason: 'You are not in the authorized group for this proposal.' };
  }
  return { ok: true };
}

export function recordMemberMergeDecision(args: {
  proposalId: string;
  identityId: string;
  memberships: WorkspaceMembership[];
  action: 'approve' | 'reject';
}): { ok: true; proposal: MemberMergeProposalRecord } | { ok: false; reason: string } {
  const proposal = getMemberMergeProposal(args.proposalId);
  if (!proposal) {
    return { ok: false, reason: 'Proposal not found.' };
  }

  const gate = canActOnProposal({
    identityId: args.identityId,
    memberships: args.memberships,
    proposal,
  });
  if (!gate.ok) {
    return gate;
  }

  const at = new Date().toISOString();
  proposal.decisions.push({ identityId: args.identityId, at, action: args.action });

  if (args.action === 'reject') {
    proposal.status = 'rejected';
    proposal.resolvedAt = at;
    proposal.resolvedByIdentityId = args.identityId;
    return { ok: true, proposal };
  }

  const workspaceAliases = aliasMap()[proposal.workspaceId] ?? {};
  workspaceAliases[proposal.duplicateMemberId] = proposal.canonicalMemberId;
  aliasMap()[proposal.workspaceId] = workspaceAliases;

  proposal.status = 'approved';
  proposal.resolvedAt = at;
  proposal.resolvedByIdentityId = args.identityId;
  return { ok: true, proposal };
}

export function cancelMemberMergeProposal(
  proposalId: string,
): { ok: true; proposal: MemberMergeProposalRecord } | { ok: false; reason: string } {
  const proposal = getMemberMergeProposal(proposalId);
  if (!proposal) {
    return { ok: false, reason: 'Proposal not found.' };
  }
  if (proposal.status !== 'pending') {
    return { ok: false, reason: 'Only pending proposals can be cancelled.' };
  }
  proposal.status = 'cancelled';
  proposal.resolvedAt = new Date().toISOString();
  return { ok: true, proposal };
}

/** Build detection input from roster rows (admin-visible fields). */
export function membersForDetectionFromSeedMembers(
  members: Array<{
    id: string;
    displayName: string;
    username?: string;
    role: string;
    email?: string;
  }>,
): MemberForDuplicateDetection[] {
  return members.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    username: m.username,
    role: m.role,
    email: m.email,
  }));
}

