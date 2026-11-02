import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { AddressInfo } from "net";
import pg from "pg";
import { registerTestUser, waitForSocketEvent } from "./test-helpers.js";
import {
  chatParticipants,
  messages,
  chats,
  users,
  messageStars,
} from "../src/db/schema.js";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ChatSummary,
  ChatClearedPayload,
  MessagesPageResponse,
} from "@chat-me/shared";

describe("Chat History Clearing & Delete/Hide Seam", () => {
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
      email: `clear-a-${Date.now()}@example.com`,
      name: "Clearer A",
    });
    userB = await registerTestUser(app, {
      email: `clear-b-${Date.now()}@example.com`,
      name: "Clearer B",
    });
    userC = await registerTestUser(app, {
      email: `clear-c-${Date.now()}@example.com`,
      name: "Clearer C",
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
    directChatId = createChatRes.json().id;
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

  it("returns 401 when calling POST /api/v1/chats/:chatId/clear without auth", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${directChatId}/clear`,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 403 when calling clear on a chat the user is not a participant of", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${directChatId}/clear`,
      headers: {
        authorization: `Bearer ${userC.accessToken}`,
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it("clears chat history for userA, deletes userA's message stars, emits chat:cleared, and leaves userB's history intact", async () => {
    // 1. Insert 2 messages in directChatId
    const msg1Id = crypto.randomUUID();
    const msg2Id = crypto.randomUUID();
    await db.insert(messages).values([
      {
        id: msg1Id,
        chatId: directChatId,
        senderId: userA.userId,
        body: "Message 1 from A",
        createdAt: new Date(Date.now() - 5000),
      },
      {
        id: msg2Id,
        chatId: directChatId,
        senderId: userB.userId,
        body: "Message 2 from B",
        createdAt: new Date(Date.now() - 3000),
      },
    ]);

    // Star msg1 for userA and msg2 for userB
    await db.insert(messageStars).values([
      { userId: userA.userId, messageId: msg1Id },
      { userId: userB.userId, messageId: msg2Id },
    ]);

    // Connect userA socket to verify chat:cleared event
    const clientSocketA: ClientSocket<ServerToClientEvents, ClientToServerEvents> =
      ioc(serverUrl, {
        auth: { token: userA.accessToken },
        transports: ["websocket"],
      });

    await new Promise<void>((resolve) => {
      if (clientSocketA.connected) resolve();
      else clientSocketA.on("connect", () => resolve());
    });

    const clearedEventPromise = waitForSocketEvent<ChatClearedPayload>(
      clientSocketA,
      "chat:cleared",
      (payload) => payload.chatId === directChatId && payload.userId === userA.userId
    );

    // Call POST /api/v1/chats/:chatId/clear
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${directChatId}/clear`,
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const summary: ChatSummary = res.json();
    expect(summary.id).toBe(directChatId);
    expect(summary.lastMessage).toBeNull();
    expect(summary.unreadCount).toBe(0);

    const clearedEvent = await clearedEventPromise;
    expect(clearedEvent.chatId).toBe(directChatId);
    expect(clearedEvent.userId).toBe(userA.userId);
    expect(clearedEvent.clearedAt).toBeDefined();
    expect(clearedEvent.hiddenAt).toBeNull();

    clientSocketA.disconnect();

    // Verify userA's star on msg1 was deleted, but userB's star on msg2 remains
    const starsA = await db
      .select()
      .from(messageStars)
      .where(and(eq(messageStars.userId, userA.userId), eq(messageStars.messageId, msg1Id)));
    expect(starsA.length).toBe(0);

    const starsB = await db
      .select()
      .from(messageStars)
      .where(and(eq(messageStars.userId, userB.userId), eq(messageStars.messageId, msg2Id)));
    expect(starsB.length).toBe(1);

    // Verify GET /messages for userA returns empty array
    const messagesResA = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/messages`,
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
    });
    expect(messagesResA.statusCode).toBe(200);
    const pageA: MessagesPageResponse = messagesResA.json();
    expect(pageA.messages.length).toBe(0);

    // Verify GET /messages for userB returns both messages
    const messagesResB = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/messages`,
      headers: {
        authorization: `Bearer ${userB.accessToken}`,
      },
    });
    expect(messagesResB.statusCode).toBe(200);
    const pageB: MessagesPageResponse = messagesResB.json();
    expect(pageB.messages.length).toBe(2);

    // Verify userA's chat in GET /api/v1/chats has lastMessage: null and unreadCount: 0
    const listResA = await app.inject({
      method: "GET",
      url: "/api/v1/chats",
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
    });
    const listA: ChatSummary[] = listResA.json();
    const chatA = listA.find((c) => c.id === directChatId);
    expect(chatA).toBeDefined();
    expect(chatA?.lastMessage).toBeNull();
    expect(chatA?.unreadCount).toBe(0);
  });

  it("deletes/hides direct chat via DELETE /api/v1/chats/:chatId, unpins it, and hides it from chat list", async () => {
    // Pin chat first for userA
    await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${directChatId}/participant`,
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
      payload: { pinned: true },
    });

    // Connect userA socket to verify chat:cleared event with hiddenAt
    const clientSocketA: ClientSocket<ServerToClientEvents, ClientToServerEvents> =
      ioc(serverUrl, {
        auth: { token: userA.accessToken },
        transports: ["websocket"],
      });

    await new Promise<void>((resolve) => {
      if (clientSocketA.connected) resolve();
      else clientSocketA.on("connect", () => resolve());
    });

    const deleteEventPromise = waitForSocketEvent<ChatClearedPayload>(
      clientSocketA,
      "chat:cleared",
      (payload) =>
        payload.chatId === directChatId &&
        payload.userId === userA.userId &&
        Boolean(payload.hiddenAt)
    );

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/chats/${directChatId}`,
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
    });

    expect(deleteRes.statusCode).toBe(200);

    const deleteEvent = await deleteEventPromise;
    expect(deleteEvent.hiddenAt).toBeDefined();

    clientSocketA.disconnect();

    // Verify userA chat participant row has pinned: false, cleared_at and hidden_at set
    const [partA] = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, directChatId),
          eq(chatParticipants.userId, userA.userId)
        )
      );
    expect(partA.pinned).toBe(false);
    expect(partA.clearedAt).toBeInstanceOf(Date);
    expect(partA.hiddenAt).toBeInstanceOf(Date);

    // Verify GET /api/v1/chats hides directChatId for userA
    const listResA = await app.inject({
      method: "GET",
      url: "/api/v1/chats",
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
    });
    const listA: ChatSummary[] = listResA.json();
    expect(listA.some((c) => c.id === directChatId)).toBe(false);

    // UserB still sees directChatId
    const listResB = await app.inject({
      method: "GET",
      url: "/api/v1/chats",
      headers: {
        authorization: `Bearer ${userB.accessToken}`,
      },
    });
    const listB: ChatSummary[] = listResB.json();
    expect(listB.some((c) => c.id === directChatId)).toBe(true);
  });

  it("un-hides chat when POST /api/v1/chats/direct is called with that contact", async () => {
    // Calling POST /api/v1/chats/direct for userA with userB should reset hidden_at = null
    const openRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
      payload: {
        targetUserId: userB.userId,
      },
    });
    expect(openRes.statusCode).toBe(200);

    // Check database
    const [partA] = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, directChatId),
          eq(chatParticipants.userId, userA.userId)
        )
      );
    expect(partA.hiddenAt).toBeNull();

    // Now chat reappears in GET /api/v1/chats for userA
    const listResA = await app.inject({
      method: "GET",
      url: "/api/v1/chats",
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
    });
    const listA: ChatSummary[] = listResA.json();
    expect(listA.some((c) => c.id === directChatId)).toBe(true);
  });

  it("un-hides chat when a new message is sent or received in the hidden chat", async () => {
    // Hide chat again for userA
    await app.inject({
      method: "DELETE",
      url: `/api/v1/chats/${directChatId}`,
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
    });

    const [partAHidden] = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, directChatId),
          eq(chatParticipants.userId, userA.userId)
        )
      );
    expect(partAHidden.hiddenAt).toBeInstanceOf(Date);

    // Connect userB to send a message over socket
    const clientSocketB: ClientSocket<ServerToClientEvents, ClientToServerEvents> =
      ioc(serverUrl, {
        auth: { token: userB.accessToken },
        transports: ["websocket"],
      });

    await new Promise<void>((resolve) => {
      if (clientSocketB.connected) resolve();
      else clientSocketB.on("connect", () => resolve());
    });

    const newMsgId = crypto.randomUUID();
    await new Promise<void>((resolve) => {
      clientSocketB.emit(
        "message:send",
        {
          id: newMsgId,
          chatId: directChatId,
          body: "New message that un-hides chat!",
        },
        (ack) => {
          expect(ack.success).toBe(true);
          resolve();
        }
      );
    });

    clientSocketB.disconnect();

    // Verify userA's hidden_at is reset to null
    const [partA] = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, directChatId),
          eq(chatParticipants.userId, userA.userId)
        )
      );
    expect(partA.hiddenAt).toBeNull();

    // UserA now sees the chat in GET /api/v1/chats with the new message as lastMessage
    const listResA = await app.inject({
      method: "GET",
      url: "/api/v1/chats",
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
    });
    const listA: ChatSummary[] = listResA.json();
    const chatA = listA.find((c) => c.id === directChatId);
    expect(chatA).toBeDefined();
    expect(chatA?.lastMessage?.body).toBe("New message that un-hides chat!");

    // UserA's GET /messages only returns this new message (older messages were cleared)
    const messagesResA = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/messages`,
      headers: {
        authorization: `Bearer ${userA.accessToken}`,
      },
    });
    const pageA: MessagesPageResponse = messagesResA.json();
    expect(pageA.messages.length).toBe(1);
    expect(pageA.messages[0].id).toBe(newMsgId);
  });
});
