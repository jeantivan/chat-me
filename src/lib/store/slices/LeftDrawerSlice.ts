import { StateCreator } from "zustand";
import { LeftDrawerSlice, StoreSlice } from "./interfaces";
import { LeftDrawerContentOptions } from "@/lib/types";

export const createLeftDrawerSlice: StateCreator<
  StoreSlice,
  [
    ["zustand/devtools", never],
    ["zustand/persist", unknown],
    ["zustand/immer", never]
  ],
  [],
  LeftDrawerSlice
> = (set, get) => ({
  leftDrawer: null,
  ldHistory: [],
  leftDrawerGoTo: (to: LeftDrawerContentOptions) => {
    set((state) => {
      state.leftDrawer = to;
      state.ldHistory.push(to);
    });
  },
  closeLeftDrawer: () =>
    set((state) => {
      state.leftDrawer = null;
      state.ldHistory = [];
    }),
  ldGoBack: () => {
    if (get().ldHistory.length === 1) {
      set((state) => {
        state.ldHistory = [];
        state.leftDrawer = null;
      });
    } else {
      set((state) => {
        state.leftDrawer = get().ldHistory.at(-2) || null;
        state.ldHistory.pop();
      });
    }
  },
});
