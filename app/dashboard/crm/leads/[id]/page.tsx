'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { Button } from '@/components/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shared/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';
import { crmFetch, type CrmAllowedRole } from '@/lib/crm/api-client';
import { Target } from 'lucide-react';

type Lead = {
  id: string;
  title: string;
  status: string;
  source: string | null;
  owner_id: string;
  notes: string | null;
  created_at: string;
};
type Pipeline = { id: string; name: string };
type User = { id: string; name: string };

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { role } = useDashboardRole();
  const allowed = role === 'staff_admin' || role === 'super_admin' ? (role as CrmAllowedRole) : null;

  const [lead, setLead] = useState<Lead | null>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [convertPipelineId, setConvertPipelineId] = useState<string>('');
  const [convertOwnerId, setConvertOwnerId] = useState<string>('');
  const [converting, setConverting] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    crmFetch<Lead>(`/api/crm/leads/${id}`, allowed)
      .then(setLead)
      .catch(() => setLead(null));
  }, [allowed, id]);

  useEffect(() => {
    if (!allowed) return;
    crmFetch<{ pipelines: Pipeline[] }>('/api/crm/pipelines', allowed).then((d) =>
      setPipelines(d.pipelines ?? [])
    );
    crmFetch<{ items: User[] }>('/api/crm/users', allowed).then((d) =>
      setUsers(d.items ?? [])
    );
  }, [allowed]);

  const handleConvert = async () => {
    if (!allowed || !convertPipelineId || !convertOwnerId) return;
    setConverting(true);
    try {
      const res = await crmFetch<{ deal_id: string }>(`/api/crm/leads/${id}/convert-to-deal`, allowed, {
        method: 'POST',
        body: JSON.stringify({ pipeline_id: convertPipelineId, owner_id: convertOwnerId }),
      });
      setOpen(false);
      window.location.href = `/dashboard/crm/deals/${res.deal_id}`;
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Convert failed');
    } finally {
      setConverting(false);
    }
  };

  if (!allowed) return null;
  if (!lead) return <p className="text-sm text-slate-500">Lead not found.</p>;

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/crm/leads">← Leads</Link>
      </Button>
      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--border)' }}>
        <h1 className="text-xl font-bold">{lead.title}</h1>
        <p className="mt-2 text-sm text-slate-500">Status: {lead.status} · Source: {lead.source ?? '—'}</p>
        {lead.notes && <p className="mt-2 text-sm">{lead.notes}</p>}
        <div className="mt-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Target className="mr-2 h-4 w-4" /> Convert to deal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convert lead to deal</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <label className="text-sm font-medium">Pipeline</label>
                  <Select value={convertPipelineId} onValueChange={setConvertPipelineId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select pipeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelines.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Owner</label>
                  <Select value={convertOwnerId} onValueChange={setConvertOwnerId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleConvert} disabled={converting || !convertPipelineId || !convertOwnerId}>
                  {converting ? 'Converting…' : 'Create deal'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
