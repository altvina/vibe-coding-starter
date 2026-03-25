import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';
import { analyticsModule } from '@/app/dashboard/modules/analytics/manifest';
import { projectsModule } from '@/app/dashboard/modules/projects/manifest';
import { peopleModule } from '@/app/dashboard/modules/people/manifest';
import { updatesModule } from '@/app/dashboard/modules/updates/manifest';
import { chatModule } from '@/app/dashboard/modules/chat/manifest';
import { integrationsModule } from '@/app/dashboard/modules/integrations/manifest';
import { clientsModule } from '@/app/dashboard/modules/clients/manifest';
import { allWorkspacesModule } from '@/app/dashboard/modules/all-workspaces/manifest';
import { workspaceAdminModule } from '@/app/dashboard/modules/workspace-admin/manifest';
import { moduleAccessModule } from '@/app/dashboard/modules/module-access/manifest';
import { superAdminModule } from '@/app/dashboard/modules/super-admin/manifest';

export const dashboardModules: DashboardModuleDefinition[] = [
  analyticsModule,
  projectsModule,
  peopleModule,
  updatesModule,
  chatModule,
  integrationsModule,
  clientsModule,
  allWorkspacesModule,
  workspaceAdminModule,
  moduleAccessModule,
  superAdminModule,
];

export function getModuleById(id: DashboardModuleDefinition['id']) {
  return dashboardModules.find((m) => m.id === id) ?? null;
}

