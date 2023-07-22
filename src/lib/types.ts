export type TUser = {
  id: string;
  name: string;
  bio: string;
  phone: string;
  picture: string;
};

export type TProfile = {
  user: TUser;
  contacts: TUser[];
} & TConfig;

export type TConfig = {
  notifications: TNotifications;
  privacy: TPrivacy;
  theme: TTheme;
};

export type TNotifications = {
  all: boolean;
  sound: boolean;
  preview: boolean;
  reactions: boolean;
};

export type TTheme = {
  options: "dark" | "light" | "system";
  mode: "dark" | "light";
  color: "emerald" | "sky";
};

export type TPrivacy = {
  lastTimeOnline: "all" | "contacts" | "none";
  picture: "all" | "contacts" | "none";
  bio: "all" | "contacts" | "none";
  groups: "all" | "contacts" | "none";
  readConfirmation: boolean;
};

export type TChat = {
  id: string;
  participants: TUser[]; // Uno o multiples usuarios pertenecientes al chat
  pinned: boolean;
  muted: boolean;
  archived: boolean;
  hasUnreadMsg: number;
  messages: TMessage[];
};

export type TMessage = {
  id: string;
  chatId?: string; // Referencia a un chat id, solo visual
  owner: string; // Referencia a un id de usuario
  starred: boolean;
  forwarded: boolean;
  time: string | number;
  status: "idle" | "send" | "received" | "read";
  body: string;
  reactions: TReaction[];
  hasMedia: TMedia | null;
};

export type TReaction = { owner: string; type: ReactionKeys };

export type TMedia = {
  type: "image" | "video";
  src: string;
  orientation: "square" | "landscape" | "portrait";
  duration: number | null;
};

export type ReactionKeys =
  | ":clapping_hands:"
  | ":sparkling_heart:"
  | ":rolling_on_the_floor_laughing:"
  | ":hushed_face:"
  | ":loudly_crying_face:"
  | ":thinking_face:";

export type TShortCut = {
  slug: string;
  title: string;
  keys: string[];
};

export type LeftDrawerContentOptions =
  | "PROFILE"
  | "NOTIFICATIONS"
  | "PRIVACY"
  | "SECURITY"
  | "THEME"
  | "BACKGROUND"
  | "SOL_INFO"
  | "HELP"
  | "OPTIONS"
  | "SHORTCUTS"
  | "NEW_CHAT";

export type RightDrawerContentOptions =
  | "CONTACT_INFO"
  | "CHAT_SHARE_CONTENT"
  | "FAV_MESSAGES";
