import type { FastifyInstance } from "fastify";
import type { Server as SocketIOServer } from "socket.io";
import { eq, and, sql, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  chats,
  chatParticipants,
  messages,
  messageReceipts,
  users,
  userSettings,
} from "../db/schema.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  MessagePayload,
  ReceiptStatusPayload,
} from "@chat-me/shared";
import { processAndBroadcastReceipt } from "../lib/receipts.js";
import { isBlockActiveBetween } from "../lib/privacy.js";
import { isUserOnline, broadcastToChatAndParticipants, type SocketData } from "./index.js";
import { makeLexicalBody } from "../services/onboarding.service.js";

export interface DemoAutoReplyDelays {
  receivedMs: number;
  readMs: number;
  typingMs: number;
  replyMs: number;
}

export const DEFAULT_DEMO_DELAYS: DemoAutoReplyDelays = {
  receivedMs: 400,
  readMs: 900,
  typingMs: 1200,
  replyMs: 2200,
};

interface ScheduledJob {
  recipientId: string;
  chatId: string;
  timers: NodeJS.Timeout[];
  cancelTyping?: () => void;
}

const pendingJobsByRecipient = new Map<string, ScheduledJob[]>();

function clearScheduledJob(job: ScheduledJob): void {
  for (const timer of job.timers) {
    clearTimeout(timer);
  }
  if (job.cancelTyping) {
    try {
      job.cancelTyping();
    } catch {
      // Silently ignore cleanup errors
    }
  }
}

/**
 * Immediately cancels any pending demo responder jobs for a user when they connect.
 */
export function cancelPendingDemoJobsForUser(userId: string): void {
  const jobs = pendingJobsByRecipient.get(userId);
  if (!jobs || jobs.length === 0) return;

  for (const job of jobs) {
    clearScheduledJob(job);
  }

  pendingJobsByRecipient.delete(userId);
}

/**
 * Clears all pending demo auto-responder jobs on server shutdown or reset.
 */
export function cancelAllPendingDemoJobs(): void {
  for (const jobs of pendingJobsByRecipient.values()) {
    for (const job of jobs) {
      clearScheduledJob(job);
    }
  }
  pendingJobsByRecipient.clear();
}

/**
 * Safely extracts raw plain text from either serialized Lexical JSON or plain text.
 */
export function extractPlainTextFromBody(body: string): string {
  if (!body || typeof body !== "string") return "";
  const trimmed = body.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && parsed.root) {
        const textParts: string[] = [];
        const traverse = (node: any) => {
          if (!node) return;
          if (typeof node.text === "string") {
            textParts.push(node.text);
          }
          if (Array.isArray(node.children)) {
            node.children.forEach(traverse);
          }
        };
        traverse(parsed.root);
        return textParts.join(" ").trim();
      }
    } catch {
      // Fallback to raw string
    }
  }
  return trimmed;
}

/**
 * Produces contextual, conversational replies showcasing live portfolio capabilities.
 */
