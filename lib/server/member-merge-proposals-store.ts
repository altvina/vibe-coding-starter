import 'server-only';

import { Pool, type PoolClient } from 'pg';

import { hasWorkspaceRole } from '@/lib/auth/workspace-rbac';
import type { WorkspaceMembership, WorkspaceRole } from '@/lib/auth/workspace-types';
import type { MemberForDuplicateDetection, MemberDuplicateCandidate } from '@/lib/member-duplicates/detect';
import type { MemberMergeApprovalMode, MemberMergeProposalRecord } from '@/lib/member-duplicates/types';

declare global {
  var __altvinaMemberMergeProposalsPool: Pool | undefined;
}

type MemberMergeProposalRow = {
  id: string;
  workspace_id: string;
  canonical_member_id: string;
  duplicate_member_id: string;
  signals: unknown;
  approval_mode: MemberMergeApprovalMode;
  assigned_approver_identity_id: string | null;
  authorized_approver_identity_ids: string[] | null;
  authorized_roles: WorkspaceRole[] | null;
  status: MemberMergeProposalRecord['status'];
  decisions: unknown;
  resolved_at: string | Date | null;
  resolved_by_identity_id: string | null;
  created_at: string | Date;
};

function toIso(value: string | Date | null | undefined) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function safeSignals(value: unknown): MemberMergeProposalRecord['signals'] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is MemberMergeProposalRecord['signals'][number] =>
      typeof entry === 'object' &&
      entry != null &&
      'kind' in entry &&
      'detail' in entry &&
      (entry as { kind?: unknown }).kind !== undefined &&
      typeof (entry as { detail?: unknown }).detail === 'string',
  );
}

function safeDecisions(value: unknown): MemberMergeProposalRecord['decisions'] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is MemberMergeProposalRecord['decisions'][number] =>
      typeof entry === 'object' &&
      entry != null &&
      typeof (entry as { identityId?: unknown }).identityId === 'string' &&
      typeof (entry as { at?: unknown }).at === 'string' &&
      ((entry as { action?: unknown }).action === 'approve' ||
        (entry as { action?: unknown }).action === 'reject'),
  );
}

function mapRow(row: MemberMergeProposalRow): MemberMergeProposalRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    canonicalMemberId: row.canonical_member_id,
    duplicateMemberId: row.duplicate_member_id,
    signals: safeSignals(row.signals),
    approvalMode: row.approval_mode,
    assignedApproverIdentityId: row.assigned_approver_identity_id ?? undefined,
    authorizedApproverIdentityIds: row.authorized_approver_identity_ids ?? undefined,
    authorizedRoles: row.authorized_roles ?? undefined,
    status: row.status,
    decisions: safeDecisions(row.decisions),
    resolvedAt: toIso(row.resolved_at),
    resolvedByIdentityId: row.resolved_by_identity_id ?? undefined,
  };
}

function getPool() {
  if (globalThis.__altvinaMemberMergeProposalsPool) {
    return globalThis.__altvinaMemberMergeProposalsPool;
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }
  globalThis.__altvinaMemberMergeProposalsPool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });
  return globalThis.__altvinaMemberMergeProposalsPool;
}

export async function getAppliedAliasesForWorkspace(workspaceId: string): Promise<Record<string, string>> {
  const pool = getPool();
  const result = await pool.query<{
    duplicate_member_id: string;
    canonical_member_id: string;
  }>(
    `
      select duplicate_member_id, canonical_member_id
      from member_merge_aliases
      where workspace_id = $1
    `,
    [workspaceId],
  );
  return result.rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.duplicate_member_id] = row.canonical_member_id;
    return acc;
  }, {});
}

export async function listMemberMergeProposalsForWorkspace(
  workspaceId: string,
): Promise<MemberMergeProposalRecord[]> {
  const pool = getPool();
  const result = await pool.query<MemberMergeProposalRow>(
    `
      select *
      from member_merge_proposals
      where workspace_id = $1
      order by created_at desc
    `,
    [workspaceId],
  );
  return result.rows.map(mapRow);
}

