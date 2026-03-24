'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="max-w-md rounded-2xl border px-5 py-4 text-center text-sm text-slate-600 dark:text-slate-300">
        CRM is currently disabled while the platform is being simplified. Redirecting to
        dashboard…
      </div>
      <div className="hidden">{children}</div>
    </div>
  );
}
