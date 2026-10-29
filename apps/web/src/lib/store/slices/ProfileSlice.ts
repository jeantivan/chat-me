import { StateCreator } from "zustand";
import { ProfileSlice, StoreSlice } from "./interfaces/index.js";
import { TProfile } from "@/lib/types.js";
import { sysModePref } from "@/lib/utils/sysModePref.js";

const initialProfileState: TProfile = {
  // TUser values
  user: {
    id: "348441f8-c083-4cd1-9af3-59ca8cab0917",
    name: "Jane Doe",
    bio: "Hola estoy usando ChatMe!",
    phone: "000 000 0000",
    picture: "",
  },
  // TNotifications
  notifications: {
    all: true,
    sound: true,
    preview: false,
    reactions: true,
  },
  // TPrivacy
  privacy: {
    lastTimeOnline: "all",
    picture: "all",
    bio: "all",
    groups: "contacts",
    readReceipt: true,
  },
  // TTheme
  theme: {
    mode: sysModePref(),
    colors: "slate-indigo",
  },
  contacts: [],
};

export const createProfileSlice: StateCreator<
  StoreSlice,
  [
    ["zustand/devtools", never],
    ["zustand/persist", unknown],
    ["zustand/immer", never]
  ],
  [],
  ProfileSlice
> = (set) => ({
  ...initialProfileState,
  changeName: (name) =>
    set((state) => {
      state.user.name = name;
    }),
  changeBio: (bio) =>
    set((state) => {
      state.user.bio = bio;
    }),
  changePicture: (picture) =>
    set((state) => {
      state.user.picture = picture;
    }),
  toggleNotifications: (type) => {
    set((state) => {
      state.notifications[type] = !state.notifications[type];
    });
  },
  setNotification: (type, value) => {
    set((state) => {
      state.notifications[type] = value;
    });
  },
  changeThemeColors: (colors) => {
    set((state) => {
      state.theme.colors = colors;
    });
  },
  changeThemeMode: (mode) => {
    set((state) => {
      state.theme.mode = mode;
    });
  },
  setUserProfile: (userData, settingsData) => {
    set((state) => {
      if (userData.id) state.user.id = userData.id;
      if (userData.name) state.user.name = userData.name;
      if (userData.bio !== undefined) state.user.bio = userData.bio;
      if (userData.picture !== undefined) state.user.picture = userData.picture;
      if (userData.phone !== undefined) state.user.phone = userData.phone;
      if (settingsData) {
        if (settingsData.themeMode) {
          state.theme.mode = settingsData.themeMode as TProfile["theme"]["mode"];
        }
        if (settingsData.themeColor) {
          state.theme.colors = settingsData.themeColor as TProfile["theme"]["colors"];
        }
        if (settingsData.notifyAll !== undefined) {
          state.notifications.all = settingsData.notifyAll;
        }
        if (settingsData.notifySound !== undefined) {
          state.notifications.sound = settingsData.notifySound;
        }
        if (settingsData.notifyPreview !== undefined) {
          state.notifications.preview = settingsData.notifyPreview;
        }
        if (settingsData.notifyReactions !== undefined) {
          state.notifications.reactions = settingsData.notifyReactions;
        }
        if (settingsData.privacyLastSeen !== undefined) {
          state.privacy.lastTimeOnline = settingsData.privacyLastSeen;
        }
        if (settingsData.privacyPicture !== undefined) {
          state.privacy.picture = settingsData.privacyPicture;
        }
        if (settingsData.privacyBio !== undefined) {
          state.privacy.bio = settingsData.privacyBio;
        }
        if (settingsData.privacyGroups !== undefined) {
          state.privacy.groups = settingsData.privacyGroups;
        }
        if (settingsData.privacyReadReceipt !== undefined) {
          state.privacy.readReceipt = settingsData.privacyReadReceipt;
        }
      }
    });
  },
  resetUserProfile: () => {
    set((state) => {
      state.user = { ...initialProfileState.user };
      state.notifications = { ...initialProfileState.notifications };
      state.privacy = { ...initialProfileState.privacy };
      state.theme = { ...initialProfileState.theme };
      state.contacts = [];
    });
  },
});
