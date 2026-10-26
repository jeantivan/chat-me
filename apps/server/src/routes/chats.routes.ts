import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq, and, sql, desc, lt, inArray } from "drizzle-orm";
import {
  chats,
  chatParticipants,
  messages,
  messageReceipts,
  messageReactions,
  messageStars,
  mediaAttachments,
  users,
  contacts,
  generateDirectPairHash,
} from "../db/schema.js";
import { generatePresignedUploadUrl } from "../services/storage.service.js";
import { toMediaPayload } from "../lib/media.js";
import {
  DELETED_MESSAGE_TOMBSTONE,
  type ChatSummary,
  type ChatParticipantSummary,
  type MessagePayload,
  type MediaPayload,
  type MessagesPageResponse,
  type DeliveryStatus,
} from "@chat-me/shared";
import {
  computeMessageStatusForViewer,
  computeStatusFromReceipts,
} from "../lib/receipts.js";

async function hydrateMessagesMetadata(
  app: FastifyInstance,
  msgRows: Array<typeof messages.$inferSelect>,
  currentUserId: string
): Promise<{
  reactionsMap: Map<string, Array<{ owner: string; type: string }>>;
  starsSet: Set<string>;
  mediaMap: Map<string, MediaPayload>;
}> {
  const messageIds = msgRows.map((m) => m.id);
  const reactionsMap = new Map<string, Array<{ owner: string; type: string }>>();
  const starsSet = new Set<string>();
  const mediaMap = new Map<string, MediaPayload>();

  if (messageIds.length === 0) {
    return { reactionsMap, starsSet, mediaMap };
  }

  const reactionRows = await app.db
    .select()
    .from(messageReactions)
    .where(inArray(messageReactions.messageId, messageIds));

  for (const rx of reactionRows) {
    const list = reactionsMap.get(rx.messageId) || [];
    list.push({ owner: rx.userId, type: rx.emoji });
    reactionsMap.set(rx.messageId, list);
  }

  const starRows = await app.db
    .select()
    .from(messageStars)
    .where(
      and(
        eq(messageStars.userId, currentUserId),
        inArray(messageStars.messageId, messageIds)
      )
    );

  for (const st of starRows) {
    starsSet.add(st.messageId);
  }

  const mediaIds = msgRows
    .map((m) => m.mediaId)
    .filter((id): id is string => Boolean(id));

  if (mediaIds.length > 0) {
    const mediaRows = await app.db
      .select()
      .from(mediaAttachments)
      .where(inArray(mediaAttachments.id, mediaIds));

    for (const m of mediaRows) {
      mediaMap.set(m.id, toMediaPayload(m));
    }
  }

  return { reactionsMap, starsSet, mediaMap };
}

function formatMessagePayload(
  msg: typeof messages.$inferSelect,
  status: DeliveryStatus,
  starred: boolean,
  mediaMap: Map<string, MediaPayload>,
  reactionsMap: Map<string, Array<{ owner: string; type: string }>>
): MessagePayload {
  const isDeleted = Boolean(msg.deletedAt);
  const hasMedia =
    !isDeleted && msg.mediaId ? mediaMap.get(msg.mediaId) || null : null;

  return {
    id: msg.id,
    chatId: msg.chatId,
    owner: msg.senderId,
    body: isDeleted ? DELETED_MESSAGE_TOMBSTONE : msg.body,
    forwarded: msg.forwarded,
    time: msg.createdAt.toISOString(),
    status,
    starred,
    deleted: isDeleted,
    hasMedia,
    reactions: reactionsMap.get(msg.id) || [],
  };
}

