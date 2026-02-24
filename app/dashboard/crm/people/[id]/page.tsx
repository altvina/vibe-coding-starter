'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { Button } from '@/components/shared/ui/button';
import { crmFetch, type CrmAllowedRole } from '@/lib/crm/api-client';

type Person = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  organization_id: string | null;
};

export default function PersonDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { role } = useDashboardRole();
  const allowed = role === 'staff_admin' || role === 'super_admin' ? (role as CrmAllowedRole) : null;
  const [person, setPerson] = useState<Person | null>(null);

  useEffect(() => {
    if (!allowed) return;
    crmFetch<Person>(`/api/crm/people/${id}`, allowed)
      .then(setPerson)
      .catch(() => setPerson(null));
  }, [allowed, id]);

  if (!allowed) return null;
  if (!person) return <p className="text-sm text-slate-500">Not found.</p>;

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/crm/people">← People</Link>
      </Button>
      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border)' }}>
        <h1 className="text-xl font-bold">{person.first_name} {person.last_name}</h1>
        <p className="mt-2 text-sm text-slate-500">{person.job_title ?? '—'}</p>
        <p className="mt-1 text-sm">{person.email ?? '—'}</p>
        {person.phone && <p className="text-sm">{person.phone}</p>}
        {person.organization_id && (
          <Button variant="link" size="sm" className="mt-2 px-0" asChild>
            <Link href={`/dashboard/crm/organizations/${person.organization_id}`}>View organization</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
