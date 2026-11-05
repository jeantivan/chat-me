import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import type { FastifyInstance } from "fastify";
import {
  isLocalStorageMode,
  generatePresignedUploadUrl,
  signStorageKey,
  verifyStorageSignature,
} from "../src/services/storage.service.js";

describe("Local Storage Signed PUT/GET Seam", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.STORAGE_MODE = "local";
    app = await buildApp({
      databaseUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me",
      redisUrl: "none",
    });
    await app.ready();
  });

  afterAll(async () => {
    delete process.env.STORAGE_MODE;
    await app.close();
  });

  it("identifies local storage mode", () => {
    expect(isLocalStorageMode()).toBe(true);
  });

  it("generates HMAC signature and verifies it correctly", () => {
    const key = "chats/123/456/test.jpg";
    const expires = Date.now() + 60000;
    const signature = signStorageKey(key, expires);
    expect(verifyStorageSignature(key, expires, signature)).toBe(true);
    expect(verifyStorageSignature(key, expires, "wrongsig")).toBe(false);
    expect(verifyStorageSignature(key, expires - 100000, signature)).toBe(false);
  });

  it("generates local presigned upload and public URL", async () => {
    const res = await generatePresignedUploadUrl({
      key: "chats/test-chat/test-media/photo.png",
      mimeType: "image/png",
      sizeBytes: 1024,
    });

    expect(res.uploadUrl).toContain("/api/v1/media/storage/chats/test-chat/test-media/photo.png");
    expect(res.uploadUrl).toContain("sig=");
    expect(res.uploadUrl).toContain("exp=");
    expect(res.publicUrl).toContain("/api/v1/media/storage/chats/test-chat/test-media/photo.png");
  });

  it("handles PUT upload with signed URL and serves file via GET", async () => {
    const key = `test/item-${Date.now()}.png`;
    const { uploadUrl, publicUrl } = await generatePresignedUploadUrl({
      key,
      mimeType: "image/png",
      sizeBytes: 12,
    });

    const fileContent = "Fake PNG binary";

    // PUT to uploadUrl with image/png
    const putRes = await app.inject({
      method: "PUT",
      url: uploadUrl,
      headers: {
        "content-type": "image/png",
      },
      payload: Buffer.from(fileContent),
    });
    expect(putRes.statusCode).toBe(200);

    // GET to publicUrl
    const getRes = await app.inject({
      method: "GET",
      url: publicUrl,
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.headers["content-type"]).toContain("image/png");
    expect(getRes.body).toBe(fileContent);
  });

  it("rejects PUT when signature is invalid or expired", async () => {
    const key = `test/invalid-${Date.now()}.txt`;
    const badUrl = `/api/v1/media/storage/${key}?exp=${Date.now() + 60000}&sig=invalid`;

    const putRes = await app.inject({
      method: "PUT",
      url: badUrl,
      headers: { "content-type": "text/plain" },
      payload: Buffer.from("bad"),
    });
    expect(putRes.statusCode).toBe(403);
  });
});
