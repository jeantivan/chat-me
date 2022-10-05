import { getRestMsg } from "./../../utils/getRestMsg";
import { StateCreator } from "zustand";
import { ChatSlice, StoreSlice } from "./interfaces";

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
    const indexOfChat = get().chats.findIndex((chat) => (chat.id = chatId));

    if (indexOfChat !== undefined) {
      set((state) => {
        state.chats[indexOfChat].isPinned = !state.chats[indexOfChat].isPinned;
      });
    }
  },

  muteChat: (chatId) => {
    // Encuentra el index del chat en el array de chats
    const indexOfChat = get().chats.findIndex((chat) => (chat.id = chatId));

    if (indexOfChat !== undefined) {
      set((state) => {
        state.chats[indexOfChat].isMuted = !state.chats[indexOfChat].isMuted;
      });
    }
  },
  // TODO: Implementar métodos
});
