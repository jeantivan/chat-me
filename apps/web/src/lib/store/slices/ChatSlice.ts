import { StateCreator } from "zustand";
import { ChatSlice, StoreSlice } from "./interfaces";

/**
 * @deprecated Legacy prototype slice. Server entities belong strictly in TanStack Query (ADR 0003).
 * Do NOT read `state.chats` in UI components or add new server collections here.
 * Use TanStack Query hooks (`useChats`, `useUpdateChatParticipant`, `useDeleteChat`, `useClearChat`).
 */
export const createChatSlice: StateCreator<
  StoreSlice,
  [
    ["zustand/devtools", never],
    ["zustand/persist", unknown],
    ["zustand/immer", never]
  ],
  [],
  ChatSlice
> = (set, get) => ({
  chats: [],
  pinChat: (chatId) => {
    // Encuentra el index del chat en el array de chats
    const chatIndex = get().chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex < 0) return;

    set((state) => {
      state.chats[chatIndex].pinned = !state.chats[chatIndex].pinned;
    });
  },
  muteChat: (chatId) => {
    // Encuentra el index del chat en el array de chats
    const chatIndex = get().chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex < 0) return;

    set((state) => {
      state.chats[chatIndex].muted = !state.chats[chatIndex].muted;
    });
  },

  deleteChat: (chatId: string) => {
    const chatIndex = get().chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex < 0) return;

    set((state) => {
      if (chatId === get().currentChatId) {
        state.currentChatId = undefined;
      }
      state.rightDrawer = null;
      state.chats[chatIndex].messages = [];
    });
  },
  archiveChat: (chatId: string) => {
    // Encuentra el index del chat en el array de chats
    const chatIndex = get().chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex < 0) return;

    set((state) => {
      if (chatId === state.currentChatId) {
        state.currentChatId = undefined;
      }
      state.chats[chatIndex].pinned = false;
      state.chats[chatIndex].archived = !state.chats[chatIndex].archived;
    });
  },
});
