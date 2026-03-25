'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { GitMerge, Loader2, ShieldQuestion } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/shared/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';
import { cn } from '@/lib/utils';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { dashboardIdentitySeeds } from '@/app/dashboard/dashboard-identities';
import { useDashboardIdentity } from '@/app/dashboard/dashboard-identity-context';
import type { MemberMergeProposalRecord } from '@/lib/member-duplicates/types';

function apiBase(workspaceId: string, identityId: string) {
  const p = new URLSearchParams();
  p.set('workspaceId', workspaceId);
  p.set('identityId', identityId);
  return `/api/workspace-admin/member-merge-proposals?${p.toString()}`;
}

export function MemberMergeDuplicatesTab({
  workspaceId,
  onWorkspaceRefresh,
}: {
  workspaceId: string;
  onWorkspaceRefresh: () => void;
}) {
  const { activeIdentityId } = useDashboardIdentity();
  const [proposals, setProposals] = useState<MemberMergeProposalRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [approvalMode, setApprovalMode] = useState<'assigned_user' | 'first_authorized_responder'>(
    'first_authorized_responder',
  );
  const [assignedApproverId, setAssignedApproverId] = useState(activeIdentityId);
  const [allowInternal, setAllowInternal] = useState(true);
  const [allowAdmin, setAllowAdmin] = useState(true);

  const reload = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await fetch(apiBase(workspaceId, activeIdentityId), { cache: 'no-store' });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? 'Could not load merge proposals.');
        setProposals([]);
        return;
      }
      const j = (await res.json()) as { proposals: MemberMergeProposalRecord[] };
      setProposals(j.proposals ?? []);
    } catch {
      setError('Could not load merge proposals.');
      setProposals([]);
    } finally {
      setLoadingList(false);
    }
  }, [activeIdentityId, workspaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function scan() {
    setScanning(true);
    setError(null);
    setMessage(null);
    try {
      const authorizedRoles: Array<'internal' | 'admin'> = [];
      if (allowInternal) authorizedRoles.push('internal');
      if (allowAdmin) authorizedRoles.push('admin');

      const body =
        approvalMode === 'assigned_user'
          ? {
              action: 'scan',
              approvalMode: 'assigned_user' as const,
              assignedApproverIdentityId: assignedApproverId,
            }
          : {
              action: 'scan',
              approvalMode: 'first_authorized_responder' as const,
              authorizedRoles,
            };

      const res = await fetch(apiBase(workspaceId, activeIdentityId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? 'Scan failed.');
        return;
      }
      const j = (await res.json()) as {
        scanned: number;
        proposalsCreated: number;
        proposals: MemberMergeProposalRecord[];
      };
      setProposals(j.proposals ?? []);
      setMessage(
        `Scan found ${j.scanned} duplicate pair(s); ${j.proposalsCreated} new proposal(s) opened.`,
      );
    } catch {
      setError('Scan failed.');
    } finally {
      setScanning(false);
    }
  }

  async function decide(proposalId: string, action: 'approve' | 'reject') {
    setActingId(proposalId);
    setError(null);
    setMessage(null);
    try {
      const p = new URLSearchParams();
      p.set('identityId', activeIdentityId);
      const res = await fetch(`/api/workspace-admin/member-merge-proposals/${proposalId}?${p.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? 'Could not update proposal.');
        return;
      }
      await reload();
      void onWorkspaceRefresh();
      setMessage(action === 'approve' ? 'Merge approved and applied to the roster.' : 'Proposal rejected.');
    } catch {
      setError('Could not update proposal.');
    } finally {
      setActingId(null);
    }
  }

  async function cancelProposal(proposalId: string) {
    setActingId(proposalId);
    setError(null);
    try {
      const p = new URLSearchParams();
      p.set('identityId', activeIdentityId);
      const res = await fetch(`/api/workspace-admin/member-merge-proposals/${proposalId}?${p.toString()}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? 'Could not cancel proposal.');
        return;
      }
      await reload();
      setMessage('Proposal cancelled.');
    } catch {
      setError('Could not cancel proposal.');
    } finally {
      setActingId(null);
    }
  }

  const pending = proposals.filter((p) => p.status === 'pending');

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'rounded-xl border px-4 py-3 sm:px-5 sm:py-4',
          dashboardTokens.border,
          dashboardTokens.surfaceMuted,
        )}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <GitMerge className="h-4 w-4 opacity-80" aria-hidden />
              Duplicate people
            </div>
            <p className={cn('max-w-prose text-sm', dashboardTokens.textMuted)}>
              Scan the admin-visible roster for the same email or matching name and username. Approve to
              merge into a single profile; references in updates and tasks are remapped. Approval can be
              limited to one person or use the first response from an authorized group.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {message ? (
        <Alert>
          <AlertTitle>Done</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div
        className={cn(
          'space-y-4 rounded-xl border p-4 sm:p-5',
          dashboardTokens.border,
          dashboardTokens.surfaceMuted,
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Labelled label="How approvals work">
              <Select
                value={approvalMode}
                onValueChange={(v) =>
                  setApprovalMode(v as 'assigned_user' | 'first_authorized_responder')
                }
              >
                <SelectTrigger className={cn('w-full sm:w-[320px]', dashboardTokens.focusRing)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_authorized_responder">
                    First authorized person decides (group)
                  </SelectItem>
                  <SelectItem value="assigned_user">Only one assigned approver</SelectItem>
                </SelectContent>
              </Select>
            </Labelled>

            {approvalMode === 'assigned_user' ? (
              <Labelled label="Assigned approver">
                <Select value={assignedApproverId} onValueChange={setAssignedApproverId}>
                  <SelectTrigger className={cn('w-full sm:w-[320px]', dashboardTokens.focusRing)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboardIdentitySeeds.map((idn) => (
                      <SelectItem key={idn.id} value={idn.id}>
                        {idn.name} ({idn.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Labelled>
            ) : (
              <div className="space-y-2">
                <span className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>
                  Authorized roles (any member with this level or higher in this workspace)
                </span>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allowInternal}
                      onChange={(e) => setAllowInternal(e.target.checked)}
                      className="rounded border-input"
                    />
                    Internal &amp; above
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allowAdmin}
                      onChange={(e) => setAllowAdmin(e.target.checked)}
                      className="rounded border-input"
                    />
                    Admin only (stricter)
                  </label>
                </div>
                <p className={cn('text-xs', dashboardTokens.textSubtle)}>
                  With both checked, anyone at internal tier or admin may approve or reject; the first
                  decision wins.
                </p>
              </div>
            )}
          </div>

          <Button
            type="button"
            className={cn('rounded-full', dashboardTokens.focusRing)}
            disabled={
              scanning ||
              (approvalMode === 'first_authorized_responder' && !allowInternal && !allowAdmin)
            }
            onClick={() => void scan()}
          >
            {scanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning…
              </>
            ) : (
              'Scan for duplicates'
            )}
          </Button>
        </div>

        {!allowInternal && !allowAdmin && approvalMode === 'first_authorized_responder' ? (
          <p className="text-sm text-amber-700 dark:text-amber-200">
            Choose at least one authorized role before scanning.
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Open proposals</h2>
          {loadingList ? (
            <Loader2 className="h-4 w-4 animate-spin opacity-60" aria-hidden />
          ) : (
            <span className={cn('text-xs tabular-nums', dashboardTokens.textSubtle)}>
              {pending.length} pending
            </span>
          )}
        </div>

        {pending.length === 0 && !loadingList ? (
          <p className={cn('text-sm', dashboardTokens.textMuted)}>
            No pending merge proposals. Run a scan after adding people, or when you suspect duplicate
            roster entries.
          </p>
        ) : null}

        <ul className="space-y-3">
          {pending.map((p) => (
            <li
              key={p.id}
              className={cn('rounded-xl border p-4', dashboardTokens.border, dashboardTokens.surfaceMuted)}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="text-sm font-semibold">
                    Merge <span className="font-mono text-xs">{p.duplicateMemberId}</span>
                    {' → '}
                    <span className="font-mono text-xs">{p.canonicalMemberId}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.signals.map((s) => (
                      <span
                        key={`${p.id}-${s.kind}-${s.detail}`}
                        className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900/30 dark:text-primary-100"
                      >
                        {s.kind}: {s.detail}
                      </span>
                    ))}
                  </div>
                  <div
                    className={cn(
                      'flex items-start gap-2 text-xs',
                      dashboardTokens.textSubtle,
                    )}
                  >
                    <ShieldQuestion className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                      {p.approvalMode === 'assigned_user' ? (
                        <>
                          Only{' '}
                          <strong className="font-medium text-foreground">
                            {p.assignedApproverIdentityId ?? '—'}
                          </strong>{' '}
                          may approve or reject.
                        </>
                      ) : (
                        <>
                          First response from an authorized group (
                          {p.authorizedRoles?.join(', ') ?? '—'}
                          ) wins.
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={cn('rounded-full', dashboardTokens.focusRing)}
                    disabled={actingId === p.id}
                    onClick={() => void cancelProposal(p.id)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={cn('rounded-full', dashboardTokens.focusRing)}
                    disabled={actingId === p.id}
                    onClick={() => void decide(p.id, 'reject')}
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className={cn('rounded-full', dashboardTokens.focusRing)}
                    disabled={actingId === p.id}
                    onClick={() => void decide(p.id, 'approve')}
                  >
                    {actingId === p.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Working…
                      </>
                    ) : (
                      'Approve merge'
                    )}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {proposals.some((p) => p.status !== 'pending') ? (
          <details className={cn('rounded-lg border p-3 text-sm', dashboardTokens.border)}>
            <summary className="cursor-pointer font-medium">Resolved history</summary>
            <ul className="mt-3 space-y-2">
              {proposals
                .filter((p) => p.status !== 'pending')
                .map((p) => (
                  <li key={p.id} className={cn('flex flex-wrap gap-2', dashboardTokens.textMuted)}>
                    <span className="font-mono text-xs">{p.duplicateMemberId}</span>
                    <span>→</span>
                    <span className="font-mono text-xs">{p.canonicalMemberId}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                      {p.status}
                    </span>
                  </li>
                ))}
            </ul>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className={cn('text-xs font-medium', dashboardTokens.textSubtle)}>{label}</span>
      {children}
    </div>
  );
}