export function generateContextualReply(inboundBody: string): string {
  const text = extractPlainTextFromBody(inboundBody).toLowerCase();

  if (/\b(hi|hello|hey|hola|buenos|buenas|greetings)\b/i.test(text)) {
    return "Hi! Thanks for checking out the demo. Feel free to explore live messaging, delivery receipts, and media attachments!";
  }
  if (/\b(how are you|how's it going|que tal|como estas|how are things)\b/i.test(text)) {
    return "I'm doing great, thanks for asking! I'm an offline demo counterpart demonstrating real-time receipts and typing presence in a single browser tab.";
  }
  if (/\b(test|testing|ping|prueba|probando|websocket)\b/i.test(text)) {
    return "Test confirmed! Real-time WebSockets, typing indicators, and delivery receipts (sent -> received -> read) are operating cleanly.";
  }
  if (/\b(feature|features|demo|portfolio|architecture|stack)\b/i.test(text)) {
    return "Glad you asked! This application features Fastify, PostgreSQL with Drizzle ORM, Redis Pub/Sub, Socket.IO, and TanStack Query with optimistic cache updates.";
  }
  if (/\b(cool|nice|awesome|great|genial|excelente|increible|good)\b/i.test(text)) {
    return "Thank you! I appreciate the feedback. You can also try sending images, reacting with emojis, or creating a group chat.";
  }
  if (/\b(bye|goodbye|see you|cya|adios|chao|hasta luego)\b/i.test(text)) {
    return "Goodbye! Thanks for taking the time to test chat-me.";
  }

  return "Thanks for your message! I received it loud and clear on this single-tab demo.";
}

export interface DemoAutoReplyParams {
  app: FastifyInstance;
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
  chatId: string;
  messageId: string;
  senderId: string;
  body: string;
  enabled?: boolean;
  delays?: Partial<DemoAutoReplyDelays>;
}

/**
 * Handles scheduling non-blocking demo auto-responder steps when an offline demo counterpart is messaged.
 */
export async function triggerDemoAutoResponder(params: DemoAutoReplyParams): Promise<void> {
  const { app, io, chatId, messageId, senderId, body, enabled, delays } = params;

  // 1. Check if demo auto-reply is enabled
  const isEnabled = enabled ?? (process.env.DEMO_AUTO_REPLY !== "false" && process.env.NODE_ENV !== "test");
  if (!isEnabled) {
    return;
  }

  try {
    // 2. Verify direct chat
    const chatRows = await app.db
      .select({ type: chats.type })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (chatRows.length === 0 || chatRows[0].type !== "direct") {
      return;
    }

    // 3. Find counterpart participant
    const participantRows = await app.db
      .select({
        userId: chatParticipants.userId,
        email: users.email,
        name: users.name,
      })
      .from(chatParticipants)
      .innerJoin(users, eq(chatParticipants.userId, users.id))
      .where(eq(chatParticipants.chatId, chatId));

    const counterpart = participantRows.find((p) => p.userId !== senderId);
    if (!counterpart) {
      return;
    }

    // 4. Verify seeded demo user (@example.com)
    const isDemoUser = counterpart.email.toLowerCase().endsWith("@example.com");
    if (!isDemoUser) {
      return;
    }

    const recipientId = counterpart.userId;

    // 5. Verify counterpart has no active WebSocket connection
    if (isUserOnline(recipientId)) {
      return;
    }

    // 6. Verify neither participant has blocked the other
    const isBlocked = await isBlockActiveBetween(app.db, senderId, recipientId);
    if (isBlocked) {
      return;
    }

    // Resolve delays
    const timing: DemoAutoReplyDelays = {
      receivedMs: delays?.receivedMs ?? DEFAULT_DEMO_DELAYS.receivedMs,
      readMs: delays?.readMs ?? DEFAULT_DEMO_DELAYS.readMs,
      typingMs: delays?.typingMs ?? DEFAULT_DEMO_DELAYS.typingMs,
      replyMs: delays?.replyMs ?? DEFAULT_DEMO_DELAYS.replyMs,
    };

    const targetRooms = [`chat:${chatId}`, `user:${senderId}`];

    const job: ScheduledJob = {
      recipientId,
      chatId,
      timers: [],
    };

    const existingJobs = pendingJobsByRecipient.get(recipientId) || [];
    pendingJobsByRecipient.set(recipientId, [...existingJobs, job]);

    const removeJob = () => {
      const current = pendingJobsByRecipient.get(recipientId);
      if (current) {
        const filtered = current.filter((j) => j !== job);
        if (filtered.length === 0) {
          pendingJobsByRecipient.delete(recipientId);
        } else {
          pendingJobsByRecipient.set(recipientId, filtered);
        }
      }
    };

    // Step 1: Received Receipt (~400ms)
    const tReceived = setTimeout(async () => {
      try {
        if (isUserOnline(recipientId)) return;
        if (await isBlockActiveBetween(app.db, senderId, recipientId)) return;

        const now = new Date();
        await app.db
          .insert(messageReceipts)
          .values({
            messageId,
            userId: recipientId,
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

        const participants = await app.db
          .select({ userId: chatParticipants.userId })
          .from(chatParticipants)
          .where(eq(chatParticipants.chatId, chatId));

        await processAndBroadcastReceipt(
          app,
          io,
          chatId,
          messageId,
          senderId,
          recipientId,
          "received",
          participants,
          now
        );

        io.to(targetRooms).emit("message:status_updated", {
          messageId,
          chatId,
          status: "received",
          userId: senderId,
          updatedAt: now.toISOString(),
        });
      } catch (err) {
        app.log.error({ err, chatId, messageId }, "Error processing demo auto-received receipt");
      }
    }, timing.receivedMs);
    job.timers.push(tReceived);

    // Step 2: Read Receipt (~900ms)
    const tRead = setTimeout(async () => {
      try {
        if (isUserOnline(recipientId)) return;
        if (await isBlockActiveBetween(app.db, senderId, recipientId)) return;

        const now = new Date();

        // Update lastReadAt for participant
        await app.db
          .update(chatParticipants)
          .set({ lastReadAt: now, markedUnread: false })
          .where(
            and(
              eq(chatParticipants.chatId, chatId),
              eq(chatParticipants.userId, recipientId)
            )
          );

        // Respect privacyReadReceipt reciprocity
        const participantSettings = await app.db
          .select({ privacyReadReceipt: userSettings.privacyReadReceipt })
          .from(chatParticipants)
          .innerJoin(userSettings, eq(chatParticipants.userId, userSettings.userId))
          .where(eq(chatParticipants.chatId, chatId));

        const allAllowReceipts =
          participantSettings.length === 2 &&
          participantSettings.every((s) => s.privacyReadReceipt === true);

        if (!allAllowReceipts) {
          // Read receipts suppressed due to reciprocity
          return;
        }

        await app.db
          .insert(messageReceipts)
          .values({
            messageId,
            userId: recipientId,
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

        const participants = await app.db
          .select({ userId: chatParticipants.userId })
          .from(chatParticipants)
          .where(eq(chatParticipants.chatId, chatId));

        await processAndBroadcastReceipt(
          app,
          io,
          chatId,
          messageId,
          senderId,
          recipientId,
          "read",
          participants,
          now
        );

        io.to(targetRooms).emit("message:status_updated", {
          messageId,
          chatId,
          status: "read",
          userId: senderId,
          updatedAt: now.toISOString(),
        });
      } catch (err) {
        app.log.error({ err, chatId, messageId }, "Error processing demo auto-read receipt");
      }
    }, timing.readMs);
    job.timers.push(tRead);

    // Step 3: Broadcast typing indicator ON (~1200ms)
    const tTyping = setTimeout(async () => {
      try {
        if (isUserOnline(recipientId)) return;
        if (await isBlockActiveBetween(app.db, senderId, recipientId)) return;

        io.to(targetRooms).emit("chat:typing_updated", {
          chatId,
          userId: recipientId,
          isTyping: true,
        });
        io.to(targetRooms).emit("typing:update", {
          chatId,
          userId: recipientId,
          isTyping: true,
        });

        job.cancelTyping = () => {
          io.to(targetRooms).emit("chat:typing_updated", {
            chatId,
            userId: recipientId,
            isTyping: false,
          });
          io.to(targetRooms).emit("typing:update", {
            chatId,
            userId: recipientId,
            isTyping: false,
          });
        };
      } catch (err) {
        app.log.error({ err, chatId, recipientId }, "Error broadcasting demo typing indicator");
      }
    }, timing.typingMs);
    job.timers.push(tTyping);

    // Step 4: Persist and broadcast contextual reply + typing OFF (~2200ms)
    const tReply = setTimeout(async () => {
      try {
        removeJob();

        // Always clear typing indicator first
        io.to(targetRooms).emit("chat:typing_updated", {
          chatId,
          userId: recipientId,
          isTyping: false,
        });
        io.to(targetRooms).emit("typing:update", {
          chatId,
          userId: recipientId,
          isTyping: false,
        });
        job.cancelTyping = undefined;

        if (isUserOnline(recipientId)) return;
        if (await isBlockActiveBetween(app.db, senderId, recipientId)) return;

        const replyText = generateContextualReply(body);
        const lexicalReplyBody = makeLexicalBody(replyText);
        const replyId = randomUUID();
        const now = new Date();

        await app.db.transaction(async (tx) => {
          await tx.insert(messages).values({
            id: replyId,
            chatId,
            senderId: recipientId,
            body: lexicalReplyBody,
            mediaId: null,
            createdAt: now,
          });

          await tx
            .update(chatParticipants)
            .set({ hiddenAt: null })
            .where(eq(chatParticipants.chatId, chatId));
        });

        const replyPayload: MessagePayload = {
          id: replyId,
          chatId,
          owner: recipientId,
          body: lexicalReplyBody,
          forwarded: false,
          time: now.toISOString(),
          status: "send",
          starred: false,
          hasMedia: null,
          reactions: [],
        };

        const participants = await app.db
          .select({ userId: chatParticipants.userId })
          .from(chatParticipants)
          .where(eq(chatParticipants.chatId, chatId));

        broadcastToChatAndParticipants(io, chatId, participants, "message:new", replyPayload);
      } catch (err) {
        app.log.error({ err, chatId, recipientId }, "Error generating demo auto-reply message");
      }
    }, timing.replyMs);
    job.timers.push(tReply);
  } catch (err) {
    app.log.error({ err, chatId, messageId }, "Error in triggerDemoAutoResponder initialization");
  }
}
