# Relational Data Model & Real-Time Event Contracts

Specification for the PostgreSQL database schema (managed with Drizzle ORM) and the Socket.IO real-time event protocol for `chat-me`.

---

## 1. Relational Database Schema (PostgreSQL / Drizzle)

### 1.1 `users`
Core user identity and profile metadata.
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL if authenticated via OAuth
    name VARCHAR(100) NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    phone VARCHAR(32),
    picture_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
```

### 1.2 `user_settings`
1-to-1 per-user preferences mapping directly to `TConfig` (`theme`, `notifications`, `privacy`).
```sql
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme_mode VARCHAR(10) NOT NULL DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark')),
    theme_color VARCHAR(30) NOT NULL DEFAULT 'slate-indigo',
    notify_all BOOLEAN NOT NULL DEFAULT true,
    notify_sound BOOLEAN NOT NULL DEFAULT true,
    notify_preview BOOLEAN NOT NULL DEFAULT true,
    notify_reactions BOOLEAN NOT NULL DEFAULT true,
    privacy_last_seen VARCHAR(15) NOT NULL DEFAULT 'all' CHECK (privacy_last_seen IN ('all', 'contacts', 'none')),
    privacy_picture VARCHAR(15) NOT NULL DEFAULT 'all' CHECK (privacy_picture IN ('all', 'contacts', 'none')),
    privacy_bio VARCHAR(15) NOT NULL DEFAULT 'all' CHECK (privacy_bio IN ('all', 'contacts', 'none')),
    privacy_groups VARCHAR(15) NOT NULL DEFAULT 'all' CHECK (privacy_groups IN ('all', 'contacts', 'none')),
    privacy_read_confirmation BOOLEAN NOT NULL DEFAULT true
);
```

### 1.3 `contacts`
Bidirectional contact book relationships.
```sql
CREATE TABLE contacts (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, contact_user_id),
    CONSTRAINT chk_no_self_contact CHECK (user_id <> contact_user_id)
);
CREATE INDEX idx_contacts_user ON contacts(user_id);
```

### 1.4 `chats`
Conversation container supporting direct (1-on-1) and group threads.
```sql
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('direct', 'group')),
    title VARCHAR(150), -- NULL for direct chats, required for groups
    picture_url TEXT,
    direct_pair_hash VARCHAR(73) UNIQUE, -- Enforces uniqueness for direct chats: LEAST(u1,u2):GREATEST(u1,u2)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 1.5 `chat_participants`
Join table with per-user chat preferences, unread watermark, and membership roles.
```sql
CREATE TABLE chat_participants (
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    pinned BOOLEAN NOT NULL DEFAULT false,
    muted BOOLEAN NOT NULL DEFAULT false,
    archived BOOLEAN NOT NULL DEFAULT false,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (chat_id, user_id)
);
CREATE INDEX idx_participants_user ON chat_participants(user_id);
```

### 1.6 `messages`
The chat messages table with client-supplied UUID for optimistic sending.
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY, -- Client-generated UUID for deduplication & optimistic matching
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL DEFAULT '',
    forwarded BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete ("Delete for everyone")
);
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at DESC);
```

### 1.7 `media_attachments`
Normalized metadata for images, videos, audio, and documents.
```sql
CREATE TABLE media_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    type VARCHAR(15) NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document')),
    url TEXT NOT NULL,
    orientation VARCHAR(10) CHECK (orientation IN ('square', 'landscape', 'portrait')),
    duration INTEGER, -- In milliseconds for video/audio
    size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_media_message ON media_attachments(message_id);
