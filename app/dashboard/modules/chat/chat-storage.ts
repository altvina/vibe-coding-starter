/**
 * Chat module storage: channels and direct/group chats (MS Teams–style).
 * Persisted per workspace in localStorage.
 */

export type Channel = {
  id: string;
  name: string;
  description?: string;
};

export type ChatConversation = {
  id: string;
  participantIds: string[];
  name?: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  authorId: string;
  authorName?: string;
  body: string;
  createdAt: string;
};

export type ChannelMessage = ChatMessage & { channelId: string };
export type DirectMessage = ChatMessage & { chatId: string };

export type ChatWorkspaceData = {
  channels: Channel[];
  channelMessages: Record<string, ChannelMessage[]>;
  chats: ChatConversation[];
  chatMessages: Record<string, DirectMessage[]>;
};

const STORAGE_PREFIX = 'altvina.dashboard.chat.';

function storageKey(workspaceId: string) {
  return `${STORAGE_PREFIX}${workspaceId}`;
}

const DEFAULT_CHANNELS: Channel[] = [
  { id: 'general', name: 'General', description: 'Team-wide announcements and discussion' },
];

export function loadChatData(workspaceId: string): ChatWorkspaceData {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey(workspaceId)) : null;
    if (!raw) {
      return {
        channels: [...DEFAULT_CHANNELS],
        channelMessages: {},
        chats: [],
        chatMessages: {},
      };
    }
    const parsed = JSON.parse(raw) as ChatWorkspaceData;
    return {
      channels: parsed.channels?.length ? parsed.channels : [...DEFAULT_CHANNELS],
      channelMessages: parsed.channelMessages ?? {},
      chats: parsed.chats ?? [],
      chatMessages: parsed.chatMessages ?? {},
    };
  } catch {
    return {
      channels: [...DEFAULT_CHANNELS],
      channelMessages: {},
      chats: [],
      chatMessages: {},
    };
  }
}

export function saveChatData(workspaceId: string, data: ChatWorkspaceData) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey(workspaceId), JSON.stringify(data));
    }
  } catch {
    // ignore
  }
}

export function addChannelMessage(
  workspaceId: string,
  channelId: string,
  message: Omit<ChannelMessage, 'id' | 'channelId'>
): ChannelMessage {
  const data = loadChatData(workspaceId);
  const list = data.channelMessages[channelId] ?? [];
  const full: ChannelMessage = {
    ...message,
    id: `ch-${channelId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    channelId,
  };
  data.channelMessages[channelId] = [full, ...list];
  saveChatData(workspaceId, data);
  return full;
}

export function addChatMessage(
  workspaceId: string,
  chatId: string,
  message: Omit<DirectMessage, 'id' | 'chatId'>
): DirectMessage {
  const data = loadChatData(workspaceId);
  const list = data.chatMessages[chatId] ?? [];
  const full: DirectMessage = {
    ...message,
    id: `dm-${chatId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    chatId,
  };
  data.chatMessages[chatId] = [full, ...list];
  saveChatData(workspaceId, data);
  return full;
}

export function getOrCreateChat(workspaceId: string, participantIds: string[]): ChatConversation {
  const data = loadChatData(workspaceId);
  const sorted = [...participantIds].sort();
  const existing = data.chats.find((c) => {
    const s = [...c.participantIds].sort();
    return s.length === sorted.length && s.every((id, i) => id === sorted[i]);
  });
  if (existing) return existing;

  const chat: ChatConversation = {
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    participantIds,
    createdAt: new Date().toISOString(),
  };
  data.chats = [chat, ...data.chats];
  data.chatMessages[chat.id] = [];
  saveChatData(workspaceId, data);
  return chat;
}

export function createChannel(workspaceId: string, name: string, description?: string): Channel {
  const data = loadChatData(workspaceId);
  const id = `channel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const channel: Channel = { id, name, description };
  data.channels = [...data.channels, channel];
  data.channelMessages[id] = [];
  saveChatData(workspaceId, data);
  return channel;
}
