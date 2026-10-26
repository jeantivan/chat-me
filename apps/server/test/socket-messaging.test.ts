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
  MessagePayload,
} from "@chat-me/shared";
import { waitForSocketEvent } from "./test-helpers.js";

describe("Socket.IO Real-Time Engine & Receipt Lifecycle Seam", () => {
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

    // Register User A
    const regARes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: `alice-ws-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Alice WS",
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
        email: `bob-ws-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Bob WS",
      },
    });
    const regBData = JSON.parse(regBRes.payload);
    userBId = regBData.user.id;
    tokenB = regBData.accessToken;

    // Create direct chat
    const chatRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { targetUserId: userBId },
    });
    chatId = JSON.parse(chatRes.payload).id;
  });

  afterAll(async () => {
    if (clientA?.connected) clientA.disconnect();
    if (clientB?.connected) clientB.disconnect();

    if (userAId) await db.delete(users).where(eq(users.id, userAId));
    if (userBId) await db.delete(users).where(eq(users.id, userBId));

    await app.close();
    await pool.end();
  });

  it("authenticates Socket.IO handshake with JWT and rejects unauthenticated connections", async () => {
    // Unauthenticated connection should fail
    const unauthSocket = ioc(serverUrl, {
      auth: { token: "invalid-token" },
      transports: ["websocket"],
      reconnection: false,
    });

    const connectErrorPromise = new Promise((resolve) => {
      unauthSocket.on("connect_error", (err) => {
        resolve(err.message);
      });
    });

    const errorMsg = await connectErrorPromise;
    expect(errorMsg).toMatch(/Unauthorized/i);
    unauthSocket.disconnect();
  });

  it("completes full-duplex message dispatch and status receipt progression (send -> received -> read)", async () => {
    // 1. Connect Client A and Client B with valid JWTs
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

    expect(clientA.connected).toBe(true);
    expect(clientB.connected).toBe(true);

    // 2. Both join chat room
    clientA.emit("chat:join", chatId);
    clientB.emit("chat:join", chatId);

    // Wait a tick for joins
    await new Promise((r) => setTimeout(r, 100));

    // 3. Client A sends message with client-supplied UUID
    const messageId = crypto.randomUUID();
    const messageText = "Hey Bob, testing status receipts!";

    const messageNewPromise = waitForSocketEvent<MessagePayload>(
      clientB,
      "message:new",
      (msg) => msg.id === messageId
    );

    const ackPromise = new Promise<{ success: boolean; id: string; createdAt: string }>((resolve) => {
      clientA.emit(
        "message:send",
        { id: messageId, chatId, body: messageText },
        (ack) => resolve(ack)
      );
    });

    // Verify ACK callback
    const ack = await ackPromise;
    expect(ack.success).toBe(true);
    expect(ack.id).toBe(messageId);
    expect(ack.createdAt).toBeDefined();

    // Verify Client B received "message:new"
    const newMsg = await messageNewPromise;
    expect(newMsg.id).toBe(messageId);
    expect(newMsg.chatId).toBe(chatId);
    expect(newMsg.owner).toBe(userAId);
    expect(newMsg.body).toBe(messageText);

    // 4. Client B acknowledges receipt (message:ack_received)
    const receivedStatusPromise = waitForSocketEvent<{ messageId: string; status: string }>(
      clientA,
      "message:status_changed",
      (payload) => payload.messageId === messageId && payload.status === "received"
    );

    clientB.emit("message:ack_received", {
      chatId,
      messageIds: [messageId],
    });

    const receivedStatus = await receivedStatusPromise;
    expect(receivedStatus.status).toBe("received");
    expect(receivedStatus.messageId).toBe(messageId);

    // 5. Client B reads the message in viewport (message:ack_read)
    const readStatusPromise = waitForSocketEvent<{ messageId: string; status: string }>(
      clientA,
      "message:status_changed",
      (payload) => payload.messageId === messageId && payload.status === "read"
    );

    clientB.emit("message:ack_read", {
      chatId,
      lastMessageId: messageId,
    });

    const readStatus = await readStatusPromise;
    expect(readStatus.status).toBe("read");
    expect(readStatus.messageId).toBe(messageId);
  });
});
