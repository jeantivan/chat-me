import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { migrateDb } from "../src/db/migrate.js";
import pg from "pg";
import type { FastifyInstance } from "fastify";

describe("User Auth Lifecycle Integration Test", () => {
  let app: FastifyInstance;
  let pool: pg.Pool;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: databaseUrl });
    await migrateDb(pool);

    app = await buildApp({
      databaseUrl,
      redisUrl,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it("verifies registering a new user, logging in, fetching /api/v1/users/me, and logging out", async () => {
    const email = `lifecycle-${Date.now()}@example.com`;
    const password = "SecurePassword456!";
    const name = "Lifecycle User";

    // 1. Register new user
    const registerRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email, password, name },
    });
    expect(registerRes.statusCode).toBe(201);
    const registerData = registerRes.json();
    expect(registerData.user.email).toBe(email);
    expect(registerData.user.name).toBe(name);
    expect(registerData.accessToken).toBeDefined();

    // 2. Log in
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email, password },
    });
    expect(loginRes.statusCode).toBe(200);
    const loginData = loginRes.json();
    const accessToken = loginData.accessToken;
    expect(accessToken).toBeDefined();

    const refreshCookie = loginRes.cookies.find((c) => c.name === "refreshToken");
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie?.httpOnly).toBe(true);

    // 3. Fetch /api/v1/users/me
    const meRes = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    expect(meRes.statusCode).toBe(200);
    const meData = meRes.json();
    expect(meData.user.id).toBe(loginData.user.id);
    expect(meData.user.email).toBe(email);
    expect(meData.settings).toBeDefined();

    // 4. Log out
    const logoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
    });
    expect(logoutRes.statusCode).toBe(200);
    const clearedCookie = logoutRes.cookies.find((c) => c.name === "refreshToken");
    expect(clearedCookie?.value).toBe("");
  });
});
