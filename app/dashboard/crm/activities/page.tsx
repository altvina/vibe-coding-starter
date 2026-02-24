'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { Button } from '@/components/shared/ui/button';
import { crmFetch, type CrmAllowedRole } from '@/lib/crm/api-client';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';

type Activity = {
  id: string;
  type: string;
  subject: string;
  due_at: string;
  done: boolean;
  deal_id: string | null;
};

export default function ActivitiesPage() {
  const { role } = useDashboardRole();
  const allowed = role === 'staff_admin' || role === 'super_admin' ? (role as CrmAllowedRole) : null;
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDone, setFilterDone] = useState<string>('false');

  useEffect(() => {
    if (!allowed) return;
    const params = new URLSearchParams({ page: '1', page_size: '100' });
    if (filterDone === 'true' || filterDone === 'false') params.set('done', filterDone);
    crmFetch<{ items: Activity[] }>(`/api/crm/activities?${params}`, allowed)
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [allowed, filterDone]);

  const toggleDone = async (a: Activity) => {
    if (!allowed) return;
    try {
      await crmFetch(`/api/crm/activities/${a.id}`, allowed, {
        method: 'PATCH',
        body: JSON.stringify({ done: !a.done }),
      });
      setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, done: !x.done } : x)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  if (!allowed) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Activities</h1>
        <div className="flex gap-2">
          <Button
            variant={filterDone === 'false' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterDone('false')}
          >
            Open
          </Button>
          <Button
            variant={filterDone === 'true' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterDone('true')}
          >
            Done
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/crm">← CRM</Link>
          </Button>
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li
              key={a.id}
              className={cn(
                'flex items-center justify-between rounded-xl border p-3',
                a.done && 'opacity-60'
              )}
              style={{ borderColor: 'var(--border)' }}
            >
              <div>
                <span className="font-medium">{a.subject}</span>
                <span className={cn('ml-2 text-xs', dashboardTokens.textMuted)}>
                  {a.type} · {new Date(a.due_at).toLocaleString()}
                </span>
                {a.deal_id && (
                  <Link href={`/dashboard/crm/deals/${a.deal_id}`} className="ml-2 text-xs text-primary-600 hover:underline">
                    Deal
                  </Link>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => toggleDone(a)}>
                {a.done ? 'Undo' : 'Mark done'}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {items.length === 0 && !loading && (
        <div className="rounded-xl border p-8 text-center text-slate-500" style={{ borderColor: 'var(--border)' }}>
          No activities.
        </div>
      )}
    </div>
  );
}
