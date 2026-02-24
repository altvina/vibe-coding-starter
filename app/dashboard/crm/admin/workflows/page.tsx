'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { Button } from '@/components/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';
import { crmFetch, type CrmAllowedRole } from '@/lib/crm/api-client';

const TRIGGER_TYPES = ['deal_created', 'deal_stage_changed', 'deal_status_changed', 'activity_completed'];

type Rule = {
  id: string;
  name: string;
  trigger_type: string;
  conditions_json: Record<string, unknown>;
  actions_json: unknown[];
  is_active: boolean;
};

export default function WorkflowsAdminPage() {
  const { role } = useDashboardRole();
  const allowed = role === 'staff_admin' || role === 'super_admin' ? (role as CrmAllowedRole) : null;
  const [triggerType, setTriggerType] = useState<string>('');
  const [items, setItems] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!allowed) return;
    const url = triggerType
      ? `/api/crm/workflows?trigger_type=${triggerType}`
      : '/api/crm/workflows';
    crmFetch<{ items: Rule[] }>(url, allowed)
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [allowed, triggerType]);

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workflow rules</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/crm">← CRM</Link>
        </Button>
      </div>
      <div>
        <label className="text-sm font-medium">Trigger type</label>
        <Select value={triggerType || 'all'} onValueChange={(v) => { setTriggerType(v === 'all' ? '' : v); setLoading(true); }}>
          <SelectTrigger className="w-56 mt-1">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {TRIGGER_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border p-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="font-medium">{r.name}</div>
              <div className="mt-1 text-sm text-slate-500">
                Trigger: {r.trigger_type} · Active: {r.is_active ? 'Yes' : 'No'}
              </div>
              {Object.keys(r.conditions_json ?? {}).length > 0 && (
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Conditions: {JSON.stringify(r.conditions_json)}
                </div>
              )}
              {Array.isArray(r.actions_json) && r.actions_json.length > 0 && (
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Actions: {JSON.stringify(r.actions_json)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {items.length === 0 && !loading && (
        <div className="rounded-xl border p-8 text-center text-slate-500" style={{ borderColor: 'var(--border)' }}>
          No workflow rules. Create via POST /api/crm/workflows (name, trigger_type, conditions_json, actions_json, created_by).
        </div>
      )}
    </div>
  );
}
