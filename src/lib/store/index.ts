import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { StoreSlice } from "./slices/interfaces";
import {
  createChatsSlice,
  createContactsSlice,
  createProfileSlice,
  createCurrentChatIdSlice,
  createChatSlice,
  createMessageSlice,
  createLeftDrawerSlice,
  createRightDrawerSlice,
} from "./slices";

const useStore = create<StoreSlice>()(
  devtools(
    persist(
      immer((...a) => ({
        ...createProfileSlice(...a),
        ...createContactsSlice(...a),
        ...createChatsSlice(...a),
        ...createCurrentChatIdSlice(...a),
        ...createChatSlice(...a),
        ...createMessageSlice(...a),
        ...createLeftDrawerSlice(...a),
        ...createRightDrawerSlice(...a),
      })),
      {
        name: "zustand-chat-me",
        partialize: (state) => ({
          user: state.user,
          theme: state.theme,
          notifications: state.notifications,
          privacy: state.privacy,
        }),
      }
    )
  )
);

export default useStore;
