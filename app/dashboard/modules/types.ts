import type { ReactNode } from 'react';

import type {
  DashboardApiResponse,
} from '@/app/dashboard/dashboard-context';
import type { WorkspaceRole } from '@/lib/auth/workspace-types';

export type DashboardModuleId =
  | 'analytics'
  | 'projects'
  | 'inbox'
  | 'people'
  | 'updates'
  | 'chat'
  | 'integrations'
  | 'clients'
  | 'workspaceAdmin'
  | 'allWorkspaces'
  | 'superAdmin'
  | 'moduleAccess';

export type DashboardWidgetSize = 'sm' | 'md' | 'lg';

export type DashboardWidgetDefinition = {
  id: string;
  moduleId: DashboardModuleId;
  title: string;
  description?: string;
  href: string;
  allowedRoles: WorkspaceRole[];
  defaultSize: DashboardWidgetSize;
  render: (args: { data: DashboardApiResponse }) => ReactNode;
};

export type DashboardModuleDefinition = {
  id: DashboardModuleId;
  label: string;
  href: string;
  allowedRoles: WorkspaceRole[];
  navOrder: number;
  widgets: DashboardWidgetDefinition[];
};

