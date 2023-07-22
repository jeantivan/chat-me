import { StateCreator } from "zustand";
import { ChatsSlice, StoreSlice } from "./interfaces";

export const createChatsSlice: StateCreator<
  StoreSlice,
  [
    ["zustand/devtools", never],
    ["zustand/persist", unknown],
    ["zustand/immer", never]
  ],
  [],
  ChatsSlice
> = () => ({
  chats: [],
});
