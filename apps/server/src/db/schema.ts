import { pgTable, uuid, varchar, text, timestamp, boolean, check } from "drizzle-orm/pg-core";
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
  }
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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
