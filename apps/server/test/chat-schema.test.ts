import { describe, it, expect, beforeAll, afterAll } from "vitest";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import {
  users,
  chats,
  chatParticipants,
  messages,
  messageReceipts,
  generateDirectPairHash,
} from "../src/db/schema.js";
import { migrateDb } from "../src/db/migrate.js";

describe("Database Schema & Relational Integrity Seam (Direct Messaging)", () => {
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: databaseUrl });
    db = drizzle(pool);
    await migrateDb(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates a direct chat between two participants with deterministic direct_pair_hash", async () => {
    // 1. Create two users
    const [userA] = await db
      .insert(users)
      .values({
        email: `alice-${Date.now()}@example.com`,
        name: "Alice",
      })
      .returning();

    const [userB] = await db
      .insert(users)
      .values({
        email: `bob-${Date.now()}@example.com`,
        name: "Bob",
      })
      .returning();

    const pairHash = generateDirectPairHash(userA.id, userB.id);

    // 2. Create direct chat
    const [chat] = await db
      .insert(chats)
      .values({
        type: "direct",
        directPairHash: pairHash,
      })
      .returning();

    expect(chat.id).toBeDefined();
    expect(chat.type).toBe("direct");
    expect(chat.directPairHash).toBe(pairHash);

    // 3. Add both participants
    await db.insert(chatParticipants).values([
      { chatId: chat.id, userId: userA.id, role: "member" },
      { chatId: chat.id, userId: userB.id, role: "member" },
    ]);

    // 4. Verify duplicate direct_pair_hash violates unique constraint
    await expect(
      db.insert(chats).values({
        type: "direct",
        directPairHash: pairHash,
      })
    ).rejects.toThrow();

    // Clean up
    await db.delete(chats).where(eq(chats.id, chat.id));
    await db.delete(users).where(eq(users.id, userA.id));
    await db.delete(users).where(eq(users.id, userB.id));
  });

  it("inserts message with client-supplied UUID and creates message_receipt", async () => {
    const [userA] = await db
      .insert(users)
      .values({
        email: `alice-msg-${Date.now()}@example.com`,
        name: "Alice M",
      })
      .returning();

    const [userB] = await db
      .insert(users)
      .values({
        email: `bob-msg-${Date.now()}@example.com`,
        name: "Bob M",
      })
      .returning();

    const [chat] = await db
      .insert(chats)
      .values({
        type: "direct",
        directPairHash: generateDirectPairHash(userA.id, userB.id),
      })
      .returning();

    await db.insert(chatParticipants).values([
      { chatId: chat.id, userId: userA.id },
      { chatId: chat.id, userId: userB.id },
    ]);

    const clientSuppliedMessageId = crypto.randomUUID();

    const [msg] = await db
      .insert(messages)
      .values({
        id: clientSuppliedMessageId,
        chatId: chat.id,
        senderId: userA.id,
        body: "Hello Bob!",
      })
      .returning();

    expect(msg.id).toBe(clientSuppliedMessageId);
    expect(msg.body).toBe("Hello Bob!");
    expect(msg.senderId).toBe(userA.id);

    // Insert delivery receipt
    const [receipt] = await db
      .insert(messageReceipts)
      .values({
        messageId: msg.id,
        userId: userB.id,
        status: "received",
      })
      .returning();

    expect(receipt.messageId).toBe(msg.id);
    expect(receipt.userId).toBe(userB.id);
    expect(receipt.status).toBe("received");

    // Cascade delete test: deleting chat removes messages and receipts
    await db.delete(chats).where(eq(chats.id, chat.id));

    const remainingMsg = await db.select().from(messages).where(eq(messages.id, msg.id));
    expect(remainingMsg.length).toBe(0);

    const remainingReceipt = await db
      .select()
      .from(messageReceipts)
      .where(eq(messageReceipts.messageId, msg.id));
    expect(remainingReceipt.length).toBe(0);

    // Clean up users
    await db.delete(users).where(eq(users.id, userA.id));
    await db.delete(users).where(eq(users.id, userB.id));
  });
});
