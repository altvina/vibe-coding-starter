'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { Button } from '@/components/shared/ui/button';
import { crmFetch, type CrmAllowedRole } from '@/lib/crm/api-client';

type Org = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  industry: string | null;
  website: string | null;
};

export default function OrganizationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { role } = useDashboardRole();
  const allowed = role === 'staff_admin' || role === 'super_admin' ? (role as CrmAllowedRole) : null;
  const [org, setOrg] = useState<Org | null>(null);

  useEffect(() => {
    if (!allowed) return;
    crmFetch<Org>(`/api/crm/organizations/${id}`, allowed)
      .then(setOrg)
      .catch(() => setOrg(null));
  }, [allowed, id]);

  if (!allowed) return null;
  if (!org) return <p className="text-sm text-slate-500">Not found.</p>;

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/crm/organizations">← Organizations</Link>
      </Button>
      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border)' }}>
        <h1 className="text-xl font-bold">{org.name}</h1>
        <p className="mt-2 text-sm text-slate-500">{org.industry ?? '—'}</p>
        {(org.address || org.city || org.country) && (
          <p className="mt-2 text-sm">
            {[org.address, org.city, org.state, org.country, org.postal_code].filter(Boolean).join(', ')}
          </p>
        )}
        {org.website && (
          <a href={org.website} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-primary-600 hover:underline">
            {org.website}
          </a>
        )}
      </div>
    </div>
  );
}
