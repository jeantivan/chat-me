import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import { Socket as ClientSocket } from "socket.io-client";
import { AddressInfo } from "net";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, chats } from "../src/db/schema.js";
import { migrateDb } from "../src/db/migrate.js";
import { ensureBucketExists } from "../src/services/storage.service.js";
import { eq } from "drizzle-orm";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  MessagePayload,
} from "@chat-me/shared";
import {
  waitForSocketEvent,
  registerTestUser,
  connectTestSocket,
} from "./test-helpers.js";

describe("Backend High Seam: Full-Lifecycle Integration Suite (PostgreSQL + Redis + MinIO)", () => {
  let app: FastifyInstance;
  let serverUrl: string;
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;

  let userAId: string;
  let userBId: string;
  let tokenA: string;
  let tokenB: string;
  let chatId: string;

  let clientA: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let clientB: ClientSocket<ServerToClientEvents, ClientToServerEvents>;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: databaseUrl });
    await migrateDb(pool);
    await ensureBucketExists();

    db = drizzle(pool);
    app = await buildApp({ databaseUrl, redisUrl });
    await app.listen({ port: 0, host: "127.0.0.1" });
    const address = app.server.address() as AddressInfo;
    serverUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    if (clientA?.connected) clientA.disconnect();
    if (clientB?.connected) clientB.disconnect();

    if (chatId) await db.delete(chats).where(eq(chats.id, chatId));
    if (userAId) await db.delete(users).where(eq(users.id, userAId));
    if (userBId) await db.delete(users).where(eq(users.id, userBId));

    await app.close();
    await pool.end();
  });

  it("executes end-to-end backend lifecycle: auth -> direct chat creation -> message delivery & receipts -> presigned MinIO media upload", async () => {
    const timestamp = Date.now();
    const emailA = `seam-alice-${timestamp}@example.com`;
    const emailB = `seam-bob-${timestamp}@example.com`;
    const password = "Password123!";

    // 1. Auth: Register User A & User B, Login, and Refresh Token
    const userA = await registerTestUser(app, {
      email: emailA,
      password,
      name: "Seam Alice",
    });
    userAId = userA.userId;

    const userB = await registerTestUser(app, {
      email: emailB,
      password,
      name: "Seam Bob",
    });
    userBId = userB.userId;
    tokenB = userB.accessToken;

    const loginARes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: emailA, password },
    });
    expect(loginARes.statusCode).toBe(200);
    const refreshCookie = loginARes.cookies.find((c) => c.name === "refreshToken");
    expect(refreshCookie?.httpOnly).toBe(true);

    const refreshARes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: { refreshToken: refreshCookie!.value },
    });
    expect(refreshARes.statusCode).toBe(200);
    tokenA = refreshARes.json().accessToken;
    expect(tokenA).toBeTruthy();

    // 2. Direct Chat Creation & Idempotency
    const createChat1 = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { targetUserId: userBId },
    });
    expect(createChat1.statusCode).toBe(200);
    chatId = createChat1.json().id;
    expect(chatId).toBeTruthy();

    const createChat2 = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { targetUserId: userAId },
    });
    expect(createChat2.statusCode).toBe(200);
    expect(createChat2.json().id).toBe(chatId);

    // 3. Socket.IO Connection, Message Delivery & Receipt Progression
    [clientA, clientB] = await Promise.all([
      connectTestSocket(serverUrl, tokenA),
      connectTestSocket(serverUrl, tokenB),
    ]);

    clientA.emit("chat:join", chatId);
    clientB.emit("chat:join", chatId);
    await new Promise((r) => setTimeout(r, 50));

    const textMessageId = crypto.randomUUID();
    const messageNewPromise = waitForSocketEvent<MessagePayload>(
      clientB,
      "message:new",
      (msg) => msg.id === textMessageId
    );

    const sendAck = await new Promise<{ success: boolean; id: string }>((resolve) => {
      clientA.emit(
        "message:send",
        { id: textMessageId, chatId, body: "Integration test message" },
        (ack) => resolve(ack)
      );
    });
    expect(sendAck.success).toBe(true);
    expect(sendAck.id).toBe(textMessageId);

    const deliveredMsg = await messageNewPromise;
    expect(deliveredMsg.body).toBe("Integration test message");
    expect(deliveredMsg.owner).toBe(userAId);

    // Verify unread count for User B before reading
    const chatsBeforeRead = await app.inject({
      method: "GET",
      url: "/api/v1/chats",
      headers: { authorization: `Bearer ${tokenB}` },
    });
    const chatForB = chatsBeforeRead.json().find((c: any) => c.id === chatId);
    expect(chatForB.unreadCount).toBe(1);

    // Progress receipt to 'received'
    const receivedPromise = waitForSocketEvent<{ messageId: string; status: string }>(
      clientA,
      "message:status_changed",
      (p) => p.messageId === textMessageId && p.status === "received"
    );
    clientB.emit("message:ack_received", { chatId, messageIds: [textMessageId] });
    const receivedEvent = await receivedPromise;
    expect(receivedEvent.status).toBe("received");

    // Progress receipt to 'read' and advance read_watermark
    const readPromise = waitForSocketEvent<{ messageId: string; status: string }>(
      clientA,
      "message:status_changed",
      (p) => p.messageId === textMessageId && p.status === "read"
    );
    clientB.emit("message:ack_read", { chatId, lastMessageId: textMessageId });
    const readEvent = await readPromise;
    expect(readEvent.status).toBe("read");

    // Verify unread count for User B resets to 0 after read watermark update
    const chatsAfterRead = await app.inject({
      method: "GET",
      url: "/api/v1/chats",
      headers: { authorization: `Bearer ${tokenB}` },
    });
    const chatForBAfter = chatsAfterRead.json().find((c: any) => c.id === chatId);
    expect(chatForBAfter.unreadCount).toBe(0);

    // 4. Media Upload via Presigned URL to MinIO & Socket.IO Attachment Delivery
    const binaryImage = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
    const presignRes = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${chatId}/media/presign`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        filename: "integration-check.png",
        mimeType: "image/png",
        sizeBytes: binaryImage.byteLength,
        type: "image",
        orientation: "square",
        width: 512,
        height: 512,
        blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
      },
    });
    expect(presignRes.statusCode).toBe(200);
    const { mediaId, uploadUrl, publicUrl } = presignRes.json();

    const s3PutRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(binaryImage.byteLength),
      },
      body: binaryImage,
    });
    expect(s3PutRes.status).toBe(200);

    const mediaMsgId = crypto.randomUUID();
    const mediaBroadcastPromise = waitForSocketEvent<MessagePayload>(
      clientB,
      "message:new",
      (msg) => msg.id === mediaMsgId
    );

    const mediaSendAck = await new Promise<{ success: boolean }>((resolve) => {
      clientA.emit(
        "message:send",
        {
          id: mediaMsgId,
          chatId,
          body: "Image caption",
          mediaId,
        },
        (ack) => resolve(ack)
      );
    });
    expect(mediaSendAck.success).toBe(true);

    const broadcastedMediaMsg = await mediaBroadcastPromise;
    expect(broadcastedMediaMsg.hasMedia).toBeDefined();
    expect(broadcastedMediaMsg.hasMedia?.id).toBe(mediaId);
    expect(broadcastedMediaMsg.hasMedia?.src).toBe(publicUrl);
    expect(broadcastedMediaMsg.hasMedia?.orientation).toBe("square");

    // Verify HTTP history includes both messages with accurate statuses and media attachment
    const historyRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${chatId}/messages`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(historyRes.statusCode).toBe(200);
    const { messages: history } = historyRes.json();
    const foundText = history.find((m: MessagePayload) => m.id === textMessageId);
    const foundMedia = history.find((m: MessagePayload) => m.id === mediaMsgId);

    expect(foundText?.status).toBe("read");
    expect(foundMedia?.hasMedia?.id).toBe(mediaId);
    expect(foundMedia?.hasMedia?.src).toBe(publicUrl);
  });
});
