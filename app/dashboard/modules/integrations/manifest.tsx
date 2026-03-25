import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';
import { Badge } from '@/components/shared/ui/badge';
import { cn } from '@/lib/utils';
import {
  integrationToolConfigs,
  permissionKeyForTool,
} from '@/app/dashboard/modules/integrations/integrations-stub';

function IntegrationsWidget({ data }: { data: DashboardApiResponse }) {
  void data;

  return (
    <DashboardCard title="Apps">
      <div className="space-y-3">
        <p className={cn('text-sm', dashboardTokens.textMuted)}>
          Connected tools, automations, and data sources in one place.
        </p>
        <div className="space-y-2">
          {Object.values(integrationToolConfigs)
            .filter((tool) => data.permissions[permissionKeyForTool(tool.id)])
            .map((tool) => (
            <div
              key={tool.id}
              className={cn(
                'flex items-center justify-between gap-2 rounded-lg border px-3 py-2',
                dashboardTokens.border,
                dashboardTokens.surfaceMuted,
              )}
            >
              <span className="text-sm font-medium">{tool.label}</span>
              <Badge variant="secondary">Launch</Badge>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}

export const integrationsModule: DashboardModuleDefinition = {
  id: 'integrations',
  label: 'Apps',
  href: '/dashboard/apps',
  allowedRoles: ['client', 'contractor', 'internal', 'admin'],
  navOrder: 10,
  widgets: [
    {
      id: 'integrations.launchpad',
      moduleId: 'integrations',
      title: 'Apps',
      href: '/dashboard/apps',
      allowedRoles: ['client', 'contractor', 'internal', 'admin'],
      defaultSize: 'md',
      render: ({ data }) => <IntegrationsWidget data={data} />,
    },
  ],
};
