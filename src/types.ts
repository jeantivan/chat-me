import { Dispatch, SetStateAction } from "react";

export type UserType = {
  name: string;
  status: string;
  picture: string;
};

export type ContactType = {
  name: { title: string; first: string; last: string; fullName: string };
  phone: string;
  picture: {
    large: string;
    medium: string;
    thumbnail: string;
  };
  lastMessage: MessageType;
};

export type MessageType = {
  id: string;
  isOwnMsg: boolean;
  isFavMsg: number;
  status: "send" | "received" | "read";
  message: {
    type: "audio" | "video" | "image" | "text";
    content: string | number;
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
