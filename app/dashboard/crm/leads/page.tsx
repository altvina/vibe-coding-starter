'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { Button } from '@/components/shared/ui/button';
import { crmFetch, type CrmAllowedRole } from '@/lib/crm/api-client';
import { cn } from '@/lib/utils';

type Lead = {
  id: string;
  title: string;
  status: string;
  source: string | null;
  owner_id: string;
  created_at: string;
};

export default function LeadsPage() {
  const { role } = useDashboardRole();
  const allowed = role === 'staff_admin' || role === 'super_admin' ? (role as CrmAllowedRole) : null;
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!allowed) return;
    crmFetch<{ items: Lead[] }>('/api/crm/leads', allowed)
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [allowed]);

  if (!allowed) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/crm">← CRM</Link>
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="p-3 text-left font-semibold">Title</th>
                <th className="p-3 text-left font-semibold">Status</th>
                <th className="p-3 text-left font-semibold">Source</th>
                <th className="p-3 text-left font-semibold">Created</th>
                <th className="p-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((lead) => (
                <tr key={lead.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-3 font-medium">{lead.title}</td>
                  <td className="p-3">{lead.status}</td>
                  <td className="p-3">{lead.source ?? '—'}</td>
                  <td className={cn('p-3', dashboardTokens.textMuted)}>
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/crm/leads/${lead.id}`}>Open</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="p-8 text-center text-slate-500">No leads yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
