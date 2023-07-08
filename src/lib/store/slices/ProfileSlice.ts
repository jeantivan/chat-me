import { UserType } from "./../../types";
import { StateCreator } from "zustand";
import { ProfileSlice, StoreSlice } from "./interfaces";

const initialProfile: UserType = {
  id: "348441f8-c083-4cd1-9af3-59ca8cab0917",
  name: "Jane Doe",
  status: "Hola estoy usando ChatMe!",
  phone: "000 000 0000",
  picture: {
    thumbnail: "",
    medium: "",
    large: "",
  },
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
  profile: initialProfile,
  changeName: (name: string) =>
    set((state) => {
      state.profile.name = name;
    }),
  changeStatus: (status: string) =>
    set((state) => {
      state.profile.status = status;
    }),
  changePicture: (picture: string) =>
    set((state) => {
      state.profile.picture = {
        large: picture,
        medium: picture,
        thumbnail: picture,
      };
    }),
});
