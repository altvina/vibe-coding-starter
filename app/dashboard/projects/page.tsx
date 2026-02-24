import { genPageMetadata } from '@/app/seo';
import { ProjectsModulePage } from '@/app/dashboard/modules/projects/module-page';

export const metadata = genPageMetadata({
  title: 'Projects',
  description: 'Projects in the Altvina expert portal.',
});

export default function ProjectsPage() {
  return <ProjectsModulePage />;
}

