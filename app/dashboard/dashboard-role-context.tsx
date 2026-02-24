'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  dashboardRoleStorageKey,
  defaultDashboardRole,
  isDashboardRole,
  type DashboardRole,
} from '@/app/dashboard/dashboard-roles';

type DashboardRoleState = {
  role: DashboardRole;
  setRole: (role: DashboardRole) => void;
};

const DashboardRoleContext = createContext<DashboardRoleState | null>(null);

export function DashboardRoleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRoleState] = useState<DashboardRole>(defaultDashboardRole);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(dashboardRoleStorageKey);
      if (isDashboardRole(saved)) {
        setRoleState(saved);
      }
    } catch (e) {
      void e;
    }
  }, []);

  const setRole = useCallback((nextRole: DashboardRole) => {
    setRoleState(nextRole);
    try {
      window.localStorage.setItem(dashboardRoleStorageKey, nextRole);
    } catch (e) {
      void e;
    }
  }, []);

  const value = useMemo(() => ({ role, setRole }), [role, setRole]);

  return (
    <DashboardRoleContext.Provider value={value}>
      {children}
    </DashboardRoleContext.Provider>
  );
}

export function useDashboardRole() {
  const ctx = useContext(DashboardRoleContext);
  if (!ctx) {
    throw new Error('useDashboardRole must be used within DashboardRoleProvider');
  }
  return ctx;
}

