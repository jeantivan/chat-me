import { StateCreator } from "zustand";
import { RightDrawerSlice, StoreSlice } from "./interfaces";
import { RightDrawerContentOptions } from "@/lib/types";

export const createRightDrawerSlice: StateCreator<
  StoreSlice,
  [
    ["zustand/devtools", never],
    ["zustand/persist", unknown],
    ["zustand/immer", never]
  ],
  [],
  RightDrawerSlice
> = (set, get) => ({
  rightDrawer: null,
  rdHistory: [],
  rightDrawerGoTo: (to: RightDrawerContentOptions) => {
    set((state) => {
      state.rightDrawer = to;
      state.rdHistory.push(to);
    });
  },
  closeRightDrawer: () =>
    set((state) => {
      state.rightDrawer = null;
      state.rdHistory = [];
    }),
  rdGoBack: () => {
    if (get().rdHistory.length === 1) {
      set((state) => {
        state.rdHistory = [];
        state.rightDrawer = null;
      });
    } else {
      set((state) => {
        state.rightDrawer = get().rdHistory.at(-2) || null;
        state.rdHistory.pop();
      });
    }
  },
});
