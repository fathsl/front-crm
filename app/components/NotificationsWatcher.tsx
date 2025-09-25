import React, { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { userAtom } from '~/utils/userAtom';
import { useMessageToast } from '~/components/ToastNotificationSystem';

const NotificationsWatcher: React.FC = () => {
  const currentUser = useAtomValue(userAtom) as any;
  const { showToastForMessage } = useMessageToast(currentUser);
  const baseUrl = 'https://api-crm-tegd.onrender.com';
  const notifiedThisSession = useRef<Set<number>>(new Set());
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!currentUser?.userId) return;

    let cancelled = false;
    const controller = new AbortController();
    controllerRef.current = controller;

    const tick = async () => {
      if (cancelled) return;
      try {
        const resp = await fetch(`${baseUrl}/api/Chat/discussions/${currentUser.userId}`, { signal: controller.signal });
        if (!resp.ok) return;
        const discussions: Array<{ id: number }> = await resp.json();
        const unique = Array.isArray(discussions)
          ? discussions.filter((d, i, self) => i === self.findIndex(x => x.id === d.id))
          : [];

        const slice = unique.slice(0, 12);
        for (const d of slice) {
          if (cancelled) break;
          try {
            const mResp = await fetch(`${baseUrl}/api/Chat/discussions/${d.id}/messages?userId=${currentUser.userId}`, { signal: controller.signal });
            if (!mResp.ok) continue;
            const payload = await mResp.json();
            const messages = Array.isArray(payload?.messages) ? payload.messages : [];
            for (const msg of messages) {
              if (!msg || typeof msg.id !== 'number') continue;
              if (notifiedThisSession.current.has(msg.id)) continue;
              if (msg.receiverId === currentUser.userId && msg.isSeen === false) {
                const senderName = msg.senderName || 'New message';
                showToastForMessage(msg, senderName);
                notifiedThisSession.current.add(msg.id);
              }
            }
          } catch {
          }
        }
      } catch {
      }
    };

    const interval = setInterval(tick, 5000);
    const init = setTimeout(tick, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(init);
      controller.abort();
    };
  }, [currentUser?.userId]);

  return null;
};

export default NotificationsWatcher;
