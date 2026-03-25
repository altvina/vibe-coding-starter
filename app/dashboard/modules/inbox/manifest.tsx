import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { cn } from '@/lib/utils';
import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';

function InboxWidget({ data }: { data: DashboardApiResponse }) {
  const message = data.inboxPreview.messages[0];
  return (
    <DashboardCard title="Inbox">
      <div className={cn('text-sm', dashboardTokens.textMuted)}>
        {message ? message.subject : 'No messages yet.'}
      </div>
      <div className={cn('mt-2 text-xs', dashboardTokens.textSubtle)}>
        {message ? `From ${message.from} • ${message.time}` : ' '}
      </div>
    </DashboardCard>
  );
}

export const inboxModule: DashboardModuleDefinition = {
  id: 'inbox',
  label: 'Inbox',
  href: '/dashboard/inbox',
  allowedRoles: ['client', 'contractor', 'internal', 'admin'],
  navOrder: 35,
  widgets: [
    {
      id: 'inbox.preview',
      moduleId: 'inbox',
      title: 'Inbox',
      href: '/dashboard/inbox',
      allowedRoles: ['client', 'contractor', 'internal', 'admin'],
      defaultSize: 'md',
      render: ({ data }) => <InboxWidget data={data} />,
    },
  ],
};

