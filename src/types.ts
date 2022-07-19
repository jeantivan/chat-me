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
  status: "send" | "received" | "read";
  message: {
    type: "audio" | "video" | "image" | "text";
    content: string;
  };
  time: string;
  reactions: Array<ReactionType> | null;
};

export type ReactionType = {
  emoji: string;
  title: string;
};

export type SelectedChatState = {
  selectedChat: ContactType;
  setSelectedChat: Dispatch<SetStateAction<ContactType | null>>;
};

export type ShortCut = {
  slug: string;
  title: string;
  keys: string[];
};
