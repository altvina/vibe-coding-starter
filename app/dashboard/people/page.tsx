import { genPageMetadata } from '@/app/seo';
import { PeopleModulePage } from '@/app/dashboard/modules/people/module-page';

export const metadata = genPageMetadata({
  title: 'People',
  description: 'Workspace member directory.',
});

export default function PeoplePage() {
  return <PeopleModulePage />;
}