async function createOrGetDirectChat(
  app: FastifyInstance,
  currentUserId: string,
  targetUserId: string
): Promise<{ error?: string; status?: number; chat?: ChatSummary | null }> {
  if (currentUserId === targetUserId) {
    return { error: "Cannot create chat with self", status: 400 };
  }

  const targetUsers = await app.db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (targetUsers.length === 0) {
    return { error: "Target user not found", status: 404 };
  }

  const pairHash = generateDirectPairHash(currentUserId, targetUserId);

  let existingChats = await app.db
    .select()
    .from(chats)
    .where(eq(chats.directPairHash, pairHash))
    .limit(1);

  let chatId: string;

  if (existingChats.length > 0) {
    chatId = existingChats[0].id;
  } else {
    const [newChat] = await app.db
      .insert(chats)
      .values({
        type: "direct",
        directPairHash: pairHash,
      })
      .returning();

    chatId = newChat.id;

    await app.db.insert(chatParticipants).values([
      { chatId, userId: currentUserId, role: "member" },
      { chatId, userId: targetUserId, role: "member" },
    ]);

    await app.db
      .insert(contacts)
      .values([
        { userId: currentUserId, contactUserId: targetUserId },
        { userId: targetUserId, contactUserId: currentUserId },
      ])
      .onConflictDoNothing();
  }

  const chat = await getChatSummary(app, chatId, currentUserId);
  return { chat };
}

async function requireAdmin(
  app: FastifyInstance,
  chatId: string,
  userId: string
): Promise<boolean> {
  const membership = await app.db
    .select({ role: chatParticipants.role })
    .from(chatParticipants)
    .where(
      and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId)
      )
    )
    .limit(1);

  return membership.length > 0 && membership[0].role === "admin";
}

