import { genPageMetadata } from '@/app/seo';
import { ChatModulePage } from '@/app/dashboard/modules/chat/module-page';

export const metadata = genPageMetadata({
  title: 'Chat',
  description: 'Workspace chat gateway.',
});

export default function ChatPage() {
  return <ChatModulePage />;
}
