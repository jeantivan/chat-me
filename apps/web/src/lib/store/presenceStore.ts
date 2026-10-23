import { create } from "zustand";

interface PresenceData {
  status: "online" | "offline";
  lastSeenAt?: string;
}

interface PresenceState {
  typingByChat: Record<string, boolean>;
  presenceByUser: Record<string, PresenceData>;
  setTyping: (chatId: string, isTyping: boolean) => void;
  setPresence: (userId: string, presence: PresenceData) => void;
  reset: () => void;
}

const typingTimers: Record<string, NodeJS.Timeout> = {};

export const usePresenceStore = create<PresenceState>((set) => ({
  typingByChat: {},
  presenceByUser: {},
  setTyping: (chatId: string, isTyping: boolean) => {
    if (typingTimers[chatId]) {
      clearTimeout(typingTimers[chatId]);
      delete typingTimers[chatId];
    }

    if (isTyping) {
      set((state) => ({
        typingByChat: { ...state.typingByChat, [chatId]: true },
      }));

      // Inactivity timeout: clear after 3 seconds
      typingTimers[chatId] = setTimeout(() => {
        set((state) => ({
          typingByChat: { ...state.typingByChat, [chatId]: false },
        }));
        delete typingTimers[chatId];
      }, 3000);
    } else {
      set((state) => ({
        typingByChat: { ...state.typingByChat, [chatId]: false },
      }));
    }
  },
  setPresence: (userId: string, presence: PresenceData) => {
    set((state) => ({
      presenceByUser: {
        ...state.presenceByUser,
        [userId]: presence,
      },
    }));
  },
  reset: () => {
    Object.values(typingTimers).forEach((t) => clearTimeout(t));
    for (const key of Object.keys(typingTimers)) {
      delete typingTimers[key];
    }
    set({ typingByChat: {}, presenceByUser: {} });
  },
}));
