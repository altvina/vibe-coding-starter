'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { dashboardModules } from '@/app/dashboard/modules/registry';
import type { DashboardModuleId } from '@/app/dashboard/modules/types';
import type { DashboardRole } from '@/app/dashboard/dashboard-roles';

const moduleAccessStorageKey = 'altvina.dashboard.moduleAccess' as const;

type ModuleAccessConfig = {
  enabledByRole: Record<DashboardRole, DashboardModuleId[]>;
};

type ModuleAccessState = {
  config: ModuleAccessConfig;
  setModuleEnabled: (args: {
    role: DashboardRole;
    moduleId: DashboardModuleId;
    enabled: boolean;
  }) => void;
  isModuleEnabled: (args: { role: DashboardRole; moduleId: DashboardModuleId }) => boolean;
  reset: () => void;
};

const ModuleAccessContext = createContext<ModuleAccessState | null>(null);

function getDefaultConfig(): ModuleAccessConfig {
  const roles: DashboardRole[] = ['client', 'expert', 'staff_admin', 'super_admin'];

  const enabledByRole = roles.reduce<Record<DashboardRole, DashboardModuleId[]>>(
    (acc, role) => {
      acc[role] = dashboardModules
        .filter((m) => m.allowedRoles.includes(role))
        .map((m) => m.id);
      return acc;
    },
    { client: [], expert: [], staff_admin: [], super_admin: [] },
  );

  // Super admin always keeps access controls enabled.
  if (!enabledByRole.super_admin.includes('moduleAccess')) {
    enabledByRole.super_admin = [...enabledByRole.super_admin, 'moduleAccess'];
  }

  // Hide staff-only modules from other roles by default.
  enabledByRole.client = enabledByRole.client.filter(
    (id) => id !== 'clients' && id !== 'moduleAccess' && id !== 'superAdmin',
  );
  enabledByRole.expert = enabledByRole.expert.filter(
    (id) => id !== 'clients' && id !== 'moduleAccess' && id !== 'superAdmin',
  );
  enabledByRole.staff_admin = enabledByRole.staff_admin.filter(
    (id) => id !== 'moduleAccess' && id !== 'superAdmin',
  );

  return { enabledByRole };
}

function coerceConfig(raw: unknown): ModuleAccessConfig {
  const fallback = getDefaultConfig();
  if (!raw || typeof raw !== 'object') return fallback;

  const obj = raw as { enabledByRole?: Record<string, unknown> };
  if (!obj.enabledByRole || typeof obj.enabledByRole !== 'object') return fallback;

  const enabledByRole = fallback.enabledByRole;
  (['client', 'expert', 'staff_admin', 'super_admin'] as const).forEach((role) => {
    const value = (obj.enabledByRole as Record<string, unknown>)[role];
    if (!Array.isArray(value)) return;
    const ids = value.filter((v): v is DashboardModuleId => typeof v === 'string') as DashboardModuleId[];
    enabledByRole[role] = ids;
  });

  // Enforce invariants.
  if (!enabledByRole.super_admin.includes('moduleAccess')) {
    enabledByRole.super_admin = [...enabledByRole.super_admin, 'moduleAccess'];
  }

  return { enabledByRole };
}

export function ModuleAccessProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ModuleAccessConfig>(() => getDefaultConfig());

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(moduleAccessStorageKey);
      if (!saved) return;
      setConfig(coerceConfig(JSON.parse(saved)));
    } catch (e) {
      void e;
    }
  }, []);

  const persist = useCallback((next: ModuleAccessConfig) => {
    setConfig(next);
    try {
      window.localStorage.setItem(moduleAccessStorageKey, JSON.stringify(next));
    } catch (e) {
      void e;
    }
  }, []);

  const setModuleEnabled = useCallback(
    ({
      role,
      moduleId,
      enabled,
    }: {
      role: DashboardRole;
      moduleId: DashboardModuleId;
      enabled: boolean;
    }) => {
      const current = config.enabledByRole[role] ?? [];
      const nextIds = enabled
        ? Array.from(new Set([...current, moduleId]))
        : current.filter((id) => id !== moduleId);

      const next: ModuleAccessConfig = {
        enabledByRole: {
          ...config.enabledByRole,
          [role]: nextIds,
        },
      };

      // Invariants
      if (!next.enabledByRole.super_admin.includes('moduleAccess')) {
        next.enabledByRole.super_admin = [...next.enabledByRole.super_admin, 'moduleAccess'];
      }

      persist(next);
    },
    [config.enabledByRole, persist],
  );

  const isModuleEnabled = useCallback(
    ({ role, moduleId }: { role: DashboardRole; moduleId: DashboardModuleId }) =>
      (config.enabledByRole[role] ?? []).includes(moduleId),
    [config.enabledByRole],
  );

  const reset = useCallback(() => {
    persist(getDefaultConfig());
  }, [persist]);

  const value = useMemo(
    () => ({ config, setModuleEnabled, isModuleEnabled, reset }),
    [config, isModuleEnabled, reset, setModuleEnabled],
  );

  return (
    <ModuleAccessContext.Provider value={value}>
      {children}
    </ModuleAccessContext.Provider>
  );
}

export function useModuleAccess() {
  const ctx = useContext(ModuleAccessContext);
  if (!ctx) {
    throw new Error('useModuleAccess must be used within ModuleAccessProvider');
  }
  return ctx;
}

