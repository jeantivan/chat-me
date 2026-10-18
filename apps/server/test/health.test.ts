import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import type { FastifyInstance } from "fastify";

describe("GET /health seam", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({
      databaseUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me",
      redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 200 with service health statuses when services are reachable", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(body.services).toEqual({
      postgres: true,
      redis: true,
    });
    expect(typeof body.uptime).toBe("number");
    expect(typeof body.timestamp).toBe("string");
  });
});
