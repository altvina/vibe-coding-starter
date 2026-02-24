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
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Switch } from '@/components/shared/ui/switch';
import { crmFetch, type CrmAllowedRole } from '@/lib/crm/api-client';

const ENTITY_TYPES = ['organization', 'person', 'lead', 'deal', 'activity', 'product'];
const FIELD_TYPES = ['text', 'number', 'date', 'boolean', 'select'];

type Definition = {
  id: string;
  entity_type: string;
  name: string;
  label: string;
  field_type: string;
  is_required: boolean;
  order_index: number;
};

export default function CustomFieldsAdminPage() {
  const { role } = useDashboardRole();
  const allowed = role === 'staff_admin' || role === 'super_admin' ? (role as CrmAllowedRole) : null;
  const [entityType, setEntityType] = useState<string>('deal');
  const [items, setItems] = useState<Definition[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!allowed) return;
    crmFetch<{ items: Definition[] }>(`/api/crm/custom-fields?entity_type=${entityType}`, allowed)
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [allowed, entityType]);

  useEffect(() => {
    if (!allowed) return;
    crmFetch<{ items: { id: string; name: string }[] }>('/api/crm/users', allowed).then((d) =>
      setUsers(d.items ?? [])
    );
  }, [allowed]);

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Custom fields</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/crm">← CRM</Link>
        </Button>
      </div>
      <div className="flex gap-4">
        <div>
          <Label>Entity type</Label>
          <Select value={entityType} onValueChange={(v) => { setEntityType(v); setLoading(true); }}>
            <SelectTrigger className="w-40 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="p-3 text-left font-semibold">Name</th>
                <th className="p-3 text-left font-semibold">Label</th>
                <th className="p-3 text-left font-semibold">Type</th>
                <th className="p-3 text-left font-semibold">Required</th>
                <th className="p-3 text-right font-semibold">Order</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-3 font-mono">{d.name}</td>
                  <td className="p-3">{d.label}</td>
                  <td className="p-3">{d.field_type}</td>
                  <td className="p-3">{d.is_required ? 'Yes' : 'No'}</td>
                  <td className="p-3 text-right">{d.order_index}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No custom fields for {entityType}. Add definitions via API or extend this UI to create them.
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-slate-500">
        Create new definitions via POST /api/crm/custom-fields (entity_type, name, label, field_type, created_by).
        Forms will pick them up by entity_type.
      </p>
    </div>
  );
}
