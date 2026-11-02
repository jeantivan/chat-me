import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { AddressInfo } from "net";
import pg from "pg";
import { registerTestUser, waitForSocketEvent } from "./test-helpers.js";
import { chatParticipants, messages, chats, users } from "../src/db/schema.js";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ChatSummary,
  ChatParticipantUpdatedPayload,
} from "@chat-me/shared";

describe("Chat Participant Actions Seam (Pin, Mute, Archive, Mark Read/Unread)", () => {
  let app: FastifyInstance;
  let serverUrl: string;
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;

  let userA: { userId: string; accessToken: string };
  let userB: { userId: string; accessToken: string };
  let userC: { userId: string; accessToken: string };
  let directChatId: string;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const address = app.server.address() as AddressInfo;
    serverUrl = `http://127.0.0.1:${address.port}`;
    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool);

    userA = await registerTestUser(app, {
      email: `part-a-${Date.now()}@example.com`,
      name: "Participant A",
    });
    userB = await registerTestUser(app, {
      email: `part-b-${Date.now()}@example.com`,
      name: "Participant B",
    });
    userC = await registerTestUser(app, {
      email: `part-c-${Date.now()}@example.com`,
      name: "Participant C",
    });

    // Create direct chat between userA and userB
    const createChatRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
      payload: {
        targetUserId: userB.userId,
      },
    });
    expect(createChatRes.statusCode).toBe(200);
    const chatData = createChatRes.json();
    directChatId = chatData.id;
  });

  afterAll(async () => {
    if (directChatId) {
      await db.delete(chats).where(eq(chats.id, directChatId));
    }
    await db.delete(users).where(eq(users.id, userA.userId));
    await db.delete(users).where(eq(users.id, userB.userId));
    await db.delete(users).where(eq(users.id, userC.userId));
    await app.close();
    await pool.end();
  });

  it("returns 401 when calling PATCH /api/v1/chats/:chatId/participant without auth", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${directChatId}/participant`,
      payload: { pinned: true },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 403 when user is not a participant of the chat", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${directChatId}/participant`,
      headers: {
        authorization: `Bearer ${userC.accessToken}`,
      },
      payload: { pinned: true },
    });
    expect(res.statusCode).toBe(403);
  });

  it("updates pinned and muted flags for the authenticated participant", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${directChatId}/participant`,
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
      payload: { pinned: true, muted: true },
    });

    expect(res.statusCode).toBe(200);
    const summary: ChatSummary = res.json();
    const participantA = summary.participants.find((p) => p.userId === userA.userId);
    expect(participantA?.pinned).toBe(true);
    expect(participantA?.muted).toBe(true);

    // Verify userB was not affected
    const participantB = summary.participants.find((p) => p.userId === userB.userId);
    expect(participantB?.pinned).toBe(false);
    expect(participantB?.muted).toBe(false);
  });

  it("automatically sets pinned = false when archived is set to true", async () => {
    // Participant A is currently pinned = true
    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${directChatId}/participant`,
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
      payload: { archived: true },
    });

    expect(res.statusCode).toBe(200);
    const summary: ChatSummary = res.json();
    const participantA = summary.participants.find((p) => p.userId === userA.userId);
    expect(participantA?.archived).toBe(true);
    expect(participantA?.pinned).toBe(false);

    // Even if pinned: true is passed alongside archived: true, pinned must be false
    const res2 = await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${directChatId}/participant`,
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
      payload: { archived: true, pinned: true },
    });
    expect(res2.statusCode).toBe(200);
    const summary2: ChatSummary = res2.json();
    const pA2 = summary2.participants.find((p) => p.userId === userA.userId);
    expect(pA2?.archived).toBe(true);
    expect(pA2?.pinned).toBe(false);

    // Unarchive chat for subsequent tests
    await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${directChatId}/participant`,
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
      payload: { archived: false },
    });
  });

  it("marks chat as unread and read, advancing lastReadAt and resetting unread count", async () => {
    // 1. Mark as unread
    const resUnread = await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${directChatId}/participant`,
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
      payload: { markedUnread: true },
    });

    expect(resUnread.statusCode).toBe(200);
    const summaryUnread: ChatSummary = resUnread.json();
    const pUnread = summaryUnread.participants.find((p) => p.userId === userA.userId);
    expect(pUnread?.markedUnread).toBe(true);
    expect(summaryUnread.unreadCount).toBeGreaterThanOrEqual(1);

    // 2. Mark as read
    const beforeRead = new Date();
    const resRead = await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${directChatId}/participant`,
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
      payload: { markedUnread: false },
    });

    expect(resRead.statusCode).toBe(200);
    const summaryRead: ChatSummary = resRead.json();
    const pRead = summaryRead.participants.find((p) => p.userId === userA.userId);
    expect(pRead?.markedUnread).toBe(false);
    expect(summaryRead.unreadCount).toBe(0);
    expect(new Date(pRead!.lastReadAt).getTime()).toBeGreaterThanOrEqual(
      beforeRead.getTime() - 1000
    );
  });

  it("emits chat:participant_updated to user room on participant update", async () => {
    const socketA: ClientSocket<ServerToClientEvents, ClientToServerEvents> = ioc(
      serverUrl,
      {
        auth: { token: userA.accessToken },
        transports: ["websocket"],
      }
    );

    await new Promise<void>((resolve) => socketA.on("connect", () => resolve()));

    const participantUpdatedPromise = waitForSocketEvent<ChatParticipantUpdatedPayload>(
      socketA,
      "chat:participant_updated",
      (payload) => payload.chatId === directChatId && payload.userId === userA.userId
    );

    const res = await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${directChatId}/participant`,
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
      payload: { muted: false, pinned: true },
    });
    expect(res.statusCode).toBe(200);

    const eventPayload = await participantUpdatedPromise;
    expect(eventPayload.chatId).toBe(directChatId);
    expect(eventPayload.userId).toBe(userA.userId);
    expect(eventPayload.pinned).toBe(true);
    expect(eventPayload.muted).toBe(false);

    socketA.disconnect();
  });

  it("resets marked_unread = false when message:ack_read is emitted", async () => {
    // 1. Mark as unread first
    await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${directChatId}/participant`,
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
      payload: { markedUnread: true },
    });

    const [rowBefore] = await db
      .select({ markedUnread: chatParticipants.markedUnread })
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, directChatId),
          eq(chatParticipants.userId, userA.userId)
        )
      );
    expect(rowBefore.markedUnread).toBe(true);

    // 2. Connect userA socket and emit message:ack_read
    const socketA: ClientSocket<ServerToClientEvents, ClientToServerEvents> = ioc(
      serverUrl,
      {
        auth: { token: userA.accessToken },
        transports: ["websocket"],
      }
    );

    await new Promise<void>((resolve) => socketA.on("connect", () => resolve()));

    socketA.emit("message:ack_read", {
      chatId: directChatId,
      lastMessageId: crypto.randomUUID(),
    });

    // Wait briefly for DB update
    await new Promise((r) => setTimeout(r, 200));

    const [rowAfter] = await db
      .select({ markedUnread: chatParticipants.markedUnread })
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, directChatId),
          eq(chatParticipants.userId, userA.userId)
        )
      );
    expect(rowAfter.markedUnread).toBe(false);

    socketA.disconnect();
  });
});
