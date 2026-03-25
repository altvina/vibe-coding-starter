import type { WorkspaceRole } from '@/lib/auth/workspace-types';

export type MemberMergeApprovalMode = 'assigned_user' | 'first_authorized_responder';

export type MemberMergeSignal = {
  kind: 'email' | 'display_name' | 'username';
  detail: string;
};

export type MemberMergeProposalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type MemberMergeDecision = {
  identityId: string;
  at: string;
  action: 'approve' | 'reject';
};

export type MemberMergeProposalRecord = {
  id: string;
  workspaceId: string;
  createdAt: string;
  canonicalMemberId: string;
  duplicateMemberId: string;
  signals: MemberMergeSignal[];
  approvalMode: MemberMergeApprovalMode;
  /** When approvalMode is assigned_user, only this identity may resolve the proposal. */
  assignedApproverIdentityId?: string;
  /** Explicit identities allowed to act when using first_authorized_responder (optional). */
  authorizedApproverIdentityIds?: string[];
  /** Role minimums in the workspace for first_authorized_responder (e.g. admin, internal). */
  authorizedRoles?: WorkspaceRole[];
  status: MemberMergeProposalStatus;
  decisions: MemberMergeDecision[];
  resolvedAt?: string;
  resolvedByIdentityId?: string;
};
