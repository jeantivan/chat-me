import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import type { FastifyInstance } from "fastify";
import fs from "node:fs";
import path from "node:path";

describe("Static SPA Hosting & Auto Migration Seam", () => {
  let app: FastifyInstance;
  const mockWebDistDir = path.resolve(process.cwd(), "test-dist-web");

  beforeAll(async () => {
    fs.mkdirSync(mockWebDistDir, { recursive: true });
    fs.writeFileSync(path.join(mockWebDistDir, "index.html"), "<html><body>SPA Root</body></html>");
    fs.writeFileSync(path.join(mockWebDistDir, "main.js"), "console.log('spa bundle');");

    app = await buildApp({
      databaseUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me",
      redisUrl: "none",
      serveStaticWeb: true,
      staticWebDir: mockWebDistDir,
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    fs.rmSync(mockWebDistDir, { recursive: true, force: true });
  });

  it("serves static assets like main.js", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/main.js",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("console.log('spa bundle');");
  });

  it("serves index.html on root /", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("<html><body>SPA Root</body></html>");
  });

  it("serves index.html fallback for client-side SPA routes (e.g. /c/123)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/c/123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("<html><body>SPA Root</body></html>");
  });

  it("preserves 404 for missing /api/v1 endpoints rather than returning HTML", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/nonexistent",
    });
    expect(res.statusCode).toBe(404);
    expect(res.headers["content-type"]).toContain("application/json");
  });
});
