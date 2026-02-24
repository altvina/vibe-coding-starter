import CustomLink from '@/components/shared/Link';
import type { DashboardApiResponse } from '@/app/dashboard/dashboard-context';
import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import { MessageSquare } from 'lucide-react';
import type { DashboardModuleDefinition } from '@/app/dashboard/modules/types';

function ChatWidget({ data }: { data: DashboardApiResponse }) {
  return (
    <DashboardCard title="Chat">
      <div className={dashboardTokens.textMuted}>
        <span className="text-sm">Channels and direct messages. Open Chat to continue.</span>
      </div>
      <CustomLink
        href="/dashboard/chat"
        className="mt-3 flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400"
      >
        <MessageSquare className="h-4 w-4" />
        Open Chat
      </CustomLink>
    </DashboardCard>
  );
}

export const chatModule: DashboardModuleDefinition = {
  id: 'chat',
  label: 'Chat',
  href: '/dashboard/chat',
  allowedRoles: ['client', 'expert', 'staff_admin', 'super_admin'],
  navOrder: 32,
  widgets: [
    {
      id: 'chat.preview',
      moduleId: 'chat',
      title: 'Chat',
      href: '/dashboard/chat',
      allowedRoles: ['client', 'expert', 'staff_admin', 'super_admin'],
      defaultSize: 'md',
      render: ({ data }) => <ChatWidget data={data} />,
    },
  ],
};
