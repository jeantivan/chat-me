import { ConfigType, UserType, ChatType, MessageType } from "./../../../types";

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
  getAllMessages: () => void;
  addMessage: (message: MessageType) => void;
  deleteMessage: (messageId: string) => void;
  toggleFavMessage: (messageId: string) => void;
}

// TODO: Interface para las reacciones a los mensajes
export interface ReactionsSlice {}

export interface StoreSlice
  extends ContactsSlice,
    ChatsSlice,
    ConfigSlice,
    ProfileSlice,
    CurrentChatIdSlice,
    ChatSlice {}