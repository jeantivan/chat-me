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
> = (set, get) => ({
  currentChatId: undefined,
  setCurrentChatId: (chatId) => {
    set((state) => {
      state.currentChatId = chatId;
    });
    get().resetInChatSearch();
  },
  closeChat: () => {
    set((state) => {
      state.rightDrawer = null;
      state.currentChatId = undefined;
    });
    get().resetInChatSearch();
  },
});
