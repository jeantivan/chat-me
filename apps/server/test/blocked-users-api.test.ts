import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import pg from "pg";
import { registerTestUser } from "./test-helpers.js";
import { blockedUsers } from "../src/db/schema.js";

describe("Blocked Users API Seam", () => {
  let app: FastifyInstance;
  let pool: pg.Pool;

  let alice: { userId: string; accessToken: string };
  let bob: { userId: string; accessToken: string };
  let charlie: { userId: string; accessToken: string };

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    pool = new pg.Pool({ connectionString: databaseUrl });

    alice = await registerTestUser(app, {
      email: `api-alice-${Date.now()}@example.com`,
      name: "Alice Api",
    });
    bob = await registerTestUser(app, {
      email: `api-bob-${Date.now()}@example.com`,
      name: "Bob Api",
    });
    charlie = await registerTestUser(app, {
      email: `api-charlie-${Date.now()}@example.com`,
      name: "Charlie Api",
    });
  });

  afterEach(async () => {
    await app.db.delete(blockedUsers);
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it("GET /api/v1/users/me/blocked returns empty list when no users are blocked", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/users/me/blocked",
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });

  it("POST /api/v1/users/me/blocked/:targetUserId rejects self-blocking with 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/me/blocked/${alice.userId}`,
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
      },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBeDefined();
  });

  it("POST /api/v1/users/me/blocked/:targetUserId returns 404 for non-existent user", async () => {
    const nonExistentUuid = crypto.randomUUID();
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/users/me/blocked/${nonExistentUuid}`,
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
      },
    });

    expect(res.statusCode).toBe(404);
  });

  it("POST /api/v1/users/me/blocked/:targetUserId blocks target user and is idempotent", async () => {
    // First block call
    const res1 = await app.inject({
      method: "POST",
      url: `/api/v1/users/me/blocked/${bob.userId}`,
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
      },
    });
    expect(res1.statusCode).toBe(200);

    // Second block call (idempotent)
    const res2 = await app.inject({
      method: "POST",
      url: `/api/v1/users/me/blocked/${bob.userId}`,
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
      },
    });
    expect(res2.statusCode).toBe(200);

    // Verify GET returns Bob
    const listRes = await app.inject({
      method: "GET",
      url: "/api/v1/users/me/blocked",
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
      },
    });
    expect(listRes.statusCode).toBe(200);
    const list = JSON.parse(listRes.body);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(bob.userId);
    expect(list[0].name).toBe("Bob Api");
  });

  it("DELETE /api/v1/users/me/blocked/:targetUserId unblocks a blocked user", async () => {
    // Alice blocks Bob and Charlie
    await app.inject({
      method: "POST",
      url: `/api/v1/users/me/blocked/${bob.userId}`,
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
      },
    });
    await app.inject({
      method: "POST",
      url: `/api/v1/users/me/blocked/${charlie.userId}`,
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
      },
    });

    // Unblock Bob
    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/users/me/blocked/${bob.userId}`,
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
      },
    });
    expect(delRes.statusCode).toBe(200);

    // Verify list only has Charlie now
    const listRes = await app.inject({
      method: "GET",
      url: "/api/v1/users/me/blocked",
      headers: {
        authorization: `Bearer ${alice.accessToken}`,
      },
    });
    const list = JSON.parse(listRes.body);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(charlie.userId);
  });
});
