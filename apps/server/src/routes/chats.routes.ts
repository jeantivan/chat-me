import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq, and, sql, desc, lt, inArray } from "drizzle-orm";
import {
  chats,
  chatParticipants,
  messages,
  messageReceipts,
  users,
  contacts,
  generateDirectPairHash,
} from "../db/schema.js";
import type {
  ChatSummary,
  ChatParticipantSummary,
  MessagePayload,
  MessagesPageResponse,
  DeliveryStatus,
} from "@chat-me/shared";

export const chatsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
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

      if (currentUserId === targetUserId) {
        return reply.status(400).send({ error: "Cannot create chat with self" });
      }

      // Check target user exists
      const targetUsers = await app.db
        .select()
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (targetUsers.length === 0) {
        return reply.status(404).send({ error: "Target user not found" });
      }

      const pairHash = generateDirectPairHash(currentUserId, targetUserId);

      // Check if chat already exists
      let existingChats = await app.db
        .select()
        .from(chats)
        .where(eq(chats.directPairHash, pairHash))
        .limit(1);

      let chatId: string;

      if (existingChats.length > 0) {
        chatId = existingChats[0].id;
      } else {
        // Create new direct chat
        const [newChat] = await app.db
          .insert(chats)
          .values({
            type: "direct",
            directPairHash: pairHash,
          })
          .returning();

        chatId = newChat.id;

        // Add both participants
        await app.db.insert(chatParticipants).values([
          { chatId, userId: currentUserId, role: "member" },
          { chatId, userId: targetUserId, role: "member" },
        ]);

        // Ensure bidirectional contacts
        await app.db
          .insert(contacts)
          .values([
            { userId: currentUserId, contactUserId: targetUserId },
            { userId: targetUserId, contactUserId: currentUserId },
          ])
          .onConflictDoNothing();
      }

      // Fetch full chat summary
      const chatSummary = await getChatSummary(app, chatId, currentUserId);
      return reply.send(chatSummary);
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

      // Check participant membership
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

      // Fetch receipts for these messages to compute delivery status
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

      const payloadList: MessagePayload[] = pageRows.map((msg) => {
        const rcList = receiptsMap.get(msg.id) || [];
        let status: DeliveryStatus = "send";

        if (msg.senderId === currentUserId) {
          // If any recipient has read it -> read
          const hasRead = rcList.some((r) => r.userId !== currentUserId && r.status === "read");
          const hasReceived = rcList.some(
            (r) => r.userId !== currentUserId && (r.status === "received" || r.status === "read")
          );
          if (hasRead) {
            status = "read";
          } else if (hasReceived) {
            status = "received";
          } else {
            status = "send";
          }
        } else {
          // Message sent by another participant
          const myReceipt = rcList.find((r) => r.userId === currentUserId);
          if (myReceipt?.status === "read") {
            status = "read";
          } else if (myReceipt?.status === "received") {
            status = "received";
          } else {
            status = "send";
          }
        }

        return {
          id: msg.id,
          chatId: msg.chatId,
          owner: msg.senderId,
          body: msg.body,
          forwarded: msg.forwarded,
          time: msg.createdAt.toISOString(),
          status,
          starred: false,
          hasMedia: null,
          reactions: [],
        };
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
    lastMessage = {
      id: lm.id,
      chatId: lm.chatId,
      owner: lm.senderId,
      body: lm.body,
      forwarded: lm.forwarded,
      time: lm.createdAt.toISOString(),
      status: "send",
      starred: false,
      hasMedia: null,
      reactions: [],
    };
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
    pictureUrl: chat.pictureUrl,
    directPairHash: chat.directPairHash,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
    participants,
    lastMessage,
    unreadCount,
  };
}
