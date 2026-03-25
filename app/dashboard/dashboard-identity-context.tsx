'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  dashboardIdentityStorageKey,
  defaultDashboardIdentityId,
  isDashboardIdentityId,
} from '@/app/dashboard/dashboard-identities';

type DashboardIdentityState = {
  activeIdentityId: string;
  setActiveIdentityId: (identityId: string) => void;
};

const DashboardIdentityContext = createContext<DashboardIdentityState | null>(null);

export function DashboardIdentityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeIdentityId, setActiveIdentityIdState] = useState<string>(
    defaultDashboardIdentityId,
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(dashboardIdentityStorageKey);
      if (isDashboardIdentityId(saved)) {
        setActiveIdentityIdState(saved);
      }
    } catch (error) {
      void error;
    }
  }, []);

  const setActiveIdentityId = useCallback((nextIdentityId: string) => {
    if (!isDashboardIdentityId(nextIdentityId)) {
      return;
    }
    setActiveIdentityIdState(nextIdentityId);
    try {
      window.localStorage.setItem(dashboardIdentityStorageKey, nextIdentityId);
    } catch (error) {
      void error;
    }
  }, []);

  const value = useMemo(
    () => ({ activeIdentityId, setActiveIdentityId }),
    [activeIdentityId, setActiveIdentityId],
  );

  return (
    <DashboardIdentityContext.Provider value={value}>
      {children}
    </DashboardIdentityContext.Provider>
  );
}

export function useDashboardIdentity() {
  const context = useContext(DashboardIdentityContext);
  if (!context) {
    throw new Error(
      'useDashboardIdentity must be used within DashboardIdentityProvider',
    );
  }
  return context;
}

