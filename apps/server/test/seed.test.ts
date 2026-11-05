import { describe, it, expect, beforeAll, afterAll } from "vitest";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, inArray, and, ne } from "drizzle-orm";
import * as schema from "../src/db/schema.js";
import {
  users,
  contacts,
  chats,
  chatParticipants,
  messages,
  mediaAttachments,
} from "../src/db/schema.js";
import { seedDb } from "../src/db/seed.js";
import { SEED_USERS } from "../src/db/seed-data.js";

describe("Database Seed Dataset Verification", () => {
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool, { schema });
    await seedDb(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("seeds Bob and Alice users with at least 20 contacts each", async () => {
    const [alice] = await db
      .select()
      .from(users)
      .where(eq(users.email, "alice@example.com"))
      .limit(1);
    const [bob] = await db
      .select()
      .from(users)
      .where(eq(users.email, "bob@example.com"))
      .limit(1);

    expect(alice).toBeDefined();
    expect(bob).toBeDefined();

    const aliceContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, alice.id));
    const bobContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, bob.id));

    expect(aliceContacts.length).toBeGreaterThanOrEqual(20);
    expect(bobContacts.length).toBeGreaterThanOrEqual(20);
  });

  it("seeds exactly 10 chats (8 direct and 2 groups) for Alice", async () => {
    const [alice] = await db
      .select()
      .from(users)
      .where(eq(users.email, "alice@example.com"))
      .limit(1);

    const seedUserRows = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.email, SEED_USERS.map((u) => u.email)));
    const seedUserIds = new Set(seedUserRows.map((u) => u.id));

    const aliceMemberships = await db
      .select({
        chatId: chatParticipants.chatId,
        type: chats.type,
      })
      .from(chatParticipants)
      .innerJoin(chats, eq(chatParticipants.chatId, chats.id))
      .where(eq(chatParticipants.userId, alice.id));

    const directChats: string[] = [];
    for (const m of aliceMemberships.filter((m) => m.type === "direct")) {
      const otherParticipants = await db
        .select({ userId: chatParticipants.userId })
        .from(chatParticipants)
        .where(
          and(
            eq(chatParticipants.chatId, m.chatId),
            ne(chatParticipants.userId, alice.id)
          )
        );
      if (otherParticipants.some((p) => seedUserIds.has(p.userId))) {
        directChats.push(m.chatId);
      }
    }

    const groupChats = aliceMemberships.filter((m) => m.type === "group");

    expect(directChats.length).toBe(8);
    expect(groupChats.length).toBe(2);
  });

  it("seeds exactly 10 chats (8 direct and 2 groups) for Bob", async () => {
    const [bob] = await db
      .select()
      .from(users)
      .where(eq(users.email, "bob@example.com"))
      .limit(1);

    const bobMemberships = await db
      .select({
        chatId: chatParticipants.chatId,
        type: chats.type,
      })
      .from(chatParticipants)
      .innerJoin(chats, eq(chatParticipants.chatId, chats.id))
      .where(eq(chatParticipants.userId, bob.id));

    const directChats = bobMemberships.filter((m) => m.type === "direct");
    const groupChats = bobMemberships.filter((m) => m.type === "group");

    expect(bobMemberships.length).toBe(10);
    expect(directChats.length).toBe(8);
    expect(groupChats.length).toBe(2);
  });

  it("provides at least 10 contacts with no existing direct chats for Alice and Bob to start new chats", async () => {
    const [alice] = await db
      .select()
      .from(users)
      .where(eq(users.email, "alice@example.com"))
      .limit(1);
    const [bob] = await db
      .select()
      .from(users)
      .where(eq(users.email, "bob@example.com"))
      .limit(1);

    // Alice
    const aliceContacts = await db
      .select({ contactUserId: contacts.contactUserId })
      .from(contacts)
      .where(eq(contacts.userId, alice.id));

    const aliceDirectChatPartners = await db
      .select({ partnerId: chatParticipants.userId })
      .from(chatParticipants)
      .innerJoin(chats, eq(chatParticipants.chatId, chats.id))
      .where(eq(chats.type, "direct"));

    // Filter to direct chats Alice is a part of
    const aliceDirectChatIds = (
      await db
        .select({ chatId: chatParticipants.chatId })
        .from(chatParticipants)
        .innerJoin(chats, eq(chatParticipants.chatId, chats.id))
        .where(eq(chatParticipants.userId, alice.id))
    )
      .map((c) => c.chatId);

    const partnersInAliceChats = (
      await db
        .select({ userId: chatParticipants.userId })
        .from(chatParticipants)
        .where(inArray(chatParticipants.chatId, aliceDirectChatIds))
    )
      .map((p) => p.userId)
      .filter((uid) => uid !== alice.id);

    const aliceUnchattedContacts = aliceContacts.filter(
      (c) => !partnersInAliceChats.includes(c.contactUserId)
    );
    expect(aliceUnchattedContacts.length).toBeGreaterThanOrEqual(10);

    // Bob
    const bobContacts = await db
      .select({ contactUserId: contacts.contactUserId })
      .from(contacts)
      .where(eq(contacts.userId, bob.id));

    const bobDirectChatIds = (
      await db
        .select({ chatId: chatParticipants.chatId })
        .from(chatParticipants)
        .innerJoin(chats, eq(chatParticipants.chatId, chats.id))
        .where(eq(chatParticipants.userId, bob.id))
    )
      .map((c) => c.chatId);

    const partnersInBobChats = (
      await db
        .select({ userId: chatParticipants.userId })
        .from(chatParticipants)
        .where(inArray(chatParticipants.chatId, bobDirectChatIds))
    )
      .map((p) => p.userId)
      .filter((uid) => uid !== bob.id);

    const bobUnchattedContacts = bobContacts.filter(
      (c) => !partnersInBobChats.includes(c.contactUserId)
    );
    expect(bobUnchattedContacts.length).toBeGreaterThanOrEqual(10);
  });

  it("ensures each existing chat has at least 50 messages and includes example images", async () => {
    const [alice] = await db
      .select()
      .from(users)
      .where(eq(users.email, "alice@example.com"))
      .limit(1);

    const seedUserRows = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.email, SEED_USERS.map((u) => u.email)));
    const seedUserIds = new Set(seedUserRows.map((u) => u.id));

    const aliceMemberships = await db
      .select({
        chatId: chatParticipants.chatId,
        type: chats.type,
      })
      .from(chatParticipants)
      .innerJoin(chats, eq(chatParticipants.chatId, chats.id))
      .where(eq(chatParticipants.userId, alice.id));

    const seedChatIds: string[] = [];
    for (const m of aliceMemberships) {
      if (m.type === "group") {
        seedChatIds.push(m.chatId);
      } else {
        const otherParticipants = await db
          .select({ userId: chatParticipants.userId })
          .from(chatParticipants)
          .where(
            and(
              eq(chatParticipants.chatId, m.chatId),
              ne(chatParticipants.userId, alice.id)
            )
          );
        if (otherParticipants.some((p) => seedUserIds.has(p.userId))) {
          seedChatIds.push(m.chatId);
        }
      }
    }

    expect(seedChatIds.length).toBe(10);

    for (const chatId of seedChatIds) {
      const chatMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId));

      expect(chatMessages.length).toBeGreaterThanOrEqual(50);

      const messagesWithMedia = chatMessages.filter((m) => m.mediaId !== null);
      expect(messagesWithMedia.length).toBeGreaterThanOrEqual(1);

      const mediaIds = messagesWithMedia.map((m) => m.mediaId as string);
      const mediaRows = await db
        .select()
        .from(mediaAttachments)
        .where(inArray(mediaAttachments.id, mediaIds));

      expect(mediaRows.length).toBe(mediaIds.length);
      for (const media of mediaRows) {
        expect(media.type).toBe("image");
        expect(media.url).toBeTruthy();
        expect(media.status).toBe("attached");
        expect(media.width).toBeGreaterThan(0);
        expect(media.height).toBeGreaterThan(0);
      }
    }
  });
});
