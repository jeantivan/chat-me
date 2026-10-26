import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, chats, chatParticipants, mediaAttachments } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

describe("Storage Service & Fastify Presign Endpoint Seam", () => {
  let app: FastifyInstance;
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;

  let userAId: string;
  let userBId: string;
  let tokenA: string;
  let tokenB: string;
  let chatId: string;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp();
    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool);

    const regA = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: `presign-a-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Presign Alice",
      },
    });
    const aData = JSON.parse(regA.payload);
    userAId = aData.user.id;
    tokenA = aData.accessToken;

    const regB = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: `presign-b-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Presign Bob",
      },
    });
    const bData = JSON.parse(regB.payload);
    userBId = bData.user.id;
    tokenB = bData.accessToken;

    // Create a direct chat between Alice and Bob
    const chatRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { targetUserId: userBId },
    });
    const chatData = JSON.parse(chatRes.payload);
    chatId = chatData.id;
  });

  afterAll(async () => {
    if (chatId) {
      await db.delete(chats).where(eq(chats.id, chatId));
    }
    if (userAId) {
      await db.delete(users).where(eq(users.id, userAId));
    }
    if (userBId) {
      await db.delete(users).where(eq(users.id, userBId));
    }
    await app.close();
    await pool.end();
  });

  it("rejects unauthenticated requests with 401", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${chatId}/media/presign`,
      payload: {
        filename: "test.png",
        mimeType: "image/png",
        sizeBytes: 1024,
        type: "image",
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it("rejects non-participant requests with 403", async () => {
    // Register third user not in chat
    const regC = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: `presign-c-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Presign Charlie",
      },
    });
    const cData = JSON.parse(regC.payload);

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${chatId}/media/presign`,
      headers: { authorization: `Bearer ${cData.accessToken}` },
      payload: {
        filename: "test.png",
        mimeType: "image/png",
        sizeBytes: 1024,
        type: "image",
      },
    });

    expect(res.statusCode).toBe(403);
    await db.delete(users).where(eq(users.id, cData.user.id));
  });

  it("rejects prohibited MIME type or oversized payload with 400", async () => {
    // Invalid MIME type for image
    const invalidMimeRes = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${chatId}/media/presign`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        filename: "malicious.exe",
        mimeType: "application/x-msdownload",
        sizeBytes: 1024,
        type: "image",
      },
    });
    expect(invalidMimeRes.statusCode).toBe(400);

    // Oversized image (> 15MB)
    const oversizedRes = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${chatId}/media/presign`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        filename: "huge.png",
        mimeType: "image/png",
        sizeBytes: 20 * 1024 * 1024, // 20 MB
        type: "image",
      },
    });
    expect(oversizedRes.statusCode).toBe(400);
  });

  it("issues signed S3 PUT URL and persists pending media attachment record", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${chatId}/media/presign`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        filename: "landscape-vacation.webp",
        mimeType: "image/webp",
        sizeBytes: 245000,
        type: "image",
        orientation: "landscape",
        width: 1200,
        height: 800,
        blurhash: "U%L#Y9xuRjt7_4t7WBofofofWBof",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);

    expect(body.mediaId).toBeDefined();
    expect(body.uploadUrl).toBeDefined();
    expect(body.uploadUrl).toContain("chats/");
    expect(body.publicUrl).toBeDefined();
    expect(body.expiresAt).toBeDefined();

    // Verify row in database
    const [mediaRow] = await db
      .select()
      .from(mediaAttachments)
      .where(eq(mediaAttachments.id, body.mediaId));

    expect(mediaRow).toBeDefined();
    expect(mediaRow.status).toBe("pending");
    expect(mediaRow.chatId).toBe(chatId);
    expect(mediaRow.uploaderId).toBe(userAId);
    expect(mediaRow.mimeType).toBe("image/webp");
    expect(mediaRow.width).toBe(1200);
    expect(mediaRow.height).toBe(800);
    expect(mediaRow.orientation).toBe("landscape");
    expect(mediaRow.blurhash).toBe("U%L#Y9xuRjt7_4t7WBofofofWBof");
  });
});
