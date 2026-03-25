import { genPageMetadata } from '@/app/seo';
import { ProjectsModulePage } from '@/app/dashboard/modules/projects/module-page';

export const metadata = genPageMetadata({
  title: 'Projects',
  description: 'Workspace projects gateway.',
});

export default function ProjectsPage() {
  return <ProjectsModulePage />;
}

