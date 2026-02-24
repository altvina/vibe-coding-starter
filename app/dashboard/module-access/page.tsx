import { genPageMetadata } from '@/app/seo';
import { ModuleAccessClient } from '@/app/dashboard/module-access/module-access-client';

export const metadata = genPageMetadata({
  title: 'Module Access',
  description: 'Configure role-based access to dashboard modules.',
});

export default function ModuleAccessPage() {
  return <ModuleAccessClient />;
}

