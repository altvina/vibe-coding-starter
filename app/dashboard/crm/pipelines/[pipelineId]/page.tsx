'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { Button } from '@/components/shared/ui/button';
import { crmFetch, type CrmAllowedRole } from '@/lib/crm/api-client';

type Stage = { id: string; pipeline_id: string; name: string; order_index: number };
type Deal = {
  id: string;
  title: string;
  stage_id: string;
  value: number;
  currency: string;
  status: string;
  person_id: string | null;
  organization_id: string | null;
  expected_close_date: string | null;
};
type Pipeline = { id: string; name: string };
type PipelinesRes = { pipelines: Pipeline[]; stages: Stage[] };
type DealsRes = { items: Deal[] };

function DealCard({
  deal,
  isDragOverlay,
}: {
  deal: Deal;
  isDragOverlay?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-3 shadow-sm dark:bg-slate-900',
        dashboardTokens.border,
        isDragOverlay && 'cursor-grabbing shadow-lg'
      )}
    >
      <div className="font-medium">{deal.title}</div>
      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
        <span>{deal.currency} {Number(deal.value).toLocaleString()}</span>
        {deal.expected_close_date && (
          <span>{new Date(deal.expected_close_date).toLocaleDateString()}</span>
        )}
      </div>
      <div className="mt-2">
        <Link
          href={`/dashboard/crm/deals/${deal.id}`}
          className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
          onClick={(e) => isDragOverlay && e.preventDefault()}
        >
          View deal →
        </Link>
      </div>
    </div>
  );
}

function DraggableDealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50'
      )}
    >
      <DealCard deal={deal} />
    </div>
  );
}

function StageColumn({
  stage,
  deals,
}: {
  stage: Stage;
  deals: Deal[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[200px] w-64 shrink-0 rounded-xl border-2 border-dashed p-3 transition-colors',
        isOver ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : dashboardTokens.border
      )}
    >
      <div className="mb-2 font-semibold">{stage.name}</div>
      <div className="space-y-2">
        {deals.map((d) => (
          <DraggableDealCard key={d.id} deal={d} />
        ))}
      </div>
    </div>
  );
}

export default function PipelineBoardPage() {
  const params = useParams();
  const pipelineId = params.pipelineId as string;
  const { role } = useDashboardRole();
  const allowed = role === 'staff_admin' || role === 'super_admin' ? (role as CrmAllowedRole) : null;

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const loadPipeline = useCallback(() => {
    if (!allowed) return;
    crmFetch<PipelinesRes>('/api/crm/pipelines', allowed)
      .then((data) => {
        setPipelines(data.pipelines ?? []);
        setStages((data.stages ?? []).filter((s: Stage) => s.pipeline_id === pipelineId).sort((a: Stage, b: Stage) => a.order_index - b.order_index));
      })
      .catch(() => {});
  }, [allowed, pipelineId]);

  const loadDeals = useCallback(() => {
    if (!allowed) return;
    crmFetch<DealsRes>(`/api/crm/deals?pipeline_id=${pipelineId}&page_size=200`, allowed)
      .then((data) => setDeals(data.items ?? []))
      .catch(() => setDeals([]));
  }, [allowed, pipelineId]);

  useEffect(() => {
    if (!allowed) return;
    loadPipeline();
  }, [allowed, loadPipeline]);

  useEffect(() => {
    if (!allowed) return;
    loadDeals();
  }, [allowed, loadDeals]);

  useEffect(() => {
    if (pipelines.length > 0 && stages.length === 0 && pipelineId) {
      setLoading(false);
    } else if (stages.length > 0) {
      setLoading(false);
    }
  }, [pipelines.length, stages.length, pipelineId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (e: DragStartEvent) => {
    const deal = (e.active.data.current as { deal?: Deal })?.deal;
    if (deal) setActiveDeal(deal);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveDeal(null);
    const dealId = e.active.id as string;
    const stageId = e.over?.id as string | undefined;
    if (!stageId || !allowed || !stages.some((s) => s.id === stageId)) return;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage_id === stageId) return;

    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage_id: stageId } : d))
    );
    try {
      await crmFetch(`/api/crm/deals/${dealId}/move-stage`, allowed, {
        method: 'POST',
        body: JSON.stringify({ stage_id: stageId }),
      });
    } catch {
      loadDeals();
    }
  };

  if (!allowed) return null;

  const dealsByStage = stages.map((s) => ({
    stage: s,
    deals: deals.filter((d) => d.stage_id === s.id),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/crm">← CRM</Link>
        </Button>
        <div className="flex gap-2">
          {pipelines.map((p) => (
            <Button
              key={p.id}
              variant={p.id === pipelineId ? 'default' : 'outline'}
              size="sm"
              asChild
            >
              <Link href={`/dashboard/crm/pipelines/${p.id}`}>{p.name}</Link>
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading pipeline…</p>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {dealsByStage.map(({ stage, deals: stageDeals }) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                deals={stageDeals}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDeal ? <DealCard deal={activeDeal} isDragOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
