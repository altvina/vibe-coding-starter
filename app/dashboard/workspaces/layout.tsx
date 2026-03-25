import { genPageMetadata } from '@/app/seo';

export const metadata = genPageMetadata({
  title: 'Workspaces',
  description: 'Create and manage workspaces across the platform.',
});

export default function WorkspacesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
