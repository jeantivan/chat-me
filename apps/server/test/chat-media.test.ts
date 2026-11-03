import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import pg from "pg";
import { registerTestUser } from "./test-helpers.js";
import {
  chatParticipants,
  messages,
  chats,
  users,
  mediaAttachments,
} from "../src/db/schema.js";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type { MessagePayload } from "@chat-me/shared";

describe("Chat Media Listing Endpoint Seam (GET /api/v1/chats/:chatId/media)", () => {
  let app: FastifyInstance;
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;

  let userA: { userId: string; accessToken: string };
  let userB: { userId: string; accessToken: string };
  let userC: { userId: string; accessToken: string };
  let directChatId: string;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool);

    userA = await registerTestUser(app, {
      email: `media-a-${Date.now()}@example.com`,
      name: "Media Tester A",
    });
    userB = await registerTestUser(app, {
      email: `media-b-${Date.now()}@example.com`,
      name: "Media Tester B",
    });
    userC = await registerTestUser(app, {
      email: `media-c-${Date.now()}@example.com`,
      name: "Media Non-Participant C",
    });

    // Create direct chat between userA and userB
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: { authorization: `Bearer ${userA.accessToken}` },
      payload: { targetUserId: userB.userId },
    });
    expect(createRes.statusCode).toBe(200);
    directChatId = createRes.json().id;
  });

  afterAll(async () => {
    if (directChatId) {
      await db.delete(chats).where(eq(chats.id, directChatId));
    }
    if (userA?.userId) await db.delete(users).where(eq(users.id, userA.userId));
    if (userB?.userId) await db.delete(users).where(eq(users.id, userB.userId));
    if (userC?.userId) await db.delete(users).where(eq(users.id, userC.userId));

    await app.close();
    await pool.end();
  });

  it("rejects unauthenticated requests with 401", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/media`,
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects non-participants with 403", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/media`,
      headers: { authorization: `Bearer ${userC.accessToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("returns media messages with populated MediaPayload fields (filename, sizeBytes, mimeType, createdAt)", async () => {
    const mediaId = crypto.randomUUID();
    const storageKey = `chats/${directChatId}/${mediaId}/report-2026.pdf`;
    const publicUrl = `http://minio/bucket/${storageKey}`;

    await db.insert(mediaAttachments).values({
      id: mediaId,
      chatId: directChatId,
      uploaderId: userA.userId,
      type: "document",
      url: publicUrl,
      storageKey,
      sizeBytes: 1048576,
      mimeType: "application/pdf",
      status: "attached",
    });

    const msgId = crypto.randomUUID();
    await db.insert(messages).values({
      id: msgId,
      chatId: directChatId,
      senderId: userA.userId,
      body: "Here is the annual report",
      mediaId,
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/media`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const mediaMessages: MessagePayload[] = res.json();
    expect(Array.isArray(mediaMessages)).toBe(true);

    const docMsg = mediaMessages.find((m) => m.id === msgId);
    expect(docMsg).toBeDefined();
    expect(docMsg?.hasMedia).toBeDefined();
    expect(docMsg?.hasMedia?.type).toBe("document");
    expect(docMsg?.hasMedia?.src).toBe(publicUrl);
    expect((docMsg?.hasMedia as any)?.filename).toBe("report-2026.pdf");
    expect((docMsg?.hasMedia as any)?.sizeBytes).toBe(1048576);
    expect((docMsg?.hasMedia as any)?.mimeType).toBe("application/pdf");
    expect((docMsg?.hasMedia as any)?.createdAt).toBeDefined();
  });

  it("filters media messages by type: image, video, audio, document, and visual", async () => {
    // Insert an image
    const imgMediaId = crypto.randomUUID();
    await db.insert(mediaAttachments).values({
      id: imgMediaId,
      chatId: directChatId,
      uploaderId: userA.userId,
      type: "image",
      url: `http://minio/bucket/chats/${directChatId}/${imgMediaId}/photo.jpg`,
      storageKey: `chats/${directChatId}/${imgMediaId}/photo.jpg`,
      sizeBytes: 200000,
      mimeType: "image/jpeg",
      status: "attached",
    });
    const imgMsgId = crypto.randomUUID();
    await db.insert(messages).values({
      id: imgMsgId,
      chatId: directChatId,
      senderId: userA.userId,
      body: "Photo caption",
      mediaId: imgMediaId,
    });

    // Insert a video
    const vidMediaId = crypto.randomUUID();
    await db.insert(mediaAttachments).values({
      id: vidMediaId,
      chatId: directChatId,
      uploaderId: userA.userId,
      type: "video",
      url: `http://minio/bucket/chats/${directChatId}/${vidMediaId}/clip.mp4`,
      storageKey: `chats/${directChatId}/${vidMediaId}/clip.mp4`,
      sizeBytes: 5000000,
      mimeType: "video/mp4",
      status: "attached",
    });
    const vidMsgId = crypto.randomUUID();
    await db.insert(messages).values({
      id: vidMsgId,
      chatId: directChatId,
      senderId: userA.userId,
      body: "Video clip",
      mediaId: vidMediaId,
    });

    // Insert an audio
    const audMediaId = crypto.randomUUID();
    await db.insert(mediaAttachments).values({
      id: audMediaId,
      chatId: directChatId,
      uploaderId: userA.userId,
      type: "audio",
      url: `http://minio/bucket/chats/${directChatId}/${audMediaId}/voice.ogg`,
      storageKey: `chats/${directChatId}/${audMediaId}/voice.ogg`,
      sizeBytes: 300000,
      mimeType: "audio/ogg",
      status: "attached",
    });
    const audMsgId = crypto.randomUUID();
    await db.insert(messages).values({
      id: audMsgId,
      chatId: directChatId,
      senderId: userA.userId,
      body: "Voice note",
      mediaId: audMediaId,
    });

    // 1. Filter ?type=image
    const imgRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/media?type=image`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(imgRes.statusCode).toBe(200);
    const imgList: MessagePayload[] = imgRes.json();
    expect(imgList.every((m) => m.hasMedia?.type === "image")).toBe(true);
    expect(imgList.some((m) => m.id === imgMsgId)).toBe(true);

    // 2. Filter ?type=video
    const vidRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/media?type=video`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(vidRes.statusCode).toBe(200);
    const vidList: MessagePayload[] = vidRes.json();
    expect(vidList.every((m) => m.hasMedia?.type === "video")).toBe(true);
    expect(vidList.some((m) => m.id === vidMsgId)).toBe(true);

    // 3. Filter ?type=audio
    const audRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/media?type=audio`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(audRes.statusCode).toBe(200);
    const audList: MessagePayload[] = audRes.json();
    expect(audList.every((m) => m.hasMedia?.type === "audio")).toBe(true);
    expect(audList.some((m) => m.id === audMsgId)).toBe(true);

    // 4. Filter ?type=document
    const docRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/media?type=document`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(docRes.statusCode).toBe(200);
    const docList: MessagePayload[] = docRes.json();
    expect(docList.every((m) => m.hasMedia?.type === "document")).toBe(true);

    // 5. Filter ?type=visual (should include image and video, exclude audio and document)
    const visualRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/media?type=visual`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(visualRes.statusCode).toBe(200);
    const visualList: MessagePayload[] = visualRes.json();
    expect(visualList.some((m) => m.id === imgMsgId)).toBe(true);
    expect(visualList.some((m) => m.id === vidMsgId)).toBe(true);
    expect(visualList.some((m) => m.id === audMsgId)).toBe(false);
    expect(visualList.every((m) => m.hasMedia?.type === "image" || m.hasMedia?.type === "video")).toBe(true);
  });

  it("excludes soft-deleted messages (deleted_at IS NOT NULL)", async () => {
    const deletedMediaId = crypto.randomUUID();
    await db.insert(mediaAttachments).values({
      id: deletedMediaId,
      chatId: directChatId,
      uploaderId: userA.userId,
      type: "image",
      url: `http://minio/bucket/chats/${directChatId}/${deletedMediaId}/deleted.jpg`,
      storageKey: `chats/${directChatId}/${deletedMediaId}/deleted.jpg`,
      sizeBytes: 150000,
      mimeType: "image/jpeg",
      status: "attached",
    });
    const deletedMsgId = crypto.randomUUID();
    await db.insert(messages).values({
      id: deletedMsgId,
      chatId: directChatId,
      senderId: userA.userId,
      body: "Deleted media message",
      mediaId: deletedMediaId,
      deletedAt: new Date(),
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/media`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const list: MessagePayload[] = res.json();
    expect(list.some((m) => m.id === deletedMsgId)).toBe(false);
  });

  it("excludes messages sent at or before caller's cleared_at timestamp watermark", async () => {
    // Clear chat for userB at this moment
    const clearTime = new Date();
    await app.inject({
      method: "POST",
      url: `/api/v1/chats/${directChatId}/clear`,
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });

    // User B should now see 0 media attachments
    const userBRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/media`,
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(userBRes.statusCode).toBe(200);
    const userBMedia: MessagePayload[] = userBRes.json();
    expect(userBMedia.length).toBe(0);

    // But User A's history is not cleared, so User A still sees them
    const userARes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/media`,
      headers: { authorization: `Bearer ${userA.accessToken}` },
    });
    expect(userARes.statusCode).toBe(200);
    const userAMedia: MessagePayload[] = userARes.json();
    expect(userAMedia.length).toBeGreaterThan(0);

    // Now if a new media message is sent after userB cleared:
    const newMediaId = crypto.randomUUID();
    await db.insert(mediaAttachments).values({
      id: newMediaId,
      chatId: directChatId,
      uploaderId: userA.userId,
      type: "image",
      url: `http://minio/bucket/chats/${directChatId}/${newMediaId}/after-clear.jpg`,
      storageKey: `chats/${directChatId}/${newMediaId}/after-clear.jpg`,
      sizeBytes: 120000,
      mimeType: "image/jpeg",
      status: "attached",
    });
    const newMsgId = crypto.randomUUID();
    await db.insert(messages).values({
      id: newMsgId,
      chatId: directChatId,
      senderId: userA.userId,
      body: "Sent after clear",
      mediaId: newMediaId,
      createdAt: new Date(Date.now() + 2000),
    });

    // Now User B should see exactly the new media message
    const userBResAfter = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${directChatId}/media`,
      headers: { authorization: `Bearer ${userB.accessToken}` },
    });
    expect(userBResAfter.statusCode).toBe(200);
    const userBAfterMedia: MessagePayload[] = userBResAfter.json();
    expect(userBAfterMedia.length).toBe(1);
    expect(userBAfterMedia[0].id).toBe(newMsgId);
  });
});