export async function getMemberMergeProposal(
  proposalId: string,
  client?: PoolClient,
): Promise<MemberMergeProposalRecord | undefined> {
  const executor = client ?? getPool();
  const result = await executor.query<MemberMergeProposalRow>(
    `
      select *
      from member_merge_proposals
      where id = $1
      limit 1
    `,
    [proposalId],
  );
  const row = result.rows[0];
  return row ? mapRow(row) : undefined;
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
export async function createMemberMergeProposalsFromScan(
  args: CreateMemberMergeProposalsArgs,
): Promise<MemberMergeProposalRecord[]> {
  const pool = getPool();
  const created: MemberMergeProposalRecord[] = [];

  for (const c of args.candidates) {
    const inserted = await pool.query<MemberMergeProposalRow>(
      `
        insert into member_merge_proposals (
          workspace_id,
          canonical_member_id,
          duplicate_member_id,
          signals,
          approval_mode,
          assigned_approver_identity_id,
          authorized_approver_identity_ids,
          authorized_roles,
          status,
          decisions
        )
        select
          $1, $2, $3, $4::jsonb, $5, $6, $7::text[], $8::text[], 'pending', '[]'::jsonb
        where not exists (
          select 1
          from member_merge_proposals
          where workspace_id = $1
            and least(canonical_member_id, duplicate_member_id) = least($2, $3)
            and greatest(canonical_member_id, duplicate_member_id) = greatest($2, $3)
            and status in ('pending', 'approved')
        )
        returning *
      `,
      [
        args.workspaceId,
        c.canonicalMemberId,
        c.duplicateMemberId,
        JSON.stringify(c.signals),
        args.approvalMode,
        args.assignedApproverIdentityId ?? null,
        args.authorizedApproverIdentityIds ?? [],
        args.authorizedRoles ?? [],
      ],
    );
    if (inserted.rows[0]) {
      created.push(mapRow(inserted.rows[0]));
    }
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

export async function recordMemberMergeDecision(args: {
  proposalId: string;
  identityId: string;
  memberships: WorkspaceMembership[];
  action: 'approve' | 'reject';
}): Promise<{ ok: true; proposal: MemberMergeProposalRecord } | { ok: false; reason: string }> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('begin');
    const lockResult = await client.query<MemberMergeProposalRow>(
      `
        select *
        from member_merge_proposals
        where id = $1
        for update
      `,
      [args.proposalId],
    );
    const lockedRow = lockResult.rows[0];
    const proposal = lockedRow ? mapRow(lockedRow) : undefined;
    if (!proposal) {
      await client.query('rollback');
      return { ok: false, reason: 'Proposal not found.' };
    }

    const gate = canActOnProposal({
      identityId: args.identityId,
      memberships: args.memberships,
      proposal,
    });
    if (!gate.ok) {
      await client.query('rollback');
      return gate;
    }

    const at = new Date().toISOString();
    const decision = JSON.stringify({ identityId: args.identityId, at, action: args.action });

    if (args.action === 'reject') {
      const updated = await client.query<MemberMergeProposalRow>(
        `
          update member_merge_proposals
          set
            decisions = coalesce(decisions, '[]'::jsonb) || jsonb_build_array($2::jsonb),
            status = 'rejected',
            resolved_at = $3,
            resolved_by_identity_id = $4,
            updated_at = now()
          where id = $1
          returning *
        `,
        [args.proposalId, decision, at, args.identityId],
      );
      await client.query('commit');
      return { ok: true, proposal: mapRow(updated.rows[0]) };
    }

    await client.query(
      `
        insert into member_merge_aliases (
          workspace_id,
          duplicate_member_id,
          canonical_member_id,
          applied_by_identity_id,
          applied_at
        )
        values ($1, $2, $3, $4, $5)
        on conflict (workspace_id, duplicate_member_id)
        do update set
          canonical_member_id = excluded.canonical_member_id,
          applied_by_identity_id = excluded.applied_by_identity_id,
          applied_at = excluded.applied_at
      `,
      [
        proposal.workspaceId,
        proposal.duplicateMemberId,
        proposal.canonicalMemberId,
        args.identityId,
        at,
      ],
    );

    const updated = await client.query<MemberMergeProposalRow>(
      `
        update member_merge_proposals
        set
          decisions = coalesce(decisions, '[]'::jsonb) || jsonb_build_array($2::jsonb),
          status = 'approved',
          resolved_at = $3,
          resolved_by_identity_id = $4,
          updated_at = now()
        where id = $1
        returning *
      `,
      [args.proposalId, decision, at, args.identityId],
    );
    await client.query('commit');
    return { ok: true, proposal: mapRow(updated.rows[0]) };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function cancelMemberMergeProposal(
  proposalId: string,
): Promise<{ ok: true; proposal: MemberMergeProposalRecord } | { ok: false; reason: string }> {
  const pool = getPool();
  const result = await pool.query<MemberMergeProposalRow>(
    `
      update member_merge_proposals
      set
        status = 'cancelled',
        resolved_at = now(),
        updated_at = now()
      where id = $1
        and status = 'pending'
      returning *
    `,
    [proposalId],
  );
  const row = result.rows[0];
  if (row) {
    return { ok: true, proposal: mapRow(row) };
  }
  const proposal = await getMemberMergeProposal(proposalId);
  if (!proposal) {
    return { ok: false, reason: 'Proposal not found.' };
  }
  return { ok: false, reason: 'Only pending proposals can be cancelled.' };
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

