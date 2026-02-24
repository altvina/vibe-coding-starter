import { genPageMetadata } from '@/app/seo';
import { ChatModulePage } from '@/app/dashboard/modules/chat/module-page';

export const metadata = genPageMetadata({
  title: 'Chat',
  description: 'Channels and direct messages.',
});

export default function ChatPage() {
  return <ChatModulePage />;
}
