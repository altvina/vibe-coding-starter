'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Maximize2, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shared/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import type { DashboardWidgetDefinition, DashboardWidgetSize } from '@/app/dashboard/modules/types';
import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';

type WidgetLayoutState = {
  order: string[];
  sizes: Record<string, DashboardWidgetSize>;
};

function getStorageKey(args: { role: string }) {
  return `altvina.dashboard.widgetLayout.${args.role}` as const;
}

type WidgetBoardMode = 'view' | 'edit';

function coerceLayoutState(args: {
  raw: unknown;
  widgets: DashboardWidgetDefinition[];
}): WidgetLayoutState {
  const widgetIds = args.widgets.map((w) => w.id);
  const fallback: WidgetLayoutState = {
    order: widgetIds,
    sizes: Object.fromEntries(args.widgets.map((w) => [w.id, w.defaultSize])),
  };

  if (!args.raw || typeof args.raw !== 'object') {
    return fallback;
  }

  const obj = args.raw as Partial<WidgetLayoutState>;
  const order =
    Array.isArray(obj.order) && obj.order.every((v) => typeof v === 'string')
      ? obj.order
      : fallback.order;
  const sizes =
    obj.sizes && typeof obj.sizes === 'object'
      ? (obj.sizes as Record<string, DashboardWidgetSize>)
      : fallback.sizes;

  const deduped = Array.from(new Set(order)).filter((id) => widgetIds.includes(id));
  const completed = [
    ...deduped,
    ...widgetIds.filter((id) => !deduped.includes(id)),
  ];

  const mergedSizes: Record<string, DashboardWidgetSize> = { ...fallback.sizes };
  widgetIds.forEach((id) => {
    const next = sizes[id];
    if (next === 'sm' || next === 'md' || next === 'lg') {
      mergedSizes[id] = next;
    }
  });

  return { order: completed, sizes: mergedSizes };
}

function sizeClasses(size: DashboardWidgetSize) {
  if (size === 'sm') {
    return 'col-span-12 md:col-span-6 lg:col-span-4 min-h-28';
  }
  if (size === 'md') {
    return 'col-span-12 md:col-span-6 lg:col-span-6 min-h-36';
  }
  return 'col-span-12 lg:col-span-8 min-h-44';
}

function SortableWidget({
  widget,
  size,
  onSizeChange,
  data,
  mode,
}: {
  widget: DashboardWidgetDefinition;
  size: DashboardWidgetSize;
  onSizeChange: (next: DashboardWidgetSize) => void;
  data: DashboardApiResponse;
  mode: WidgetBoardMode;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: widget.id, disabled: mode !== 'edit' });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const controlsVisible = mode === 'edit';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        sizeClasses(size),
        isDragging ? 'z-50' : undefined,
      )}
    >
      <div
        className={cn(
          'group h-full w-full',
          mode === 'edit' ? 'cursor-default' : 'cursor-pointer',
          isDragging ? 'opacity-90' : undefined,
        )}
        onClick={() => {
          if (mode !== 'edit') {
            router.push(widget.href);
          }
        }}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (mode !== 'edit') {
              router.push(widget.href);
            }
          }
        }}
      >
        <div
          className={cn(
            'pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2 transition-opacity',
            controlsVisible
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  'pointer-events-auto h-9 w-9 rounded-full',
                  dashboardTokens.surface,
                  dashboardTokens.border,
                  dashboardTokens.focusRing,
                )}
                onClick={(e) => e.stopPropagation()}
                aria-label="Widget options (resize)"
                title="Resize"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuLabel>Widget size</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(['sm', 'md', 'lg'] as const).map((s) => (
                <DropdownMenuItem
                  key={s}
                  onSelect={() => onSizeChange(s)}
                >
                  {s.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  'pointer-events-auto h-9 w-9 rounded-full',
                  dashboardTokens.surface,
                  dashboardTokens.border,
                  dashboardTokens.focusRing,
                )}
                onClick={(e) => e.stopPropagation()}
                aria-label="More widget options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push(widget.href)}>
                Open module
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              'pointer-events-auto h-9 w-9 rounded-full',
              dashboardTokens.surface,
              dashboardTokens.border,
              dashboardTokens.focusRing,
            )}
            ref={setActivatorNodeRef}
            onClick={(e) => e.stopPropagation()}
            {...attributes}
            {...listeners}
            aria-label="Drag widget"
            disabled={mode !== 'edit'}
            title={mode === 'edit' ? 'Drag to reorder' : 'Enable Customize to reorder'}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-full w-full">{widget.render({ data })}</div>
      </div>
    </div>
  );
}

export function WidgetBoard({
  role,
  widgets,
  data,
  mode,
}: {
  role: string;
  widgets: DashboardWidgetDefinition[];
  data: DashboardApiResponse;
  mode: WidgetBoardMode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [layout, setLayout] = useState<WidgetLayoutState>(() =>
    coerceLayoutState({ raw: null, widgets }),
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(getStorageKey({ role }));
      const parsed = saved ? JSON.parse(saved) : null;
      setLayout(coerceLayoutState({ raw: parsed, widgets }));
    } catch (e) {
      void e;
      setLayout(coerceLayoutState({ raw: null, widgets }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, widgets.map((w) => w.id).join('|')]);

  function persist(next: WidgetLayoutState) {
    setLayout(next);
    try {
      window.localStorage.setItem(getStorageKey({ role }), JSON.stringify(next));
    } catch (e) {
      void e;
    }
  }

  const orderedWidgets = useMemo(() => {
    const byId = new Map(widgets.map((w) => [w.id, w]));
    return layout.order.map((id) => byId.get(id)).filter(Boolean) as DashboardWidgetDefinition[];
  }, [layout.order, widgets]);

  function onDragEnd(event: DragEndEvent) {
    if (mode !== 'edit') return;
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;
    const oldIndex = layout.order.indexOf(String(active.id));
    const newIndex = layout.order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    persist({ ...layout, order: arrayMove(layout.order, oldIndex, newIndex) });
  }

  function setWidgetSize(id: string, size: DashboardWidgetSize) {
    persist({ ...layout, sizes: { ...layout.sizes, [id]: size } });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={layout.order} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-12 gap-4">
          {orderedWidgets.map((w) => (
            <SortableWidget
              key={w.id}
              widget={w}
              size={layout.sizes[w.id] ?? w.defaultSize}
              onSizeChange={(next) => setWidgetSize(w.id, next)}
              data={data}
              mode={mode}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

