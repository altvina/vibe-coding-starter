import { genPageMetadata } from '@/app/seo';
import { WorkspaceAdminModulePage } from '@/app/dashboard/modules/workspace-admin/module-page';

export const metadata = genPageMetadata({
  title: 'Workspace Admin',
  description: 'Staff-curated workspace membership and masking.',
});

export default function WorkspaceAdminPage() {
  return <WorkspaceAdminModulePage />;
}

