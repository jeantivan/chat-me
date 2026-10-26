import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { AddressInfo } from "net";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "../src/db/schema.js";
import { chats, messages, messageReactions, messageStars } from "../src/db/schema.js";
import { eq, inArray } from "drizzle-orm";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  MessagePayload,
} from "@chat-me/shared";
import { waitForSocketEvent } from "./test-helpers.js";

describe("Message Reactions, Starred Messages, Deletion & Forwarding Seam", () => {
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
  let directChatABId: string;
  let groupChatId: string;

  let clientA: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let clientB: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let clientC: ClientSocket<ServerToClientEvents, ClientToServerEvents>;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool);

    app = await buildApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const address = app.server.address() as AddressInfo;
    serverUrl = `http://127.0.0.1:${address.port}`;

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

    const uA = await registerUser("Alice Interactions");
    userAId = uA.id;
    tokenA = uA.token;

    const uB = await registerUser("Bob Interactions");
    userBId = uB.id;
    tokenB = uB.token;

    const uC = await registerUser("Charlie Interactions");
    userCId = uC.id;
    tokenC = uC.token;

    // Create direct chat between Alice and Bob
    const directRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { targetUserId: userBId },
    });
    directChatABId = JSON.parse(directRes.payload).id;

    // Create group chat with Alice, Bob, and Charlie
    const groupRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        type: "group",
        title: "Forward Target Group",
        participantIds: [userBId, userCId],
      },
    });
    groupChatId = JSON.parse(groupRes.payload).id;

    // Connect sockets
    clientA = ioc(serverUrl, { auth: { token: tokenA }, transports: ["websocket"] });
    clientB = ioc(serverUrl, { auth: { token: tokenB }, transports: ["websocket"] });
    clientC = ioc(serverUrl, { auth: { token: tokenC }, transports: ["websocket"] });

    await Promise.all([
      new Promise<void>((r) => clientA.on("connect", () => r())),
      new Promise<void>((r) => clientB.on("connect", () => r())),
      new Promise<void>((r) => clientC.on("connect", () => r())),
    ]);

    clientA.emit("chat:join", directChatABId);
    clientB.emit("chat:join", directChatABId);
    clientA.emit("chat:join", groupChatId);
    clientB.emit("chat:join", groupChatId);
    clientC.emit("chat:join", groupChatId);

    await new Promise((r) => setTimeout(r, 100));
  });

  afterAll(async () => {
    if (clientA?.connected) clientA.disconnect();
    if (clientB?.connected) clientB.disconnect();
    if (clientC?.connected) clientC.disconnect();

    const ids = [userAId, userBId, userCId].filter(Boolean);
    if (ids.length > 0) {
      await db.delete(users).where(inArray(users.id, ids));
    }
    if (directChatABId) {
      await db.delete(chats).where(eq(chats.id, directChatABId));
    }
    if (groupChatId) {
      await db.delete(chats).where(eq(chats.id, groupChatId));
    }

    await app.close();
    await pool.end();
  });

  it("enforces message_reactions and message_stars per-user composite primary key constraints in PostgreSQL", async () => {
    const msgId = crypto.randomUUID();
    await db.insert(messages).values({
      id: msgId,
      chatId: directChatABId,
      senderId: userAId,
      body: "Schema constraint test message",
    });

    // Insert reaction for userA
    await db.insert(messageReactions).values({
      messageId: msgId,
      userId: userAId,
      emoji: ":sparkling_heart:",
    });

    // Duplicate (message_id, user_id) without conflict clause must fail
    await expect(
      db.insert(messageReactions).values({
        messageId: msgId,
        userId: userAId,
        emoji: ":clapping_hands:",
      })
    ).rejects.toThrow();

    // Insert star for userA
    await db.insert(messageStars).values({
      userId: userAId,
      messageId: msgId,
    });

    // Duplicate (user_id, message_id) without conflict clause must fail
    await expect(
      db.insert(messageStars).values({
        userId: userAId,
        messageId: msgId,
      })
    ).rejects.toThrow();
  });

  it("adds, atomically replaces, and toggles off emoji reactions in real time across participants", async () => {
    const messageId = crypto.randomUUID();

    // Send a message from Alice in directChatABId
    await new Promise<{ success: boolean }>((resolve) => {
      clientA.emit(
        "message:send",
        { id: messageId, chatId: directChatABId, body: "React to me!" },
        (ack) => resolve(ack)
      );
    });

    // 1. Bob reacts with :clapping_hands:
    const reactionAddedPromiseA = waitForSocketEvent<{
      messageId: string;
      chatId: string;
      reactions: Array<{ owner: string; type: string }>;
    }>(
      clientA,
      "message:reaction_updated",
      (data) => data.messageId === messageId && data.reactions.length === 1
    );

    const ackAdd = await new Promise<{ success: boolean }>((resolve) => {
      clientB.emit(
        "message:reaction",
        { messageId, chatId: directChatABId, emoji: ":clapping_hands:" },
        (ack) => resolve(ack)
      );
    });
    expect(ackAdd.success).toBe(true);

    const addedEvent = await reactionAddedPromiseA;
    expect(addedEvent.chatId).toBe(directChatABId);
    expect(addedEvent.reactions).toEqual([
      { owner: userBId, type: ":clapping_hands:" },
    ]);

    // 2. Bob atomically replaces reaction with :sparkling_heart:
    const reactionReplacedPromiseA = waitForSocketEvent<{
      messageId: string;
      chatId: string;
      reactions: Array<{ owner: string; type: string }>;
    }>(
      clientA,
      "message:reaction_updated",
      (data) =>
        data.messageId === messageId &&
        data.reactions.some((r) => r.type === ":sparkling_heart:")
    );

    const ackReplace = await new Promise<{ success: boolean }>((resolve) => {
      clientB.emit(
        "message:reaction",
        { messageId, chatId: directChatABId, emoji: ":sparkling_heart:" },
        (ack) => resolve(ack)
      );
    });
    expect(ackReplace.success).toBe(true);

    const replacedEvent = await reactionReplacedPromiseA;
    expect(replacedEvent.reactions).toEqual([
      { owner: userBId, type: ":sparkling_heart:" },
    ]);

    // 3. Alice also adds a reaction :thinking_face:
    const aliceReactPromiseB = waitForSocketEvent<{
      messageId: string;
      chatId: string;
      reactions: Array<{ owner: string; type: string }>;
    }>(
      clientB,
      "message:reaction_updated",
      (data) => data.messageId === messageId && data.reactions.length === 2
    );

    await new Promise<{ success: boolean }>((resolve) => {
      clientA.emit(
        "message:reaction",
        { messageId, chatId: directChatABId, emoji: ":thinking_face:" },
        (ack) => resolve(ack)
      );
    });

    const twoReactionsEvent = await aliceReactPromiseB;
    expect(twoReactionsEvent.reactions).toHaveLength(2);
    expect(twoReactionsEvent.reactions).toEqual(
      expect.arrayContaining([
        { owner: userBId, type: ":sparkling_heart:" },
        { owner: userAId, type: ":thinking_face:" },
      ])
    );

    // 4. Bob removes his reaction (emoji: null)
    const bobRemovedPromiseA = waitForSocketEvent<{
      messageId: string;
      chatId: string;
      reactions: Array<{ owner: string; type: string }>;
    }>(
      clientA,
      "message:reaction_updated",
      (data) => data.messageId === messageId && data.reactions.length === 1
    );

    const ackRemove = await new Promise<{ success: boolean }>((resolve) => {
      clientB.emit(
        "message:reaction",
        { messageId, chatId: directChatABId, emoji: null },
        (ack) => resolve(ack)
      );
    });
    expect(ackRemove.success).toBe(true);

    const removedEvent = await bobRemovedPromiseA;
    expect(removedEvent.reactions).toEqual([
      { owner: userAId, type: ":thinking_face:" },
    ]);

    // 5. Verify GET /api/v1/chats/:chatId/messages returns the reaction array
    const msgsRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatABId}/messages`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(msgsRes.statusCode).toBe(200);
    const msgsBody = JSON.parse(msgsRes.payload);
    const fetchedMsg = msgsBody.messages.find((m: MessagePayload) => m.id === messageId);
    expect(fetchedMsg).toBeDefined();
    expect(fetchedMsg.reactions).toEqual([
      { owner: userAId, type: ":thinking_face:" },
    ]);
  });

  it("allows sender to soft-delete a message for everyone, rendering tombstone across timelines, and rejects non-sender deletion", async () => {
    const messageId = crypto.randomUUID();

    // Alice sends a message
    await new Promise<{ success: boolean }>((resolve) => {
      clientA.emit(
        "message:send",
        { id: messageId, chatId: directChatABId, body: "Secret message to delete" },
        (ack) => resolve(ack)
      );
    });

    // 1. Bob (non-sender) attempts to delete Alice's message -> rejected
    const bobDeleteAck = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      clientB.emit(
        "message:delete",
        { messageId, chatId: directChatABId },
        (ack) => resolve(ack)
      );
    });
    expect(bobDeleteAck.success).toBe(false);

    // 2. Alice (sender) deletes the message for everyone -> succeeds and broadcasts message:deleted
    const deletedPromiseB = waitForSocketEvent<{ messageId: string; chatId: string }>(
      clientB,
      "message:deleted",
      (data) => data.messageId === messageId
    );

    const aliceDeleteAck = await new Promise<{ success: boolean }>((resolve) => {
      clientA.emit(
        "message:delete",
        { messageId, chatId: directChatABId },
        (ack) => resolve(ack)
      );
    });
    expect(aliceDeleteAck.success).toBe(true);

    const deletedEvent = await deletedPromiseB;
    expect(deletedEvent.messageId).toBe(messageId);
    expect(deletedEvent.chatId).toBe(directChatABId);

    // 3. Verify GET /api/v1/chats/:chatId/messages returns tombstone ("This message was deleted") and null media
    const msgsRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatABId}/messages`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(msgsRes.statusCode).toBe(200);
    const msgsBody = JSON.parse(msgsRes.payload);
    const deletedMsg = msgsBody.messages.find((m: MessagePayload) => m.id === messageId);
    expect(deletedMsg).toBeDefined();
    expect(deletedMsg.body).toBe("This message was deleted");
    expect(deletedMsg.hasMedia).toBeNull();
  });

  it("allows users to star and unstar messages and query starred messages", async () => {
    const messageId = crypto.randomUUID();

    // Bob sends an important message in directChatABId
    await new Promise<{ success: boolean }>((resolve) => {
      clientB.emit(
        "message:send",
        { id: messageId, chatId: directChatABId, body: "Important release notes" },
        (ack) => resolve(ack)
      );
    });

    // 1. Alice stars the message
    const starRes = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${directChatABId}/messages/${messageId}/star`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(starRes.statusCode).toBe(200);
    const starData = JSON.parse(starRes.payload);
    expect(starData.starred).toBe(true);
    expect(starData.messageId).toBe(messageId);

    // 2. Query starred messages for Alice
    const getStarredRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/starred?chatId=${directChatABId}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(getStarredRes.statusCode).toBe(200);
    const starredList = JSON.parse(getStarredRes.payload) as MessagePayload[];
    expect(starredList.some((m) => m.id === messageId)).toBe(true);
    const starredMsg = starredList.find((m) => m.id === messageId)!;
    expect(starredMsg.starred).toBe(true);
    expect(starredMsg.body).toBe("Important release notes");

    // 3. Bob has NOT starred the message -> Bob's starred list does not include it
    const bobStarredRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/starred?chatId=${directChatABId}`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(bobStarredRes.statusCode).toBe(200);
    const bobStarredList = JSON.parse(bobStarredRes.payload) as MessagePayload[];
    expect(bobStarredList.some((m) => m.id === messageId)).toBe(false);

    // 4. Alice toggles star off
    const unstarRes = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${directChatABId}/messages/${messageId}/star`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(unstarRes.statusCode).toBe(200);
    expect(JSON.parse(unstarRes.payload).starred).toBe(false);

    // 5. Alice's starred query no longer contains the message
    const afterUnstarRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/starred?chatId=${directChatABId}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const afterUnstarList = JSON.parse(afterUnstarRes.payload) as MessagePayload[];
    expect(afterUnstarList.some((m) => m.id === messageId)).toBe(false);
  });

  it("allows users to forward messages to another direct or group chat and broadcasts message:new with forwarded: true", async () => {
    const sourceMessageId = crypto.randomUUID();
    const bodyText = "Forwarded announcement across chats";

    // Bob sends original message in directChatABId
    await new Promise<{ success: boolean }>((resolve) => {
      clientB.emit(
        "message:send",
        { id: sourceMessageId, chatId: directChatABId, body: bodyText },
        (ack) => resolve(ack)
      );
    });

    // Listen on Charlie's socket for the forwarded message arriving in groupChatId
    const forwardedGroupMsgPromiseC = waitForSocketEvent<MessagePayload>(
      clientC,
      "message:new",
      (msg) => msg.chatId === groupChatId && msg.body === bodyText
    );

    // Alice forwards the message to both groupChatId (by targetChatIds) and Charlie's direct chat (by targetUserIds)
    const forwardRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/forward",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        messageIds: [sourceMessageId],
        targetChatIds: [groupChatId],
        targetUserIds: [userCId],
      },
    });
    expect(forwardRes.statusCode).toBe(200);
    const forwardBody = JSON.parse(forwardRes.payload) as {
      messages: MessagePayload[];
    };
    expect(forwardBody.messages).toHaveLength(2);
    for (const fwdMsg of forwardBody.messages) {
      expect(fwdMsg.forwarded).toBe(true);
      expect(fwdMsg.owner).toBe(userAId);
      expect(fwdMsg.body).toBe(bodyText);
      expect(fwdMsg.starred).toBe(false);
    }

    // Verify Charlie received the real-time broadcast in groupChatId
    const groupForwardedMsg = await forwardedGroupMsgPromiseC;
    expect(groupForwardedMsg.forwarded).toBe(true);
    expect(groupForwardedMsg.owner).toBe(userAId);
    expect(groupForwardedMsg.body).toBe(bodyText);
  });
});
