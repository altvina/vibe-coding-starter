import { genPageMetadata } from '@/app/seo';
import { InboxModulePage } from '@/app/dashboard/modules/inbox/module-page';

export const metadata = genPageMetadata({
  title: 'Inbox',
  description: 'Inbox in the Altvina expert portal.',
});

export default function InboxPage() {
  return <InboxModulePage />;
}

