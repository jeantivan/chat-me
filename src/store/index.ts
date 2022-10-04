import { getContacts } from "./../utils/getContacts";
import { getChats } from "../utils/getChats";
import create from "zustand";
import { persist, devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { StoreSlice } from "./slices/interfaces";
import {
  createChatsSlice,
  createConfigSlice,
  createContactsSlice,
  createProfileSlice,
} from "./slices";

const useStore = create<StoreSlice>()(
  devtools(
    persist(
      immer((...a) => ({
        ...createConfigSlice(...a),
        ...createProfileSlice(...a),
        ...createContactsSlice(...a),
        ...createChatsSlice(...a),
      })),
      {
        name: "zustand-chat-me",
        partialize: (state) => ({
          config: state.config,
          profile: state.profile,
        }),
      }
    )
  )
);

export default useStore;
