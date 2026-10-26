import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { AddressInfo } from "net";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "../src/db/schema.js";
import { inArray } from "drizzle-orm";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  MessagePayload,
} from "@chat-me/shared";

describe("Multi-User Group Chat & Participant Management Seam", () => {
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
  let groupId: string;

  let clientA: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let clientB: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let clientC: ClientSocket<ServerToClientEvents, ClientToServerEvents>;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const address = app.server.address() as AddressInfo;
    serverUrl = `http://127.0.0.1:${address.port}`;

    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool);

    async function registerUser(name: string) {
      const email = `${name.toLowerCase().replace(/\s+/g, "")}-${Date.now()}@example.com`;
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email,
          password: "Password123!",
          name,
        },
      });
      const data = JSON.parse(res.payload);
      return { id: data.user.id, token: data.accessToken };
    }

    const uA = await registerUser("Alice Group WS");
    userAId = uA.id;
    tokenA = uA.token;

    const uB = await registerUser("Bob Group WS");
    userBId = uB.id;
    tokenB = uB.token;

    const uC = await registerUser("Charlie Group WS");
    userCId = uC.id;
    tokenC = uC.token;
  });

  afterAll(async () => {
    if (clientA?.connected) clientA.disconnect();
    if (clientB?.connected) clientB.disconnect();
    if (clientC?.connected) clientC.disconnect();

    const ids = [userAId, userBId, userCId].filter(Boolean);
    if (ids.length > 0) {
      await db.delete(users).where(inArray(users.id, ids));
    }

    await app.close();
    await pool.end();
  });

  it("verifies group creation, participant addition, and multi-user message receipt aggregation in a unified integration lifecycle", async () => {
    // 1. Group Creation via REST
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        type: "group",
        title: "Testing Group Realtime",
        bio: "Integration test chat",
        participantIds: [userBId],
      },
    });
    expect(createRes.statusCode).toBe(201);
    const groupData = JSON.parse(createRes.payload);
    groupId = groupData.id;
    expect(groupData.title).toBe("Testing Group Realtime");
    expect(groupData.bio).toBe("Integration test chat");
    expect(groupData.participants.length).toBe(2);

    // 2. Participant Addition via REST (Alice adds Charlie)
    const addRes = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${groupId}/participants`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        userIds: [userCId],
      },
    });
    expect(addRes.statusCode).toBe(200);
    const updatedGroupData = JSON.parse(addRes.payload);
    expect(updatedGroupData.participants.length).toBe(3);

    // 3. Socket.IO connection and receipt aggregation
    clientA = ioc(serverUrl, { auth: { token: tokenA }, transports: ["websocket"] });
    clientB = ioc(serverUrl, { auth: { token: tokenB }, transports: ["websocket"] });
    clientC = ioc(serverUrl, { auth: { token: tokenC }, transports: ["websocket"] });

    await Promise.all([
      new Promise<void>((resolve) => clientA.on("connect", () => resolve())),
      new Promise<void>((resolve) => clientB.on("connect", () => resolve())),
      new Promise<void>((resolve) => clientC.on("connect", () => resolve())),
    ]);

    clientA.emit("chat:join", groupId);
    clientB.emit("chat:join", groupId);
    clientC.emit("chat:join", groupId);

    await new Promise((r) => setTimeout(r, 100));

    const messageId = crypto.randomUUID();
    const messageText = "Hello group members!";

    // Both B and C should receive message:new
    const msgPromiseB = new Promise<MessagePayload>((resolve) => {
      clientB.on("message:new", (msg) => {
        if (msg.id === messageId) resolve(msg);
      });
    });

    const msgPromiseC = new Promise<MessagePayload>((resolve) => {
      clientC.on("message:new", (msg) => {
        if (msg.id === messageId) resolve(msg);
      });
    });

    // Send message from A
    await new Promise<{ success: boolean }>((resolve) => {
      clientA.emit(
        "message:send",
        { id: messageId, chatId: groupId, body: messageText },
        (ack) => resolve(ack)
      );
    });

    const [bMsg, cMsg] = await Promise.all([msgPromiseB, msgPromiseC]);
    expect(bMsg.id).toBe(messageId);
    expect(cMsg.id).toBe(messageId);
    expect(bMsg.owner).toBe(userAId);
    expect(cMsg.owner).toBe(userAId);

    // Initial check via REST: status for Alice should be "send"
    const msgsRes1 = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${groupId}/messages`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const msgsData1 = JSON.parse(msgsRes1.payload);
    const msg1 = msgsData1.messages.find((m: any) => m.id === messageId);
    expect(msg1.status).toBe("send");

    // Bob acknowledges receipt (received)
    let prematureStatus: string | null = null;
    const tempListener = (payload: any) => {
      if (payload.messageId === messageId) {
        prematureStatus = payload.status;
      }
    };
    clientA.on("message:status_changed", tempListener);

    clientB.emit("message:ack_received", {
      chatId: groupId,
      messageIds: [messageId],
    });
    await new Promise((r) => setTimeout(r, 150));
    clientA.off("message:status_changed", tempListener);

    // Premature status should NOT have been "received" or "read" for Alice because Charlie hasn't received yet
    expect(prematureStatus).not.toBe("received");
    expect(prematureStatus).not.toBe("read");

    // Alice should STILL see "send" because Charlie has not received yet!
    const msgsRes2 = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${groupId}/messages`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const msgsData2 = JSON.parse(msgsRes2.payload);
    const msg2 = msgsData2.messages.find((m: any) => m.id === messageId);
    expect(msg2.status).toBe("send");

    // Now Charlie acknowledges receipt -> Alice should receive status_changed to "received"
    const aliceReceivedPromise = new Promise<{ status: string }>((resolve) => {
      clientA.on("message:status_changed", (payload) => {
        if (payload.messageId === messageId && payload.status === "received") {
          resolve(payload);
        }
      });
    });

    clientC.emit("message:ack_received", {
      chatId: groupId,
      messageIds: [messageId],
    });

    const statusReceived = await aliceReceivedPromise;
    expect(statusReceived.status).toBe("received");

    // REST check confirms Alice sees "received"
    const msgsRes3 = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${groupId}/messages`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const msgsData3 = JSON.parse(msgsRes3.payload);
    const msg3 = msgsData3.messages.find((m: any) => m.id === messageId);
    expect(msg3.status).toBe("received");

    // Bob reads the message (message:ack_read)
    let prematureReadStatus: string | null = null;
    const tempReadListener = (payload: any) => {
      if (payload.messageId === messageId) {
        prematureReadStatus = payload.status;
      }
    };
    clientA.on("message:status_changed", tempReadListener);

    clientB.emit("message:ack_read", {
      chatId: groupId,
      lastMessageId: messageId,
    });
    await new Promise((r) => setTimeout(r, 150));
    clientA.off("message:status_changed", tempReadListener);

    // Alice should NOT prematurely receive "read" because Charlie hasn't read
    expect(prematureReadStatus).not.toBe("read");

    // Alice should STILL see "received" because Charlie hasn't read
    const msgsRes4 = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${groupId}/messages`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const msgsData4 = JSON.parse(msgsRes4.payload);
    const msg4 = msgsData4.messages.find((m: any) => m.id === messageId);
    expect(msg4.status).toBe("received");

    // Now Charlie reads -> Alice receives status_changed to "read"
    const aliceReadPromise = new Promise<{ status: string }>((resolve) => {
      clientA.on("message:status_changed", (payload) => {
        if (payload.messageId === messageId && payload.status === "read") {
          resolve(payload);
        }
      });
    });

    clientC.emit("message:ack_read", {
      chatId: groupId,
      lastMessageId: messageId,
    });

    const statusRead = await aliceReadPromise;
    expect(statusRead.status).toBe("read");

    // REST check confirms Alice sees "read"
    const msgsRes5 = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${groupId}/messages`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const msgsData5 = JSON.parse(msgsRes5.payload);
    const msg5 = msgsData5.messages.find((m: any) => m.id === messageId);
    expect(msg5.status).toBe("read");
  });
});
