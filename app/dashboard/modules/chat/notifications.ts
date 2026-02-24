/**
 * Browser notifications for Chat (and optionally Updates).
 * Requests permission and shows a notification when new messages arrive
 * (e.g. when the tab is in background). For full push when app is closed
 * you'd need a backend with Web Push (VAPID) and a service worker.
 */

const NOTIFICATION_PERMISSION_KEY = 'altvina.chat.notifications.enabled';

export function requestNotificationPermission(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  // Don't auto-request; let user click "Enable notifications" in Chat
  return false;
}

export function requestAndStorePermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      resolve(false);
      return;
    }
    if (Notification.permission === 'granted') {
      try {
        window.localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
      } catch {
        // ignore
      }
      resolve(true);
      return;
    }
    if (Notification.permission === 'denied') {
      resolve(false);
      return;
    }
    Notification.requestPermission().then((permission) => {
      const allowed = permission === 'granted';
      try {
        window.localStorage.setItem(NOTIFICATION_PERMISSION_KEY, allowed ? 'true' : 'false');
      } catch {
        // ignore
      }
      resolve(allowed);
    });
  });
}

export function showChatNotification(senderName: string, body: string, chatTitle: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (document.hasFocus()) return; // don't notify if user is on the tab

  try {
    const n = new Notification(`${senderName} in ${chatTitle}`, {
      body: body.slice(0, 100) + (body.length > 100 ? '…' : ''),
      icon: '/static/favicons/android-chrome-192x192.png',
      tag: `chat-${chatTitle}-${Date.now()}`,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // ignore
  }
}
