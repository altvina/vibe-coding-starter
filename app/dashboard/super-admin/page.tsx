import { genPageMetadata } from '@/app/seo';
import { SuperAdminModulePage } from '@/app/dashboard/modules/super-admin/module-page';

export const metadata = genPageMetadata({
  title: 'Super Admin',
  description: 'Platform-wide administration tools.',
});

export default function SuperAdminPage() {
  return <SuperAdminModulePage />;
}

