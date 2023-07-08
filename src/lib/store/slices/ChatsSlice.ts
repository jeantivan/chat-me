import { StateCreator } from "zustand";
import { ChatsSlice, StoreSlice } from "./interfaces";
import { getChats } from "@/lib/utils/getChats";

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
  chats: getChats(),
});
