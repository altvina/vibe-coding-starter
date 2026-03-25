import { genPageMetadata } from '@/app/seo';
import { WorkspaceAdminRedirect } from '@/app/dashboard/workspace-admin/workspace-admin-redirect';

export const metadata = genPageMetadata({
  title: 'Workspace Admin',
  description: 'Altvina-curated workspace membership and masking.',
});

export default function WorkspaceAdminPage() {
  return <WorkspaceAdminRedirect />;
}
