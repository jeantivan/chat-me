import { Dispatch, SetStateAction } from "react";

export type UserType = {
  id: string;
  name: string;
  status: string;
  phone: string;
  picture: {
    large: string;
    medium: string;
    thumbnail: string;
  };
};

type NotificationsConfig = {
  allNoti: boolean;
  sound: boolean;
  alerts: boolean;
  previewMsg: boolean;
  reactionsNoti: boolean;
};

type PrivacyConfig = {
  lastTimeOnline: "all" | "contacts" | "none";
  profilePicture: "all" | "contacts" | "none";
  info: "all" | "contacts" | "none";
  readConfirmation: boolean;
  tempMsg: "deactivated" | "24h" | "7d" | "90d";
  groups: "all" | "contacts";
};

type SecurityConfig = {
  showSecurityNoti: boolean;
};

export type ConfigType = {
  notifications: NotificationsConfig;
  privacy: PrivacyConfig;
  security: SecurityConfig;
};

export type ContactType = {
  name: { title: string; first: string; last: string; fullName: string };
  phone: string;
  picture: {
    large: string;
    medium: string;
    thumbnail: string;
  };
};

export type ChatType = {
  id: string;
  contact: UserType;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  isOpenChat: boolean;
  hasUnreadMsg: boolean;
  shouldLoadOldMsg: boolean;
  messages: MessageType[];
};

export type MessageType = {
  id: string;
  isOwnMsg: boolean;
  isFavMsg: boolean;
  status: "idle" | "send" | "received" | "read";
  message: {
    type: "audio" | "video" | "image" | "text";
    content: string | number;
    orientation?: "squarish" | "landscape" | "portrait";
  };
  time: string;
  reactions: ReactionType[] | [];
};

export type ReactionType = {
  reaction: {
    isOwnReaction: boolean;
    type: ReactionListType;
  };
};
export type ReactionListType =
  | "thumbs-up"
  | "heart"
  | "face-with-tears-of-joy"
  | "face-with-open-mouth"
  | "crying-face"
  | "folded-hands";

export type SelectedChatState = {
  selectedChat: ContactType | null;
  setSelectedChat: Dispatch<SetStateAction<ContactType | null>>;
};

export type ShortCut = {
  slug: string;
  title: string;
  keys: string[];
};

export type ConfigurationOptionsType =
  | "PROFILE"
  | "NOTIFICATIONS"
  | "PRIVACY"
  | "SECURITY"
  | "THEME"
  | "BACKGROUND"
  | "SOL_INFO"
  | "HELP"
  | "OPTIONS"
  | "SHORTCUTS";
