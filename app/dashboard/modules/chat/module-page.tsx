'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Hash,
  MessageSquare,
  Send,
  Plus,
  UserPlus,
  Users,
  Bell,
  BellOff,
} from 'lucide-react';

import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/shared/ui/avatar';
import { ScrollArea } from '@/components/shared/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { cn } from '@/lib/utils';

import { useDashboardData } from '@/app/dashboard/dashboard-context';
import type { WorkspaceMember } from '@/app/dashboard/dashboard-context';
import { useDashboardWorkspace } from '@/app/dashboard/dashboard-workspace-context';
import { dashboardTokens } from '@/app/dashboard/dashboard-tokens';
import type {
  Channel,
  ChannelMessage,
  ChatConversation,
  ChatWorkspaceData,
  DirectMessage,
} from '@/app/dashboard/modules/chat/chat-storage';
import {
  loadChatData,
  saveChatData,
  addChannelMessage,
  addChatMessage,
  getOrCreateChat,
  createChannel,
} from '@/app/dashboard/modules/chat/chat-storage';
import { requestAndStorePermission } from '@/app/dashboard/modules/chat/notifications';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? 'A').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

type ViewType = { type: 'channel'; id: string } | { type: 'chat'; id: string };

const EMPTY_MEMBERS: WorkspaceMember[] = [];

