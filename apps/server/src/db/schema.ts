import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  check,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    name: varchar("name", { length: 100 }).notNull(),
    bio: text("bio").notNull().default(""),
    phone: varchar("phone", { length: 32 }),
    pictureUrl: text("picture_url").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
  })
);

export const userSettings = pgTable(
  "user_settings",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    themeMode: varchar("theme_mode", { length: 10 }).notNull().default("light"),
    themeColor: varchar("theme_color", { length: 30 }).notNull().default("slate-indigo"),
    notifyAll: boolean("notify_all").notNull().default(true),
    notifySound: boolean("notify_sound").notNull().default(true),
    notifyPreview: boolean("notify_preview").notNull().default(true),
    notifyReactions: boolean("notify_reactions").notNull().default(true),
    privacyLastSeen: varchar("privacy_last_seen", { length: 15 }).notNull().default("all"),
    privacyPicture: varchar("privacy_picture", { length: 15 }).notNull().default("all"),
    privacyBio: varchar("privacy_bio", { length: 15 }).notNull().default("all"),
    privacyGroups: varchar("privacy_groups", { length: 15 }).notNull().default("all"),
    privacyReadReceipt: boolean("privacy_read_receipt").notNull().default(true),
  },
  (table) => ({
    themeModeCheck: check("theme_mode_check", sql`${table.themeMode} IN ('light', 'dark')`),
    privacyLastSeenCheck: check(
      "privacy_last_seen_check",
      sql`${table.privacyLastSeen} IN ('all', 'contacts', 'none')`
    ),
    privacyPictureCheck: check(
      "privacy_picture_check",
      sql`${table.privacyPicture} IN ('all', 'contacts', 'none')`
    ),
    privacyBioCheck: check(
      "privacy_bio_check",
      sql`${table.privacyBio} IN ('all', 'contacts', 'none')`
    ),
    privacyGroupsCheck: check(
      "privacy_groups_check",
      sql`${table.privacyGroups} IN ('all', 'contacts', 'none')`
    ),
  })
);

export const contacts = pgTable(
  "contacts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactUserId: uuid("contact_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nickname: varchar("nickname", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.contactUserId] }),
    userIdIdx: index("idx_contacts_user").on(table.userId),
    noSelfContactCheck: check("chk_no_self_contact", sql`${table.userId} <> ${table.contactUserId}`),
  })
);

export const chats = pgTable(
  "chats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: varchar("type", { length: 10 }).notNull(),
    title: varchar("title", { length: 150 }),
    pictureUrl: text("picture_url"),
    directPairHash: varchar("direct_pair_hash", { length: 73 }).unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    typeCheck: check("chat_type_check", sql`${table.type} IN ('direct', 'group')`),
  })
);

export const chatParticipants = pgTable(
  "chat_participants",
  {
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 10 }).notNull().default("member"),
    pinned: boolean("pinned").notNull().default(false),
    muted: boolean("muted").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }).notNull().defaultNow(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.userId] }),
    userIdIdx: index("idx_participants_user").on(table.userId),
    roleCheck: check("participant_role_check", sql`${table.role} IN ('admin', 'member')`),
  })
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull().default(""),
    forwarded: boolean("forwarded").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    chatCreatedIdx: index("idx_messages_chat_created").on(table.chatId, sql`${table.createdAt} DESC`),
  })
);

export const messageReceipts = pgTable(
  "message_receipts",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 10 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.messageId, table.userId] }),
    userIdIdx: index("idx_receipts_user").on(table.userId),
    statusCheck: check("receipt_status_check", sql`${table.status} IN ('received', 'read')`),
  })
);

import { generateDirectPairHash, DirectPairHash } from "@chat-me/shared";
export { generateDirectPairHash, DirectPairHash };

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type NewChatParticipant = typeof chatParticipants.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageReceipt = typeof messageReceipts.$inferSelect;
export type NewMessageReceipt = typeof messageReceipts.$inferInsert;
