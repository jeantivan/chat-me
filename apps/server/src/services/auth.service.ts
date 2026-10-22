import argon2 from "argon2";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.js";
import { users, userSettings, User, UserSettings } from "../db/schema.js";
import type { AuthResponse, UserProfile, UserSettingsData } from "@chat-me/shared";

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

export function formatUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    bio: user.bio,
    phone: user.phone,
    pictureUrl: user.pictureUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

export function formatUserSettings(settings: UserSettings): UserSettingsData {
  return {
    userId: settings.userId,
    themeMode: settings.themeMode as "light" | "dark",
    themeColor: settings.themeColor,
    notifyAll: settings.notifyAll,
    notifySound: settings.notifySound,
    notifyPreview: settings.notifyPreview,
    notifyReactions: settings.notifyReactions,
    privacyLastSeen: settings.privacyLastSeen as "all" | "contacts" | "none",
    privacyPicture: settings.privacyPicture as "all" | "contacts" | "none",
    privacyBio: settings.privacyBio as "all" | "contacts" | "none",
    privacyGroups: settings.privacyGroups as "all" | "contacts" | "none",
    privacyReadConfirmation: settings.privacyReadConfirmation,
  };
}

export async function getUserProfileAndSettings(
  db: NodePgDatabase<typeof schema>,
  userId: string
): Promise<{ user: UserProfile; settings: UserSettingsData } | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.id))
    .limit(1);

  return {
    user: formatUserProfile(user),
    settings: formatUserSettings(settings),
  };
}

export function sendAuthResponse(
  app: FastifyInstance,
  reply: FastifyReply,
  user: User,
  settings: UserSettings,
  statusCode = 200
): FastifyReply {
  const accessToken = app.jwt.sign(
    { sub: user.id, email: user.email, type: "access" },
    { expiresIn: "15m" }
  );

  const refreshToken = app.jwt.sign(
    { sub: user.id, email: user.email, type: "refresh" },
    { expiresIn: "7d" }
  );

  reply.setCookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  const payload: AuthResponse = {
    accessToken,
    user: formatUserProfile(user),
    settings: formatUserSettings(settings),
  };

  return reply.status(statusCode).send(payload);
}