export function ChatModulePage() {
  const { data } = useDashboardData();
  const { activeWorkspaceId } = useDashboardWorkspace();
  const [chatData, setChatData] = useState<ChatWorkspaceData | null>(null);
  const [view, setView] = useState<ViewType>({ type: 'channel', id: 'general' });
  const [messageDraft, setMessageDraft] = useState('');
  const [newChannelOpen, setNewChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChatMemberId, setNewChatMemberId] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const members = data?.workspace.members ?? EMPTY_MEMBERS;
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const currentUserId = useMemo(() => {
    const role = data?.role;
    if (!role) return members[0]?.id ?? 'unknown';
    if (role === 'staff_admin' || role === 'super_admin') {
      return members.find((m) => m.role === 'staff')?.id ?? members[0]?.id ?? 'unknown';
    }
    return members.find((m) => m.role === role)?.id ?? members[0]?.id ?? 'unknown';
  }, [data?.role, members]);
  const currentUserName = memberById.get(currentUserId)?.displayName ?? data?.user?.name ?? 'You';

  useEffect(() => {
    setChatData(loadChatData(activeWorkspaceId));
  }, [activeWorkspaceId]);

  const persistData = useCallback(
    (next: ChatWorkspaceData) => {
      setChatData(next);
      saveChatData(activeWorkspaceId, next);
    },
    [activeWorkspaceId]
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const channels = chatData?.channels ?? [];
  const chats = chatData?.chats ?? [];
  const channelMessages = useMemo(
    () => chatData?.channelMessages ?? {},
    [chatData?.channelMessages]
  );
  const chatMessages = useMemo(
    () => chatData?.chatMessages ?? {},
    [chatData?.chatMessages]
  );

  const currentChannel = view.type === 'channel' ? channels.find((c) => c.id === view.id) : null;
  const currentChat = view.type === 'chat' ? chats.find((c) => c.id === view.id) : null;

  const messages = useMemo(() => {
    if (view.type === 'channel') {
      const list = channelMessages[view.id] ?? [];
      return [...list].reverse();
    }
    const list = chatMessages[view.id] ?? [];
    return [...list].reverse();
  }, [view, channelMessages, chatMessages]);

  const chatTitle = useMemo(() => {
    if (view.type === 'channel') return currentChannel?.name ?? 'Channel';
    if (!currentChat) return 'Chat';
    const names = currentChat.participantIds
      .filter((id) => id !== currentUserId)
      .map((id) => memberById.get(id)?.displayName ?? 'Unknown');
    return names.length ? names.join(', ') : 'Chat';
  }, [view, currentChannel, currentChat, currentUserId, memberById]);

  function handleSend() {
    const body = messageDraft.trim();
    if (!body || !chatData) return;

    if (view.type === 'channel') {
      const msg = addChannelMessage(activeWorkspaceId, view.id, {
        authorId: currentUserId,
        authorName: currentUserName,
        body,
        createdAt: new Date().toISOString(),
      });
      setChatData({
        ...chatData,
        channelMessages: {
          ...chatData.channelMessages,
          [view.id]: [msg, ...(chatData.channelMessages[view.id] ?? [])],
        },
      });
    } else {
      const msg = addChatMessage(activeWorkspaceId, view.id, {
        authorId: currentUserId,
        authorName: currentUserName,
        body,
        createdAt: new Date().toISOString(),
      });
      setChatData({
        ...chatData,
        chatMessages: {
          ...chatData.chatMessages,
          [view.id]: [msg, ...(chatData.chatMessages[view.id] ?? [])],
        },
      });
      // In a real app with real-time (WebSocket/polling), call showChatNotification
      // when a new message from another user arrives so the recipient gets a push.
    }
    setMessageDraft('');
  }

  function handleNewChannel() {
    const name = newChannelName.trim();
    if (!name || !chatData) return;
    const channel = createChannel(activeWorkspaceId, name);
    setChatData({
      ...chatData,
      channels: [...chatData.channels, channel],
      channelMessages: { ...chatData.channelMessages, [channel.id]: [] },
    });
    setNewChannelName('');
    setNewChannelOpen(false);
    setView({ type: 'channel', id: channel.id });
  }

  function handleNewChat(memberId: string) {
    const chat = getOrCreateChat(activeWorkspaceId, [currentUserId, memberId]);
    setChatData(loadChatData(activeWorkspaceId));
    setNewChatMemberId(null);
    setView({ type: 'chat', id: chat.id });
  }

  if (!data) return null;

  return (
    <div className={cn('flex h-[calc(100vh-8rem)] min-h-[400px] rounded-2xl border', dashboardTokens.border, dashboardTokens.surface)}>
      {/* Left: Channels + Chats */}
      <aside className={cn('flex w-64 shrink-0 flex-col border-r', dashboardTokens.border)}>
        <div className="border-b p-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Channels</h2>
          <div className="mt-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setNewChannelOpen(true)}
              aria-label="New channel"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-xs text-slate-500">New channel</span>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-0.5 p-2">
            {channels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setView({ type: 'channel', id: ch.id })}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  view.type === 'channel' && view.id === ch.id
                    ? 'bg-primary-100 font-medium text-primary-800 dark:bg-primary-900/30 dark:text-primary-200'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <Hash className="h-4 w-4 shrink-0" />
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Chats</h2>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-8 gap-2 px-2"
            onClick={() => setNewChatMemberId('')}
            aria-label="New chat"
          >
            <UserPlus className="h-4 w-4" />
            <span className="text-xs">New chat</span>
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-0.5 p-2">
            {chats.map((c) => {
              const otherId = c.participantIds.find((id) => id !== currentUserId);
              const label = otherId ? memberById.get(otherId)?.displayName ?? 'Unknown' : 'Chat';
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setView({ type: 'chat', id: c.id })}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    view.type === 'chat' && view.id === c.id
                      ? 'bg-primary-100 font-medium text-primary-800 dark:bg-primary-900/30 dark:text-primary-200'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </aside>

      {/* Right: Thread + composer */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className={cn('flex items-center justify-between border-b px-4 py-3', dashboardTokens.border)}>
          <div className="flex items-center gap-2">
            {view.type === 'channel' ? (
              <Hash className="h-5 w-5 text-slate-500" />
            ) : (
              <Users className="h-5 w-5 text-slate-500" />
            )}
            <h1 className="font-semibold">{chatTitle}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={async () => {
              const next = await requestAndStorePermission();
              setNotificationsEnabled(next);
            }}
            title={notificationsEnabled ? 'Notifications on' : 'Enable notifications'}
          >
            {notificationsEnabled ? (
              <Bell className="h-4 w-4 text-primary-600" />
            ) : (
              <BellOff className="h-4 w-4 text-slate-400" />
            )}
            <span className="text-xs">{notificationsEnabled ? 'On' : 'Off'}</span>
          </Button>
        </header>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className={cn('py-8 text-center text-sm', dashboardTokens.textMuted)}>
                No messages yet. Send one below.
              </p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {initials(m.authorName ?? '?')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">{m.authorName ?? 'Unknown'}</span>
                      <span className={cn('text-xs', dashboardTokens.textSubtle)}>
                        {formatTime(m.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm">{m.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className={cn('border-t p-4', dashboardTokens.border)}>
          <div className="flex gap-2">
            <Textarea
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message…"
              className={cn('min-h-10 flex-1 resize-none rounded-xl', dashboardTokens.focusRing)}
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!messageDraft.trim()}
              className="shrink-0 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* New channel dialog */}
      <Dialog open={newChannelOpen} onOpenChange={setNewChannelOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New channel</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <Input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Channel name"
              onKeyDown={(e) => e.key === 'Enter' && handleNewChannel()}
            />
            <Button onClick={handleNewChannel} disabled={!newChannelName.trim()}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New chat: pick member */}
      <Dialog open={newChatMemberId !== null} onOpenChange={(open) => !open && setNewChatMemberId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New chat</DialogTitle>
          </DialogHeader>
          <div className="max-h-64 space-y-1 overflow-auto py-2">
            {members
              .filter((m) => m.id !== currentUserId)
              .map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleNewChat(m.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                    dashboardTokens.border,
                    'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{initials(m.displayName)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{m.displayName}</span>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
