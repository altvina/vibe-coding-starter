import { genPageMetadata } from '@/app/seo';
import { ChatModulePage } from '@/app/dashboard/modules/chat/module-page';

export const metadata = genPageMetadata({
  title: 'Mattermost',
  description: 'Workspace chat launch surface.',
});

export default function ChatPage() {
  return <ChatModulePage />;
}
