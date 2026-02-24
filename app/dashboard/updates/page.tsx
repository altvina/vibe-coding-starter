import { genPageMetadata } from '@/app/seo';
import { UpdatesModulePage } from '@/app/dashboard/modules/updates/module-page';

export const metadata = genPageMetadata({
  title: 'Updates',
  description: 'Workspace update feed.',
});

export default function UpdatesPage() {
  return <UpdatesModulePage />;
}

