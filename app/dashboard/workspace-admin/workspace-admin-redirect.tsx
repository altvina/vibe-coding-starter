'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useDashboardWorkspace } from '@/app/dashboard/dashboard-workspace-context';

export function WorkspaceAdminRedirect() {
  const router = useRouter();
  const { activeWorkspaceId } = useDashboardWorkspace();

  useEffect(() => {
    router.replace(`/dashboard/workspace-admin/${activeWorkspaceId}?tab=members`);
  }, [activeWorkspaceId, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Opening workspace admin…
    </div>
  );
}
