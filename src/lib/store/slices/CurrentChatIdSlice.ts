import { StateCreator } from "zustand";
import { CurrentChatIdSlice, StoreSlice } from "./interfaces";

export const createCurrentChatIdSlice: StateCreator<
  StoreSlice,
  [
    ["zustand/devtools", never],
    ["zustand/persist", unknown],
    ["zustand/immer", never]
  ],
  [],
  CurrentChatIdSlice
> = (set) => ({
  currentChatId: undefined,
  setCurrentChatId: (chatId) =>
    set((state) => {
      state.chats = state.chats.map((chat) =>
        chat.id === chatId
          ? { ...chat, isOpenChat: true }
          : { ...chat, isOpenChat: false }
      );

      state.currentChatId = chatId;
    }),
  closeChat: () =>
    set((state) => {
      state.chats = state.chats.map((chat) => ({ ...chat, isOpenChat: false }));
      state.currentChatId = undefined;
    }),
});
