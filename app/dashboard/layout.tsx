import type { ReactNode } from 'react';

import { DashboardShell } from '@/app/dashboard/dashboard-shell';
import { DashboardDataProvider } from '@/app/dashboard/dashboard-context';
import { DashboardRoleProvider } from '@/app/dashboard/dashboard-role-context';
import { ModuleAccessProvider } from '@/app/dashboard/module-access/module-access-context';
import { DashboardWorkspaceProvider } from '@/app/dashboard/dashboard-workspace-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardRoleProvider>
      <ModuleAccessProvider>
        <DashboardWorkspaceProvider>
          <DashboardDataProvider>
            <DashboardShell>{children}</DashboardShell>
          </DashboardDataProvider>
        </DashboardWorkspaceProvider>
      </ModuleAccessProvider>
    </DashboardRoleProvider>
  );
}

