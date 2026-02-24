import { genPageMetadata } from '@/app/seo';
import { SuperAdminSqlConsolePage } from '@/app/dashboard/modules/super-admin/sql-console-page';

export const metadata = genPageMetadata({
  title: 'SQL Console',
  description: 'Admin-only SQL console (guarded).',
});

export default function SuperAdminSqlPage() {
  return <SuperAdminSqlConsolePage />;
}

