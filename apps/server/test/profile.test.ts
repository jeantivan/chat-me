import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import { io as ioc, Socket as ClientSocket } from "socket.io-client";
import { AddressInfo } from "net";
import pg from "pg";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  UserProfile,
} from "@chat-me/shared";
import { registerTestUser, waitForSocketEvent } from "./test-helpers.js";

describe("User Profile Persistence, Avatar Upload & Real-Time Sync Seam", () => {
  let app: FastifyInstance;
  let serverUrl: string;
  let pool: pg.Pool;

  let userA: { userId: string; accessToken: string };
  let userB: { userId: string; accessToken: string };
  let clientB: ClientSocket<ServerToClientEvents, ClientToServerEvents>;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const address = app.server.address() as AddressInfo;
    serverUrl = `http://127.0.0.1:${address.port}`;

    pool = new pg.Pool({ connectionString: databaseUrl });

    userA = await registerTestUser(app, {
      email: `alice-profile-${Date.now()}@example.com`,
      name: "Alice Profile",
    });

    userB = await registerTestUser(app, {
      email: `bob-profile-${Date.now()}@example.com`,
      name: "Bob Profile",
    });
  });

  afterAll(async () => {
    if (clientB?.connected) {
      clientB.disconnect();
    }
    await app.close();
    await pool.end();
  });

  describe("PATCH /api/v1/users/me/profile validation & persistence", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/profile",
        payload: { name: "New Name" },
      });
      expect(res.statusCode).toBe(401);
    });

    it("rejects empty trimmed name with 400", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/profile",
        headers: { authorization: `Bearer ${userA.accessToken}` },
        payload: { name: "   " },
      });
      expect(res.statusCode).toBe(400);
    });

    it("rejects name longer than 100 characters with 400", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/profile",
        headers: { authorization: `Bearer ${userA.accessToken}` },
        payload: { name: "a".repeat(101) },
      });
      expect(res.statusCode).toBe(400);
    });

    it("rejects bio longer than 500 characters with 400", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/profile",
        headers: { authorization: `Bearer ${userA.accessToken}` },
        payload: { bio: "b".repeat(501) },
      });
      expect(res.statusCode).toBe(400);
    });

    it("rejects invalid pictureUrl with 400", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/profile",
        headers: { authorization: `Bearer ${userA.accessToken}` },
        payload: { pictureUrl: "not-a-valid-url" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("validates and persists updates to name, bio, and pictureUrl, returning updated profile and broadcasting via Socket.IO", async () => {
      clientB = ioc(serverUrl, {
        auth: { token: userB.accessToken },
        transports: ["websocket"],
        forceNew: true,
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Socket connection timeout")), 5000);
        clientB.on("connect", () => {
          clearTimeout(timeout);
          resolve();
        });
        clientB.on("connect_error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      const newName = "Alice Wonderland";
      const newBio = "Exploring real-time architectures with S3 avatars.";
      const newPictureUrl = "https://example.com/alice-avatar.png";

      const profileEventPromise = waitForSocketEvent<UserProfile>(
        clientB,
        "user:profile_updated",
        (data) => data.id === userA.userId
      );

      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/profile",
        headers: { authorization: `Bearer ${userA.accessToken}` },
        payload: {
          name: newName,
          bio: newBio,
          pictureUrl: newPictureUrl,
        },
      });

      expect(res.statusCode).toBe(200);
      const updatedProfile = res.json() as UserProfile;
      expect(updatedProfile.id).toBe(userA.userId);
      expect(updatedProfile.name).toBe(newName);
      expect(updatedProfile.bio).toBe(newBio);
      expect(updatedProfile.pictureUrl).toBe(newPictureUrl);

      // Verify GET /api/v1/users/me reflects the updated profile
      const meRes = await app.inject({
        method: "GET",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${userA.accessToken}` },
      });
      expect(meRes.statusCode).toBe(200);
      expect(meRes.json().user.name).toBe(newName);
      expect(meRes.json().user.bio).toBe(newBio);
      expect(meRes.json().user.pictureUrl).toBe(newPictureUrl);

      // Verify Socket.IO broadcast to clientB
      const broadcasted = await profileEventPromise;
      expect(broadcasted.id).toBe(userA.userId);
      expect(broadcasted.name).toBe(newName);
      expect(broadcasted.bio).toBe(newBio);
      expect(broadcasted.pictureUrl).toBe(newPictureUrl);

      clientB.disconnect();
    });

    it("allows removing avatar picture by sending empty string pictureUrl", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/profile",
        headers: { authorization: `Bearer ${userA.accessToken}` },
        payload: { pictureUrl: "" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().pictureUrl).toBe("");

      const meRes = await app.inject({
        method: "GET",
        url: "/api/v1/users/me",
        headers: { authorization: `Bearer ${userA.accessToken}` },
      });
      expect(meRes.json().user.pictureUrl).toBe("");
    });
  });

  describe("POST /api/v1/users/me/avatar/presign S3 upload pipeline", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/users/me/avatar/presign",
        payload: {
          filename: "avatar.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 1024,
        },
      });
      expect(res.statusCode).toBe(401);
    });

    it("rejects non-image MIME types with 400", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/users/me/avatar/presign",
        headers: { authorization: `Bearer ${userA.accessToken}` },
        payload: {
          filename: "document.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
        },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toContain("Invalid MIME type");
    });

    it("rejects avatar file sizes larger than 5 MB with 400", async () => {
      const fiveMbPlusOne = 5 * 1024 * 1024 + 1;
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/users/me/avatar/presign",
        headers: { authorization: `Bearer ${userA.accessToken}` },
        payload: {
          filename: "huge-avatar.png",
          mimeType: "image/png",
          sizeBytes: fiveMbPlusOne,
        },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toContain("exceeds maximum allowed size");
    });

    it("generates presigned upload URL and public URL for valid avatar upload", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/users/me/avatar/presign",
        headers: { authorization: `Bearer ${userA.accessToken}` },
        payload: {
          filename: "profile-photo.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 1024 * 500, // 500 KB
        },
      });

      expect(res.statusCode).toBe(200);
      const data = res.json();
      expect(data.uploadUrl).toBeDefined();
      expect(typeof data.uploadUrl).toBe("string");
      expect(data.publicUrl).toBeDefined();
      expect(data.publicUrl).toContain(`/avatars/${userA.userId}/`);
      expect(data.publicUrl).toMatch(/\.jpg$/);
    });
  });
});
