import type { ReactNode } from 'react';

import type {
  DashboardApiResponse,
} from '@/app/dashboard/dashboard-context';
import type { DashboardRole } from '@/app/dashboard/dashboard-roles';

export type DashboardModuleId =
  | 'analytics'
  | 'projects'
  | 'inbox'
  | 'people'
  | 'updates'
  | 'chat'
  | 'crm'
  | 'clients'
  | 'workspaceAdmin'
  | 'superAdmin'
  | 'moduleAccess';

export type DashboardWidgetSize = 'sm' | 'md' | 'lg';

export type DashboardWidgetDefinition = {
  id: string;
  moduleId: DashboardModuleId;
  title: string;
  description?: string;
  href: string;
  allowedRoles: DashboardRole[];
  defaultSize: DashboardWidgetSize;
  render: (args: { data: DashboardApiResponse }) => ReactNode;
};

export type DashboardModuleDefinition = {
  id: DashboardModuleId;
  label: string;
  href: string;
  allowedRoles: DashboardRole[];
  navOrder: number;
  widgets: DashboardWidgetDefinition[];
};

