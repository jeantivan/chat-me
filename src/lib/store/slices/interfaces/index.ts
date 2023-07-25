import {
  TChat,
  TMessage,
  TProfile,
  TReaction,
  LeftDrawerContentOptions,
  RightDrawerContentOptions,
  TNotifications,
} from "@/lib/types";

// Interface de perfil
export interface ProfileSlice extends TProfile, ConfigSlice {
  changeName: (name: string) => void;
  changeBio: (bio: string) => void;
  changePicture: (picture: string) => void;
}

// Interface para la configuración
export interface ConfigSlice {
  toggleNotifications: (type: keyof TNotifications) => void;
}

// Interface del Id del Chat actual
export interface CurrentChatIdSlice {
  currentChatId?: string;
  setCurrentChatId: (chatId: string) => void;
  closeChat: () => void;
}

// Interface para el Chat
export interface ChatSlice {
  chats: TChat[];
  pinChat: (chatId: string) => void;
  muteChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  archiveChat: (chatId: string) => void;
}

// Interface para las acciones de los mensajes
export interface MessageSlice {
  addMessage: (message: TMessage) => void;
  deleteMessage: (message: TMessage) => void;
  starMessage: (message: TMessage) => void;
  addReaction: (message: TMessage, reaction: TReaction) => void;
  changeReaction: (message: TMessage, reaction: TReaction) => void;
  deleteReaction: (message: TMessage) => void;
}

export interface LeftDrawerSlice {
  leftDrawer: LeftDrawerContentOptions | null;
  leftDrawerGoTo: (to: LeftDrawerContentOptions) => void;
  closeLeftDrawer: () => void;
}
export interface RightDrawerSlice {
  rightDrawer: RightDrawerContentOptions | null;
  rightDrawerGoTo: (to: RightDrawerContentOptions) => void;
  closeRightDrawer: () => void;
}

export interface LoadingSlice {
  loading: "idle" | "contacts" | "chats" | "messages" | "ready";
  prepareApp: Awaited<() => void>;
}
export interface StoreSlice
  extends ProfileSlice,
    CurrentChatIdSlice,
    ChatSlice,
    MessageSlice,
    LeftDrawerSlice,
    RightDrawerSlice,
    LoadingSlice {}
