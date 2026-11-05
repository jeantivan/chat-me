import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import type { FastifyInstance } from "fastify";
import type { AddressInfo } from "net";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, messages, messageReceipts, userSettings } from "../src/db/schema.js";
import { eq, inArray } from "drizzle-orm";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  MessagePayload,
  ReceiptStatusPayload,
} from "@chat-me/shared";
import { waitForSocketEvent, registerTestUser, connectTestSocket } from "./test-helpers.js";
import type { Socket } from "socket.io-client";
import { randomUUID } from "node:crypto";

describe("Demo Auto-Responder Seam (Single-Tab Evaluation)", () => {
  let app: FastifyInstance;
  let serverUrl: string;
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;
  const createdUserIds: string[] = [];
  const activeSockets: Socket[] = [];

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp({
      enableDemoAutoReply: true,
      demoAutoReplyDelays: {
        receivedMs: 50,
        readMs: 100,
        typingMs: 150,
        replyMs: 250,
      },
    });
    await app.listen({ port: 0, host: "127.0.0.1" });
    const address = app.server.address() as AddressInfo;
    serverUrl = `http://127.0.0.1:${address.port}`;

    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool);
  });

  afterEach(() => {
    while (activeSockets.length > 0) {
      const sock = activeSockets.pop();
      if (sock?.connected) {
        sock.disconnect();
      }
    }
  });

  afterAll(async () => {
    for (const sock of activeSockets) {
      if (sock.connected) sock.disconnect();
    }
    if (createdUserIds.length > 0) {
      await db.delete(users).where(inArray(users.id, createdUserIds));
    }
    await app.close();
    await pool.end();
  });

  it("auto-acknowledges received and read receipts, displays typing, and generates a contextual reply for offline demo users", async () => {
    const timestamp = Date.now();
    const userA = await registerTestUser(app, {
      email: `evaluator-${timestamp}@test.com`,
      name: "Evaluator",
    });
    createdUserIds.push(userA.userId);

    const demoUser = await registerTestUser(app, {
      email: `seeded-demo-${timestamp}@example.com`,
      name: "Demo Counterpart",
    });
    createdUserIds.push(demoUser.userId);

    // Create direct chat
    const chatRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: demoUser.userId },
    });
    expect(chatRes.statusCode).toBe(200);
    const chatId = chatRes.json().id;

    // Connect User A socket only (demo user remains offline)
    const socketA = await connectTestSocket(serverUrl, userA.accessToken);
    activeSockets.push(socketA);
    activeSockets.push(socketA);
    socketA.emit("chat:join", chatId);

    // Set up listeners for the full lifecycle progression
    const messageId = randomUUID();
    const receivedPromise = waitForSocketEvent<ReceiptStatusPayload>(
      socketA,
      "message:status_changed",
      (data) => data.messageId === messageId && data.status === "received"
    );

    const readPromise = waitForSocketEvent<ReceiptStatusPayload>(
      socketA,
      "message:status_changed",
      (data) => data.messageId === messageId && data.status === "read"
    );

    const typingStartPromise = waitForSocketEvent<{ chatId: string; userId: string; isTyping: boolean }>(
      socketA,
      "chat:typing_updated",
      (data) => data.chatId === chatId && data.userId === demoUser.userId && data.isTyping === true
    );

    const replyPromise = waitForSocketEvent<MessagePayload>(
      socketA,
      "message:new",
      (data) => data.chatId === chatId && data.owner === demoUser.userId
    );

    const typingStopPromise = waitForSocketEvent<{ chatId: string; userId: string; isTyping: boolean }>(
      socketA,
      "chat:typing_updated",
      (data) => data.chatId === chatId && data.userId === demoUser.userId && data.isTyping === false
    );

    // User A sends message
    socketA.emit("message:send", {
      id: messageId,
      chatId,
      body: "Hello! Testing the demo auto-reply functionality",
    }, () => {});

    // Verify 1. Received receipt arrives
    const receivedEvent = await receivedPromise;
    expect(receivedEvent.status).toBe("received");

    // Verify received persisted in database
    const receivedDb = await db
      .select()
      .from(messageReceipts)
      .where(eq(messageReceipts.messageId, messageId));
    expect(receivedDb.some((r) => r.userId === demoUser.userId && (r.status === "received" || r.status === "read"))).toBe(true);

    // Verify 2. Read receipt arrives
    const readEvent = await readPromise;
    expect(readEvent.status).toBe("read");

    // Verify 3. Typing start arrives
    const typingStartEvent = await typingStartPromise;
    expect(typingStartEvent.isTyping).toBe(true);
    expect(typingStartEvent.userId).toBe(demoUser.userId);

    // Verify 4. Contextual reply arrives
    const replyMessage = await replyPromise;
    expect(replyMessage.chatId).toBe(chatId);
    expect(replyMessage.owner).toBe(demoUser.userId);
    expect(replyMessage.body).toContain("demo");

    // Verify 5. Typing stop arrives
    const typingStopEvent = await typingStopPromise;
    expect(typingStopEvent.isTyping).toBe(false);

    // Verify reply persisted in database
    const replyDb = await db
      .select()
      .from(messages)
      .where(eq(messages.id, replyMessage.id));
    expect(replyDb.length).toBe(1);
    expect(replyDb[0].senderId).toBe(demoUser.userId);

    socketA.disconnect();
  });

  it("does not trigger auto-responder when counterpart is online", async () => {
    const timestamp = Date.now();
    const userA = await registerTestUser(app, {
      email: `online-tester-${timestamp}@test.com`,
      name: "User A",
    });
    createdUserIds.push(userA.userId);

    const demoUser = await registerTestUser(app, {
      email: `online-demo-${timestamp}@example.com`,
      name: "Online Demo User",
    });
    createdUserIds.push(demoUser.userId);

    const chatRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: demoUser.userId },
    });
    const chatId = chatRes.json().id;

    // Both users connect
    const socketA = await connectTestSocket(serverUrl, userA.accessToken);
    activeSockets.push(socketA);
    const socketB = await connectTestSocket(serverUrl, demoUser.accessToken);
    activeSockets.push(socketB);
    activeSockets.push(socketA, socketB);
    socketA.emit("chat:join", chatId);
    socketB.emit("chat:join", chatId);

    let autoReplyFired = false;
    socketA.on("message:new", (msg) => {
      if (msg.owner === demoUser.userId) {
        autoReplyFired = true;
      }
    });

    const messageId = randomUUID();
    socketA.emit("message:send", {
      id: messageId,
      chatId,
      body: "Are you online?",
    }, () => {});

    // Wait 350ms (longer than reply delay of 250ms)
    await new Promise((r) => setTimeout(r, 350));
    expect(autoReplyFired).toBe(false);

    socketA.disconnect();
    socketB.disconnect();
  });

  it("does not trigger auto-responder when counterpart is not an @example.com demo user", async () => {
    const timestamp = Date.now();
    const userA = await registerTestUser(app, {
      email: `sender-${timestamp}@test.com`,
      name: "Sender",
    });
    createdUserIds.push(userA.userId);

    const regularUser = await registerTestUser(app, {
      email: `realuser-${timestamp}@gmail.com`,
      name: "Regular User",
    });
    createdUserIds.push(regularUser.userId);

    const chatRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: regularUser.userId },
    });
    const chatId = chatRes.json().id;

    const socketA = await connectTestSocket(serverUrl, userA.accessToken);
    activeSockets.push(socketA);
    socketA.emit("chat:join", chatId);

    let autoReplyFired = false;
    socketA.on("message:new", (msg) => {
      if (msg.owner === regularUser.userId) {
        autoReplyFired = true;
      }
    });

    const messageId = randomUUID();
    socketA.emit("message:send", {
      id: messageId,
      chatId,
      body: "Hello regular user",
    }, () => {});

    await new Promise((r) => setTimeout(r, 350));
    expect(autoReplyFired).toBe(false);

    socketA.disconnect();
  });

  it("respects privacyReadReceipt reciprocity and suppresses read receipt if disabled", async () => {
    const timestamp = Date.now();
    const userA = await registerTestUser(app, {
      email: `privacy-user-${timestamp}@test.com`,
      name: "Privacy User",
    });
    createdUserIds.push(userA.userId);

    const demoUser = await registerTestUser(app, {
      email: `demo-privacy-${timestamp}@example.com`,
      name: "Demo Recipient",
    });
    createdUserIds.push(demoUser.userId);

    // Disable privacyReadReceipt for demoUser
    await db
      .update(userSettings)
      .set({ privacyReadReceipt: false })
      .where(eq(userSettings.userId, demoUser.userId));

    const chatRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: demoUser.userId },
    });
    const chatId = chatRes.json().id;

    const socketA = await connectTestSocket(serverUrl, userA.accessToken);
    activeSockets.push(socketA);
    socketA.emit("chat:join", chatId);

    const messageId = randomUUID();
    const receivedPromise = waitForSocketEvent<ReceiptStatusPayload>(
      socketA,
      "message:status_changed",
      (data) => data.messageId === messageId && data.status === "received"
    );

    let readReceiptFired = false;
    socketA.on("message:status_changed", (data) => {
      if (data.messageId === messageId && data.status === "read") {
        readReceiptFired = true;
      }
    });

    socketA.emit("message:send", {
      id: messageId,
      chatId,
      body: "Testing read receipt suppression",
    }, () => {});

    await receivedPromise;
    // Wait past read delay
    await new Promise((r) => setTimeout(r, 200));

    expect(readReceiptFired).toBe(false);

    // In DB, receipt should be received, not read
    const receiptsInDb = await db
      .select()
      .from(messageReceipts)
      .where(eq(messageReceipts.messageId, messageId));
    expect(receiptsInDb.some((r) => r.status === "read")).toBe(false);

    socketA.disconnect();
  });

  it("cancels pending auto-replies immediately if counterpart connects online", async () => {
    const timestamp = Date.now();
    const userA = await registerTestUser(app, {
      email: `canceller-user-${timestamp}@test.com`,
      name: "Canceller User",
    });
    createdUserIds.push(userA.userId);

    const demoUser = await registerTestUser(app, {
      email: `cancel-demo-${timestamp}@example.com`,
      name: "Connect Mid-Flight Demo",
    });
    createdUserIds.push(demoUser.userId);

    const chatRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: demoUser.userId },
    });
    const chatId = chatRes.json().id;

    const socketA = await connectTestSocket(serverUrl, userA.accessToken);
    activeSockets.push(socketA);
    socketA.emit("chat:join", chatId);

    let autoReplyFired = false;
    socketA.on("message:new", (msg) => {
      if (msg.owner === demoUser.userId) {
        autoReplyFired = true;
      }
    });

    const messageId = randomUUID();
    socketA.emit("message:send", {
      id: messageId,
      chatId,
      body: "Will you reply if you come online?",
    }, () => {});

    // Demo counterpart connects immediately (at 30ms, before reply delay of 250ms)
    await new Promise((r) => setTimeout(r, 30));
    const socketB = await connectTestSocket(serverUrl, demoUser.accessToken);
    activeSockets.push(socketB);

    // Wait until past the 250ms reply delay
    await new Promise((r) => setTimeout(r, 350));
    expect(autoReplyFired).toBe(false);

    socketA.disconnect();
    socketB.disconnect();
  });

  it("does not trigger auto-responder when counterpart is blocked", async () => {
    const timestamp = Date.now();
    const userA = await registerTestUser(app, {
      email: `blocker-${timestamp}@test.com`,
      name: "Blocker User",
    });
    createdUserIds.push(userA.userId);

    const demoUser = await registerTestUser(app, {
      email: `blocked-demo-${timestamp}@example.com`,
      name: "Blocked Demo",
    });
    createdUserIds.push(demoUser.userId);

    const chatRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: demoUser.userId },
    });
    const chatId = chatRes.json().id;

    // User A blocks demoUser
    const blockRes = await app.inject({
      method: "POST",
      url: `/api/v1/users/me/blocked/${demoUser.userId}`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(blockRes.statusCode).toBe(200);

    const socketA = await connectTestSocket(serverUrl, userA.accessToken);
    activeSockets.push(socketA);
    socketA.emit("chat:join", chatId);

    let autoReplyFired = false;
    socketA.on("message:new", (msg) => {
      if (msg.owner === demoUser.userId) {
        autoReplyFired = true;
      }
    });

    const messageId = randomUUID();
    socketA.emit("message:send", {
      id: messageId,
      chatId,
      body: "Blocked message attempt",
    }, () => {});

    await new Promise((r) => setTimeout(r, 350));
    expect(autoReplyFired).toBe(false);

    socketA.disconnect();
  });

  it("emits both message:status_updated and typing:update alias events", async () => {
    const timestamp = Date.now();
    const userA = await registerTestUser(app, {
      email: `aliases-${timestamp}@test.com`,
      name: "Aliases User",
    });
    createdUserIds.push(userA.userId);

    const demoUser = await registerTestUser(app, {
      email: `aliases-demo-${timestamp}@example.com`,
      name: "Aliases Demo",
    });
    createdUserIds.push(demoUser.userId);

    const chatRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: demoUser.userId },
    });
    const chatId = chatRes.json().id;

    const socketA = await connectTestSocket(serverUrl, userA.accessToken);
    activeSockets.push(socketA);
    socketA.emit("chat:join", chatId);

    const messageId = randomUUID();
    const statusUpdatedPromise = waitForSocketEvent<ReceiptStatusPayload>(
      socketA,
      "message:status_updated",
      (data) => data.messageId === messageId && data.status === "received"
    );

    const typingUpdatePromise = waitForSocketEvent<{ chatId: string; userId: string; isTyping: boolean }>(
      socketA,
      "typing:update",
      (data) => data.chatId === chatId && data.userId === demoUser.userId && data.isTyping === true
    );

    socketA.emit("message:send", {
      id: messageId,
      chatId,
      body: "Testing alias events",
    }, () => {});

    const statusUpdated = await statusUpdatedPromise;
    expect(statusUpdated.status).toBe("received");

    const typingUpdate = await typingUpdatePromise;
    expect(typingUpdate.isTyping).toBe(true);

    socketA.disconnect();
  });

  it("does not trigger auto-responder when enableDemoAutoReply is false", async () => {
    const disabledApp = await buildApp({
      enableDemoAutoReply: false,
    });
    await disabledApp.listen({ port: 0, host: "127.0.0.1" });
    const address = disabledApp.server.address() as AddressInfo;
    const disabledServerUrl = `http://127.0.0.1:${address.port}`;

    const timestamp = Date.now();
    const userA = await registerTestUser(disabledApp, {
      email: `disabled-sender-${timestamp}@test.com`,
      name: "Disabled Sender",
    });
    createdUserIds.push(userA.userId);

    const demoUser = await registerTestUser(disabledApp, {
      email: `disabled-demo-${timestamp}@example.com`,
      name: "Disabled Demo User",
    });
    createdUserIds.push(demoUser.userId);

    const chatRes = await disabledApp.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: demoUser.userId },
    });
    const chatId = chatRes.json().id;

    const socketA = await connectTestSocket(disabledServerUrl, userA.accessToken);
    activeSockets.push(socketA);
    socketA.emit("chat:join", chatId);

    let autoReplyFired = false;
    socketA.on("message:new", (msg) => {
      if (msg.owner === demoUser.userId) {
        autoReplyFired = true;
      }
    });

    const messageId = randomUUID();
    socketA.emit("message:send", {
      id: messageId,
      chatId,
      body: "Should not auto-reply",
    }, () => {});

    await new Promise((r) => setTimeout(r, 200));
    expect(autoReplyFired).toBe(false);

    socketA.disconnect();
    await disabledApp.close();
  });
});
