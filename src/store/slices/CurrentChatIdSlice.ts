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
      state.currentChatId = chatId;
    }),
  closeChat: () =>
    set((state) => {
      state.currentChatId = undefined;
    }),
});
