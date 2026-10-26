import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users } from "../src/db/schema.js";
import { eq, inArray } from "drizzle-orm";

describe("Multi-User Group Conversations & Participant Management Seam", () => {
  let app: FastifyInstance;
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;

  let userAId: string;
  let userBId: string;
  let userCId: string;
  let userDId: string;
  let tokenA: string;
  let tokenB: string;
  let tokenC: string;
  let tokenD: string;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp();
    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool);

    async function registerUser(name: string) {
      const email = `${name.toLowerCase().replace(/\s+/g, "")}-${Date.now()}@example.com`;
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email,
          password: "Password123!",
          name,
        },
      });
      const data = JSON.parse(res.payload);
      return { id: data.user.id, token: data.accessToken };
    }

    const uA = await registerUser("Admin Alice");
    userAId = uA.id;
    tokenA = uA.token;

    const uB = await registerUser("Member Bob");
    userBId = uB.id;
    tokenB = uB.token;

    const uC = await registerUser("Member Charlie");
    userCId = uC.id;
    tokenC = uC.token;

    const uD = await registerUser("Member Dave");
    userDId = uD.id;
    tokenD = uD.token;
  });

  afterAll(async () => {
    const ids = [userAId, userBId, userCId, userDId].filter(Boolean);
    if (ids.length > 0) {
      await db.delete(users).where(inArray(users.id, ids));
    }
    await app.close();
    await pool.end();
  });

  let createdGroupId: string;

  it("POST /api/v1/chats creates a group chat with custom title, creator as admin, and invitees as members", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/chats",
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        type: "group",
        title: "Engineering Guild",
        participantIds: [userBId, userCId],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.id).toBeDefined();
    expect(body.type).toBe("group");
    expect(body.title).toBe("Engineering Guild");
    expect(body.participants.length).toBe(3);

    const adminParticipant = body.participants.find((p: any) => p.userId === userAId);
    expect(adminParticipant).toBeDefined();
    expect(adminParticipant.role).toBe("admin");

    const memberB = body.participants.find((p: any) => p.userId === userBId);
    expect(memberB).toBeDefined();
    expect(memberB.role).toBe("member");

    const memberC = body.participants.find((p: any) => p.userId === userCId);
    expect(memberC).toBeDefined();
    expect(memberC.role).toBe("member");

    createdGroupId = body.id;
  });

  it("PATCH /api/v1/chats/:chatId allows group admin to update title and avatar, rejects non-admins", async () => {
    // Non-admin attempt should be 403
    const forbiddenRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${createdGroupId}`,
      headers: {
        authorization: `Bearer ${tokenB}`,
      },
      payload: {
        title: "Hacked Guild",
      },
    });
    expect(forbiddenRes.statusCode).toBe(403);

    // Admin attempt should succeed
    const successRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${createdGroupId}`,
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        title: "Platform Guild",
        pictureUrl: "https://example.com/avatar.png",
      },
    });
    expect(successRes.statusCode).toBe(200);
    const body = JSON.parse(successRes.payload);
    expect(body.title).toBe("Platform Guild");
    expect(body.pictureUrl).toBe("https://example.com/avatar.png");
  });

  it("POST /api/v1/chats/:chatId/participants allows group admin to add participants, rejects non-admins", async () => {
    // Non-admin attempt should be 403
    const forbiddenRes = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${createdGroupId}/participants`,
      headers: {
        authorization: `Bearer ${tokenB}`,
      },
      payload: {
        userIds: [userDId],
      },
    });
    expect(forbiddenRes.statusCode).toBe(403);

    // Admin adds Dave
    const addRes = await app.inject({
      method: "POST",
      url: `/api/v1/chats/${createdGroupId}/participants`,
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        userIds: [userDId],
      },
    });
    expect(addRes.statusCode).toBe(200);
    const body = JSON.parse(addRes.payload);
    expect(body.participants.length).toBe(4);
    expect(body.participants.some((p: any) => p.userId === userDId)).toBe(true);
  });

  it("PATCH /api/v1/chats/:chatId/participants/:userId/role promotes a member to admin", async () => {
    // Admin Alice promotes Bob to admin
    const promoteRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${createdGroupId}/participants/${userBId}/role`,
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        role: "admin",
      },
    });
    expect(promoteRes.statusCode).toBe(200);
    const body = JSON.parse(promoteRes.payload);
    const bob = body.participants.find((p: any) => p.userId === userBId);
    expect(bob.role).toBe("admin");

    // Bob can now update title as well
    const bobUpdateRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/chats/${createdGroupId}`,
      headers: {
        authorization: `Bearer ${tokenB}`,
      },
      payload: {
        title: "Platform Guild 2.0",
      },
    });
    expect(bobUpdateRes.statusCode).toBe(200);
  });

  it("DELETE /api/v1/chats/:chatId/participants/:userId removes participant", async () => {
    // Admin Bob removes Charlie
    const removeRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/chats/${createdGroupId}/participants/${userCId}`,
      headers: {
        authorization: `Bearer ${tokenB}`,
      },
    });
    expect(removeRes.statusCode).toBe(200);
    const body = JSON.parse(removeRes.payload);
    expect(body.participants.some((p: any) => p.userId === userCId)).toBe(false);

    // Dave can leave the chat himself (self-remove)
    const selfRemoveRes = await app.inject({
      method: "DELETE",
      url: `/api/v1/chats/${createdGroupId}/participants/${userDId}`,
      headers: {
        authorization: `Bearer ${tokenD}`,
      },
    });
    expect(selfRemoveRes.statusCode).toBe(200);
    const afterDaveLeave = JSON.parse(selfRemoveRes.payload);
    expect(afterDaveLeave.participants.some((p: any) => p.userId === userDId)).toBe(false);
  });
});