const MIME_LIMITS = {
  image: {
    allowed: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxBytes: 15 * 1024 * 1024,
  },
  audio: {
    allowed: ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"],
    maxBytes: 25 * 1024 * 1024,
  },
  video: {
    allowed: ["video/mp4", "video/webm", "video/quicktime"],
    maxBytes: 100 * 1024 * 1024,
  },
  document: {
    allowed: [
      "application/pdf",
      "application/zip",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    maxBytes: 50 * 1024 * 1024,
  },
} as const;

export const chatsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Presign S3 PUT upload URL for chat media
  app.post<{
    Params: { chatId: string };
  }>(
    "/:chatId/media/presign",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;
      const { chatId } = request.params;

      const bodySchema = z.object({
        filename: z.string().min(1).max(255),
        mimeType: z.string().min(1).max(100),
        sizeBytes: z.number().int().positive(),
        type: z.enum(["image", "video", "audio", "document"]),
        orientation: z.enum(["square", "landscape", "portrait"]).optional(),
        duration: z.number().int().nonnegative().nullable().optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        blurhash: z.string().max(64).optional(),
      });

      const parseResult = bodySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.flatten() });
      }

      const data = parseResult.data;

      // Validate MIME whitelist and size limits
      const categoryLimits = MIME_LIMITS[data.type];
      if (!(categoryLimits.allowed as readonly string[]).includes(data.mimeType)) {
        return reply.status(400).send({
          error: `Invalid MIME type '${data.mimeType}' for category '${data.type}'. Allowed: ${categoryLimits.allowed.join(", ")}`,
        });
      }

      if (data.sizeBytes > categoryLimits.maxBytes) {
        return reply.status(400).send({
          error: `File size ${data.sizeBytes} exceeds maximum allowed size of ${categoryLimits.maxBytes} bytes for ${data.type}`,
        });
      }

      // Check caller is an active participant in this chat
      const membership = await app.db
        .select()
        .from(chatParticipants)
        .where(
          and(
            eq(chatParticipants.chatId, chatId),
            eq(chatParticipants.userId, currentUserId)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        return reply.status(403).send({ error: "Forbidden: Not a participant of this chat" });
      }

      const mediaId = crypto.randomUUID();
      const sanitizedFilename = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storageKey = `chats/${chatId}/${mediaId}/${sanitizedFilename}`;

      const { uploadUrl, publicUrl, expiresAt } = await generatePresignedUploadUrl({
        key: storageKey,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
      });

      await app.db.insert(mediaAttachments).values({
        id: mediaId,
        chatId,
        uploaderId: currentUserId,
        type: data.type,
        url: publicUrl,
        storageKey,
        blurhash: data.blurhash || null,
        orientation: data.orientation || null,
        duration: data.duration ?? null,
        width: data.width || null,
        height: data.height || null,
        sizeBytes: data.sizeBytes,
        mimeType: data.mimeType,
        status: "pending",
      });

      return reply.send({
        mediaId,
        uploadUrl,
        publicUrl,
        expiresAt: expiresAt.toISOString(),
      });
    }
  );
  // Create chat (direct or group)
  app.post(
    "/",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;

      const bodySchema = z.union([
        z.object({
          type: z.literal("group"),
          title: z.string().min(1).max(150),
          bio: z.string().max(500).nullable().optional(),
          pictureUrl: z.string().nullable().optional(),
          participantIds: z.array(z.string().uuid()).min(1),
        }),
        z.object({
          type: z.literal("direct").optional(),
          targetUserId: z.string().uuid(),
        }),
      ]);

      const parseResult = bodySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.flatten() });
      }

      const data = parseResult.data;

      if (data.type === "group") {
        const uniqueInvitees = Array.from(
          new Set(data.participantIds.filter((id) => id !== currentUserId))
        );

        if (uniqueInvitees.length === 0) {
          return reply
            .status(400)
            .send({ error: "Group chat must have at least one other participant" });
        }

        const foundUsers = await app.db
          .select({ id: users.id })
          .from(users)
          .where(inArray(users.id, uniqueInvitees));

        if (foundUsers.length !== uniqueInvitees.length) {
          return reply
            .status(404)
            .send({ error: "One or more participants not found" });
        }

        const [newChat] = await app.db
          .insert(chats)
          .values({
            type: "group",
            title: data.title,
            bio: data.bio || null,
            pictureUrl: data.pictureUrl || null,
            directPairHash: null,
          })
          .returning();

        const chatId = newChat.id;

        await app.db.insert(chatParticipants).values([
          { chatId, userId: currentUserId, role: "admin" },
          ...uniqueInvitees.map((uid) => ({
            chatId,
            userId: uid,
            role: "member" as const,
          })),
        ]);

        const summary = await getChatSummary(app, chatId, currentUserId);
        return reply.status(201).send(summary);
      } else {
        const result = await createOrGetDirectChat(app, currentUserId, data.targetUserId);
        if (result.error) {
          return reply.status(result.status || 400).send({ error: result.error });
        }
        return reply.send(result.chat);
      }
    }
  );

  // Update group chat metadata (title, picture, bio)
  app.patch<{
    Params: { chatId: string };
    Body: { title?: string; bio?: string | null; pictureUrl?: string | null };
  }>(
    "/:chatId",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;
      const { chatId } = request.params;

      const bodySchema = z.object({
        title: z.string().min(1).max(150).optional(),
        bio: z.string().max(500).nullable().optional(),
        pictureUrl: z.string().nullable().optional(),
      });

      const parseResult = bodySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.flatten() });
      }

      const isAdmin = await requireAdmin(app, chatId, currentUserId);
      if (!isAdmin) {
        return reply
          .status(403)
          .send({ error: "Forbidden: Admin privileges required" });
      }

      const updateData: Partial<{
        title: string;
        bio: string | null;
        pictureUrl: string | null;
        updatedAt: Date;
      }> = {
        updatedAt: new Date(),
      };

      if (parseResult.data.title !== undefined) {
        updateData.title = parseResult.data.title;
      }
      if (parseResult.data.bio !== undefined) {
        updateData.bio = parseResult.data.bio;
      }
      if (parseResult.data.pictureUrl !== undefined) {
        updateData.pictureUrl = parseResult.data.pictureUrl;
      }

      await app.db.update(chats).set(updateData).where(eq(chats.id, chatId));

      const summary = await getChatSummary(app, chatId, currentUserId);
      return reply.send(summary);
    }
  );

  // Add participants to group chat
  app.post<{
    Params: { chatId: string };
    Body: { userIds: string[] };
  }>(
    "/:chatId/participants",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;
      const { chatId } = request.params;

      const bodySchema = z.object({
        userIds: z.array(z.string().uuid()).min(1),
      });

      const parseResult = bodySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.flatten() });
      }

      const isAdmin = await requireAdmin(app, chatId, currentUserId);
      if (!isAdmin) {
        return reply
          .status(403)
          .send({ error: "Forbidden: Admin privileges required" });
      }

      const uniqueUserIds = Array.from(new Set(parseResult.data.userIds));
      const existingUsers = await app.db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.id, uniqueUserIds));

      if (existingUsers.length !== uniqueUserIds.length) {
        return reply.status(404).send({ error: "One or more users not found" });
      }

      await app.db
        .insert(chatParticipants)
        .values(
          uniqueUserIds.map((uid) => ({
            chatId,
            userId: uid,
            role: "member" as const,
          }))
        )
        .onConflictDoNothing();

      const summary = await getChatSummary(app, chatId, currentUserId);
      return reply.send(summary);
    }
  );

  // Change participant role (promote to admin or demote to member)
  app.patch<{
    Params: { chatId: string; userId: string };
    Body: { role: "admin" | "member" };
  }>(
    "/:chatId/participants/:userId/role",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;
      const { chatId, userId: targetUserId } = request.params;

      const bodySchema = z.object({
        role: z.enum(["admin", "member"]),
      });

      const parseResult = bodySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.flatten() });
      }

      const isAdmin = await requireAdmin(app, chatId, currentUserId);
      if (!isAdmin) {
        return reply
          .status(403)
          .send({ error: "Forbidden: Admin privileges required" });
      }

      await app.db
        .update(chatParticipants)
        .set({ role: parseResult.data.role })
        .where(
          and(
            eq(chatParticipants.chatId, chatId),
            eq(chatParticipants.userId, targetUserId)
          )
        );

      const summary = await getChatSummary(app, chatId, currentUserId);
      return reply.send(summary);
    }
  );

  // Remove participant from group chat
  app.delete<{
    Params: { chatId: string; userId: string };
  }>(
    "/:chatId/participants/:userId",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;
      const { chatId, userId: targetUserId } = request.params;

      if (currentUserId !== targetUserId) {
        const isAdmin = await requireAdmin(app, chatId, currentUserId);
        if (!isAdmin) {
          return reply
            .status(403)
            .send({ error: "Forbidden: Admin privileges required" });
        }
      }

      await app.db
        .delete(chatParticipants)
        .where(
          and(
            eq(chatParticipants.chatId, chatId),
            eq(chatParticipants.userId, targetUserId)
          )
        );

      const summary = await getChatSummary(app, chatId, currentUserId);
      return reply.send(summary || { success: true });
    }
  );

  // Create or get direct chat
  app.post<{ Body: { targetUserId: string } }>(
    "/direct",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const payloadSchema = z.object({
        targetUserId: z.string().uuid(),
      });

      const parseResult = payloadSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.flatten() });
      }

      const { targetUserId } = parseResult.data;
      const currentUserId = (request.user as { sub: string }).sub;

      const result = await createOrGetDirectChat(app, currentUserId, targetUserId);
      if (result.error) {
        return reply.status(result.status || 400).send({ error: result.error });
      }

      return reply.send(result.chat);
    }
  );

  // List all chats for current user
  app.get(
    "/",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;

      const participantRows = await app.db
        .select({ chatId: chatParticipants.chatId })
        .from(chatParticipants)
        .where(eq(chatParticipants.userId, currentUserId));

      const chatList: ChatSummary[] = [];
      for (const row of participantRows) {
        const summary = await getChatSummary(app, row.chatId, currentUserId);
        if (summary) {
          chatList.push(summary);
        }
      }

      chatList.sort((a, b) => {
        const timeA = a.lastMessage?.time
          ? new Date(a.lastMessage.time).getTime()
          : new Date(a.createdAt).getTime();
        const timeB = b.lastMessage?.time
          ? new Date(b.lastMessage.time).getTime()
          : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });

      return reply.send(chatList);
    }
  );

  // Get messages for chat with cursor pagination (upward scrolling: older pages)
  app.get<{
    Params: { chatId: string };
    Querystring: { cursor?: string; limit?: string };
  }>(
    "/:chatId/messages",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;
      const { chatId } = request.params;
      const limit = Math.min(Math.max(Number(request.query.limit) || 40, 1), 100);
      const cursor = request.query.cursor ? new Date(request.query.cursor) : null;

      // Check participant access
      const participantRows = await app.db
        .select()
        .from(chatParticipants)
        .where(
          and(
            eq(chatParticipants.chatId, chatId),
            eq(chatParticipants.userId, currentUserId)
          )
        )
        .limit(1);

      if (participantRows.length === 0) {
        return reply.status(403).send({ error: "Forbidden: Not a participant of this chat" });
      }

      // Query messages ordered by createdAt DESC
      const conditions = [eq(messages.chatId, chatId)];
      if (cursor && !isNaN(cursor.getTime())) {
        conditions.push(lt(messages.createdAt, cursor));
      }

      const rows = await app.db
        .select()
        .from(messages)
        .where(and(...conditions))
        .orderBy(desc(messages.createdAt))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor =
        hasMore && pageRows.length > 0
          ? pageRows[pageRows.length - 1].createdAt.toISOString()
          : null;

      // Fetch receipts, reactions, stars, and media for these messages
      const messageIds = pageRows.map((r) => r.id);
      const receiptsMap = new Map<string, Array<{ userId: string; status: string }>>();

      if (messageIds.length > 0) {
        const receiptRows = await app.db
          .select()
          .from(messageReceipts)
          .where(inArray(messageReceipts.messageId, messageIds));

        for (const rc of receiptRows) {
          const list = receiptsMap.get(rc.messageId) || [];
          list.push({ userId: rc.userId, status: rc.status });
          receiptsMap.set(rc.messageId, list);
        }
      }

      const { reactionsMap, starsSet, mediaMap } = await hydrateMessagesMetadata(
        app,
        pageRows,
        currentUserId
      );

      // Fetch all participants in this chat to compute aggregated receipt status
      const allParticipants = await app.db
        .select({ userId: chatParticipants.userId })
        .from(chatParticipants)
        .where(eq(chatParticipants.chatId, chatId));

      const otherParticipantIds = allParticipants
        .filter((p) => p.userId !== currentUserId)
        .map((p) => p.userId);

      const payloadList: MessagePayload[] = pageRows.map((msg) => {
        const rcList = receiptsMap.get(msg.id) || [];
        const status = computeStatusFromReceipts(
          msg.senderId,
          currentUserId,
          otherParticipantIds,
          rcList
        );

        return formatMessagePayload(
          msg,
          status,
          starsSet.has(msg.id),
          mediaMap,
          reactionsMap
        );
      });

      // Reverse so messages are returned in chronological ascending order
      payloadList.reverse();

      const response: MessagesPageResponse = {
        messages: payloadList,
        nextCursor,
        hasMore,
      };

      return reply.send(response);
    }
  );

  // Toggle star on a message
  app.post<{
    Params: { chatId: string; messageId: string };
  }>(
    "/:chatId/messages/:messageId/star",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;
      const { chatId, messageId } = request.params;

      const participantRows = await app.db
        .select()
        .from(chatParticipants)
        .where(
          and(
            eq(chatParticipants.chatId, chatId),
            eq(chatParticipants.userId, currentUserId)
          )
        )
        .limit(1);

      if (participantRows.length === 0) {
        return reply.status(403).send({ error: "Forbidden: Not a participant of this chat" });
      }

      const msgRows = await app.db
        .select({ id: messages.id })
        .from(messages)
        .where(and(eq(messages.id, messageId), eq(messages.chatId, chatId)))
        .limit(1);

      if (msgRows.length === 0) {
        return reply.status(404).send({ error: "Message not found" });
      }

      const existingStar = await app.db
        .select()
        .from(messageStars)
        .where(
          and(
            eq(messageStars.userId, currentUserId),
            eq(messageStars.messageId, messageId)
          )
        )
        .limit(1);

      let starred: boolean;
      if (existingStar.length > 0) {
        await app.db
          .delete(messageStars)
          .where(
            and(
              eq(messageStars.userId, currentUserId),
              eq(messageStars.messageId, messageId)
            )
          );
        starred = false;
      } else {
        await app.db.insert(messageStars).values({
          userId: currentUserId,
          messageId,
          createdAt: new Date(),
        });
        starred = true;
      }

      return reply.send({ messageId, chatId, starred });
    }
  );

  // Get starred messages for current user (optionally filtered by chatId)
  app.get<{
    Querystring: { chatId?: string };
  }>(
    "/starred",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;
      const { chatId } = request.query;

      const conditions = [eq(messageStars.userId, currentUserId)];
      if (chatId) {
        conditions.push(eq(messages.chatId, chatId));
      }

      const starredRows = await app.db
        .select({
          msg: messages,
          starredAt: messageStars.createdAt,
        })
        .from(messageStars)
        .innerJoin(messages, eq(messageStars.messageId, messages.id))
        .where(and(...conditions))
        .orderBy(desc(messageStars.createdAt));

      const msgRows = starredRows.map((r) => r.msg);
      const { reactionsMap, mediaMap } = await hydrateMessagesMetadata(
        app,
        msgRows,
        currentUserId
      );

      const result: MessagePayload[] = [];
      for (const msg of msgRows) {
        const status = await computeMessageStatusForViewer(
          app,
          msg.chatId,
          msg.id,
          msg.senderId,
          currentUserId
        );

        result.push(
          formatMessagePayload(msg, status, true, mediaMap, reactionsMap)
        );
      }

      return reply.send(result);
    }
  );

  // Forward messages to direct or group chats
  app.post(
    "/forward",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;

      const bodySchema = z.object({
        messageIds: z.array(z.string().uuid()).min(1),
        targetChatIds: z.array(z.string().uuid()).optional(),
        targetUserIds: z.array(z.string().uuid()).optional(),
      });

      const parseResult = bodySchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.flatten() });
      }

      const { messageIds, targetChatIds = [], targetUserIds = [] } = parseResult.data;

      if (targetChatIds.length === 0 && targetUserIds.length === 0) {
        return reply
          .status(400)
          .send({ error: "At least one targetChatId or targetUserId is required" });
      }

      // Fetch source messages and verify caller is a participant of each source chat
      const sourceMsgs = await app.db
        .select()
        .from(messages)
        .where(inArray(messages.id, messageIds));

      if (sourceMsgs.length === 0) {
        return reply.status(404).send({ error: "No source messages found" });
      }

      const sourceChatIds = Array.from(new Set(sourceMsgs.map((m) => m.chatId)));
      const sourceParticipants = await app.db
        .select({ chatId: chatParticipants.chatId })
        .from(chatParticipants)
        .where(
          and(
            inArray(chatParticipants.chatId, sourceChatIds),
            eq(chatParticipants.userId, currentUserId)
          )
        );

      const allowedSourceChats = new Set(sourceParticipants.map((p) => p.chatId));
      const validSourceMsgs = sourceMsgs.filter(
        (m) => allowedSourceChats.has(m.chatId) && !m.deletedAt
      );

      if (validSourceMsgs.length === 0) {
        return reply.status(403).send({ error: "Forbidden or deleted source messages" });
      }

      // Resolve all destination chat IDs
      const destinationChatIds = new Set<string>();

      for (const tChatId of targetChatIds) {
        const participantCheck = await app.db
          .select()
          .from(chatParticipants)
          .where(
            and(
              eq(chatParticipants.chatId, tChatId),
              eq(chatParticipants.userId, currentUserId)
            )
          )
          .limit(1);
        if (participantCheck.length > 0) {
          destinationChatIds.add(tChatId);
        }
      }

      for (const targetUid of targetUserIds) {
        const directRes = await createOrGetDirectChat(app, currentUserId, targetUid);
        if (directRes.chat) {
          destinationChatIds.add(directRes.chat.id);
        }
      }

      const createdPayloads: MessagePayload[] = [];
      const io = (app as any).io;

      for (const destChatId of destinationChatIds) {
        const participants = await app.db
          .select({ userId: chatParticipants.userId })
          .from(chatParticipants)
          .where(eq(chatParticipants.chatId, destChatId));

        for (const srcMsg of validSourceMsgs) {
          const newMsgId = crypto.randomUUID();
          const now = new Date();
          let clonedMediaId: string | null = null;
          let mediaPayloadData: MediaPayload | null = null;

          if (srcMsg.mediaId) {
            const mediaRows = await app.db
              .select()
              .from(mediaAttachments)
              .where(eq(mediaAttachments.id, srcMsg.mediaId))
              .limit(1);

            if (mediaRows.length > 0) {
              const origMedia = mediaRows[0];
              clonedMediaId = crypto.randomUUID();
              const [insertedMedia] = await app.db
                .insert(mediaAttachments)
                .values({
                  id: clonedMediaId,
                  chatId: destChatId,
                  uploaderId: currentUserId,
                  type: origMedia.type,
                  url: origMedia.url,
                  storageKey: `chats/${destChatId}/${clonedMediaId}/forwarded_${Date.now()}`,
                  blurhash: origMedia.blurhash,
                  orientation: origMedia.orientation,
                  duration: origMedia.duration,
                  width: origMedia.width,
                  height: origMedia.height,
                  sizeBytes: origMedia.sizeBytes,
                  mimeType: origMedia.mimeType,
                  status: "attached",
                })
                .returning();
              mediaPayloadData = toMediaPayload(insertedMedia);
            }
          }

          await app.db.insert(messages).values({
            id: newMsgId,
            chatId: destChatId,
            senderId: currentUserId,
            body: srcMsg.body,
            mediaId: clonedMediaId,
            forwarded: true,
            createdAt: now,
          });

          if (clonedMediaId) {
            await app.db
              .update(mediaAttachments)
              .set({ messageId: newMsgId })
              .where(eq(mediaAttachments.id, clonedMediaId));
          }

          const msgPayload: MessagePayload = {
            id: newMsgId,
            chatId: destChatId,
            owner: currentUserId,
            body: srcMsg.body,
            forwarded: true,
            time: now.toISOString(),
            status: "send",
            starred: false,
            hasMedia: mediaPayloadData,
            reactions: [],
          };

          createdPayloads.push(msgPayload);

          if (io) {
            const rooms = [
              `chat:${destChatId}`,
              ...participants.map((p) => `user:${p.userId}`),
            ];
            io.to(rooms).emit("message:new", msgPayload);
          }
        }
      }

      return reply.send({ messages: createdPayloads });
    }
  );
};

