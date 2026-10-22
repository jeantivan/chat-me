import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { migrateDb } from "../src/db/migrate.js";
import pg from "pg";
import type { FastifyInstance } from "fastify";

describe("Fastify Auth Endpoints Seam", () => {
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

  const testUser = {
    email: `auth-test-${Date.now()}@example.com`,
    password: "Password123!",
    name: "Auth Tester",
  };

  it("POST /api/v1/auth/register fails with 400 if validation fails", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: "not-an-email",
        password: "short",
        name: "",
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("POST /api/v1/auth/register creates user and returns access token + refresh cookie", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: testUser,
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe(testUser.email);
    expect(body.user.name).toBe(testUser.name);
    expect(body.settings).toBeDefined();
    expect(body.settings.themeMode).toBe("light");

    // Check HTTP-only cookie
    const cookies = res.cookies;
    const refreshCookie = cookies.find((c) => c.name === "refreshToken");
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie?.httpOnly).toBe(true);
  });

  it("POST /api/v1/auth/register rejects duplicate email with 409", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: testUser,
    });

    expect(res.statusCode).toBe(409);
  });

  it("POST /api/v1/auth/login fails with 401 on incorrect password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: testUser.email,
        password: "wrongPassword!",
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it("POST /api/v1/auth/login succeeds with valid credentials and sets refresh cookie", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: testUser.email,
        password: testUser.password,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe(testUser.email);

    const refreshCookie = res.cookies.find((c) => c.name === "refreshToken");
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie?.httpOnly).toBe(true);
  });

  it("GET /api/v1/users/me verifies JWT access token and returns user profile", async () => {
    // 1. Without token -> 401
    const unauthRes = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
    });
    expect(unauthRes.statusCode).toBe(401);

    // 2. Login to get token
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: testUser.email,
        password: testUser.password,
      },
    });
    const { accessToken } = loginRes.json();

    // 3. With token -> 200
    const authRes = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    expect(authRes.statusCode).toBe(200);
    const body = authRes.json();
    expect(body.user.email).toBe(testUser.email);
    expect(body.settings.themeColor).toBe("slate-indigo");

    // 4. Using refresh token as Bearer token -> 401
    const refreshCookie = loginRes.cookies.find((c) => c.name === "refreshToken")!;
    const forbiddenRes = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${refreshCookie.value}`,
      },
    });
    expect(forbiddenRes.statusCode).toBe(401);
  });

  it("POST /api/v1/auth/refresh issues a new access token using refresh cookie", async () => {
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: testUser.email,
        password: testUser.password,
      },
    });

    const refreshCookie = loginRes.cookies.find((c) => c.name === "refreshToken");
    expect(refreshCookie).toBeDefined();

    const refreshRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: {
        refreshToken: refreshCookie!.value,
      },
    });

    expect(refreshRes.statusCode).toBe(200);
    const body = refreshRes.json();
    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe(testUser.email);
  });

  it("POST /api/v1/auth/logout clears refresh cookie", async () => {
    const logoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
    });

    expect(logoutRes.statusCode).toBe(200);
    const refreshCookie = logoutRes.cookies.find((c) => c.name === "refreshToken");
    // Should be expired/cleared
    expect(refreshCookie?.value).toBe("");
  });
});
