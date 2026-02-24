'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2, User, Calendar, DollarSign } from 'lucide-react';

import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { Button } from '@/components/shared/ui/button';
import { crmFetch, type CrmAllowedRole } from '@/lib/crm/api-client';
import { cn } from '@/lib/utils';

type Deal = {
  id: string;
  title: string;
  person_id: string | null;
  organization_id: string | null;
  pipeline_id: string;
  stage_id: string;
  value: number;
  currency: string;
  status: string;
  owner_id: string;
  expected_close_date: string | null;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
};

export default function DealDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { role } = useDashboardRole();
  const allowed = role === 'staff_admin' || role === 'super_admin' ? (role as CrmAllowedRole) : null;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [activities, setActivities] = useState<unknown[]>([]);
  const [notes, setNotes] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!allowed) return;
    Promise.all([
      crmFetch<Deal>(`/api/crm/deals/${id}`, allowed),
      crmFetch<{ items: unknown[] }>(`/api/crm/activities?deal_id=${id}`, allowed),
      crmFetch<{ items: unknown[] }>(`/api/crm/notes?deal_id=${id}`, allowed),
    ])
      .then(([d, a, n]) => {
        setDeal(d);
        setActivities(a.items ?? []);
        setNotes(n.items ?? []);
      })
      .catch(() => setDeal(null))
      .finally(() => setLoading(false));
  }, [allowed, id]);

  useEffect(() => {
    load();
  }, [load]);

  const markWon = async () => {
    if (!allowed || !deal) return;
    try {
      await crmFetch(`/api/crm/deals/${id}/mark-won`, allowed, { method: 'POST' });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const markLost = async () => {
    const reason = window.prompt('Lost reason (optional):');
    if (!allowed || !deal) return;
    try {
      await crmFetch(`/api/crm/deals/${id}/mark-lost`, allowed, {
        method: 'POST',
        body: JSON.stringify({ lost_reason: reason ?? undefined }),
      });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  if (!allowed) return null;
  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!deal) return <p className="text-sm text-slate-500">Deal not found.</p>;

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/crm/pipelines/${deal.pipeline_id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to pipeline
        </Link>
      </Button>

      <div className="rounded-xl border bg-white p-6 dark:bg-slate-900" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{deal.title}</h1>
            <div className={cn('mt-2 flex flex-wrap gap-4 text-sm', dashboardTokens.textMuted)}>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {deal.currency} {Number(deal.value).toLocaleString()}
              </span>
              <span>Status: {deal.status}</span>
              {deal.expected_close_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(deal.expected_close_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          {deal.status === 'open' && (
            <div className="flex gap-2">
              <Button size="sm" onClick={markWon}>Mark won</Button>
              <Button size="sm" variant="outline" onClick={markLost}>Mark lost</Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold">Linked</h2>
          <div className="mt-2 space-y-2 text-sm">
            {deal.organization_id && (
              <Link href={`/dashboard/crm/organizations/${deal.organization_id}`} className="flex items-center gap-2 text-primary-600 hover:underline">
                <Building2 className="h-4 w-4" /> Organization
              </Link>
            )}
            {deal.person_id && (
              <Link href={`/dashboard/crm/people/${deal.person_id}`} className="flex items-center gap-2 text-primary-600 hover:underline">
                <User className="h-4 w-4" /> Contact
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold">Activities ({activities.length})</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {(activities as Array<{ id: string; subject: string; type: string; due_at: string; done: boolean }>).map((a) => (
              <li key={a.id} className="flex justify-between">
                <span>{a.subject} ({a.type})</span>
                <span>{a.done ? 'Done' : new Date(a.due_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
        <h2 className="font-semibold">Notes ({notes.length})</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {(notes as Array<{ id: string; content: string; created_at: string }>).map((n) => (
            <li key={n.id} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
              {n.content}
              <div className={cn('mt-1 text-xs', dashboardTokens.textSubtle)}>
                {new Date(n.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
