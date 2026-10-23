import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { AddressInfo } from "net";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "../src/db/schema.js";
import { eq } from "drizzle-orm";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ChatSummary,
} from "@chat-me/shared";

describe("Chat Navigation Ordering & Unread Watermark Seam", () => {
  let app: FastifyInstance;
  let serverUrl: string;
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;

  let userAId: string;
  let userBId: string;
  let userCId: string;
  let tokenA: string;
  let tokenB: string;
  let tokenC: string;

  let chatABId: string;
  let chatACId: string;

  let clientA: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let clientB: ClientSocket<ServerToClientEvents, ClientToServerEvents>;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const address = app.server.address() as AddressInfo;
    serverUrl = `http://127.0.0.1:${address.port}`;

    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool);

    // Register User A
    const regARes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: `alice-nav-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Alice Nav",
      },
    });
    const regAData = JSON.parse(regARes.payload);
    userAId = regAData.user.id;
    tokenA = regAData.accessToken;

    // Register User B
    const regBRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: `bob-nav-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Bob Nav",
      },
    });
    const regBData = JSON.parse(regBRes.payload);
    userBId = regBData.user.id;
    tokenB = regBData.accessToken;

    // Register User C
    const regCRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: `charlie-nav-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Charlie Nav",
      },
    });
    const regCData = JSON.parse(regCRes.payload);
    userCId = regCData.user.id;
    tokenC = regCData.accessToken;

    // Create chat A-B
    const chatABRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { targetUserId: userBId },
    });
    chatABId = JSON.parse(chatABRes.payload).id;

    // Create chat A-C
    const chatACRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { targetUserId: userCId },
    });
    chatACId = JSON.parse(chatACRes.payload).id;

    clientA = ioc(serverUrl, {
      auth: { token: tokenA },
      transports: ["websocket"],
      reconnection: false,
    });

    clientB = ioc(serverUrl, {
      auth: { token: tokenB },
      transports: ["websocket"],
      reconnection: false,
    });

    await Promise.all([
      new Promise<void>((resolve) => clientA.on("connect", () => resolve())),
      new Promise<void>((resolve) => clientB.on("connect", () => resolve())),
    ]);

    clientA.emit("chat:join", chatABId);
    clientB.emit("chat:join", chatABId);
  });

  afterAll(async () => {
    if (clientA?.connected) clientA.disconnect();
    if (clientB?.connected) clientB.disconnect();

    if (userAId) await db.delete(users).where(eq(users.id, userAId));
    if (userBId) await db.delete(users).where(eq(users.id, userBId));
    if (userCId) await db.delete(users).where(eq(users.id, userCId));

    await app.close();
    await pool.end();
  });

  it("orders recent conversations by most recent message timestamp", async () => {
    // 1. Send message in chat A-B
    const msgId1 = crypto.randomUUID();
    await new Promise<void>((resolve) => {
      clientA.emit(
        "message:send",
        { id: msgId1, chatId: chatABId, body: "Message 1 in AB" },
        () => resolve()
      );
    });

    // 2. Wait a small amount and send message in chat A-C
    await new Promise((r) => setTimeout(r, 50));
    const msgId2 = crypto.randomUUID();
    const sendACRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${tokenC}` },
      payload: { targetUserId: userAId },
    });

    // Send via socket from user A to C
    await new Promise<void>((resolve) => {
      clientA.emit(
        "message:send",
        { id: msgId2, chatId: chatACId, body: "Message 2 in AC" },
        () => resolve()
      );
    });

    // Query chats list for User A: AC should be first because its last message is newer
    const listRes1 = await app.inject({
      method: "GET",
      url: "/api/v1/chats",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const list1: ChatSummary[] = JSON.parse(listRes1.payload);
    expect(list1[0].id).toBe(chatACId);
    expect(list1[1].id).toBe(chatABId);

    // 3. Now send a newer message in chat A-B from user B
    await new Promise((r) => setTimeout(r, 50));
    const msgId3 = crypto.randomUUID();
    await new Promise<void>((resolve) => {
      clientB.emit(
        "message:send",
        { id: msgId3, chatId: chatABId, body: "Message 3 in AB" },
        () => resolve()
      );
    });

    // Query chats list for User A: AB should now be first!
    const listRes2 = await app.inject({
      method: "GET",
      url: "/api/v1/chats",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const list2: ChatSummary[] = JSON.parse(listRes2.payload);
    expect(list2[0].id).toBe(chatABId);
    expect(list2[1].id).toBe(chatACId);
  });

  it("calculates accurate unread count and decrements upon message:ack_read watermark update", async () => {
    // User B sends 2 messages to User A in chat A-B
    const msg1 = crypto.randomUUID();
    const msg2 = crypto.randomUUID();

    await new Promise<void>((resolve) => {
      clientB.emit(
        "message:send",
        { id: msg1, chatId: chatABId, body: "Hello Alice 1" },
        () => resolve()
      );
    });

    await new Promise<void>((resolve) => {
      clientB.emit(
        "message:send",
        { id: msg2, chatId: chatABId, body: "Hello Alice 2" },
        () => resolve()
      );
    });

    // Check User A's unread count for chat A-B
    const listResBefore = await app.inject({
      method: "GET",
      url: "/api/v1/chats",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const listBefore: ChatSummary[] = JSON.parse(listResBefore.payload);
    const chatABBefore = listBefore.find((c) => c.id === chatABId);
    expect(chatABBefore?.unreadCount).toBeGreaterThanOrEqual(2);

    // User A views the chat and emits message:ack_read
    clientA.emit("message:ack_read", {
      chatId: chatABId,
      lastMessageId: msg2,
    });

    // Wait for DB watermark update
    await new Promise((r) => setTimeout(r, 150));

    // Check User A's unread count: should now be 0!
    const listResAfter = await app.inject({
      method: "GET",
      url: "/api/v1/chats",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const listAfter: ChatSummary[] = JSON.parse(listResAfter.payload);
    const chatABAfter = listAfter.find((c) => c.id === chatABId);
    expect(chatABAfter?.unreadCount).toBe(0);
  });
});
