/**
 * Client-side helper to call CRM API with current dashboard role.
 * All CRM routes require role=staff_admin or super_admin (sent as query param).
 */

export type CrmAllowedRole = 'staff_admin' | 'super_admin';

export function crmApiUrl(path: string, role: CrmAllowedRole, params?: Record<string, string>): string {
  const base = path.startsWith('/') ? path : `/api/crm/${path}`;
  const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  url.searchParams.set('role', role);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}

export async function crmFetch<T>(
  path: string,
  role: CrmAllowedRole,
  options?: RequestInit & { params?: Record<string, string> }
): Promise<T> {
  const { params, ...init } = options ?? {};
  const url = crmApiUrl(path, role, params);
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}
