'use client';

import { ShieldCheck } from 'lucide-react';

import CustomLink from '@/components/shared/Link';
import { Button } from '@/components/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { cn } from '@/lib/utils';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { ModuleAccessClient } from '@/app/dashboard/module-access/module-access-client';
import { WorkspaceAdminModulePage } from '@/app/dashboard/modules/workspace-admin/module-page';
import { IntegrationSettingsCard } from '@/app/dashboard/modules/integrations/integration-settings-card';

const superAdminWorkspaceId = 'ws-superadmin' as const;

export function SuperAdminModulePage() {
  const { data } = useDashboardData();

  if (!data) return null;

  if (data.role !== 'super_admin') {
    return (
      <DashboardCard title="Super Admin">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          This area is only available to Super Admin users.
        </p>
      </DashboardCard>
    );
  }

  if (data.activeWorkspaceId !== superAdminWorkspaceId) {
    return (
      <DashboardCard title="Super Admin workspace required">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          Switch to the <span className="font-semibold">Super Admin</span> workspace to manage platform-wide access.
        </p>
      </DashboardCard>
    );
  }

  const superAdmins = data.workspace.members.filter(
    (m) => m.role === 'staff' && (m.title ?? '').toLowerCase().includes('super admin'),
  );

  return (
    <div className="space-y-4">
      <DashboardCard title="Super Admin control center">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className={cn('text-sm', dashboardTokens.textMuted)}>
            Manage platform settings, role access, workspace policy, integrations, and operations.
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 dark:bg-primary-900/20 dark:text-primary-200">
            <ShieldCheck className="h-4 w-4" />
            Highest permission tier
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="Super Admin users">
        <div className="space-y-3">
          <p className={cn('text-sm', dashboardTokens.textMuted)}>
            For safety, we require more than one Super Admin user in the simulation so there are backups.
          </p>
          <div className={cn('rounded-2xl border p-4', dashboardTokens.border)}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">
                Configured super admins
              </div>
              <div className={cn('text-xs tabular-nums', dashboardTokens.textSubtle)}>
                {superAdmins.length}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {superAdmins.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{m.displayName}</div>
                    <div className={cn('truncate text-xs', dashboardTokens.textSubtle)}>
                      {m.email ? m.email : '—'}
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Super Admin
                  </span>
                </div>
              ))}
              {superAdmins.length < 2 ? (
                <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                  Add at least one more Super Admin user (backup). This is seeded in the mock API for now.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </DashboardCard>

      <Tabs defaultValue="platform" className="space-y-3">
        <TabsList className={cn('h-auto flex-wrap gap-1 p-1', dashboardTokens.surfaceMuted)}>
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="access">Module Access</TabsTrigger>
          <TabsTrigger value="workspace">Workspace Policy</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-4">
          <DashboardCard title="Platform overview">
            <div className="space-y-2">
              <p className={cn('text-sm', dashboardTokens.textMuted)}>
                This control center is the authoritative place for all customizable platform
                behavior.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild className={cn('rounded-full', dashboardTokens.focusRing)}>
                  <CustomLink href="/dashboard/module-access">Open module access</CustomLink>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className={cn('rounded-full', dashboardTokens.focusRing)}
                >
                  <CustomLink href="/dashboard/workspace-admin">
                    Open workspace policy
                  </CustomLink>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className={cn('rounded-full', dashboardTokens.focusRing)}
                >
                  <CustomLink href="/dashboard/super-admin/sql">Open SQL console</CustomLink>
                </Button>
              </div>
            </div>
          </DashboardCard>
        </TabsContent>

        <TabsContent value="access">
          <ModuleAccessClient />
        </TabsContent>

        <TabsContent value="workspace">
          <WorkspaceAdminModulePage />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationSettingsCard />
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <DashboardCard title="Operations">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                asChild
                variant="outline"
                className={cn('rounded-full', dashboardTokens.focusRing)}
              >
                <CustomLink href="/dashboard/super-admin/sql">SQL console</CustomLink>
              </Button>
            </div>
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

