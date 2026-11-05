import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, contacts } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

describe("Contacts Database Schema & REST Seam", () => {
  let app: FastifyInstance;
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;

  let userAId: string;
  let userAEmail: string;
  let userBId: string;
  let userCId: string;
  let userDId: string;
  let userDEmail: string;
  let tokenA: string;
  let tokenB: string;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp();
    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool);

    // Register User A
    userAEmail = `alice-contacts-${Date.now()}@example.com`;
    const regARes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: userAEmail,
        password: "Password123!",
        name: "Alice Contacts",
      },
    });
    const regAData = JSON.parse(regARes.payload);
    userAId = regAData.user.id;
    tokenA = regAData.accessToken;

    // Register User B
    const regBRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: `bob-contacts-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Bob Contacts",
      },
    });
    const regBData = JSON.parse(regBRes.payload);
    userBId = regBData.user.id;
    tokenB = regBData.accessToken;

    // Register User C
    const regCRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: `charlie-contacts-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Charlie Contacts",
      },
    });
    const regCData = JSON.parse(regCRes.payload);
    userCId = regCData.user.id;

    // Register User D
    userDEmail = `diana-contacts-${Date.now()}@example.com`;
    const regDRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: userDEmail,
        password: "Password123!",
        name: "Diana Contacts",
      },
    });
    const regDData = JSON.parse(regDRes.payload);
    userDId = regDData.user.id;
  });

  afterAll(async () => {
    if (userAId) await db.delete(users).where(eq(users.id, userAId));
    if (userBId) await db.delete(users).where(eq(users.id, userBId));
    if (userCId) await db.delete(users).where(eq(users.id, userCId));
    if (userDId) await db.delete(users).where(eq(users.id, userDId));
    await app.close();
    await pool.end();
  });

  it("enforces chk_no_self_contact check constraint", async () => {
    await expect(
      db.insert(contacts).values({
        userId: userAId,
        contactUserId: userAId,
      })
    ).rejects.toThrow();
  });

  it("creates bidirectional contacts between user A and user B", async () => {
    await db.insert(contacts).values([
      { userId: userAId, contactUserId: userBId, nickname: "Bobby" },
      { userId: userBId, contactUserId: userAId, nickname: "Ali" },
    ]);

    const aContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userAId));

    const aContactToB = aContacts.find((c) => c.contactUserId === userBId);
    expect(aContactToB).toBeDefined();
    expect(aContactToB!.nickname).toBe("Bobby");

    const bContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userBId));

    const bContactToA = bContacts.find((c) => c.contactUserId === userAId);
    expect(bContactToA).toBeDefined();
    expect(bContactToA!.nickname).toBe("Ali");
  });

  it("GET /api/v1/contacts returns the authenticated user's contact list with profile information", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/contacts",
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);

    const bContact = data.find((c: any) => c.contactUserId === userBId);
    expect(bContact).toBeDefined();
    expect(bContact.nickname).toBe("Bobby");
    expect(bContact.contact.name).toBe("Bob Contacts");
    expect(bContact.contact.email).toContain("bob-contacts-");
  });

  it("POST /api/v1/contacts adds a contact with bidirectional link", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/contacts",
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        contactUserId: userCId,
        nickname: "Chuck",
      },
    });

    expect(res.statusCode).toBe(200);

    // Verify User A has User C
    const aRes = await app.inject({
      method: "GET",
      url: "/api/v1/contacts",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    const aData = JSON.parse(aRes.payload);
    expect(aData.some((c: any) => c.contactUserId === userCId)).toBe(true);

    // Verify bidirectional link: User C has User A
    const cContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userCId));
    expect(cContacts.some((c) => c.contactUserId === userAId)).toBe(true);

    const postData = JSON.parse(res.payload);
    expect(postData.userId).toBe(userAId);
    expect(postData.contactUserId).toBe(userCId);
    expect(postData.nickname).toBe("Chuck");
    expect(postData.contact).toBeDefined();
    expect(postData.contact.id).toBe(userCId);
  });

  it("POST /api/v1/contacts adds a contact by email and returns ContactSummary", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/contacts",
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        email: userDEmail,
        nickname: "Dee",
      },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.payload);
    expect(data.userId).toBe(userAId);
    expect(data.contactUserId).toBe(userDId);
    expect(data.nickname).toBe("Dee");
    expect(data.contact).toBeDefined();
    expect(data.contact.id).toBe(userDId);
    expect(data.contact.name).toBe("Diana Contacts");

    // Verify bidirectional link in DB
    const dContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userDId));
    expect(dContacts.some((c) => c.contactUserId === userAId)).toBe(true);
  });

  it("POST /api/v1/contacts rejects adding self by email with 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/contacts",
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        email: userAEmail,
      },
    });

    expect(res.statusCode).toBe(400);
    const data = JSON.parse(res.payload);
    expect(data.error).toBe("Cannot add self as contact");
  });

  it("POST /api/v1/contacts returns 404 for unknown email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/contacts",
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        email: "nonexistent-user-xyz@example.com",
      },
    });

    expect(res.statusCode).toBe(404);
  });

  it("POST /api/v1/contacts returns 400 when neither contactUserId nor email is provided", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/contacts",
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        nickname: "Nobody",
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it("POST /api/v1/contacts returns 400 when both contactUserId and email are provided", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/contacts",
      headers: {
        authorization: `Bearer ${tokenA}`,
      },
      payload: {
        contactUserId: userDId,
        email: userDEmail,
      },
    });

    expect(res.statusCode).toBe(400);
  });
});
