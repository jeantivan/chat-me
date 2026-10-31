import { Server as SocketIOServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { FastifyInstance } from "fastify";
import { eq, and, sql, inArray } from "drizzle-orm";
import {
  chatParticipants,
  messages,
  messageReceipts,
  messageReactions,
  mediaAttachments,
  users,
  chats,
  userSettings,
} from "../db/schema.js";
import { toMediaPayload } from "../lib/media.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  MessagePayload,
  MediaPayload,
  UserProfile,
} from "@chat-me/shared";
import { processAndBroadcastReceipt } from "../lib/receipts.js";
import { canViewPresence, sanitizeUserProfile } from "../lib/privacy.js";

interface SocketData {
  userId: string;
}

const userSocketCounts = new Map<string, number>();

export function isUserOnline(userId: string): boolean {
  return (userSocketCounts.get(userId) || 0) > 0;
}

export async function syncPresenceOnPrivacyChange(
  app: FastifyInstance,
  userId: string
): Promise<void> {
  if (!app.io) return;
  const isOnline = isUserOnline(userId);
  const userRows = await app.db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const userLastSeen = userRows[0]?.lastSeenAt.toISOString();

  for (const otherUserId of userSocketCounts.keys()) {
    if (otherUserId === userId) continue;

    // Reciprocal check: canViewPresence evaluates target and viewer symmetrically.
    const canSeePresence = await canViewPresence(app.db, userId, otherUserId);
    if (canSeePresence) {
      app.io.to(`user:${otherUserId}`).emit("presence:updated", {
        userId,
        status: isOnline ? "online" : "offline",
        ...(isOnline ? {} : userLastSeen ? { lastSeenAt: userLastSeen } : {}),
      });
    } else {
      app.io.to(`user:${otherUserId}`).emit("presence:updated", {
        userId,
        status: "offline",
      });
    }

    const otherOnline = isUserOnline(otherUserId);
    if (canSeePresence) {
      app.io.to(`user:${userId}`).emit("presence:updated", {
        userId: otherUserId,
        status: otherOnline ? "online" : "offline",
      });
    } else {
      app.io.to(`user:${userId}`).emit("presence:updated", {
        userId: otherUserId,
        status: "offline",
      });
    }
  }
}

export async function broadcastSanitizedProfileUpdate(
  app: FastifyInstance,
  profile: UserProfile
): Promise<void> {
  if (!app.io) return;
  // Always deliver full unredacted profile to the owner themselves
  app.io.to(`user:${profile.id}`).emit("user:profile_updated", profile);

  for (const viewerId of userSocketCounts.keys()) {
    if (viewerId === profile.id) continue;
    const sanitized = await sanitizeUserProfile(app.db, profile, viewerId);
    app.io.to(`user:${viewerId}`).emit("user:profile_updated", sanitized);
  }
}

function broadcastToChatAndParticipants(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
  chatId: string,
  participants: Array<{ userId: string }>,
  event: keyof ServerToClientEvents,
  payload: any
) {
  const rooms = [`chat:${chatId}`, ...participants.map((p) => `user:${p.userId}`)];
  io.to(rooms).emit(event as any, payload);
}

function broadcastPresenceToConnectedPeers(
  app: FastifyInstance,
  userId: string,
  payload: { status: "online" | "offline"; lastSeenAt?: string }
): void {
  for (const otherUserId of userSocketCounts.keys()) {
    if (otherUserId !== userId) {
      canViewPresence(app.db, userId, otherUserId).then((canSee) => {
        if (canSee) {
          app.io.to(`user:${otherUserId}`).emit("presence:updated", {
            userId,
            ...payload,
          });
        }
      });
    }
  }
}

