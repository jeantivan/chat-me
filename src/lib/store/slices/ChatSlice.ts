import { StateCreator } from "zustand";
import { ChatSlice, StoreSlice } from "./interfaces";
import { getRestMsg } from "@/lib/utils/getRestMsg";

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
  getAllMessages: () => {
    const indexOfCurrentChat = get().chats.findIndex(
      (chat) => chat.id === get().currentChatId
    );
    setTimeout(() => {
      set((state) => {
        if (state.chats[indexOfCurrentChat].shouldLoadOldMsg) {
          const restMessages = getRestMsg();
          state.chats[indexOfCurrentChat].messages.unshift(...restMessages);
          state.chats[indexOfCurrentChat].shouldLoadOldMsg = false;
        }
      });
    }, 1000);
  },
  pinChat: (chatId) => {
    // Encuentra el index del chat en el array de chats
    const indexOfChat = get().chats.findIndex((chat) => chat.id === chatId);

    if (indexOfChat !== undefined) {
      set((state) => {
        state.chats[indexOfChat].isPinned = !state.chats[indexOfChat].isPinned;
      });
    }
  },
  muteChat: (chatId) => {
    // Encuentra el index del chat en el array de chats
    const indexOfChat = get().chats.findIndex((chat) => chat.id === chatId);

    if (indexOfChat !== undefined) {
      set((state) => {
        state.chats[indexOfChat].isMuted = !state.chats[indexOfChat].isMuted;
      });
    }
  },
  closeChat: () => {
    set((state) => {
      const indexOfChat = state.chats.findIndex(
        (chat) => chat.id === state.currentChatId
      );

      if (indexOfChat >= 0) {
        state.chats[indexOfChat].isOpenChat = false;
        state.currentChatId = undefined;
      }
    });
  },
  deleteChat: (chatId: string) => {
    const chatIndex = get().chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex !== undefined) {
      set((state) => {
        state.chats.splice(chatIndex, 1);
      });
    }
  },
  archiveChat: (chatId: string) => {
    // Encuentra el index del chat en el array de chats
    const indexOfChat = get().chats.findIndex((chat) => chat.id === chatId);

    if (indexOfChat !== undefined) {
      set((state) => {
        state.chats[indexOfChat].isArchived =
          !state.chats[indexOfChat].isArchived;
      });
    }
  },
});
