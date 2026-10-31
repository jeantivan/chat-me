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

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  pictureUrl?: string;
}

export interface PresignAvatarRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PresignAvatarResponse {
  uploadUrl: string;
  publicUrl: string;
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

export interface UpdateUserSettingsInput {
  themeMode?: ThemeMode;
  themeColor?: string;
  notifyAll?: boolean;
  notifySound?: boolean;
  notifyPreview?: boolean;
  notifyReactions?: boolean;
  privacyLastSeen?: PrivacyAudience;
  privacyPicture?: PrivacyAudience;
  privacyBio?: PrivacyAudience;
  privacyGroups?: PrivacyAudience;
  privacyReadReceipt?: boolean;
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

export interface ContactSummary {
  userId: string;
  contactUserId: string;
  nickname: string | null;
  createdAt: string;
  contact: UserProfile;
}

export interface BlockedUserSummary {
  id: string;
  name: string;
  email: string;
  bio: string;
  pictureUrl: string;
  createdAt: string;
  user: UserProfile;
}

export interface UserPresence {
  userId: string;
  status: "online" | "offline";
  lastSeenAt?: string | null;
}

// Chat & Message Domain Interfaces

export type ChatType = "direct" | "group";
export type DeliveryStatus = "idle" | "send" | "received" | "read";

export type MediaType = "image" | "video" | "audio" | "document";
export type MediaOrientation = "square" | "landscape" | "portrait";

export interface MediaPayload {
  id: string;
  type: MediaType;
  src: string;
  orientation: MediaOrientation;
  duration: number | null;
  width?: number | null;
  height?: number | null;
  blurhash?: string | null;
}

export interface PresignMediaRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  type: MediaType;
  orientation?: MediaOrientation;
  duration?: number | null;
  width?: number;
  height?: number;
  blurhash?: string;
}

export interface PresignMediaResponse {
  mediaId: string;
  uploadUrl: string;
  publicUrl: string;
  expiresAt: string;
}

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
  bio?: string | null;
  pictureUrl: string | null;
  directPairHash: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipantSummary[];
  lastMessage?: MessagePayload | null;
  unreadCount?: number;
}

export const DELETED_MESSAGE_TOMBSTONE = "This message was deleted";

export interface MessagePayload {
  id: string;
  chatId: string;
  owner: string; // userId of sender
  body: string;
  forwarded: boolean;
  time: string; // ISO string
  status: DeliveryStatus;
  starred: boolean;
  deleted?: boolean;
  hasMedia: MediaPayload | null;
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
      mediaId?: string;
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
  "message:reaction": (
    payload: {
      messageId: string;
      chatId: string;
      emoji: string | null;
    },
    callback?: (ack: { success: boolean; error?: string }) => void
  ) => void;
  "message:delete": (
    payload: {
      messageId: string;
      chatId: string;
    },
    callback?: (ack: { success: boolean; error?: string }) => void
  ) => void;
  "chat:typing": (payload: {
    chatId: string;
    isTyping: boolean;
  }) => void;
  "presence:heartbeat": () => void;
}

declare const DirectPairHashBrand: unique symbol;
export type DirectPairHash = string & { readonly [DirectPairHashBrand]: true };

export function generateDirectPairHash(user1Id: string, user2Id: string): DirectPairHash {
  return (user1Id < user2Id ? `${user1Id}:${user2Id}` : `${user2Id}:${user1Id}`) as DirectPairHash;
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
  "receipt:updated": (payload: ReceiptStatusPayload) => void;
  "message:reaction_updated": (payload: {
    messageId: string;
    chatId: string;
    reactions: Array<{ owner: string; type: string }>;
  }) => void;
  "message:deleted": (payload: {
    messageId: string;
    chatId: string;
  }) => void;
  "chat:typing_updated": (payload: {
    chatId: string;
    userId: string;
    isTyping: boolean;
  }) => void;
  "presence:updated": (payload: UserPresence) => void;
  "user:profile_updated": (payload: UserProfile) => void;
}
