import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, chats, messages, messageReceipts } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

describe("Fastify Chat HTTP & Cursor Pagination Seam", () => {
  let app: FastifyInstance;
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;

  let userAId: string;
  let userBId: string;
  let tokenA: string;
  let tokenB: string;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp();
    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool);

    // Register User A
    const regARes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: `alice-api-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Alice Api",
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
        email: `bob-api-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Bob Api",
      },
    });
    const regBData = JSON.parse(regBRes.payload);
    userBId = regBData.user.id;
    tokenB = regBData.accessToken;
  });

  afterAll(async () => {
    if (userAId) {
      await db.delete(users).where(eq(users.id, userAId));
    }
    if (userBId) {
      await db.delete(users).where(eq(users.id, userBId));
    }
    await app.close();
    await pool.end();
  });

  it("POST /api/v1/chats/direct creates a direct chat idempotently", async () => {
    // 1. Create chat between A and B
    const res1 = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        targetUserId: userBId,
      },
    });

    expect(res1.statusCode).toBe(200);
    const chat1 = JSON.parse(res1.payload);
    expect(chat1.id).toBeDefined();
    expect(chat1.type).toBe("direct");
    expect(chat1.participants.length).toBe(2);

    // 2. Call again from B to A -> should return exact same chat
    const res2 = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: {
        authorization: `Bearer ${tokenB}`,
      },
      payload: {
        targetUserId: userAId,
      },
    });

    expect(res2.statusCode).toBe(200);
    const chat2 = JSON.parse(res2.payload);
    expect(chat2.id).toBe(chat1.id);
  });

  it("GET /api/v1/chats lists chats for authenticated user", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/chats",
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("GET /api/v1/chats/:chatId/messages returns 40-message window with cursor pagination", async () => {
    // Get chat id
    const chatRes = await app.inject({
      method: "POST",
      url: "/api/v1/chats/direct",
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        targetUserId: userBId,
      },
    });
    const chat = JSON.parse(chatRes.payload);

    // Insert 50 messages into database
    const sampleMsgs = [];
    const baseTime = Date.now() - 100000;
    for (let i = 0; i < 50; i++) {
      const msgId = crypto.randomUUID();
      sampleMsgs.push({
        id: msgId,
        chatId: chat.id,
        senderId: i % 2 === 0 ? userAId : userBId,
        body: `Message ${i}`,
        createdAt: new Date(baseTime + i * 1000),
      });
    }
    await db.insert(messages).values(sampleMsgs);

    // Fetch initial page with default limit 40
    const page1Res = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${chat.id}/messages?limit=40`,
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
    });

    expect(page1Res.statusCode).toBe(200);
    const page1 = JSON.parse(page1Res.payload);
    expect(page1.messages.length).toBe(40);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextCursor).toBeDefined();

    // Fetch next page using cursor
    const page2Res = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${chat.id}/messages?limit=40&cursor=${encodeURIComponent(page1.nextCursor)}`,
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
    });

    expect(page2Res.statusCode).toBe(200);
    const page2 = JSON.parse(page2Res.payload);
    expect(page2.messages.length).toBe(10);
    expect(page2.hasMore).toBe(false);

    // Non-participant cannot access messages
    const fakeToken = app.jwt.sign({ sub: crypto.randomUUID(), type: "access" });
    const forbidRes = await app.inject({
      method: "GET",
      url: `/api/v1/chats/${chat.id}/messages`,
      headers: {
        authorization: `Bearer ${fakeToken}`,
      },
    });
    expect(forbidRes.statusCode).toBe(403);
  });
});
