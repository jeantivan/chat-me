import create from "zustand";
import { ConfigType, UserType, ChatType } from "../types";
import { initialConfig, initialProfile } from "./state";

interface Store {
  profile: UserType;
  config: ConfigType;
  contacts: UserType[];
  chats: ChatType[];
}

const useStore = create<Store>((set) => ({
  profile: initialProfile,
  config: initialConfig,
  contacts: [],
  chats: [],
}));

export default useStore;
