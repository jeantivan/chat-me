import { StateCreator } from "zustand";
import { SearchSlice, StoreSlice } from "./interfaces";

export const createSearchSlice: StateCreator<
  StoreSlice,
  [
    ["zustand/devtools", never],
    ["zustand/persist", unknown],
    ["zustand/immer", never]
  ],
  [],
  SearchSlice
> = (set) => ({
  chatSearchFilter: "",
  setChatSearchFilter: (query) =>
    set((state) => {
      state.chatSearchFilter = query;
    }),
  clearChatSearchFilter: () =>
    set((state) => {
      state.chatSearchFilter = "";
    }),
  inChatSearchQuery: "",
  isInChatSearchOpen: false,
  setInChatSearchQuery: (query) =>
    set((state) => {
      state.inChatSearchQuery = query;
    }),
  clearInChatSearchQuery: () =>
    set((state) => {
      state.inChatSearchQuery = "";
    }),
  resetInChatSearch: () =>
    set((state) => {
      state.isInChatSearchOpen = false;
      state.inChatSearchQuery = "";
    }),
  toggleInChatSearch: (open) =>
    set((state) => {
      state.isInChatSearchOpen =
        open !== undefined ? open : !state.isInChatSearchOpen;
      if (!state.isInChatSearchOpen) {
        state.inChatSearchQuery = "";
      }
    }),
});
