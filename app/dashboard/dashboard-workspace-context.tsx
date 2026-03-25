'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useDashboardIdentity } from '@/app/dashboard/dashboard-identity-context';

function storageKeyForIdentity(identityId: string) {
  return `altvina.dashboard.activeWorkspace.v2.${identityId}` as const;
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
  const { activeIdentityId } = useDashboardIdentity();
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState('ws-acme');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKeyForIdentity(activeIdentityId));
      if (saved) {
        setActiveWorkspaceIdState(saved);
      } else {
        setActiveWorkspaceIdState('ws-acme');
      }
    } catch (e) {
      void e;
      setActiveWorkspaceIdState('ws-acme');
    }
  }, [activeIdentityId]);

  const setActiveWorkspaceId = useCallback(
    (id: string) => {
      setActiveWorkspaceIdState(id);
      try {
        window.localStorage.setItem(storageKeyForIdentity(activeIdentityId), id);
      } catch (e) {
        void e;
      }
    },
    [activeIdentityId],
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

