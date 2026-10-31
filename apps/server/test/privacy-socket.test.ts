import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { AddressInfo } from "net";
import pg from "pg";
import { registerTestUser, waitForSocketEvent } from "./test-helpers.js";
import { userSettings, contacts } from "../src/db/schema.js";
import { eq } from "drizzle-orm";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  UserPresence,
  ReceiptStatusPayload,
  MessagePayload,
} from "@chat-me/shared";

describe("Privacy Socket & Presence Reciprocity Seam", () => {
  let app: FastifyInstance;
  let serverUrl: string;
  let pool: pg.Pool;

  let alice: { userId: string; accessToken: string };
  let bob: { userId: string; accessToken: string };
  let charlie: { userId: string; accessToken: string };

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const address = app.server.address() as AddressInfo;
    serverUrl = `http://127.0.0.1:${address.port}`;
    pool = new pg.Pool({ connectionString: databaseUrl });

    alice = await registerTestUser(app, {
      email: `alice-sock-${Date.now()}@example.com`,
      name: "Alice Sock",
    });
    bob = await registerTestUser(app, {
      email: `bob-sock-${Date.now()}@example.com`,
      name: "Bob Sock",
    });
    charlie = await registerTestUser(app, {
      email: `charlie-sock-${Date.now()}@example.com`,
      name: "Charlie Sock",
    });
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  describe("Presence Reciprocity (privacyLastSeen)", () => {
    let clientAlice: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
    let clientBob: ClientSocket<ServerToClientEvents, ClientToServerEvents>;

    afterEach(() => {
      if (clientAlice?.connected) clientAlice.disconnect();
      if (clientBob?.connected) clientBob.disconnect();
    });

    it("GET /api/v1/users/:id/presence respects reciprocity", async () => {
      // Connect Alice so she is online
      clientAlice = ioc(serverUrl, {
        auth: { token: alice.accessToken },
        transports: ["websocket"],
        reconnection: false,
      });
      await new Promise((resolve) => clientAlice.on("connect", resolve));

      // Alice has privacyLastSeen='all', Bob has privacyLastSeen='all'
      const pres1 = await app.inject({
        method: "GET",
        url: `/api/v1/users/${alice.userId}/presence`,
        headers: { authorization: `Bearer ${bob.accessToken}` },
      });
      expect(pres1.statusCode).toBe(200);
      const data1 = pres1.json() as UserPresence;
      expect(data1.status).toBe("online");
      expect(data1.lastSeenAt).toBeDefined();

      // Alice changes privacyLastSeen to 'none'
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/settings",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: { privacyLastSeen: "none" },
      });

      // Bob checks Alice's presence -> masked to offline with no lastSeenAt
      const pres2 = await app.inject({
        method: "GET",
        url: `/api/v1/users/${alice.userId}/presence`,
        headers: { authorization: `Bearer ${bob.accessToken}` },
      });
      expect(pres2.statusCode).toBe(200);
      const data2 = pres2.json() as UserPresence;
      expect(data2.status).toBe("offline");
      expect(data2.lastSeenAt).toBeUndefined();

      // Alice checks Bob's presence -> because reciprocity applies, Alice also cannot see Bob!
      const pres3 = await app.inject({
        method: "GET",
        url: `/api/v1/users/${bob.userId}/presence`,
        headers: { authorization: `Bearer ${alice.accessToken}` },
      });
      expect(pres3.statusCode).toBe(200);
      const data3 = pres3.json() as UserPresence;
      expect(data3.status).toBe("offline");
      expect(data3.lastSeenAt).toBeUndefined();

      // Reset Alice to 'all'
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/settings",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: { privacyLastSeen: "all" },
      });
    });

    it("hydrates presence on connection only when reciprocity permits", async () => {
      // Bob restricts privacyLastSeen to 'none'
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/settings",
        headers: { authorization: `Bearer ${bob.accessToken}` },
        payload: { privacyLastSeen: "none" },
      });

      // Connect Bob
      clientBob = ioc(serverUrl, {
        auth: { token: bob.accessToken },
        transports: ["websocket"],
        reconnection: false,
      });
      await new Promise((resolve) => clientBob.on("connect", resolve));

      // Alice connects. She should NOT receive presence hydration for Bob
      clientAlice = ioc(serverUrl, {
        auth: { token: alice.accessToken },
        transports: ["websocket"],
        reconnection: false,
      });

      let receivedBobPresence = false;
      clientAlice.on("presence:updated", (p) => {
        if (p.userId === bob.userId) receivedBobPresence = true;
      });

      await new Promise((resolve) => clientAlice.on("connect", resolve));
      // Give 200ms to verify no event arrives
      await new Promise((r) => setTimeout(r, 200));
      expect(receivedBobPresence).toBe(false);

      // Reset Bob to 'all'
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/settings",
        headers: { authorization: `Bearer ${bob.accessToken}` },
        payload: { privacyLastSeen: "all" },
      });
    });

    it("re-evaluates presence in real-time when privacyLastSeen changes", async () => {
      // Both Alice and Bob are connected and start with 'all'
      clientAlice = ioc(serverUrl, {
        auth: { token: alice.accessToken },
        transports: ["websocket"],
        reconnection: false,
      });
      clientBob = ioc(serverUrl, {
        auth: { token: bob.accessToken },
        transports: ["websocket"],
        reconnection: false,
      });

      await Promise.all([
        new Promise((resolve) => clientAlice.on("connect", resolve)),
        new Promise((resolve) => clientBob.on("connect", resolve)),
      ]);

      const bobReceivedPromise = waitForSocketEvent<UserPresence>(
        clientBob,
        "presence:updated",
        (p) => p.userId === alice.userId && p.status === "offline"
      );

      // Alice changes privacyLastSeen to 'none'
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/settings",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: { privacyLastSeen: "none" },
      });

      const updatedPresenceForBob = await bobReceivedPromise;
      expect(updatedPresenceForBob.status).toBe("offline");

      // Reset Alice to 'all'
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/settings",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: { privacyLastSeen: "all" },
      });
    });
  });

  describe("Read Receipt Reciprocity (privacyReadReceipt)", () => {
    let clientAlice: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
    let clientBob: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
    let directChatId: string;
    let groupChatId: string;

    beforeAll(async () => {
      // Create Direct Chat between Alice and Bob
      const dirRes = await app.inject({
        method: "POST",
        url: "/api/v1/chats",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: {
          type: "direct",
          targetUserId: bob.userId,
        },
      });
      directChatId = dirRes.json().id;

      // Create Group Chat with Alice, Bob, and Charlie
      const grpRes = await app.inject({
        method: "POST",
        url: "/api/v1/chats",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: {
          type: "group",
          title: "Read Receipts Test Group",
          participantIds: [bob.userId, charlie.userId],
        },
      });
      groupChatId = grpRes.json().id;
    });

    afterEach(() => {
      if (clientAlice?.connected) clientAlice.disconnect();
      if (clientBob?.connected) clientBob.disconnect();
    });

    it("in direct chat, does not record or broadcast read receipts if either participant has privacyReadReceipt=false", async () => {
      // Bob disables read receipts
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/settings",
        headers: { authorization: `Bearer ${bob.accessToken}` },
        payload: { privacyReadReceipt: false },
      });

      clientAlice = ioc(serverUrl, {
        auth: { token: alice.accessToken },
        transports: ["websocket"],
        reconnection: false,
      });
      clientBob = ioc(serverUrl, {
        auth: { token: bob.accessToken },
        transports: ["websocket"],
        reconnection: false,
      });

      await Promise.all([
        new Promise((resolve) => clientAlice.on("connect", resolve)),
        new Promise((resolve) => clientBob.on("connect", resolve)),
      ]);

      clientAlice.emit("chat:join", directChatId);
      clientBob.emit("chat:join", directChatId);

      // Alice sends a message
      const msgId = crypto.randomUUID();
      const sendPromise = new Promise<{ success: boolean }>((resolve) => {
        clientAlice.emit(
          "message:send",
          {
            id: msgId,
            chatId: directChatId,
            body: "Hello Bob, do you read me?",
          },
          resolve
        );
      });
      await sendPromise;

      // Bob acks received
      clientBob.emit("message:ack_received", {
        chatId: directChatId,
        messageIds: [msgId],
      });

      let receivedReadReceipt = false;
      clientAlice.on("receipt:updated", (r) => {
        if (r.messageId === msgId && r.status === "read") {
          receivedReadReceipt = true;
        }
      });
      clientAlice.on("message:status_changed", (s) => {
        if (s.messageId === msgId && s.status === "read") {
          receivedReadReceipt = true;
        }
      });

      // Bob acks read
      clientBob.emit("message:ack_read", {
        chatId: directChatId,
        lastMessageId: msgId,
      });

      await new Promise((r) => setTimeout(r, 300));

      // Alice must NOT receive 'read' status (capped at 'received')
      expect(receivedReadReceipt).toBe(false);

      // But Bob's unread count should be 0 because watermark lastReadAt updated
      const bobChatsRes = await app.inject({
        method: "GET",
        url: "/api/v1/chats",
        headers: { authorization: `Bearer ${bob.accessToken}` },
      });
      const bobChats = bobChatsRes.json();
      const bChat = bobChats.find((c: any) => c.id === directChatId);
      expect(bChat?.unreadCount).toBe(0);

      // Reset Bob's privacyReadReceipt to true
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/settings",
        headers: { authorization: `Bearer ${bob.accessToken}` },
        payload: { privacyReadReceipt: true },
      });
    });

    it("in group chat, read receipts are always recorded and broadcast even if participant has privacyReadReceipt=false", async () => {
      // Bob disables read receipts
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/settings",
        headers: { authorization: `Bearer ${bob.accessToken}` },
        payload: { privacyReadReceipt: false },
      });

      clientAlice = ioc(serverUrl, {
        auth: { token: alice.accessToken },
        transports: ["websocket"],
        reconnection: false,
      });
      clientBob = ioc(serverUrl, {
        auth: { token: bob.accessToken },
        transports: ["websocket"],
        reconnection: false,
      });

      await Promise.all([
        new Promise((resolve) => clientAlice.on("connect", resolve)),
        new Promise((resolve) => clientBob.on("connect", resolve)),
      ]);

      clientAlice.emit("chat:join", groupChatId);
      clientBob.emit("chat:join", groupChatId);

      // Alice sends message to group
      const msgId = crypto.randomUUID();
      await new Promise<void>((resolve) => {
        clientAlice.emit(
          "message:send",
          {
            id: msgId,
            chatId: groupChatId,
            body: "Group announcement",
          },
          () => resolve()
        );
      });

      const readReceiptPromise = waitForSocketEvent<ReceiptStatusPayload>(
        clientAlice,
        "receipt:updated",
        (r) => r.messageId === msgId && r.status === "read" && r.userId === bob.userId
      );

      // Bob acks read in group chat
      clientBob.emit("message:ack_read", {
        chatId: groupChatId,
        lastMessageId: msgId,
      });

      const receipt = await readReceiptPromise;
      expect(receipt.status).toBe("read");
      expect(receipt.userId).toBe(bob.userId);
    });
  });
});
