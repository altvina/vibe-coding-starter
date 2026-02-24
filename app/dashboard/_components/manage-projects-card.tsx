'use client';

import { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock3, ChevronRight, Search } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { cn } from '@/lib/utils';

import {
  type ProjectRow,
  type ProjectStatus,
} from '@/app/dashboard/dashboard-data';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';

type ManageProjects = {
  title: string;
  defaultFilterId: string;
  filters: Array<{ id: string; label: string }>;
  rows: ProjectRow[];
};

type FilterId = string;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === 'onReview') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-200">
        <CheckCircle2 className="h-4 w-4" />
        On Review
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
      <Clock3 className="h-4 w-4" />
      On Progress
    </span>
  );
}

function ClientCell({ row }: { row: ProjectRow }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {getInitials(row.client.name)}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{row.client.name}</div>
        <div className={cn('truncate text-xs', dashboardTokens.textSubtle)}>
          {row.client.handle}
        </div>
      </div>
    </div>
  );
}

function TaskCell({ row }: { row: ProjectRow }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-semibold">{row.task.title}</div>
      <div className={cn('truncate text-xs', dashboardTokens.textSubtle)}>
        {row.task.subtitle}
      </div>
    </div>
  );
}

function DueCell({ row }: { row: ProjectRow }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <Calendar className={cn('h-4 w-4', dashboardTokens.textSubtle)} />
      <span className={cn('tabular-nums', dashboardTokens.textMuted)}>{row.dueOn}</span>
    </div>
  );
}

