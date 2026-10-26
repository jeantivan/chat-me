import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { AddressInfo } from "net";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, chats, mediaAttachments, messages } from "../src/db/schema.js";
import { ensureBucketExists } from "../src/services/storage.service.js";
import { eq } from "drizzle-orm";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  MessagePayload,
} from "@chat-me/shared";

describe("MinIO End-to-End Object Storage Integration Test Seam", () => {
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

  beforeAll(async () => {
    await ensureBucketExists();

    app = await buildApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const address = app.server.address() as AddressInfo;
    serverUrl = `http://127.0.0.1:${address.port}`;

    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool);

    const regA = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: `minio-alice-${Date.now()}@example.com`,
        password: "Password123!",
        name: "MinIO Alice",
      },
    });
    const aData = JSON.parse(regA.payload);
    userAId = aData.user.id;
    tokenA = aData.accessToken;

    const regB = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: `minio-bob-${Date.now()}@example.com`,
        password: "Password123!",
        name: "MinIO Bob",
      },
    });
    const bData = JSON.parse(regB.payload);
    userBId = bData.user.id;
    tokenB = bData.accessToken;

    const chatRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { targetUserId: userBId },
    });
    chatId = JSON.parse(chatRes.payload).id;

    clientA = ioc(serverUrl, {
      auth: { token: tokenA },
      transports: ["websocket"],
    });
    clientB = ioc(serverUrl, {
      auth: { token: tokenB },
      transports: ["websocket"],
    });

    await Promise.all([
      new Promise<void>((resolve) => clientA.on("connect", () => resolve())),
      new Promise<void>((resolve) => clientB.on("connect", () => resolve())),
    ]);

    clientA.emit("chat:join", chatId);
    clientB.emit("chat:join", chatId);
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

  it("completes full lifecycle: presign URL, PUT directly to MinIO, and Socket.IO message association", async () => {
    const rawPayload = Buffer.from("PNG_RAW_IMAGE_DATA_SAMPLE_1234567890");

    // 1. Request presigned URL from Fastify
    const presignRes = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${chatId}/media/presign`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        filename: "minio-e2e-photo.png",
        mimeType: "image/png",
        sizeBytes: rawPayload.byteLength,
        type: "image",
        orientation: "landscape",
        width: 1200,
        height: 800,
        blurhash: "U%L#Y9xuRjt7_4t7WBofofofWBof",
      },
    });

    expect(presignRes.statusCode).toBe(200);
    const { mediaId, uploadUrl, publicUrl } = JSON.parse(presignRes.payload);
    expect(uploadUrl).toContain("http://localhost:9000/chat-media/");

    // 2. Direct HTTP PUT upload to MinIO container
    const putResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(rawPayload.byteLength),
      },
      body: rawPayload,
    });

    expect(putResponse.status).toBe(200);

    // 3. Client B listens for message:new broadcast
    const broadcastPromise = new Promise<MessagePayload>((resolve) => {
      clientB.on("message:new", (msg) => {
        if (msg.hasMedia?.id === mediaId) {
          resolve(msg);
        }
      });
    });

    // 4. Send message over WebSocket with mediaId
    const messageId = crypto.randomUUID();
    const ack = await new Promise<any>((resolve) => {
      clientA.emit(
        "message:send",
        {
          id: messageId,
          chatId,
          body: "Uploaded directly to MinIO",
          mediaId,
        },
        (res) => resolve(res)
      );
    });

    expect(ack.success).toBe(true);

    // 5. Verify broadcast payload
    const received = await broadcastPromise;
    expect(received.id).toBe(messageId);
    expect(received.hasMedia).toBeDefined();
    expect(received.hasMedia?.id).toBe(mediaId);
    expect(received.hasMedia?.src).toBe(publicUrl);
    expect(received.hasMedia?.width).toBe(1200);
    expect(received.hasMedia?.height).toBe(800);
    expect(received.hasMedia?.blurhash).toBe("U%L#Y9xuRjt7_4t7WBofofofWBof");

    // 6. Verify GET messages returns the attached media
    const historyRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${chatId}/messages`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    const history = JSON.parse(historyRes.payload);
    const msgInHistory = history.messages.find((m: any) => m.id === messageId);
    expect(msgInHistory).toBeDefined();
    expect(msgInHistory.hasMedia.id).toBe(mediaId);
    expect(msgInHistory.hasMedia.src).toBe(publicUrl);
  });
});
