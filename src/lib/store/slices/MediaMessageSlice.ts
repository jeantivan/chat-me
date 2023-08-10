import { StateCreator } from "zustand";
import { MediaMessageSlice, StoreSlice } from "./interfaces";

export const createMediaMessageSlice: StateCreator<
  StoreSlice,
  [
    ["zustand/devtools", never],
    ["zustand/persist", unknown],
    ["zustand/immer", never]
  ],
  [],
  MediaMessageSlice
> = (set) => ({
  mediaMessage: null,
  openMediaMessage: (message) => {
    set((state) => {
      state.mediaMessage = message;
    });
  },
  closeMediaMessage: () =>
    set((state) => {
      state.mediaMessage = null;
    }),
});
