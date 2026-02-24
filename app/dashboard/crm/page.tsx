'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, ChevronRight, LayoutGrid, Users, Building2, ListTodo, Target } from 'lucide-react';

import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { Button } from '@/components/shared/ui/button';
import { crmFetch, type CrmAllowedRole } from '@/lib/crm/api-client';
import { cn } from '@/lib/utils';

type Pipeline = { id: string; name: string; description: string | null; is_active: boolean };
type PipelinesResponse = { pipelines: Pipeline[]; stages: unknown[] };

export default function CrmHomePage() {
  const { role } = useDashboardRole();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allowed = role === 'staff_admin' || role === 'super_admin' ? (role as CrmAllowedRole) : null;

  useEffect(() => {
    if (!allowed) return;
    crmFetch<PipelinesResponse>('/api/crm/pipelines', allowed)
      .then((data) => setPipelines(data.pipelines ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [allowed]);

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CRM</h1>
        <p className={cn('mt-1 text-sm', dashboardTokens.textMuted)}>
          Leads, deals, pipelines, and activities. Internal use only.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Pipelines">
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : pipelines.length === 0 ? (
            <p className="text-sm text-slate-500">No pipelines yet. Run migrations to seed one.</p>
          ) : (
            <ul className="space-y-2">
              {pipelines.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/crm/pipelines/${p.id}`}
                    className="flex items-center justify-between rounded-lg border p-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <span>{p.name}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard title="Deals">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            View and move deals on the pipeline board.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href={pipelines[0] ? `/dashboard/crm/pipelines/${pipelines[0].id}` : '/dashboard/crm'}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              Open board
            </Link>
          </Button>
        </DashboardCard>

        <DashboardCard title="Leads">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage leads and convert to deals.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/dashboard/crm/leads">
              <Target className="mr-2 h-4 w-4" />
              Leads
            </Link>
          </Button>
        </DashboardCard>

        <DashboardCard title="Contacts &amp; Orgs">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            People and organizations.
          </p>
          <div className="mt-3 flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/crm/organizations">
                <Building2 className="mr-2 h-4 w-4" />
                Orgs
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/crm/people">
                <Users className="mr-2 h-4 w-4" />
                People
              </Link>
            </Button>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Activities">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Tasks and events linked to deals and contacts.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link href="/dashboard/crm/activities">
            <ListTodo className="mr-2 h-4 w-4" />
            My tasks
          </Link>
        </Button>
      </DashboardCard>

      {(role === 'super_admin' || role === 'staff_admin') && (
        <DashboardCard title="Admin">
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/crm/admin/custom-fields">Custom fields</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/crm/admin/workflows">Workflows</Link>
            </Button>
          </div>
        </DashboardCard>
      )}
    </div>
  );
}
