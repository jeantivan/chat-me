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
> = (set) => ({
  rightDrawer: null,
  rightDrawerGoTo: (to: RightDrawerContentOptions) => {
    set((state) => {
      state.rightDrawer = to;
    });
  },
  closeRightDrawer: () =>
    set((state) => {
      state.rightDrawer = null;
    }),
});
