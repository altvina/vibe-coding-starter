'use client';

import { useEffect, useMemo, useState } from 'react';
import { Database, Lock, Play, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { cn } from '@/lib/utils';

import { DashboardCard } from '@/app/dashboard/_components/dashboard-card';
import { useDashboardData } from '@/app/dashboard/dashboard-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';

type SqlConfig = {
  enabled: boolean;
  allowWrites: boolean;
  requireToken: boolean;
  allowed: boolean;
};

type SqlResult = {
  rowCount: number;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  durationMs: number;
  readOnly: boolean;
};

export function SuperAdminSqlConsolePage() {
  const { data } = useDashboardData();
  const [config, setConfig] = useState<SqlConfig | null>(null);
  const [sql, setSql] = useState('select now() as server_time');
  const [maxRows, setMaxRows] = useState(200);
  const [token, setToken] = useState('');
  const [allowWrites, setAllowWrites] = useState(false);
  const [confirmWrites, setConfirmWrites] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SqlResult | null>(null);

  const role = data?.role ?? null;
  const roleParam = role ? `?role=${encodeURIComponent(role)}` : '';

  useEffect(() => {
    let cancelled = false;
    async function loadConfig() {
      try {
        const res = await fetch(`/api/admin/sql${roleParam}`);
        const json = (await res.json()) as SqlConfig;
        if (!cancelled) setConfig(json);
      } catch (e) {
        void e;
        if (!cancelled) {
          setConfig({ enabled: false, allowWrites: false, requireToken: true, allowed: false });
        }
      }
    }
    void loadConfig();
    return () => {
      cancelled = true;
    };
  }, [roleParam]);

  const canUseConsole = Boolean(config?.enabled && config.allowed);

  const helperText = useMemo(() => {
    if (!config) return 'Loading configuration…';
    if (!config.enabled) return 'Admin SQL is disabled (set ADMIN_SQL_ENABLED=true).';
    if (!config.allowed) return 'Only internal/admin workspace roles can use this console.';
    if (config.requireToken) return 'Token required (set ADMIN_SQL_TOKEN).';
    return 'Read-only by default (SELECT / WITH / EXPLAIN).';
  }, [config]);

  async function run() {
    if (!config?.enabled) return;
    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/sql${roleParam}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token.trim() ? { 'x-admin-token': token.trim() } : {}),
        },
        body: JSON.stringify({
          sql,
          maxRows,
          allowWrites,
          confirmWrites,
        }),
      });

      const json = (await res.json()) as SqlResult | { error?: string };
      if (!res.ok) {
        setError((json as { error?: string }).error ?? 'SQL execution failed.');
        return;
      }
      setResult(json as SqlResult);
    } catch (e) {
      void e;
      setError('Network error.');
    } finally {
      setIsRunning(false);
    }
  }

  if (!data) return null;

  if (data.role !== 'admin' && data.role !== 'internal') {
    return (
      <DashboardCard title="SQL Console">
        <div className={cn('text-sm', dashboardTokens.textMuted)}>
          This tool is only available to admin roles.
        </div>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardCard title="SQL Console">
        <div className={cn('text-sm', dashboardTokens.textMuted)}>
          Run guarded SQL against the configured database.
        </div>
      </DashboardCard>

      <DashboardCard
        title="Query"
        action={
          <Button
            type="button"
            className={cn('h-10 rounded-full bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700', 'dark:bg-primary-400 dark:text-slate-950 dark:hover:bg-primary-300', dashboardTokens.focusRing)}
            disabled={!canUseConsole || isRunning || sql.trim().length < 1}
            onClick={() => void run()}
          >
            <Play className="mr-2 h-4 w-4" />
            Run
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                className={cn('min-h-44 font-mono text-xs rounded-2xl', dashboardTokens.focusRing)}
                placeholder="select * from ..."
                disabled={!canUseConsole}
              />
            </div>
            <div className="space-y-3 lg:col-span-4">
              <div className={cn('rounded-2xl border p-4', dashboardTokens.border, dashboardTokens.surface)}>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Database className="h-4 w-4" />
                  Controls
                </div>
                <div className={cn('mt-2 text-xs', dashboardTokens.textSubtle)}>
                  {helperText}
                </div>

                <div className="mt-4 space-y-2">
                  <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                    Max rows (auto LIMIT)
                  </div>
                  <Input
                    type="number"
                    value={maxRows}
                    min={1}
                    max={1000}
                    onChange={(e) => setMaxRows(Number(e.target.value))}
                    className={cn('rounded-2xl', dashboardTokens.focusRing)}
                    disabled={!canUseConsole}
                  />
                </div>

                {config?.requireToken ? (
                  <div className="mt-4 space-y-2">
                    <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                      Admin token
                    </div>
                    <Input
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className={cn('rounded-2xl', dashboardTokens.focusRing)}
                      placeholder="x-admin-token"
                      disabled={!canUseConsole}
                    />
                    <div className={cn('text-xs', dashboardTokens.textSubtle)}>
                      <Lock className="mr-1 inline-block h-3.5 w-3.5" />
                      Token is required in production.
                    </div>
                  </div>
                ) : null}

                {config?.allowWrites ? (
                  <div className="mt-4 space-y-2">
                    <div className={cn('text-xs font-semibold', dashboardTokens.textSubtle)}>
                      Write mode
                    </div>
                    <div className={cn('rounded-2xl border p-3', dashboardTokens.border)}>
                      <label className="flex items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={allowWrites}
                          onChange={(e) => setAllowWrites(e.target.checked)}
                          disabled={!canUseConsole}
                        />
                        <span>
                          Enable write queries (INSERT/UPDATE/DELETE). Use with extreme care.
                        </span>
                      </label>
                      {allowWrites ? (
                        <label className="mt-3 flex items-start gap-3 text-sm">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={confirmWrites}
                            onChange={(e) => setConfirmWrites(e.target.checked)}
                            disabled={!canUseConsole}
                          />
                          <span>
                            I understand this can change production data.
                          </span>
                        </label>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    Writes are disabled (set <span className="font-semibold">ADMIN_SQL_ALLOW_WRITES=true</span> to enable).
                  </div>
                )}
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-100">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4 w-4" />
                Query failed
              </div>
              <div className="mt-2 whitespace-pre-wrap">{error}</div>
            </div>
          ) : null}
        </div>
      </DashboardCard>

      <DashboardCard title="Result">
        {result ? (
          <div className="space-y-3">
            <div className={cn('text-xs', dashboardTokens.textSubtle)}>
              {result.rowCount} row(s) • {result.durationMs}ms • {result.readOnly ? 'read-only' : 'writes enabled'}
            </div>
            {result.rows.length ? (
              <div className={cn('overflow-auto rounded-2xl border', dashboardTokens.border)}>
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <tr>
                      {result.columns.map((c) => (
                        <th key={c} className="px-3 py-2 font-semibold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-slate-200/70 dark:border-slate-800/70"
                      >
                        {result.columns.map((c) => (
                          <td key={c} className="px-3 py-2 align-top">
                            <span className="whitespace-pre-wrap">
                              {row[c] === null || typeof row[c] === 'undefined'
                                ? '—'
                                : typeof row[c] === 'object'
                                  ? JSON.stringify(row[c])
                                  : String(row[c])}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={cn('text-sm', dashboardTokens.textMuted)}>
                Query returned no rows.
              </div>
            )}
          </div>
        ) : (
          <div className={cn('text-sm', dashboardTokens.textMuted)}>
            Run a query to see results.
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