export function setupSocketServer(
  app: FastifyInstance,
  redisUrl: string
): SocketIOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> {
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(app.server, {
    cors: {
      origin: true,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Redis Adapter
  const pubClient = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });
  pubClient.on("error", (err) => {
    app.log.warn({ err }, "Socket.IO Redis pubClient error");
  });
  const subClient = pubClient.duplicate();
  subClient.on("error", (err) => {
    app.log.warn({ err }, "Socket.IO Redis subClient error");
  });

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
  }).catch((err) => {
    app.log.warn({ err }, "Socket.IO Redis adapter connection error, running with default in-memory adapter");
  });

  // Clean up on server close
  app.addHook("onClose", async () => {
    io.close();
    pubClient.disconnect();
    subClient.disconnect();
  });

  // JWT Connection Handshake Authentication
  io.use(async (socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>, next) => {
    try {
      const authHeader =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization;

      if (!authHeader) {
        return next(new Error("Unauthorized: Missing token"));
      }

      const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

      const payload = app.jwt.verify<{ sub?: string; type?: string }>(token);
      if (!payload || payload.type !== "access" || !payload.sub) {
        return next(new Error("Unauthorized: Invalid token"));
      }

      socket.data.userId = payload.sub;
      return next();
    } catch {
      return next(new Error("Unauthorized: Verification failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // Track active connection and broadcast online presence
    const currentCount = userSocketCounts.get(userId) || 0;
    userSocketCounts.set(userId, currentCount + 1);
    if (currentCount === 0) {
      broadcastPresenceToConnectedPeers(app, userId, { status: "online" });
    }

    // Hydrate currently online users to this newly connected socket
    for (const [onlineUserId, count] of userSocketCounts.entries()) {
      if (onlineUserId !== userId && count > 0) {
        canViewPresence(app.db, onlineUserId, userId).then((canSee) => {
          if (canSee) {
            socket.emit("presence:updated", {
              userId: onlineUserId,
              status: "online",
            });
          }
        });
      }
    }

    // Join per-user room
    socket.join(`user:${userId}`);

    // Join per-chat room
    socket.on("chat:join", async (chatId: string) => {
      try {
        const membership = await app.db
          .select()
          .from(chatParticipants)
          .where(
            and(
              eq(chatParticipants.chatId, chatId),
              eq(chatParticipants.userId, userId)
            )
          )
          .limit(1);

        if (membership.length > 0) {
          socket.join(`chat:${chatId}`);
        }
      } catch (err) {
        app.log.error({ err, chatId, userId }, "Error joining chat room");
      }
    });

    // Send message event
    socket.on("message:send", async (payload, callback) => {
      const { id, chatId, body, mediaId } = payload;
      try {
        const membership = await app.db
          .select()
          .from(chatParticipants)
          .where(
            and(
              eq(chatParticipants.chatId, chatId),
              eq(chatParticipants.userId, userId)
            )
          )
          .limit(1);

        if (membership.length === 0) {
          if (callback) {
            callback({
              success: false,
              id,
              createdAt: "",
              error: "Not a participant of this chat",
            });
          }
          return;
        }

        let mediaPayloadData: MediaPayload | null = null;
        if (mediaId) {
          const mediaRows = await app.db
            .select()
            .from(mediaAttachments)
            .where(
              and(
                eq(mediaAttachments.id, mediaId),
                eq(mediaAttachments.chatId, chatId),
                eq(mediaAttachments.uploaderId, userId),
                eq(mediaAttachments.status, "pending")
              )
            )
            .limit(1);

          if (mediaRows.length === 0) {
            if (callback) {
              callback({
                success: false,
                id,
                createdAt: "",
                error: "Invalid media attachment",
              });
            }
            return;
          }

          mediaPayloadData = toMediaPayload(mediaRows[0]);
        }

        const now = new Date();
        await app.db.transaction(async (tx) => {
          await tx.insert(messages).values({
            id,
            chatId,
            senderId: userId,
            body,
            mediaId: mediaId || null,
            createdAt: now,
          });

          if (mediaId) {
            await tx
              .update(mediaAttachments)
              .set({
                messageId: id,
                status: "attached",
                updatedAt: now,
              })
              .where(eq(mediaAttachments.id, mediaId));
          }
        });

        if (callback) {
          callback({
            success: true,
            id,
            createdAt: now.toISOString(),
          });
        }

        const messagePayload: MessagePayload = {
          id,
          chatId,
          owner: userId,
          body,
          forwarded: false,
          time: now.toISOString(),
          status: "send",
          starred: false,
          hasMedia: mediaPayloadData,
          reactions: [],
        };

        // Broadcast to chat room and individual participant rooms (deduplicated)
        const participants = await app.db
          .select({ userId: chatParticipants.userId })
          .from(chatParticipants)
          .where(eq(chatParticipants.chatId, chatId));

        broadcastToChatAndParticipants(io, chatId, participants, "message:new", messagePayload);
      } catch (err) {
        app.log.error({ err, id, chatId }, "Error persisting sent message");
        if (callback) {
          callback({
            success: false,
            id,
            createdAt: "",
            error: "Failed to save message",
          });
        }
      }
    });

    // Acknowledge receipt on device (received)
    socket.on("message:ack_received", async ({ chatId, messageIds }) => {
      if (!messageIds || messageIds.length === 0) return;
      try {
        const now = new Date();
        const participants = await app.db
          .select({ userId: chatParticipants.userId })
          .from(chatParticipants)
          .where(eq(chatParticipants.chatId, chatId));

        for (const msgId of messageIds) {
          const msg = await app.db
            .select({ senderId: messages.senderId })
            .from(messages)
            .where(eq(messages.id, msgId))
            .limit(1);

          if (!msg.length || msg[0].senderId === userId) {
            continue;
          }

          await app.db
            .insert(messageReceipts)
            .values({
              messageId: msgId,
              userId,
              status: "received",
              updatedAt: now,
            })
            .onConflictDoUpdate({
              target: [messageReceipts.messageId, messageReceipts.userId],
              set: {
                status: sql`CASE WHEN ${messageReceipts.status} = 'read' THEN 'read' ELSE 'received' END`,
                updatedAt: now,
              },
            });

          await processAndBroadcastReceipt(
            app,
            io,
            chatId,
            msgId,
            msg[0].senderId,
            userId,
            "received",
            participants,
            now
          );
        }
      } catch (err) {
        app.log.error({ err, chatId, messageIds }, "Error updating received receipt");
      }
    });

    // Acknowledge read in active viewport (read)
    socket.on("message:ack_read", async ({ chatId, lastMessageId }) => {
      try {
        const now = new Date();

        // Update lastReadAt for participant
        await app.db
          .update(chatParticipants)
          .set({ lastReadAt: now })
          .where(
            and(
              eq(chatParticipants.chatId, chatId),
              eq(chatParticipants.userId, userId)
            )
          );

        // Check if direct chat and privacyReadReceipt reciprocity applies
        const chatRows = await app.db
          .select({ type: chats.type })
          .from(chats)
          .where(eq(chats.id, chatId))
          .limit(1);

        if (chatRows.length > 0 && chatRows[0].type === "direct") {
          const participantSettings = await app.db
            .select({ privacyReadReceipt: userSettings.privacyReadReceipt })
            .from(chatParticipants)
            .innerJoin(userSettings, eq(chatParticipants.userId, userSettings.userId))
            .where(eq(chatParticipants.chatId, chatId));

          const allAllowReceipts = participantSettings.every(
            (s) => s.privacyReadReceipt === true
          );

          if (!allAllowReceipts) {
            // Read receipt reciprocity: do not record or broadcast 'read' status
            return;
          }
        }

        // Find last message timestamp if lastMessageId provided
        let targetDate = now;
        if (lastMessageId) {
          const lastMsg = await app.db
            .select({ createdAt: messages.createdAt })
            .from(messages)
            .where(eq(messages.id, lastMessageId))
            .limit(1);

          if (lastMsg.length > 0) {
            targetDate = lastMsg[0].createdAt;
          }
        }

        const participants = await app.db
          .select({ userId: chatParticipants.userId })
          .from(chatParticipants)
          .where(eq(chatParticipants.chatId, chatId));

        // Find unread messages sent by others in this chat up to targetDate (skipping already-read messages)
        const unreadMsgs = await app.db
          .select({ id: messages.id, senderId: messages.senderId })
          .from(messages)
          .leftJoin(
            messageReceipts,
            and(
              eq(messageReceipts.messageId, messages.id),
              eq(messageReceipts.userId, userId)
            )
          )
          .where(
            and(
              eq(messages.chatId, chatId),
              sql`${messages.senderId} <> ${userId}`,
              sql`${messages.createdAt} <= ${targetDate}`,
              sql`(${messageReceipts.status} IS NULL OR ${messageReceipts.status} <> 'read')`
            )
          );

        for (const msg of unreadMsgs) {
          await app.db
            .insert(messageReceipts)
            .values({
              messageId: msg.id,
              userId,
              status: "read",
              updatedAt: now,
            })
            .onConflictDoUpdate({
              target: [messageReceipts.messageId, messageReceipts.userId],
              set: {
                status: "read",
                updatedAt: now,
              },
            });

          await processAndBroadcastReceipt(
            app,
            io,
            chatId,
            msg.id,
            msg.senderId,
            userId,
            "read",
            participants,
            now
          );
        }
      } catch (err) {
        app.log.error({ err, chatId, lastMessageId }, "Error processing read receipt");
      }
    });

    // React or toggle reaction on message
    socket.on("message:reaction", async ({ messageId, chatId, emoji }, callback) => {
      try {
        const participants = await app.db
          .select({ userId: chatParticipants.userId })
          .from(chatParticipants)
          .where(eq(chatParticipants.chatId, chatId));

        const isParticipant = participants.some((p) => p.userId === userId);
        if (!isParticipant) {
          if (callback) callback({ success: false, error: "Forbidden" });
          return;
        }

        const msgRows = await app.db
          .select({ id: messages.id })
          .from(messages)
          .where(and(eq(messages.id, messageId), eq(messages.chatId, chatId)))
          .limit(1);

        if (msgRows.length === 0) {
          if (callback) callback({ success: false, error: "Message not found" });
          return;
        }

        if (!emoji) {
          await app.db
            .delete(messageReactions)
            .where(
              and(
                eq(messageReactions.messageId, messageId),
                eq(messageReactions.userId, userId)
              )
            );
        } else {
          await app.db
            .insert(messageReactions)
            .values({
              messageId,
              userId,
              emoji,
              createdAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [messageReactions.messageId, messageReactions.userId],
              set: {
                emoji,
                createdAt: new Date(),
              },
            });
        }

        const reactionRows = await app.db
          .select()
          .from(messageReactions)
          .where(eq(messageReactions.messageId, messageId));

        const reactions = reactionRows.map((r) => ({
          owner: r.userId,
          type: r.emoji,
        }));

        if (callback) callback({ success: true });

        broadcastToChatAndParticipants(
          io,
          chatId,
          participants,
          "message:reaction_updated",
          {
            messageId,
            chatId,
            reactions,
          }
        );
      } catch (err) {
        app.log.error({ err, messageId, chatId, userId }, "Error handling message:reaction");
        if (callback) callback({ success: false, error: "Failed to update reaction" });
      }
    });

    // Soft-delete message ("Delete for everyone")
    socket.on("message:delete", async ({ messageId, chatId }, callback) => {
      try {
        const msgRows = await app.db
          .select({
            id: messages.id,
            senderId: messages.senderId,
            chatId: messages.chatId,
          })
          .from(messages)
          .where(and(eq(messages.id, messageId), eq(messages.chatId, chatId)))
          .limit(1);

        if (msgRows.length === 0) {
          if (callback) callback({ success: false, error: "Message not found" });
          return;
        }

        if (msgRows[0].senderId !== userId) {
          if (callback) callback({ success: false, error: "Forbidden: Only sender can delete message" });
          return;
        }

        const now = new Date();
        await app.db
          .update(messages)
          .set({
            deletedAt: now,
          })
          .where(eq(messages.id, messageId));

        if (callback) callback({ success: true });

        const participants = await app.db
          .select({ userId: chatParticipants.userId })
          .from(chatParticipants)
          .where(eq(chatParticipants.chatId, chatId));

        broadcastToChatAndParticipants(
          io,
          chatId,
          participants,
          "message:deleted",
          {
            messageId,
            chatId,
          }
        );
      } catch (err) {
        app.log.error({ err, messageId, chatId, userId }, "Error handling message:delete");
        if (callback) callback({ success: false, error: "Failed to delete message" });
      }
    });

    // Ephemeral typing indicator
    socket.on("chat:typing", async ({ chatId, isTyping }) => {
      try {
        const participants = await app.db
          .select({ userId: chatParticipants.userId })
          .from(chatParticipants)
          .where(eq(chatParticipants.chatId, chatId));

        const isMember = participants.some((p) => p.userId === userId);
        if (!isMember) return;

        // Broadcast to other participants in the chat
        const targetRooms = [
          `chat:${chatId}`,
          ...participants
            .filter((p) => p.userId !== userId)
            .map((p) => `user:${p.userId}`),
        ];

        socket.to(targetRooms).emit("chat:typing_updated", {
          chatId,
          userId,
          isTyping,
        });
      } catch (err) {
        app.log.error({ err, chatId, userId }, "Error handling chat:typing");
      }
    });

    // Presence heartbeat
    socket.on("presence:heartbeat", () => {
      // Keep-alive heartbeat acknowledgment
    });

    // Handle socket disconnect
    socket.on("disconnect", async () => {
      const remaining = (userSocketCounts.get(userId) || 1) - 1;
      if (remaining <= 0) {
        userSocketCounts.delete(userId);
        const now = new Date();
        try {
          await app.db
            .update(users)
            .set({ lastSeenAt: now })
            .where(eq(users.id, userId));
        } catch (err) {
          app.log.error({ err, userId }, "Error updating user last seen on disconnect");
        }

        broadcastPresenceToConnectedPeers(app, userId, {
          status: "offline",
          lastSeenAt: now.toISOString(),
        });
      } else {
        userSocketCounts.set(userId, remaining);
      }
    });
  });

  return io;
}
