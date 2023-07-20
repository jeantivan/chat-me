import { StateCreator } from "zustand";
import { ProfileSlice, StoreSlice } from "./interfaces";
import { TProfile } from "@/lib/types";

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
    preview: true,
    reactions: true,
  },
  // TPrivacy
  privacy: {
    lastTimeOnline: "all",
    picture: "all",
    bio: "all",
    groups: "contacts",
    readConfirmation: true,
  },
  // TTheme
  theme: {
    options: "dark",
    mode: "dark",
    color: "emerald",
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
  toggleNotifications() {},
});