function TableRow({ row, onView }: { row: ProjectRow; onView: () => void }) {
  return (
    <tr className="border-b border-dashed border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
      <td className="py-4 pr-6">
        <ClientCell row={row} />
      </td>
      <td className="py-4 pr-6">
        <TaskCell row={row} />
      </td>
      <td className="py-4 pr-6">
        <DueCell row={row} />
      </td>
      <td className="py-4 pr-6">
        <StatusBadge status={row.status} />
      </td>
      <td className="py-4 pr-0 text-right">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onView}
          className={cn(
            'h-9 w-9 rounded-full',
            dashboardTokens.surfaceMuted,
            dashboardTokens.border,
            dashboardTokens.focusRing,
          )}
          aria-label="View project details"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

function RowCard({ row }: { row: ProjectRow }) {
  return (
    <div className={cn('rounded-2xl border p-4', dashboardTokens.surface, dashboardTokens.border)}>
      <div className="flex items-start justify-between gap-4">
        <ClientCell row={row} />
        <StatusBadge status={row.status} />
      </div>
      <div className="mt-3">
        <TaskCell row={row} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
            Due On
          </div>
          <DueCell row={row} />
        </div>
        <div className="space-y-1 text-right">
          <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
            Status
          </div>
          <div className="inline-flex justify-end">
            <StatusBadge status={row.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ManageProjectsCard({ manageProjects }: { manageProjects: ManageProjects }) {
  const [activeFilterId, setActiveFilterId] = useState<FilterId>(
    manageProjects.defaultFilterId,
  );
  const [query, setQuery] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const priority = manageProjects.rows.filter((r) => r.priority).length;
    const active = manageProjects.rows.filter((r) => r.status === 'onProgress').length;
    const draft = 0;
    const completed = 0;
    return { priority, active, draft, completed };
  }, [manageProjects.rows]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (activeFilterId === 'priority') {
      return manageProjects.rows.filter((r) => r.priority).filter((r) => {
        if (!q) return true;
        return (
          r.client.name.toLowerCase().includes(q) ||
          r.client.handle.toLowerCase().includes(q) ||
          r.task.title.toLowerCase().includes(q) ||
          r.task.subtitle.toLowerCase().includes(q)
        );
      });
    }
    if (activeFilterId === 'active') {
      return manageProjects.rows.filter((r) => r.status === 'onProgress').filter((r) => {
        if (!q) return true;
        return (
          r.client.name.toLowerCase().includes(q) ||
          r.client.handle.toLowerCase().includes(q) ||
          r.task.title.toLowerCase().includes(q) ||
          r.task.subtitle.toLowerCase().includes(q)
        );
      });
    }
    return [];
  }, [activeFilterId, manageProjects.rows, query]);

  const selectedRow = useMemo(() => {
    if (!selectedRowId) return null;
    return manageProjects.rows.find((r) => r.id === selectedRowId) ?? null;
  }, [manageProjects.rows, selectedRowId]);

  return (
    <>
      <DashboardCard
        title={manageProjects.title}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {manageProjects.filters.map((f) => {
              const isActive = f.id === activeFilterId;
              const count =
                f.id === 'priority'
                  ? counts.priority
                  : f.id === 'active'
                    ? counts.active
                    : f.id === 'draft'
                      ? counts.draft
                      : counts.completed;

              return (
                <Button
                  key={f.id}
                  type="button"
                  variant="outline"
                  onClick={() => setActiveFilterId(f.id)}
                  className={cn(
                    'h-9 rounded-full px-3 text-xs font-semibold',
                    dashboardTokens.focusRing,
                    isActive
                      ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-700 hover:text-white dark:border-primary-400 dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300'
                      : cn(
                          dashboardTokens.surface,
                          dashboardTokens.border,
                          dashboardTokens.textMuted,
                          'hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50',
                        ),
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      'ml-2 inline-flex h-5 items-center rounded-full px-2 text-xs tabular-nums',
                      isActive
                        ? 'bg-white/20 text-white dark:bg-slate-950/10 dark:text-slate-950'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
                    )}
                  >
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>
        }
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', dashboardTokens.textSubtle)} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects…"
              className={cn(
                'h-10 w-full rounded-full border bg-white pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-500',
                'dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-400',
                dashboardTokens.border,
                dashboardTokens.focusRing,
              )}
            />
          </div>
          <div className={cn('text-xs', dashboardTokens.textSubtle)}>
            Showing {visibleRows.length} result{visibleRows.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="md:hidden space-y-3">
          {visibleRows.length ? (
            visibleRows.map((row) => (
              <div
                key={row.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedRowId(row.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSelectedRowId(row.id);
                  }
                }}
                className={cn('cursor-pointer', dashboardTokens.focusRing)}
              >
                <RowCard row={row} />
              </div>
            ))
          ) : (
            <div
              className={cn(
                'rounded-2xl border p-4 text-sm',
                dashboardTokens.border,
                dashboardTokens.textMuted,
              )}
            >
              No projects found for this filter.
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={cn('border-b', dashboardTokens.border)}>
                  {['Client', 'Task', 'Due On', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className={cn(
                        'py-3 pr-6 text-left text-xs font-semibold',
                        dashboardTokens.textSubtle,
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.length ? (
                  visibleRows.map((row) => (
                    <TableRow
                      key={row.id}
                      row={row}
                      onView={() => setSelectedRowId(row.id)}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className={cn('py-6 text-sm', dashboardTokens.textMuted)}
                    >
                      No projects found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardCard>

      <Dialog open={Boolean(selectedRow)} onOpenChange={() => setSelectedRowId(null)}>
        <DialogContent className="sm:rounded-2xl">
          {selectedRow ? (
            <DialogHeader>
              <DialogTitle>{selectedRow.task.title}</DialogTitle>
              <DialogDescription>
                {selectedRow.client.name} • due {selectedRow.dueOn}
              </DialogDescription>
            </DialogHeader>
          ) : null}
          {selectedRow ? (
            <div className="space-y-4">
              <div className={cn('rounded-2xl border p-4', dashboardTokens.border)}>
                <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                  Summary
                </div>
                <div className={cn('mt-2 text-sm', dashboardTokens.textMuted)}>
                  {selectedRow.task.subtitle}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                    Status
                  </div>
                  <StatusBadge status={selectedRow.status} />
                </div>
                <Button
                  type="button"
                  className={cn(
                    'h-10 rounded-full bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700',
                    'dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300',
                    dashboardTokens.focusRing,
                  )}
                  onClick={() => setSelectedRowId(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

