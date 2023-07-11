import {
  ConfigType,
  UserType,
  ChatType,
  MessageType,
  ReactionListType,
  LeftDrawerContentOptions,
} from "@/lib/types";

// Interface para todos los Contactos
export interface ContactsSlice {
  contacts: UserType[];
}

// Interface para todos los Chats
export interface ChatsSlice {
  chats: ChatType[];
}

// Interface de perfil
export interface ProfileSlice {
  profile: UserType;
  changeName: (name: string) => void;
  changeStatus: (status: string) => void;
  changePicture: (picture: string) => void;
}

// Interface para la configuración
export interface ConfigSlice {
  config: ConfigType;
  toggleNotifications: (
    type: "ALL" | "SOUND" | "PREV_MSG" | "REACTIONS"
  ) => void;
  toggleSecurityNoti: () => void;
}

// Interface del Id del Chat actual
export interface CurrentChatIdSlice {
  currentChatId?: string;
  setCurrentChatId: (chatId: string) => void;
  closeChat: () => void;
}

// Interface para el Chat
export interface ChatSlice {
  pinChat: (chatId: string) => void;
  muteChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  archiveChat: (chatId: string) => void;
  getAllMessages: () => void;
}

// Interface para las acciones de los mensajes
export interface MessageSlice {
  addMessage: (message: MessageType, chatId: string) => void;
  deleteMessage: (messageId: string, chatId: string) => void;
  toggleFavMessage: (messageId: string, chatId: string) => void;
  updateMessageStatus: (messageId: string, chatId: string) => void;
  addReaction: (
    messageId: string,
    reaction: ReactionListType,
    chatId: string
  ) => void;
  deleteReaction: (messageId: string, chatId: string) => void;
  changeReaction: (
    messageId: string,
    reaction: ReactionListType,
    chatId: string
  ) => void;
}

export interface LeftDrawerSlice {
  leftDrawer: LeftDrawerContentOptions | null;
  leftDrawerGoTo: (to: LeftDrawerContentOptions) => void;
  close: () => void;
}

export interface StoreSlice
  extends ContactsSlice,
    ChatsSlice,
    ConfigSlice,
    ProfileSlice,
    CurrentChatIdSlice,
    ChatSlice,
    MessageSlice,
    LeftDrawerSlice {}
