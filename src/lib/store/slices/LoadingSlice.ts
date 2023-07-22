import { StateCreator } from "zustand";
import { LoadingSlice, StoreSlice } from "./interfaces";
import { getContacts } from "@/lib/utils/getContacts";
import { getChats } from "@/lib/utils/getChats";

export const createLoadingSlice: StateCreator<
  StoreSlice,
  [
    ["zustand/devtools", never],
    ["zustand/persist", unknown],
    ["zustand/immer", never]
  ],
  [],
  LoadingSlice
> = (set, get) => ({
  loading: "idle",
  prepareApp: async () => {
    if (get().loading === "ready") return;

    set((state) => {
      state.loading = "contacts";
    });

    const contacts = await getContacts();

    set((state) => {
      state.contacts = contacts;
      state.loading = "chats";
    });

    set((state) => {
      state.chats = getChats(state.contacts);

      state.loading = "messages";
    });

    set((state) => {
      state.loading = "ready";
    });
  },
});
