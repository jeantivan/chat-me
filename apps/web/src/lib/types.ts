export type TUser = {
  id: string;
  name: string;
  bio: string;
  phone: string;
  picture: string;
};

export type TParticipant = TUser & {
  role?: "admin" | "member";
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
  mode: "dark" | "light";
  colors:
    | "gold-lime"
    | "mauve-crimson"
    | "mauve-violet"
    | "olive-grass"
    | "sage-teal"
    | "sand-orange"
    | "sand-yellow"
    | "slate-indigo"
    | "slate-sky";
};

export type TPrivacy = {
  lastTimeOnline: "all" | "contacts" | "none";
  picture: "all" | "contacts" | "none";
  bio: "all" | "contacts" | "none";
  groups: "all" | "contacts" | "none";
  readReceipt: boolean;
};

export type TChat = {
  id: string;
  type?: "direct" | "group";
  title?: string | null;
  bio?: string | null;
  pictureUrl?: string | null;
  participants: TParticipant[]; // Uno o multiples usuarios pertenecientes al chat
  pinned: boolean;
  muted: boolean;
  archived: boolean;
  hasUnreadMsg: number;
  messages: TMessage[];
};

export type TMessage = {
  id: string;
  chatId: string; // Referencia a un chat id, solo visual
  owner: string; // Referencia a un id de usuario
  starred: boolean;
  deleted?: boolean;
  forwarded: boolean;
  time: string;
  status: "idle" | "send" | "received" | "read";
  body: string;
  reactions: TReaction[];
  hasMedia: TMedia | null;
  senderName?: string;
  senderPicture?: string;
};

export type TReaction = { owner: string; type: ReactionKeys };

export type TMedia = {
  id?: string;
  type: "image" | "video" | "audio" | "document";
  src: string;
  orientation: "square" | "landscape" | "portrait";
  duration: number | null;
  width?: number | null;
  height?: number | null;
  blurhash?: string | null;
  uploadProgress?: number; // 0-100% while uploading
};

export type ReactionKeys =
  | ":clapping_hands:"
  | ":sparkling_heart:"
  | ":rolling_on_the_floor_laughing:"
  | ":hushed_face:"
  | ":loudly_crying_face:"
  | ":thinking_face:";

export type LeftDrawerContentOptions =
  | "PROFILE"
  | "NOTIFICATIONS"
  | "PRIVACY"
  | "THEME"
  | "OPTIONS"
  | "NEW_CHAT"
  | "NEW_GROUP"
  | "ARCHIVED_CHATS"
  | "STARRED_MESSAGES"
  | "BLOCKED_USERS";

export type RightDrawerContentOptions =
  | "CONTACT_INFO"
  | "SHARED_CONTENT"
  | "STARRED_MESSAGES";

type BaseEmoji = { unified: string; image: string; native: string };

export type TEmoji = BaseEmoji & {
  name: string;
  short_name: string;
  short_names: string[];
  skin_variations?: { [key: string]: BaseEmoji };
  category: string;
  sort_order: number;
};
