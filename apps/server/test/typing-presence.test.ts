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
} from "@chat-me/shared";

describe("Socket.IO Ephemeral Typing & Presence Seam", () => {
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
        email: `alice-presence-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Alice Presence",
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
        email: `bob-presence-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Bob Presence",
      },
    });
    const regBData = JSON.parse(regBRes.payload);
    userBId = regBData.user.id;
    tokenB = regBData.accessToken;

    // Create direct chat between A and B
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

  it("broadcasts chat:typing_updated to other participants when user types", async () => {
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

    // Join chat room
    clientA.emit("chat:join", chatId);
    clientB.emit("chat:join", chatId);

    // Wait a tick for joins to propagate
    await new Promise((r) => setTimeout(r, 100));

    // Listen on client B for typing update
    const typingPromise = new Promise<{
      chatId: string;
      userId: string;
      isTyping: boolean;
    }>((resolve) => {
      clientB.once("chat:typing_updated", (data) => resolve(data));
    });

    clientA.emit("chat:typing", { chatId, isTyping: true });

    const typingData = await typingPromise;
    expect(typingData.chatId).toBe(chatId);
    expect(typingData.userId).toBe(userAId);
    expect(typingData.isTyping).toBe(true);

    // Stop typing
    const stopTypingPromise = new Promise<{
      chatId: string;
      userId: string;
      isTyping: boolean;
    }>((resolve) => {
      clientB.once("chat:typing_updated", (data) => resolve(data));
    });

    clientA.emit("chat:typing", { chatId, isTyping: false });

    const stopTypingData = await stopTypingPromise;
    expect(stopTypingData.chatId).toBe(chatId);
    expect(stopTypingData.userId).toBe(userAId);
    expect(stopTypingData.isTyping).toBe(false);
  });

  it("broadcasts presence:updated when user connects and disconnects", async () => {
    // When Client B disconnects, Client A should receive presence:updated with offline
    const offlinePromise = new Promise<{
      userId: string;
      status: "online" | "offline";
      lastSeenAt?: string;
    }>((resolve) => {
      const listener = (data: any) => {
        if (data.userId === userBId) {
          clientA.off("presence:updated", listener);
          resolve(data);
        }
      };
      clientA.on("presence:updated", listener);
    });

    clientB.disconnect();

    const offlineData = await offlinePromise;
    expect(offlineData.userId).toBe(userBId);
    expect(offlineData.status).toBe("offline");
    expect(offlineData.lastSeenAt).toBeDefined();

    // When Client B reconnects, Client A should receive presence:updated with online
    const onlinePromise = new Promise<{
      userId: string;
      status: "online" | "offline";
    }>((resolve) => {
      const listener = (data: any) => {
        if (data.userId === userBId && data.status === "online") {
          clientA.off("presence:updated", listener);
          resolve(data);
        }
      };
      clientA.on("presence:updated", listener);
    });

    clientB = ioc(serverUrl, {
      auth: { token: tokenB },
      transports: ["websocket"],
      reconnection: false,
    });

    const onlineData = await onlinePromise;
    expect(onlineData.userId).toBe(userBId);
    expect(onlineData.status).toBe("online");
  });

  it("handles presence:heartbeat without throwing", async () => {
    expect(() => {
      clientA.emit("presence:heartbeat");
    }).not.toThrow();
  });
});