```

### 1.8 `message_receipts`
Per-user delivery and read tracking for 1-on-1 and group chats.
```sql
CREATE TABLE message_receipts (
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL CHECK (status IN ('received', 'read')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);
CREATE INDEX idx_receipts_user ON message_receipts(user_id);
```

### 1.9 `message_reactions`
Single-reaction-per-user with atomic replacement and toggle.
```sql
CREATE TABLE message_reactions (
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(64) NOT NULL, -- Shortcode or unicode
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);
```

### 1.10 `message_stars`
Per-user starred messages bookmarking.
```sql
CREATE TABLE message_stars (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, message_id)
);
```

---

## 2. Mapping Existing Frontend Types to Relational Model

| Frontend Type (`src/lib/types.ts`) | Source in Relational Model |
| :--- | :--- |
| `TUser` (`id, name, bio, phone, picture`) | `users` table |
| `TProfile` (`user, contacts, config`) | `users` + `contacts` join + `user_settings` |
| `TChat.pinned, muted, archived` | Joined from `chat_participants` WHERE `user_id = current_user` |
| `TChat.hasUnreadMsg` | Computed: `COUNT(*) FROM messages WHERE chat_id = $1 AND created_at > participant.last_read_at AND sender_id != current_user` |
| `TMessage.status` | For 1-on-1 chats: `idle` (client pre-ack), `send` (stored on server), `received` (recipient receipt exists), `read` (recipient read receipt exists) |
| `TMessage.starred` | Derived via `EXISTS (SELECT 1 FROM message_stars WHERE message_id = m.id AND user_id = current_user)` |
| `TMessage.hasMedia` | Joined 1-to-1 or 1-to-many from `media_attachments` |
| `TMessage.reactions` | Aggregated array from `message_reactions` (`{ owner: user_id, type: emoji }`) |

---

## 3. Real-Time Socket.IO Event Contracts

### 3.1 Client-to-Server Events (`ClientToServerEvents`)
```typescript
export interface ClientToServerEvents {
  // Send message with client-supplied UUID and ACK callback
  "message:send": (
    payload: {
      id: string; // Client UUID
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

  // Recipient confirms delivery to device
  "message:ack_received": (payload: {
    chatId: string;
    messageIds: string[];
  }) => void;

  // Recipient confirms viewing in active viewport
  "message:ack_read": (payload: {
    chatId: string;
    lastMessageId: string;
  }) => void;

  // React or toggle reaction (null removes reaction)
  "message:reaction": (
    payload: {
      messageId: string;
      chatId: string;
      emoji: string | null;
    },
    callback: (ack: { success: boolean }) => void
  ) => void;

  // Soft-delete message ("Delete for everyone")
  "message:delete": (
    payload: {
      messageId: string;
      chatId: string;
    },
    callback: (ack: { success: boolean }) => void
  ) => void;

  // Ephemeral typing indicator
  "chat:typing": (payload: {
    chatId: string;
    isTyping: boolean;
  }) => void;

  // Presence heartbeat
  "presence:heartbeat": () => void;
}
```

### 3.2 Server-to-Client Events (`ServerToClientEvents`)
```typescript
export interface ServerToClientEvents {
  // Broadcast new message to participants in room `chat:${chatId}`
  "message:new": (message: {
    id: string;
    chatId: string;
    owner: string;
    body: string;
    forwarded: boolean;
    time: string;
    status: "send" | "received" | "read";
    starred: boolean;
    hasMedia: TMedia | null;
    reactions: TReaction[];
  }) => void;

  // Delivery status changed (e.g. gray tick -> double gray -> double blue)
  "message:status_changed": (payload: {
    messageId: string;
    chatId: string;
    status: "received" | "read";
    userId: string;
    updatedAt: string;
  }) => void;

  // Message reaction added, updated, or removed
  "message:reaction_updated": (payload: {
    messageId: string;
    chatId: string;
    reactions: { owner: string; type: string }[];
  }) => void;

  // Message tombstoned
  "message:deleted": (payload: {
    messageId: string;
    chatId: string;
  }) => void;

  // Ephemeral typing update
  "chat:typing_updated": (payload: {
    chatId: string;
    userId: string;
    isTyping: boolean;
  }) => void;

  // User online/offline presence update
  "presence:updated": (payload: {
    userId: string;
    status: "online" | "offline";
    lastSeenAt?: string;
  }) => void;
}
```
