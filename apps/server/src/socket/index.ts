import { Server as SocketIOServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { FastifyInstance } from "fastify";
import { eq, and, sql } from "drizzle-orm";
import {
  chatParticipants,
  messages,
  messageReceipts,
  users,
} from "../db/schema.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  MessagePayload,
} from "@chat-me/shared";

interface SocketData {
  userId: string;
}

const userSocketCounts = new Map<string, number>();

export function isUserOnline(userId: string): boolean {
  return (userSocketCounts.get(userId) || 0) > 0;
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
  const subClient = pubClient.duplicate();

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
      io.emit("presence:updated", {
        userId,
        status: "online",
      });
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
      const { id, chatId, body } = payload;
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

        const now = new Date();
        await app.db.insert(messages).values({
          id,
          chatId,
          senderId: userId,
          body,
          createdAt: now,
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
          hasMedia: null,
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

          const statusPayload = {
            messageId: msgId,
            chatId,
            status: "received" as const,
            userId,
            updatedAt: now.toISOString(),
          };

          broadcastToChatAndParticipants(
            io,
            chatId,
            participants,
            "message:status_changed",
            statusPayload
          );
          broadcastToChatAndParticipants(
            io,
            chatId,
            participants,
            "receipt:updated",
            statusPayload
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
          .select({ id: messages.id })
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

          const statusPayload = {
            messageId: msg.id,
            chatId,
            status: "read" as const,
            userId,
            updatedAt: now.toISOString(),
          };

          broadcastToChatAndParticipants(
            io,
            chatId,
            participants,
            "message:status_changed",
            statusPayload
          );
          broadcastToChatAndParticipants(
            io,
            chatId,
            participants,
            "receipt:updated",
            statusPayload
          );
        }
      } catch (err) {
        app.log.error({ err, chatId, lastMessageId }, "Error processing read receipt");
      }
    });

    // Ephemeral typing indicator
    socket.on("chat:typing", async ({ chatId, isTyping }) => {
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

        if (membership.length === 0) return;

        // Broadcast to other participants in the chat
        const participants = await app.db
          .select({ userId: chatParticipants.userId })
          .from(chatParticipants)
          .where(eq(chatParticipants.chatId, chatId));

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
            .set({ updatedAt: now })
            .where(eq(users.id, userId));
        } catch (err) {
          app.log.error({ err, userId }, "Error updating user last seen on disconnect");
        }

        io.emit("presence:updated", {
          userId,
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
