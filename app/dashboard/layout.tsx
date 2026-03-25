import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { DashboardShell } from '@/app/dashboard/dashboard-shell';
import { DashboardDataProvider } from '@/app/dashboard/dashboard-context';
import { DashboardIdentityProvider } from '@/app/dashboard/dashboard-identity-context';
import { ModuleAccessProvider } from '@/app/dashboard/module-access/module-access-context';
import { DashboardWorkspaceProvider } from '@/app/dashboard/dashboard-workspace-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardIdentityProvider>
      <ModuleAccessProvider>
        <DashboardWorkspaceProvider>
          <Suspense fallback={null}>
            <DashboardDataProvider>
              <DashboardShell>{children}</DashboardShell>
            </DashboardDataProvider>
          </Suspense>
        </DashboardWorkspaceProvider>
      </ModuleAccessProvider>
    </DashboardIdentityProvider>
  );
}

