import { ConfigType, UserType, ChatType } from "./../../../types";

export interface ContactsSlice {
  contacts: UserType[];
}
export interface ChatsSlice {
  chats: ChatType[];
}

export interface ProfileSlice {
  profile: UserType;
  changeName: (name: string) => void;
  changeStatus: (status: string) => void;
  changePicture: (picture: string) => void;
}

export interface ConfigSlice {
  config: ConfigType;
  toggleNotifications: (
    type: "ALL" | "SOUND" | "PREV_MSG" | "REACTIONS"
  ) => void;
  toggleSecurityNoti: () => void;
}

export interface StoreSlice
  extends ContactsSlice,
    ChatsSlice,
    ConfigSlice,
    ProfileSlice {}
