import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";
import { formatUserProfile, formatUserSettings, getUserProfileAndSettings } from "../services/auth.service.js";
import { generatePresignedUploadUrl } from "../services/storage.service.js";
import {
  isUserOnline,
  syncPresenceOnPrivacyChange,
  syncPresenceOnBlock,
  syncPresenceOnUnblock,
  broadcastSanitizedProfileUpdate,
} from "../socket/index.js";
import { canViewPresence } from "../lib/privacy.js";
import { users, userSettings, blockedUsers } from "../db/schema.js";
import type {
  UserPresence,
  UpdateProfileInput,
  UpdateUserSettingsInput,
  PresignAvatarRequest,
  BlockedUserSummary,
} from "@chat-me/shared";

const AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  pictureUrl: z
    .union([z.string().url("Invalid pictureUrl"), z.literal("")])
    .optional(),
});

const presignAvatarSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive(),
});

const updateUserSettingsSchema = z.object({
  themeMode: z.enum(["light", "dark"]).optional(),
  themeColor: z.string().min(1).max(30).optional(),
  notifyAll: z.boolean().optional(),
  notifySound: z.boolean().optional(),
  notifyPreview: z.boolean().optional(),
  notifyReactions: z.boolean().optional(),
  privacyLastSeen: z.enum(["all", "contacts", "none"]).optional(),
  privacyPicture: z.enum(["all", "contacts", "none"]).optional(),
  privacyBio: z.enum(["all", "contacts", "none"]).optional(),
  privacyGroups: z.enum(["all", "contacts", "none"]).optional(),
  privacyReadReceipt: z.boolean().optional(),
});

