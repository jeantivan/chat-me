import { UserType, ConfigType } from "../types";
export const initialProfile: UserType = {
  name: "",
  status: "",
  phone: "",
  picture: {
    thumbnail: "",
    medium: "",
    large: "",
  },
};

export const initialConfig: ConfigType = {
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
