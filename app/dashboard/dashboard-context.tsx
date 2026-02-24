'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import type {
  DonutSegment,
  KpiDelta,
  ProjectRow,
} from '@/app/dashboard/dashboard-data';
import type { DashboardCapabilities } from '@/app/dashboard/dashboard-permissions';
import type { DashboardRole } from '@/app/dashboard/dashboard-roles';
import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { useDashboardWorkspace } from '@/app/dashboard/dashboard-workspace-context';

export type DashboardKpi = {
  id: string;
  label: string;
  value: number;
  valueFormat: 'currencyIdr' | 'number';
  subtext: string;
  delta: KpiDelta;
};

export type RevenuePoint = {
  id: string;
  weekLabel: string;
  monthLabel: string;
  value: number;
};

export type DashboardUser = {
  name: string;
  email: string;
  initials: string;
};

export type InboxMessage = {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  clientLabel: string;
};

export type WorkspaceMember = {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  /** Alias for @mentions, URLs, and display; unique per workspace in practice */
  username?: string;
  role: 'client' | 'expert' | 'staff';
  /** Professional headline / tagline (e.g. "Fractional COO · Ops & Automation") */
  headline?: string;
  title?: string;
  bio?: string;
  location?: string;
  phone?: string;
  email?: string;
  linkedInUrl?: string;
  website?: string;
  /** Comma-separated or array of skills/areas (e.g. "Operations, Strategy, Analytics") */
  skills?: string;
  fieldMask?: { name?: boolean; title?: boolean; bio?: boolean };
  contactMask?: { email?: boolean; phone?: boolean };
};

export type WorkspaceUpdateComment = {
  id: string;
  authorId: string;
  authorName?: string;
  createdAt: string;
  body: string;
};

export type WorkspaceUpdate = {
  id: string;
  authorId: string;
  authorName?: string;
  createdAt: string;
  body: string;
  comments: WorkspaceUpdateComment[];
  /** When set, this update appears on the project feed; when absent, workspace feed only */
  projectId?: string;
};

export type WorkspaceProject = {
  id: string;
  name: string;
  status: 'active' | 'review' | 'done';
};

export type WorkspaceProjectMembership = {
  projectId: string;
  memberId: string;
  engagementRole: string;
};

export type WorkspaceTask = {
  id: string;
  projectId: string;
  title: string;
  status: 'todo' | 'doing' | 'blocked' | 'review' | 'done';
  dueOn?: string;
  assigneeIds: string[];
};

export type WorkspaceSubtask = {
  id: string;
  taskId: string;
  title: string;
  done: boolean;
};

export type WorkspaceDetail = {
  members: WorkspaceMember[];
  updates: WorkspaceUpdate[];
  projects: WorkspaceProject[];
  projectMemberships: WorkspaceProjectMembership[];
  tasks: WorkspaceTask[];
  subtasks: WorkspaceSubtask[];
};

export type DashboardApiResponse = {
  role: DashboardRole;
  capabilities: DashboardCapabilities;
  user: DashboardUser;
  kpis: DashboardKpi[];
  revenueAnalytics: {
    title: string;
    highlightedPointId: string;
    points: RevenuePoint[];
  };
  progressDonut: {
    title: string;
    center: { value: number; label: string };
    segments: DonutSegment[];
  };
  manageProjects: {
    title: string;
    defaultFilterId: string;
    filters: Array<{ id: string; label: string }>;
    rows: ProjectRow[];
  };
  sidebarAssistant: {
    greeting: string;
    headline: string;
    placeholder: string;
    quickActions: Array<{ id: string; label: string }>;
  };
  performanceEvaluation: {
    title: string;
    rating: number;
    ratingLabel: string;
    note: string;
    distribution: Array<{ id: string; label: string; pct: number; color: 'primary' | 'secondary' | 'ink' }>;
  };
  promoLearning: {
    headline: string;
    supporting: string;
    ctaLabel: string;
  };
  inboxPreview: {
    title: string;
    messages: InboxMessage[];
  };
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string;
  workspace: WorkspaceDetail;
};

type DashboardDataState = {
  data: DashboardApiResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const DashboardDataContext = createContext<DashboardDataState | null>(null);

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const { role } = useDashboardRole();
  const { activeWorkspaceId } = useDashboardWorkspace();
  const [data, setData] = useState<DashboardApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(() => {
    const delay = searchParams?.get('delay');
    const fail = searchParams?.get('fail');
    const params = new URLSearchParams();
    params.set('role', role);
    params.set('workspaceId', activeWorkspaceId);
    if (delay) params.set('delay', delay);
    if (fail) params.set('fail', fail);
    const suffix = params.toString();
    return suffix ? `/api/dashboard?${suffix}` : '/api/dashboard';
  }, [activeWorkspaceId, role, searchParams]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? 'Failed to load dashboard data.');
        setData(null);
        return;
      }
      const json = (await res.json()) as DashboardApiResponse;
      setData(json);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Network error';
      setError(message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ data, isLoading, error, refresh }),
    [data, isLoading, error, refresh],
  );

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error('useDashboardData must be used within DashboardDataProvider');
  }
  return ctx;
}