export const usersRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // GET /api/v1/users/me
  app.get("/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const profile = await getUserProfileAndSettings(app.db, userId);

    if (!profile) {
      return reply.status(404).send({ error: "User not found" });
    }

    return reply.status(200).send(profile);
  });

  // GET /api/v1/users/me/blocked
  app.get(
    "/me/blocked",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;

      const rows = await app.db
        .select({
          blockerId: blockedUsers.blockerId,
          blockedId: blockedUsers.blockedId,
          createdAt: blockedUsers.createdAt,
          user: users,
        })
        .from(blockedUsers)
        .innerJoin(users, eq(blockedUsers.blockedId, users.id))
        .where(eq(blockedUsers.blockerId, currentUserId));

      const list: BlockedUserSummary[] = rows.map((r) => ({
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        bio: r.user.bio,
        pictureUrl: r.user.pictureUrl,
        createdAt: r.createdAt.toISOString(),
        user: formatUserProfile(r.user),
      }));

      return reply.status(200).send(list);
    }
  );

  // POST /api/v1/users/me/blocked/:targetUserId
  app.post<{ Params: { targetUserId: string } }>(
    "/me/blocked/:targetUserId",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;
      const { targetUserId } = request.params;

      if (targetUserId === currentUserId) {
        return reply.status(400).send({ error: "Cannot block self" });
      }

      const parseResult = z.string().uuid().safeParse(targetUserId);
      if (!parseResult.success) {
        return reply.status(400).send({ error: "Invalid user ID" });
      }

      const targetUserRows = await app.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (targetUserRows.length === 0) {
        return reply.status(404).send({ error: "User not found" });
      }

      await app.db
        .insert(blockedUsers)
        .values({
          blockerId: currentUserId,
          blockedId: targetUserId,
        })
        .onConflictDoNothing();

      await syncPresenceOnBlock(app, currentUserId, targetUserId);

      return reply.status(200).send({ success: true });
    }
  );

  // DELETE /api/v1/users/me/blocked/:targetUserId
  app.delete<{ Params: { targetUserId: string } }>(
    "/me/blocked/:targetUserId",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;
      const { targetUserId } = request.params;

      await app.db
        .delete(blockedUsers)
        .where(
          and(
            eq(blockedUsers.blockerId, currentUserId),
            eq(blockedUsers.blockedId, targetUserId)
          )
        );

      await syncPresenceOnUnblock(app, currentUserId, targetUserId);

      return reply.status(200).send({ success: true });
    }
  );

  // PATCH /api/v1/users/me/profile
  app.patch<{ Body: UpdateProfileInput }>(
    "/me/profile",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { sub: string }).sub;

      const parseResult = updateProfileSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: parseResult.error.flatten(),
        });
      }

      const data = parseResult.data;
      const updates: Partial<{
        name: string;
        bio: string;
        pictureUrl: string;
        updatedAt: Date;
      }> = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) {
        updates.name = data.name;
      }
      if (data.bio !== undefined) {
        updates.bio = data.bio;
      }
      if (data.pictureUrl !== undefined) {
        updates.pictureUrl = data.pictureUrl;
      }

      const [updatedUser] = await app.db
        .update(users)
        .set(updates)
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return reply.status(404).send({ error: "User not found" });
      }

      const formattedProfile = formatUserProfile(updatedUser);

      // Broadcast sanitized profile update event via Socket.IO
      await broadcastSanitizedProfileUpdate(app, formattedProfile);

      return reply.status(200).send(formattedProfile);
    }
  );

  // PATCH /api/v1/users/me/settings
  app.patch<{ Body: UpdateUserSettingsInput }>(
    "/me/settings",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { sub: string }).sub;

      const parseResult = updateUserSettingsSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: parseResult.error.flatten(),
        });
      }

      const data = parseResult.data;
      const [updatedSettings] = await app.db
        .update(userSettings)
        .set(data)
        .where(eq(userSettings.userId, userId))
        .returning();

      if (!updatedSettings) {
        return reply.status(404).send({ error: "User settings not found" });
      }

      if (data.privacyLastSeen !== undefined) {
        await syncPresenceOnPrivacyChange(app, userId);
      }

      const formattedSettings = formatUserSettings(updatedSettings);
      return reply.status(200).send(formattedSettings);
    }
  );

  // POST /api/v1/users/me/avatar/presign
  app.post<{ Body: PresignAvatarRequest }>(
    "/me/avatar/presign",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { sub: string }).sub;

      const parseResult = presignAvatarSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: parseResult.error.flatten(),
        });
      }

      const data = parseResult.data;

      if (!(AVATAR_MIME_TYPES as readonly string[]).includes(data.mimeType)) {
        return reply.status(400).send({
          error: `Invalid MIME type '${data.mimeType}'. Allowed image MIME types: ${AVATAR_MIME_TYPES.join(", ")}`,
        });
      }

      if (data.sizeBytes > MAX_AVATAR_BYTES) {
        return reply.status(400).send({
          error: `File size ${data.sizeBytes} bytes exceeds maximum allowed size of ${MAX_AVATAR_BYTES} bytes (5 MB)`,
        });
      }

      const ext = data.filename.includes(".")
        ? data.filename.substring(data.filename.lastIndexOf("."))
        : ".jpg";
      const storageKey = `avatars/${userId}/${crypto.randomUUID()}${ext}`;

      const { uploadUrl, publicUrl } = await generatePresignedUploadUrl({
        key: storageKey,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
      });

      return reply.status(200).send({ uploadUrl, publicUrl });
    }
  );

  // GET /api/v1/users/:id/presence
  app.get<{ Params: { id: string } }>(
    "/:id/presence",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const targetUserId = request.params.id;
      const viewerUserId = (request.user as { sub: string }).sub;
      const targetUser = await app.db
        .select()
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (targetUser.length === 0) {
        return reply.status(404).send({ error: "User not found" });
      }

      // Check reciprocity
      const canSee = await canViewPresence(app.db, targetUserId, viewerUserId);
      if (!canSee) {
        const masked: UserPresence = {
          userId: targetUserId,
          status: "offline",
        };
        return reply.status(200).send(masked);
      }

      const online = isUserOnline(targetUserId);
      const response: UserPresence = {
        userId: targetUserId,
        status: online ? "online" : "offline",
        lastSeenAt: targetUser[0].lastSeenAt.toISOString(),
      };

      return reply.status(200).send(response);
    }
  );
};
