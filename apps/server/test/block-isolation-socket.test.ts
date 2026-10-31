import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { AddressInfo } from "net";
import pg from "pg";
import { registerTestUser, waitForSocketEvent } from "./test-helpers.js";
import { blockedUsers, chats, chatParticipants, messages } from "../src/db/schema.js";
import { eq, and } from "drizzle-orm";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  UserPresence,
} from "@chat-me/shared";

describe("Block Isolation & Socket Flows Seam", () => {
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
      email: `block-iso-alice-${Date.now()}@example.com`,
      name: "Alice Iso",
    });
    bob = await registerTestUser(app, {
      email: `block-iso-bob-${Date.now()}@example.com`,
      name: "Bob Iso",
    });
    charlie = await registerTestUser(app, {
      email: `block-iso-charlie-${Date.now()}@example.com`,
      name: "Charlie Iso",
    });
  });

  afterEach(async () => {
    await app.db.delete(blockedUsers);
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  describe("HTTP Chat Creation & Group Addition Isolation", () => {
    it("rejects POST /api/v1/chats when attempting to create a Direct Chat with a blocked user (403)", async () => {
      // Alice blocks Bob
      await app.inject({
        method: "POST",
        url: `/api/v1/users/me/blocked/${bob.userId}`,
        headers: { authorization: `Bearer ${alice.accessToken}` },
      });

      // Alice tries to create direct chat with Bob -> 403
      const resAlice = await app.inject({
        method: "POST",
        url: "/api/v1/chats",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: {
          type: "direct",
          targetUserId: bob.userId,
        },
      });
      expect(resAlice.statusCode).toBe(403);

      // Bob tries to create direct chat with Alice -> 403 (blocked by Alice)
      const resBob = await app.inject({
        method: "POST",
        url: "/api/v1/chats",
        headers: { authorization: `Bearer ${bob.accessToken}` },
        payload: {
          type: "direct",
          targetUserId: alice.userId,
        },
      });
      expect(resBob.statusCode).toBe(403);
    });

    it("rejects adding a user who blocked the actor to a group Chat (403), while keeping existing group Chat timelines visible", async () => {
      // Bob blocks Alice
      await app.inject({
        method: "POST",
        url: `/api/v1/users/me/blocked/${alice.userId}`,
        headers: { authorization: `Bearer ${bob.accessToken}` },
      });

      // Alice tries to create a group chat with Bob -> 403
      const createGroupRes = await app.inject({
        method: "POST",
        url: "/api/v1/chats",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: {
          type: "group",
          title: "Secret Club",
          participantIds: [bob.userId],
        },
      });
      expect(createGroupRes.statusCode).toBe(403);

      // But an existing group chat where both are already members remains fully visible
      // Unblock temporarily to establish initial group chat with Alice, Bob, Charlie
      await app.db.delete(blockedUsers);

      const groupRes = await app.inject({
        method: "POST",
        url: "/api/v1/chats",
        headers: { authorization: `Bearer ${charlie.accessToken}` },
        payload: {
          type: "group",
          title: "Public Project",
          participantIds: [alice.userId, bob.userId],
        },
      });
      expect(groupRes.statusCode).toBe(201);
      const groupData = JSON.parse(groupRes.body);

      // Charlie posts a message
      await app.db.insert(messages).values({
        id: crypto.randomUUID(),
        chatId: groupData.id,
        senderId: charlie.userId,
        body: "Hello group!",
      });

      // Bob blocks Alice now
      await app.inject({
        method: "POST",
        url: `/api/v1/users/me/blocked/${alice.userId}`,
        headers: { authorization: `Bearer ${bob.accessToken}` },
      });

      // Both Alice and Bob can still fetch messages from the existing group chat
      const aliceMsgsRes = await app.inject({
        method: "GET",
        url: `/api/v1/chats/${groupData.id}/messages`,
        headers: { authorization: `Bearer ${alice.accessToken}` },
      });
      expect(aliceMsgsRes.statusCode).toBe(200);
      const aliceMsgs = JSON.parse(aliceMsgsRes.body);
      expect(aliceMsgs.messages.length).toBeGreaterThan(0);

      const bobMsgsRes = await app.inject({
        method: "GET",
        url: `/api/v1/chats/${groupData.id}/messages`,
        headers: { authorization: `Bearer ${bob.accessToken}` },
      });
      expect(bobMsgsRes.statusCode).toBe(200);
    });
  });

  describe("Socket.IO Real-Time Block Isolation (Presence, Message Send, Typing)", () => {
    let clientAlice: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
    let clientBob: ClientSocket<ServerToClientEvents, ClientToServerEvents>;

    afterEach(() => {
      if (clientAlice?.connected) clientAlice.disconnect();
      if (clientBob?.connected) clientBob.disconnect();
    });

    it("immediately updates mutual presence over Socket.IO on block (status: offline, lastSeenAt: null) and unblock", async () => {
      clientAlice = ioc(serverUrl, {
        auth: { token: alice.accessToken },
        transports: ["websocket"],
      });
      clientBob = ioc(serverUrl, {
        auth: { token: bob.accessToken },
        transports: ["websocket"],
      });

      await Promise.all([
        new Promise<void>((resolve) => clientAlice.on("connect", resolve)),
        new Promise<void>((resolve) => clientBob.on("connect", resolve)),
      ]);

      // Prepare promise on Bob's socket expecting Alice's presence update to offline
      const bobSeesAliceOffline = waitForSocketEvent<UserPresence>(
        clientBob,
        "presence:updated",
        (data) => data.userId === alice.userId && data.status === "offline" && data.lastSeenAt === null
      );

      // Prepare promise on Alice's socket expecting Bob's presence update to offline
      const aliceSeesBobOffline = waitForSocketEvent<UserPresence>(
        clientAlice,
        "presence:updated",
        (data) => data.userId === bob.userId && data.status === "offline" && data.lastSeenAt === null
      );

      // Alice blocks Bob via API
      await app.inject({
        method: "POST",
        url: `/api/v1/users/me/blocked/${bob.userId}`,
        headers: { authorization: `Bearer ${alice.accessToken}` },
      });

      const [presenceForBob, presenceForAlice] = await Promise.all([
        bobSeesAliceOffline,
        aliceSeesBobOffline,
      ]);

      expect(presenceForBob.status).toBe("offline");
      expect(presenceForBob.lastSeenAt).toBeNull();
      expect(presenceForAlice.status).toBe("offline");
      expect(presenceForAlice.lastSeenAt).toBeNull();

      // Now unblock and verify presence is re-evaluated to online
      const bobSeesAliceOnline = waitForSocketEvent<UserPresence>(
        clientBob,
        "presence:updated",
        (data) => data.userId === alice.userId && data.status === "online"
      );
      const aliceSeesBobOnline = waitForSocketEvent<UserPresence>(
        clientAlice,
        "presence:updated",
        (data) => data.userId === bob.userId && data.status === "online"
      );

      await app.inject({
        method: "DELETE",
        url: `/api/v1/users/me/blocked/${bob.userId}`,
        headers: { authorization: `Bearer ${alice.accessToken}` },
      });

      const [onlineForBob, onlineForAlice] = await Promise.all([
        bobSeesAliceOnline,
        aliceSeesBobOnline,
      ]);

      expect(onlineForBob.status).toBe("online");
      expect(onlineForAlice.status).toBe("online");
    });

    it("rejects message:send in a Direct Chat where a block exists in either direction", async () => {
      // Create direct chat between Alice and Bob first
      const directChatRes = await app.inject({
        method: "POST",
        url: "/api/v1/chats",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: {
          type: "direct",
          targetUserId: bob.userId,
        },
      });
      const directChat = JSON.parse(directChatRes.body);

      // Alice blocks Bob
      await app.inject({
        method: "POST",
        url: `/api/v1/users/me/blocked/${bob.userId}`,
        headers: { authorization: `Bearer ${alice.accessToken}` },
      });

      clientAlice = ioc(serverUrl, {
        auth: { token: alice.accessToken },
        transports: ["websocket"],
      });
      clientBob = ioc(serverUrl, {
        auth: { token: bob.accessToken },
        transports: ["websocket"],
      });

      await Promise.all([
        new Promise<void>((resolve) => clientAlice.on("connect", resolve)),
        new Promise<void>((resolve) => clientBob.on("connect", resolve)),
      ]);

      // Bob tries to send a message to Alice in the direct chat -> rejected
      const sendFromBobAck = await new Promise<any>((resolve) => {
        clientBob.emit(
          "message:send",
          {
            id: crypto.randomUUID(),
            chatId: directChat.id,
            body: "Hey Alice, can you hear me?",
          },
          resolve
        );
      });

      expect(sendFromBobAck.success).toBe(false);
      expect(sendFromBobAck.error).toContain("blocked");

      // Alice tries to send a message to Bob -> also rejected
      const sendFromAliceAck = await new Promise<any>((resolve) => {
        clientAlice.emit(
          "message:send",
          {
            id: crypto.randomUUID(),
            chatId: directChat.id,
            body: "I blocked you!",
          },
          resolve
        );
      });

      expect(sendFromAliceAck.success).toBe(false);
      expect(sendFromAliceAck.error).toContain("blocked");
    });

    it("suppresses typing indicators in Direct Chat when a block exists in either direction", async () => {
      // Create direct chat
      const directChatRes = await app.inject({
        method: "POST",
        url: "/api/v1/chats",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: {
          type: "direct",
          targetUserId: bob.userId,
        },
      });
      const directChat = JSON.parse(directChatRes.body);

      // Alice blocks Bob
      await app.inject({
        method: "POST",
        url: `/api/v1/users/me/blocked/${bob.userId}`,
        headers: { authorization: `Bearer ${alice.accessToken}` },
      });

      clientAlice = ioc(serverUrl, {
        auth: { token: alice.accessToken },
        transports: ["websocket"],
      });
      clientBob = ioc(serverUrl, {
        auth: { token: bob.accessToken },
        transports: ["websocket"],
      });

      await Promise.all([
        new Promise<void>((resolve) => clientAlice.on("connect", resolve)),
        new Promise<void>((resolve) => clientBob.on("connect", resolve)),
      ]);

      clientAlice.emit("chat:join", directChat.id);
      clientBob.emit("chat:join", directChat.id);

      let typingReceivedByAlice = false;
      clientAlice.on("chat:typing_updated", () => {
        typingReceivedByAlice = true;
      });

      // Bob sends chat:typing
      clientBob.emit("chat:typing", { chatId: directChat.id, isTyping: true });

      // Wait a short time to verify typing event is suppressed
      await new Promise((r) => setTimeout(r, 200));
      expect(typingReceivedByAlice).toBe(false);
    });
  });
});
