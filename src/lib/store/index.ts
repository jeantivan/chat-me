import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { StoreSlice } from "./slices/interfaces";
import {
  createChatsSlice,
  createConfigSlice,
  createContactsSlice,
  createProfileSlice,
  createCurrentChatIdSlice,
  createChatSlice,
  createMessageSlice,
  createLeftDrawerSlice,
} from "./slices";

const useStore = create<StoreSlice>()(
  devtools(
    persist(
      immer((...a) => ({
        ...createConfigSlice(...a),
        ...createProfileSlice(...a),
        ...createContactsSlice(...a),
        ...createChatsSlice(...a),
        ...createCurrentChatIdSlice(...a),
        ...createChatSlice(...a),
        ...createMessageSlice(...a),
        ...createLeftDrawerSlice(...a),
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
