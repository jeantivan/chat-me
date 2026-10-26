import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { AddressInfo } from "net";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, chats, mediaAttachments, messages } from "../src/db/schema.js";
import { eq } from "drizzle-orm";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  MessagePayload,
} from "@chat-me/shared";
import { waitForSocketEvent } from "./test-helpers.js";

describe("Socket.IO Real-Time Media Linking & Serialization Seam", () => {
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
        email: `media-ws-a-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Media Alice",
      },
    });
    const aData = JSON.parse(regA.payload);
    userAId = aData.user.id;
    tokenA = aData.accessToken;

    const regB = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: `media-ws-b-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Media Bob",
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

  it("rejects message:send if mediaId does not belong to sender or chat", async () => {
    const bogusMediaId = crypto.randomUUID();
    const ack = await new Promise<any>((resolve) => {
      clientA.emit(
        "message:send",
        {
          id: crypto.randomUUID(),
          chatId,
          body: "Trying bogus media",
          mediaId: bogusMediaId,
        },
        (response) => resolve(response)
      );
    });

    expect(ack.success).toBe(false);
    expect(ack.error).toMatch(/media/i);
  });

  it("atomically links mediaId, updates status to attached, and broadcasts message:new with hasMedia", async () => {
    // 1. Presign media via HTTP endpoint
    const presignRes = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${chatId}/media/presign`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        filename: "sunset.png",
        mimeType: "image/png",
        sizeBytes: 150000,
        type: "image",
        orientation: "landscape",
        width: 1920,
        height: 1080,
        blurhash: "U%L#Y9xuRjt7_4t7WBofofofWBof",
      },
    });
    expect(presignRes.statusCode).toBe(200);
    const { mediaId, publicUrl } = JSON.parse(presignRes.payload);

    // 2. Client B listens for message:new
    const messageNewPromise = waitForSocketEvent<MessagePayload>(
      clientB,
      "message:new",
      (msg) => msg.hasMedia?.id === mediaId
    );

    // 3. Client A sends message with mediaId
    const messageId = crypto.randomUUID();
    const ack = await new Promise<any>((resolve) => {
      clientA.emit(
        "message:send",
        {
          id: messageId,
          chatId,
          body: "Sunset photo",
          mediaId,
        },
        (response) => resolve(response)
      );
    });

    expect(ack.success).toBe(true);

    // 4. Verify broadcast payload on Client B
    const receivedMsg = await messageNewPromise;
    expect(receivedMsg.id).toBe(messageId);
    expect(receivedMsg.hasMedia).toBeDefined();
    expect(receivedMsg.hasMedia?.id).toBe(mediaId);
    expect(receivedMsg.hasMedia?.src).toBe(publicUrl);
    expect(receivedMsg.hasMedia?.orientation).toBe("landscape");
    expect(receivedMsg.hasMedia?.blurhash).toBe("U%L#Y9xuRjt7_4t7WBofofofWBof");
    expect(receivedMsg.hasMedia?.width).toBe(1920);
    expect(receivedMsg.hasMedia?.height).toBe(1080);

    // 5. Verify database records
    const [attachmentRow] = await db
      .select()
      .from(mediaAttachments)
      .where(eq(mediaAttachments.id, mediaId));

    expect(attachmentRow.status).toBe("attached");
    expect(attachmentRow.messageId).toBe(messageId);

    // 6. Verify messages GET endpoint returns hasMedia
    const messagesRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${chatId}/messages`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(messagesRes.statusCode).toBe(200);
    const messagesData = JSON.parse(messagesRes.payload);
    const foundMsg = messagesData.messages.find((m: any) => m.id === messageId);
    expect(foundMsg).toBeDefined();
    expect(foundMsg.hasMedia).toBeDefined();
    expect(foundMsg.hasMedia.id).toBe(mediaId);
    expect(foundMsg.hasMedia.src).toBe(publicUrl);
    expect(foundMsg.hasMedia.blurhash).toBe("U%L#Y9xuRjt7_4t7WBofofofWBof");
  });
});
