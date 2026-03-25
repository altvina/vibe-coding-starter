'use client';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { dashboardModules } from '@/app/dashboard/modules/registry';
import { useModuleAccess } from '@/app/dashboard/module-access/module-access-context';
import { Switch } from '@/components/shared/ui/switch';
import { Button } from '@/components/shared/ui/button';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';
import { membershipRoleDisplayLabel } from '@/app/dashboard/workspace-role-labels';

export function ModuleAccessClient() {
  const { data } = useDashboardData();
  const { isModuleEnabled, setModuleEnabled, reset } = useModuleAccess();

  if (!data) {
    return null;
  }

  if (data.role !== 'admin') {
    return (
      <DashboardCard title="Module Access">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          This module is only available to workspace admins in the simulation.
        </p>
      </DashboardCard>
    );
  }

  const targetRoles = [
    { id: 'client' as const, label: membershipRoleDisplayLabel('client') },
    { id: 'viewer' as const, label: membershipRoleDisplayLabel('viewer') },
    { id: 'contractor' as const, label: membershipRoleDisplayLabel('contractor') },
    { id: 'internal' as const, label: membershipRoleDisplayLabel('internal') },
  ];

  return (
    <div className="space-y-4">
      <DashboardCard
        title="Module access control"
        action={
          <Button
            type="button"
            variant="outline"
            onClick={reset}
            className={cn('rounded-full', dashboardTokens.focusRing)}
          >
            Reset defaults
          </Button>
        }
      >
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          Toggle which modules appear for each role. This is stored locally for fast iteration.
        </p>
      </DashboardCard>

      <DashboardCard title="Modules">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={cn('border-b', dashboardTokens.border)}>
                <th
                  className={cn(
                    'py-3 pr-6 text-left text-xs font-semibold',
                    dashboardTokens.textSubtle,
                  )}
                >
                  Module
                </th>
                {targetRoles.map((r) => (
                  <th
                    key={r.id}
                    className={cn(
                      'py-3 pr-6 text-left text-xs font-semibold',
                      dashboardTokens.textSubtle,
                    )}
                  >
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dashboardModules
                .filter((m) => m.id !== 'moduleAccess' && m.id !== 'superAdmin')
                .sort((a, b) => a.navOrder - b.navOrder)
                .map((m) => (
                  <tr
                    key={m.id}
                    className={cn('border-b border-dashed', dashboardTokens.border)}
                  >
                    <td className="py-4 pr-6">
                      <div className="text-sm font-semibold">{m.label}</div>
                      <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                        {m.href}
                      </div>
                    </td>
                    {targetRoles.map((r) => {
                      const allowedByModule = m.allowedRoles.includes(r.id);
                      const enabled = isModuleEnabled({ role: r.id, moduleId: m.id });
                      return (
                        <td key={r.id} className="py-4 pr-6">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={allowedByModule && enabled}
                              disabled={!allowedByModule}
                              onCheckedChange={(checked) =>
                                setModuleEnabled({
                                  role: r.id,
                                  moduleId: m.id,
                                  enabled: Boolean(checked),
                                })
                              }
                              aria-label={`Enable ${m.label} for ${r.label}`}
                            />
                            <span className={cn('text-xs', dashboardTokens.textSubtle)}>
                              {allowedByModule ? (enabled ? 'On' : 'Off') : 'N/A'}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}

