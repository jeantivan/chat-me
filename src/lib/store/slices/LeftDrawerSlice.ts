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
> = (set) => ({
  leftDrawer: null,
  leftDrawerGoTo: (to: LeftDrawerContentOptions) => {
    set((state) => {
      state.leftDrawer = to;
    });
  },
  closeLeftDrawer: () =>
    set((state) => {
      state.leftDrawer = null;
    }),
});
