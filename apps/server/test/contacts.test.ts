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
  let userBId: string;
  let userCId: string;
  let tokenA: string;
  let tokenB: string;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp();
    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool);

    // Register User A
    const regARes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: `alice-contacts-${Date.now()}@example.com`,
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
  });

  afterAll(async () => {
    if (userAId) await db.delete(users).where(eq(users.id, userAId));
    if (userBId) await db.delete(users).where(eq(users.id, userBId));
    if (userCId) await db.delete(users).where(eq(users.id, userCId));
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

    expect(aContacts).toHaveLength(1);
    expect(aContacts[0].contactUserId).toBe(userBId);
    expect(aContacts[0].nickname).toBe("Bobby");

    const bContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userBId));

    expect(bContacts).toHaveLength(1);
    expect(bContacts[0].contactUserId).toBe(userAId);
    expect(bContacts[0].nickname).toBe("Ali");
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
  });
});
