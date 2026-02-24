'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import type { DashboardRole } from '@/app/dashboard/dashboard-roles';

function storageKeyForRole(role: DashboardRole) {
  return `altvina.dashboard.activeWorkspace.${role}` as const;
}

type WorkspaceState = {
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
};

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function DashboardWorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useDashboardRole();
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState('ws-acme');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKeyForRole(role));
      if (saved) {
        setActiveWorkspaceIdState(saved);
      } else {
        setActiveWorkspaceIdState(role === 'super_admin' ? 'ws-superadmin' : 'ws-acme');
      }
    } catch (e) {
      void e;
      setActiveWorkspaceIdState(role === 'super_admin' ? 'ws-superadmin' : 'ws-acme');
    }
  }, [role]);

  const setActiveWorkspaceId = useCallback(
    (id: string) => {
      setActiveWorkspaceIdState(id);
      try {
        window.localStorage.setItem(storageKeyForRole(role), id);
      } catch (e) {
        void e;
      }
    },
    [role],
  );

  const value = useMemo(
    () => ({ activeWorkspaceId, setActiveWorkspaceId }),
    [activeWorkspaceId, setActiveWorkspaceId],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useDashboardWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useDashboardWorkspace must be used within DashboardWorkspaceProvider');
  }
  return ctx;
}

