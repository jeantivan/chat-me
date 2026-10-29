import { create } from "zustand";
import type { MessagePayload } from "@chat-me/shared";

export interface InAppAlert {
  id: string;
  title: string;
  body: string;
  chatId: string;
  createdAt: number;
}

interface InAppAlertStore {
  alerts: InAppAlert[];
  addAlert: (alert: Omit<InAppAlert, "id" | "createdAt">) => void;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
}

export const useInAppAlertStore = create<InAppAlertStore>((set) => ({
  alerts: [],
  addAlert: (alert) =>
    set((state) => ({
      alerts: [
        ...state.alerts,
        {
          ...alert,
          id: Math.random().toString(36).substring(2, 9),
          createdAt: Date.now(),
        },
      ],
    })),
  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),
  clearAlerts: () => set({ alerts: [] }),
}));

export function playNotificationSound(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Unsupported or blocked in environment
  }
}

export function isChatActivelyFocused(
  chatId: string,
  currentChatId?: string | null
): boolean {
  if (currentChatId !== chatId) return false;
  if (typeof document === "undefined") return true;
  if (document.visibilityState !== "visible") return false;
  if (typeof document.hasFocus === "function" && !document.hasFocus()) return false;
  return true;
}

export function triggerNotificationAlert(payload: {
  title: string;
  body: string;
  chatId: string;
}): void {
  // 1. Browser Notification
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      new Notification(payload.title, {
        body: payload.body,
      });
    } catch {
      // Ignore notification creation errors
    }
  }

  // 2. In-app Alert
  useInAppAlertStore.getState().addAlert(payload);
}

export interface InboundMessageNotificationParams {
  message: MessagePayload;
  currentUserId?: string;
  currentChatId?: string | null;
  isChatMuted?: boolean;
  settings: {
    notifyAll: boolean;
    notifySound: boolean;
    notifyPreview: boolean;
  };
}

export function handleInboundMessageNotification({
  message,
  currentUserId,
  currentChatId,
  isChatMuted = false,
  settings,
}: InboundMessageNotificationParams): void {
  if (!settings.notifyAll) return;
  if (isChatMuted) return;
  if (currentUserId && message.owner === currentUserId) return;

  if (settings.notifySound) {
    playNotificationSound();
  }

  if (!isChatActivelyFocused(message.chatId, currentChatId)) {
    const body = settings.notifyPreview
      ? message.body || "New message"
      : "New message";

    triggerNotificationAlert({
      title: "New message",
      body,
      chatId: message.chatId,
    });
  }
}

export interface InboundReactionNotificationParams {
  chatId: string;
  messageId: string;
  reactions: Array<{ owner: string; type: string }>;
  targetMessageOwnerId?: string;
  targetMessageBody?: string;
  currentUserId?: string;
  currentChatId?: string | null;
  isChatMuted?: boolean;
  settings: {
    notifyAll: boolean;
    notifySound: boolean;
    notifyPreview: boolean;
    notifyReactions: boolean;
  };
}

export function handleInboundReactionNotification({
  chatId,
  reactions,
  targetMessageOwnerId,
  targetMessageBody,
  currentUserId,
  currentChatId,
  isChatMuted = false,
  settings,
}: InboundReactionNotificationParams): void {
  if (!settings.notifyAll) return;
  if (!settings.notifyReactions) return;
  if (isChatMuted) return;

  // Must be on the current user's message
  if (targetMessageOwnerId && targetMessageOwnerId !== currentUserId) {
    return;
  }

  // Must have an incoming reaction from another user
  const hasInboundReaction = reactions.some(
    (r) => !currentUserId || r.owner !== currentUserId
  );
  if (!hasInboundReaction) return;

  if (settings.notifySound) {
    playNotificationSound();
  }

  if (!isChatActivelyFocused(chatId, currentChatId)) {
    const body = settings.notifyPreview
      ? targetMessageBody || "New message"
      : "New message";

    triggerNotificationAlert({
      title: "New reaction",
      body,
      chatId,
    });
  }
}
