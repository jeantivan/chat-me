import { describe, it, expect } from "vitest";
import { buildApp } from "../src/app.js";

describe("Optional Redis Single-Node Seam", () => {
  it("reports healthy single-node redis on /health when redisUrl is 'none'", async () => {
    const app = await buildApp({
      databaseUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me",
      redisUrl: "none",
    });
    await app.ready();

    const res = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(body.services.postgres).toBe(true);
    expect(body.services.redis).toBe(true);

    await app.close();
  });

  it("reports healthy single-node redis on /health when REDIS_URL is omitted or empty", async () => {
    const orig = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    try {
      const app = await buildApp({
        databaseUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me",
        redisUrl: "",
      });
      await app.ready();

      const res = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("ok");
      expect(body.services.postgres).toBe(true);
      expect(body.services.redis).toBe(true);

      await app.close();
    } finally {
      if (orig) process.env.REDIS_URL = orig;
    }
  });
});
