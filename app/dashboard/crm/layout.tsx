'use client';

import { useRouter } from 'next/navigation';
import { useDashboardRole } from '@/app/dashboard/dashboard-role-context';
import { useEffect } from 'react';

const CRM_ALLOWED: Array<string> = ['staff_admin', 'super_admin'];

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useDashboardRole();
  const router = useRouter();

  useEffect(() => {
    if (!CRM_ALLOWED.includes(role)) {
      router.replace('/dashboard');
    }
  }, [role, router]);

  if (!CRM_ALLOWED.includes(role)) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-slate-500">
        Access denied. Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}
