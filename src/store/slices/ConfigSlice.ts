import { ConfigType } from "./../../types";
import { StateCreator } from "zustand";
import { ConfigSlice, StoreSlice } from "./interfaces";

const initialConfig: ConfigType = {
  notifications: {
    allNoti: false,
    sound: false,
    alerts: false,
    previewMsg: false,
    reactionsNoti: false,
  },
  privacy: {
    lastTimeOnline: "all",
    profilePicture: "contacts",
    info: "all",
    readConfirmation: true,
    tempMsg: "90d",
    groups: "all",
  },
  security: {
    showSecurityNoti: false,
  },
};

const notificationReducer = (
  state: { config: ConfigType },
  type: "ALL" | "SOUND" | "ALERTS" | "PREV_MSG" | "REACTIONS"
) => {
  switch (type) {
    case "ALL":
      state.config.notifications.allNoti = !state.config.notifications.allNoti;
      break;
    case "ALERTS":
      state.config.notifications.alerts = !state.config.notifications.alerts;
      break;
    case "SOUND":
      state.config.notifications.sound = !state.config.notifications.sound;
      break;
    case "PREV_MSG":
      state.config.notifications.previewMsg =
        !state.config.notifications.previewMsg;
      break;
    case "REACTIONS":
      state.config.notifications.reactionsNoti =
        !state.config.notifications.reactionsNoti;
      break;
    default:
      break;
  }
};

export const createConfigSlice: StateCreator<
  StoreSlice,
  [
    ["zustand/devtools", never],
    ["zustand/persist", unknown],
    ["zustand/immer", never]
  ],
  [],
  ConfigSlice
> = (set) => ({
  config: initialConfig,
  toggleNotifications: (type) =>
    set((state) => notificationReducer(state, type)),
  toggleSecurityNoti: () =>
    set((state) => {
      state.config.security.showSecurityNoti =
        !state.config.security.showSecurityNoti;
    }),
});
