import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import pg from "pg";
import type { UserSettingsData } from "@chat-me/shared";
import { registerTestUser } from "./test-helpers.js";

describe("User Preferences Persistence Seam (PATCH /api/v1/users/me/settings)", () => {
  let app: FastifyInstance;
  let pool: pg.Pool;
  let user: { userId: string; accessToken: string };

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    pool = new pg.Pool({ connectionString: databaseUrl });

    user = await registerTestUser(app, {
      email: `pref-user-${Date.now()}@example.com`,
      name: "Preferences User",
    });
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it("rejects unauthenticated requests with 401", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me/settings",
      payload: { themeMode: "dark" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects invalid themeMode or payload types with 400", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me/settings",
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
      payload: {
        themeMode: "neon",
      },
    });
    expect(res.statusCode).toBe(400);

    const res2 = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me/settings",
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
      payload: {
        notifySound: "yes",
      },
    });
    expect(res2.statusCode).toBe(400);
  });

  it("persists theme preferences (themeMode and themeColor)", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me/settings",
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
      payload: {
        themeMode: "dark",
        themeColor: "mauve-violet",
      },
    });

    expect(res.statusCode).toBe(200);
    const updated = res.json() as UserSettingsData;
    expect(updated.themeMode).toBe("dark");
    expect(updated.themeColor).toBe("mauve-violet");
    // Other defaults remain unchanged
    expect(updated.notifyAll).toBe(true);

    // Verify persistence via GET /api/v1/users/me
    const getRes = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    });
    expect(getRes.statusCode).toBe(200);
    const meData = getRes.json();
    expect(meData.settings.themeMode).toBe("dark");
    expect(meData.settings.themeColor).toBe("mauve-violet");
  });

  it("persists notification toggles partially without overwriting other settings", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me/settings",
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
      payload: {
        notifySound: false,
        notifyPreview: false,
      },
    });

    expect(res.statusCode).toBe(200);
    const updated = res.json() as UserSettingsData;
    expect(updated.notifySound).toBe(false);
    expect(updated.notifyPreview).toBe(false);
    expect(updated.notifyAll).toBe(true);
    expect(updated.notifyReactions).toBe(true);
    // Theme preserves previous state
    expect(updated.themeMode).toBe("dark");
    expect(updated.themeColor).toBe("mauve-violet");

    // Also toggle notifyAll to false
    const resAll = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me/settings",
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
      payload: {
        notifyAll: false,
      },
    });
    expect(resAll.statusCode).toBe(200);
    const updatedAll = resAll.json() as UserSettingsData;
    expect(updatedAll.notifyAll).toBe(false);
    expect(updatedAll.notifySound).toBe(false);
  });

  it("persists privacy settings (privacyLastSeen, privacyPicture, privacyBio, privacyGroups, privacyReadReceipt)", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me/settings",
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
      payload: {
        privacyLastSeen: "contacts",
        privacyPicture: "none",
        privacyBio: "contacts",
        privacyGroups: "none",
        privacyReadReceipt: false,
      },
    });

    expect(res.statusCode).toBe(200);
    const updated = res.json() as UserSettingsData;
    expect(updated.privacyLastSeen).toBe("contacts");
    expect(updated.privacyPicture).toBe("none");
    expect(updated.privacyBio).toBe("contacts");
    expect(updated.privacyGroups).toBe("none");
    expect(updated.privacyReadReceipt).toBe(false);

    // Verify GET /api/v1/users/me returns updated privacy settings
    const getRes = await app.inject({
      method: "GET",
      url: "/api/v1/users/me",
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
    });
    expect(getRes.statusCode).toBe(200);
    const meData = getRes.json();
    expect(meData.settings.privacyLastSeen).toBe("contacts");
    expect(meData.settings.privacyPicture).toBe("none");
    expect(meData.settings.privacyBio).toBe("contacts");
    expect(meData.settings.privacyGroups).toBe("none");
    expect(meData.settings.privacyReadReceipt).toBe(false);
  });

  it("rejects invalid privacy settings values with 400", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me/settings",
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
      payload: {
        privacyLastSeen: "invalid-audience",
      },
    });
    expect(res.statusCode).toBe(400);

    const res2 = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me/settings",
      headers: {
        authorization: `Bearer ${user.accessToken}`,
      },
      payload: {
        privacyReadReceipt: "not-a-boolean",
      },
    });
    expect(res2.statusCode).toBe(400);
  });
});
