import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { StoreSlice } from "./slices/interfaces";
import {
  createProfileSlice,
  createCurrentChatIdSlice,
  createLeftDrawerSlice,
  createRightDrawerSlice,
  createMediaMessageSlice,
  createSearchSlice,
} from "./slices";

const useStore = create<StoreSlice>()(
  devtools(
    persist(
      immer((...a) => ({
        ...createProfileSlice(...a),
        ...createCurrentChatIdSlice(...a),
        ...createMediaMessageSlice(...a),
        ...createLeftDrawerSlice(...a),
        ...createRightDrawerSlice(...a),
        ...createSearchSlice(...a),
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
