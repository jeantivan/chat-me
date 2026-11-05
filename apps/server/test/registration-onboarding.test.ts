import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { migrateDb } from "../src/db/migrate.js";
import pg from "pg";
import type { FastifyInstance } from "fastify";
import { eq, inArray, and } from "drizzle-orm";
import {
  users,
  contacts,
  chats,
  chatParticipants,
  messages,
  messageReceipts,
} from "../src/db/schema.js";
import { hashPassword } from "../src/services/auth.service.js";

describe("Registration Starter Onboarding Seam", () => {
  let app: FastifyInstance;
  let pool: pg.Pool;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  const demoEmails = [
    "alice@example.com",
    "bob@example.com",
    "charlie@example.com",
    "diana@example.com",
  ];

  let demoUserIds: Record<string, string> = {};
  let engGroupId: string;
  const createdTestUserIds: string[] = [];

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: databaseUrl });
    await migrateDb(pool);

    app = await buildApp({
      databaseUrl,
      redisUrl,
    });
    await app.ready();

    // Ensure demo accounts exist
    const defaultPasswordHash = await hashPassword("Password123!");
    for (const email of demoEmails) {
      const name = email.split("@")[0].toUpperCase();
      const [existing] = await app.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing) {
        demoUserIds[email] = existing.id;
      } else {
        const [inserted] = await app.db
          .insert(users)
          .values({
            email,
            passwordHash: defaultPasswordHash,
            name,
          })
          .returning();
        demoUserIds[email] = inserted.id;
      }
    }

    // Ensure "Engineering & Architecture" group chat exists
    const [existingGroup] = await app.db
      .select({ id: chats.id })
      .from(chats)
      .where(and(eq(chats.type, "group"), eq(chats.title, "Engineering & Architecture")))
      .limit(1);

    if (existingGroup) {
      engGroupId = existingGroup.id;
    } else {
      const [newGroup] = await app.db
        .insert(chats)
        .values({
          type: "group",
          title: "Engineering & Architecture",
        })
        .returning();
      engGroupId = newGroup.id;
    }
  });

  afterAll(async () => {
    if (createdTestUserIds.length > 0) {
      await app.db.delete(users).where(inArray(users.id, createdTestUserIds));
    }
    await app.close();
    await pool.end();
  });

  it("POST /api/v1/auth/register automatically onboards new user with contacts, group, and direct chat", async () => {
    const testEmail = `new-user-${Date.now()}@example.com`;
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: testEmail,
        password: "Password123!",
        name: "New Starter User",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    const newUserId = body.user.id;
    createdTestUserIds.push(newUserId);

    // 1. Verify bidirectional contacts with demo accounts
    const userContacts = await app.db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, newUserId));

    const userContactIds = userContacts.map((c) => c.contactUserId);
    for (const email of demoEmails) {
      expect(userContactIds).toContain(demoUserIds[email]);

      // Reverse direction
      const reverseContact = await app.db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, demoUserIds[email]),
            eq(contacts.contactUserId, newUserId)
          )
        );
      expect(reverseContact.length).toBe(1);
    }

    // 2. Verify participant in "Engineering & Architecture" group
    const groupParticipation = await app.db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, engGroupId),
          eq(chatParticipants.userId, newUserId)
        )
      );
    expect(groupParticipation.length).toBe(1);
    expect(groupParticipation[0].role).toBe("member");

    // 3. Verify direct chat with Alice containing a welcome message
    const aliceId = demoUserIds["alice@example.com"];
    const aliceDirectChats = await app.db
      .select({ chatId: chatParticipants.chatId })
      .from(chatParticipants)
      .where(eq(chatParticipants.userId, newUserId));

    let directChatWithAliceId: string | null = null;
    for (const part of aliceDirectChats) {
      const [isDirect] = await app.db
        .select({ id: chats.id, type: chats.type })
        .from(chats)
        .where(and(eq(chats.id, part.chatId), eq(chats.type, "direct")))
        .limit(1);

      if (isDirect) {
        const [hasAlice] = await app.db
          .select()
          .from(chatParticipants)
          .where(
            and(
              eq(chatParticipants.chatId, isDirect.id),
              eq(chatParticipants.userId, aliceId)
            )
          )
          .limit(1);

        if (hasAlice) {
          directChatWithAliceId = isDirect.id;
          break;
        }
      }
    }

    expect(directChatWithAliceId).not.toBeNull();

    // Verify welcome message from Alice
    const welcomeMsgs = await app.db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.chatId, directChatWithAliceId!),
          eq(messages.senderId, aliceId)
        )
      );

    expect(welcomeMsgs.length).toBeGreaterThanOrEqual(1);
    const welcomeMsg = welcomeMsgs[0];
    expect(welcomeMsg.body).toContain("Welcome to ChatMe!");

    // Verify receipt for new user is received
    const receipts = await app.db
      .select()
      .from(messageReceipts)
      .where(
        and(
          eq(messageReceipts.messageId, welcomeMsg.id),
          eq(messageReceipts.userId, newUserId)
        )
      );
    expect(receipts.length).toBe(1);
    expect(receipts[0].status).toBe("received");
  });
});
