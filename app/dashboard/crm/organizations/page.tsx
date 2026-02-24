'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { crmFetch, type CrmAllowedRole } from '@/lib/crm/api-client';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';

type Org = { id: string; name: string; city: string | null; country: string | null; industry: string | null };

export default function OrganizationsPage() {
  const { role } = useDashboardRole();
  const allowed = role === 'staff_admin' || role === 'super_admin' ? (role as CrmAllowedRole) : null;
  const [items, setItems] = useState<Org[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!allowed) return;
    const params = new URLSearchParams({ page: '1', page_size: '50' });
    if (search) params.set('search', search);
    crmFetch<{ items: Org[] }>(`/api/crm/organizations?${params}`, allowed)
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [allowed, search]);

  if (!allowed) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/crm">← CRM</Link>
        </Button>
      </div>
      <Input
        placeholder="Search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="p-3 text-left font-semibold">Name</th>
                <th className="p-3 text-left font-semibold">City</th>
                <th className="p-3 text-left font-semibold">Country</th>
                <th className="p-3 text-left font-semibold">Industry</th>
                <th className="p-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((org) => (
                <tr key={org.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-3 font-medium">{org.name}</td>
                  <td className="p-3">{org.city ?? '—'}</td>
                  <td className="p-3">{org.country ?? '—'}</td>
                  <td className={dashboardTokens.textMuted}>{org.industry ?? '—'}</td>
                  <td className="p-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/crm/organizations/${org.id}`}>Open</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="p-8 text-center text-slate-500">No organizations.</div>
          )}
        </div>
      )}
    </div>
  );
}