async function getChatSummary(
  app: FastifyInstance,
  chatId: string,
  currentUserId: string
): Promise<ChatSummary | null> {
  const chatRows = await app.db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (chatRows.length === 0) return null;
  const chat = chatRows[0];

  const participantRows = await app.db
    .select({
      chatId: chatParticipants.chatId,
      userId: chatParticipants.userId,
      role: chatParticipants.role,
      pinned: chatParticipants.pinned,
      muted: chatParticipants.muted,
      archived: chatParticipants.archived,
      lastReadAt: chatParticipants.lastReadAt,
      userName: users.name,
      userEmail: users.email,
      userBio: users.bio,
      userPictureUrl: users.pictureUrl,
      userCreatedAt: users.createdAt,
    })
    .from(chatParticipants)
    .innerJoin(users, eq(chatParticipants.userId, users.id))
    .where(eq(chatParticipants.chatId, chatId));

  const participants: ChatParticipantSummary[] = participantRows.map((p) => ({
    userId: p.userId,
    role: p.role as "admin" | "member",
    pinned: p.pinned,
    muted: p.muted,
    archived: p.archived,
    lastReadAt: p.lastReadAt.toISOString(),
    user: {
      id: p.userId,
      email: p.userEmail,
      name: p.userName,
      bio: p.userBio,
      pictureUrl: p.userPictureUrl,
      createdAt: p.userCreatedAt.toISOString(),
    },
  }));

  // Find latest message
  const lastMsgRows = await app.db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))
    .limit(1);

  let lastMessage: MessagePayload | null = null;
  if (lastMsgRows.length > 0) {
    const lm = lastMsgRows[0];
    const status = await computeMessageStatusForViewer(
      app,
      chatId,
      lm.id,
      lm.senderId,
      currentUserId
    );

    const { reactionsMap, starsSet, mediaMap } = await hydrateMessagesMetadata(
      app,
      [lm],
      currentUserId
    );

    lastMessage = formatMessagePayload(
      lm,
      status,
      starsSet.has(lm.id),
      mediaMap,
      reactionsMap
    );
  }

  // Compute unread count for current user
  const currentParticipant = participants.find((p) => p.userId === currentUserId);
  let unreadCount = 0;
  if (currentParticipant) {
    const unreadResult = await app.db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.chatId, chatId),
          sql`${messages.createdAt} > ${new Date(currentParticipant.lastReadAt)}`,
          sql`${messages.senderId} <> ${currentUserId}`
        )
      );
    unreadCount = Number(unreadResult[0]?.count || 0);
  }

  return {
    id: chat.id,
    type: chat.type as "direct" | "group",
    title: chat.title,
    bio: chat.bio || null,
    pictureUrl: chat.pictureUrl,
    directPairHash: chat.directPairHash,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
    participants,
    lastMessage,
    unreadCount,
  };
}
