export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  uptime: number;
  services: {
    postgres: boolean;
    redis: boolean;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio: string;
  phone?: string | null;
  pictureUrl: string;
  createdAt: string;
}

export type ThemeMode = "light" | "dark";
export type PrivacyAudience = "all" | "contacts" | "none";

export interface UserSettingsData {
  userId: string;
  themeMode: ThemeMode;
  themeColor: string;
  notifyAll: boolean;
  notifySound: boolean;
  notifyPreview: boolean;
  notifyReactions: boolean;
  privacyLastSeen: PrivacyAudience;
  privacyPicture: PrivacyAudience;
  privacyBio: PrivacyAudience;
  privacyGroups: PrivacyAudience;
  privacyReadReceipt: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
  settings: UserSettingsData;
}

export interface SessionResponse {
  user: UserProfile;
  settings: UserSettingsData;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// Chat & Message Domain Interfaces

export type ChatType = "direct" | "group";
export type DeliveryStatus = "idle" | "send" | "received" | "read";

export interface ChatParticipantSummary {
  userId: string;
  role: "admin" | "member";
  pinned: boolean;
  muted: boolean;
  archived: boolean;
  lastReadAt: string;
  user: UserProfile;
}

export interface ChatSummary {
  id: string;
  type: ChatType;
  title: string | null;
  pictureUrl: string | null;
  directPairHash: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipantSummary[];
  lastMessage?: MessagePayload | null;
  unreadCount?: number;
}

export interface MessagePayload {
  id: string;
  chatId: string;
  owner: string; // userId of sender
  body: string;
  forwarded: boolean;
  time: string; // ISO string
  status: DeliveryStatus;
  starred: boolean;
  hasMedia: any | null;
  reactions: Array<{ owner: string; type: string }>;
}

export interface MessagesPageResponse {
  messages: MessagePayload[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Socket.IO Event Contracts

export interface ClientToServerEvents {
  "chat:join": (chatId: string) => void;
  "message:send": (
    payload: {
      id: string;
      chatId: string;
      body: string;
    },
    callback: (ack: {
      success: boolean;
      id: string;
      createdAt: string;
      error?: string;
    }) => void
  ) => void;
  "message:ack_received": (payload: {
    chatId: string;
    messageIds: string[];
  }) => void;
  "message:ack_read": (payload: {
    chatId: string;
    lastMessageId: string;
  }) => void;
}

export interface ReceiptStatusPayload {
  messageId: string;
  chatId: string;
  status: "received" | "read";
  userId: string;
  updatedAt: string;
}

export interface ServerToClientEvents {
  "message:new": (message: MessagePayload) => void;
  "message:status_changed": (payload: ReceiptStatusPayload) => void;
}
