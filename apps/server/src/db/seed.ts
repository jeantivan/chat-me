import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import * as schema from "./schema.js";
import {
  users,
  userSettings,
  contacts,
  chats,
  chatParticipants,
  messages,
  messageReceipts,
  messageReactions,
  messageStars,
  generateDirectPairHash,
} from "./schema.js";
import { hashPassword } from "../services/auth.service.js";
import { migrateDb } from "./migrate.js";

function makeLexicalBody(text: string): string {
  return JSON.stringify({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  });
}

export async function seedDb(pool: pg.Pool) {
  const db = drizzle(pool, { schema });

  console.log("🌱 Running database migrations before seeding...");
  await migrateDb(pool);

  console.log("🌱 Creating test users...");
  const defaultPassword = "Password123!";
  const passwordHash = await hashPassword(defaultPassword);

  const testUsersData = [
    {
      email: "alice@example.com",
      name: "Alice Smith",
      bio: "Software engineer & open-source enthusiast",
      phone: "+1 555-0101",
      pictureUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    },
    {
      email: "bob@example.com",
      name: "Bob Builder",
      bio: "Can we build it? Yes we can!",
      phone: "+1 555-0102",
      pictureUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    },
    {
      email: "charlie@example.com",
      name: "Charlie Brown",
      bio: "A day without laughter is a day wasted",
      phone: "+1 555-0103",
      pictureUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
    },
    {
      email: "diana@example.com",
      name: "Diana Prince",
      bio: "Always striving for justice and connection",
      phone: "+1 555-0104",
      pictureUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    },
  ];

  const seededUsers: Record<string, string> = {}; // email -> userId

  for (const u of testUsersData) {
    const existing = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, u.email))
      .limit(1);

    if (existing.length > 0) {
      seededUsers[u.email] = existing[0].id;
      // Update fields
      await db
        .update(users)
        .set({
          name: u.name,
          bio: u.bio,
          phone: u.phone,
          pictureUrl: u.pictureUrl,
          passwordHash,
        })
        .where(eq(users.id, existing[0].id));
    } else {
      const [inserted] = await db
        .insert(users)
        .values({
          email: u.email,
          passwordHash,
          name: u.name,
          bio: u.bio,
          phone: u.phone,
          pictureUrl: u.pictureUrl,
        })
        .returning();
      seededUsers[u.email] = inserted.id;

      await db
        .insert(userSettings)
        .values({
          userId: inserted.id,
        })
        .onConflictDoNothing();
    }
  }

  const aliceId = seededUsers["alice@example.com"];
  const bobId = seededUsers["bob@example.com"];
  const charlieId = seededUsers["charlie@example.com"];
  const dianaId = seededUsers["diana@example.com"];

  console.log("🌱 Establishing bidirectional contacts...");
  const contactPairs = [
    [aliceId, bobId],
    [aliceId, charlieId],
    [aliceId, dianaId],
    [bobId, charlieId],
  ];

  for (const [u1, u2] of contactPairs) {
    await db
      .insert(contacts)
      .values([
        { userId: u1, contactUserId: u2 },
        { userId: u2, contactUserId: u1 },
      ])
      .onConflictDoNothing();
  }

  console.log("🌱 Seeding direct conversations...");

  async function getOrCreateDirectChat(userA: string, userB: string) {
    const pairHash = generateDirectPairHash(userA, userB);
    const existing = await db
      .select({ id: chats.id })
      .from(chats)
      .where(eq(chats.directPairHash, pairHash))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(messages).where(eq(messages.chatId, existing[0].id));
      return existing[0].id;
    }

    const [newChat] = await db
      .insert(chats)
      .values({
        type: "direct",
        directPairHash: pairHash,
      })
      .returning();

    await db.insert(chatParticipants).values([
      { chatId: newChat.id, userId: userA, role: "member" },
      { chatId: newChat.id, userId: userB, role: "member" },
    ]);

    return newChat.id;
  }

  const now = Date.now();

  // 1. Chat Alice & Bob (Active conversation, all read)
  const chatAliceBob = await getOrCreateDirectChat(aliceId, bobId);
  const aliceBobMessages = [
    {
      sender: bobId,
      recipient: aliceId,
      text: "Hey Alice! Welcome to the chat-me platform 🎉",
      offsetMinutesAgo: 60,
    },
    {
      sender: aliceId,
      recipient: bobId,
      text: "Hi Bob! The real-time messaging with Socket.IO is super responsive!",
      offsetMinutesAgo: 50,
    },
    {
      sender: bobId,
      recipient: aliceId,
      text: "Have you checked out the unread watermarks and typing indicators?",
      offsetMinutesAgo: 30,
    },
    {
      sender: aliceId,
      recipient: bobId,
      text: "Yes, they update immediately when someone starts typing in the editor!",
      offsetMinutesAgo: 20,
    },
  ];

  const aliceBobMsgIds: string[] = [];
  for (const msg of aliceBobMessages) {
    const msgId = randomUUID();
    aliceBobMsgIds.push(msgId);
    const time = new Date(now - msg.offsetMinutesAgo * 60 * 1000);
    await db
      .insert(messages)
      .values({
        id: msgId,
        chatId: chatAliceBob,
        senderId: msg.sender,
        body: makeLexicalBody(msg.text),
        createdAt: time,
        forwarded: false,
      })
      .onConflictDoNothing();

    await db
      .insert(messageReceipts)
      .values([
        { messageId: msgId, userId: msg.recipient, status: "read" },
      ])
      .onConflictDoNothing();
  }

  // Seed reactions and starred messages on Alice & Bob conversation
  if (aliceBobMsgIds.length >= 2) {
    await db
      .insert(messageReactions)
      .values([
        { messageId: aliceBobMsgIds[0], userId: aliceId, emoji: "🎉" },
        { messageId: aliceBobMsgIds[1], userId: bobId, emoji: "🚀" },
        { messageId: aliceBobMsgIds[3], userId: bobId, emoji: "❤️" },
      ])
      .onConflictDoNothing();

    await db
      .insert(messageStars)
      .values([
        { userId: aliceId, messageId: aliceBobMsgIds[0] },
        { userId: aliceId, messageId: aliceBobMsgIds[1] },
        { userId: bobId, messageId: aliceBobMsgIds[1] },
      ])
      .onConflictDoNothing();
  }

  // Update Alice and Bob's lastReadAt so all are marked read
  await db
    .update(chatParticipants)
    .set({ lastReadAt: new Date(now) })
    .where(eq(chatParticipants.chatId, chatAliceBob));

  // 2. Chat Alice & Charlie (Charlie sent 2 unread messages for Alice!)
  const chatAliceCharlie = await getOrCreateDirectChat(aliceId, charlieId);
  const aliceCharlieMessages = [
    {
      sender: aliceId,
      recipient: charlieId,
      text: "Hey Charlie, are we still meeting this afternoon?",
      offsetMinutesAgo: 45,
    },
    {
      sender: charlieId,
      recipient: aliceId,
      text: "Yes! 3:00 PM works perfectly for me.",
      offsetMinutesAgo: 10,
    },
    {
      sender: charlieId,
      recipient: aliceId,
      text: "I'll bring the project architecture diagrams along.",
      offsetMinutesAgo: 5,
    },
  ];

  for (const msg of aliceCharlieMessages) {
    const msgId = randomUUID();
    const time = new Date(now - msg.offsetMinutesAgo * 60 * 1000);
    await db
      .insert(messages)
      .values({
        id: msgId,
        chatId: chatAliceCharlie,
        senderId: msg.sender,
        body: makeLexicalBody(msg.text),
        createdAt: time,
        forwarded: false,
      })
      .onConflictDoNothing();

    await db
      .insert(messageReceipts)
      .values([
        {
          messageId: msgId,
          userId: msg.recipient,
          status: msg.offsetMinutesAgo > 30 ? "read" : "received",
        },
      ])
      .onConflictDoNothing();
  }

  // Alice last read 30 minutes ago -> the 2 recent Charlie messages will show as unread badge (2)!
  await db
    .update(chatParticipants)
    .set({ lastReadAt: new Date(now - 30 * 60 * 1000) })
    .where(
      and(
        eq(chatParticipants.chatId, chatAliceCharlie),
        eq(chatParticipants.userId, aliceId)
      )
    );
  // Charlie read everything
  await db
    .update(chatParticipants)
    .set({ lastReadAt: new Date(now) })
    .where(
      and(
        eq(chatParticipants.chatId, chatAliceCharlie),
        eq(chatParticipants.userId, charlieId)
      )
    );

  // 3. Chat Alice & Diana (Recent single unread message from Diana!)
  const chatAliceDiana = await getOrCreateDirectChat(aliceId, dianaId);
  const msgDianaId = randomUUID();
  const dianaMsgTime = new Date(now - 2 * 60 * 1000);
  await db
    .insert(messages)
    .values({
      id: msgDianaId,
      chatId: chatAliceDiana,
      senderId: dianaId,
      body: makeLexicalBody("Hey Alice, can you review the new PR when you get a chance?"),
      createdAt: dianaMsgTime,
      forwarded: false,
    })
    .onConflictDoNothing();

  await db
    .insert(messageReceipts)
    .values([
      { messageId: msgDianaId, userId: aliceId, status: "received" },
    ])
    .onConflictDoNothing();

  // Alice last read 15 minutes ago -> Diana message is unread (1)!
  await db
    .update(chatParticipants)
    .set({ lastReadAt: new Date(now - 15 * 60 * 1000) })
    .where(
      and(
        eq(chatParticipants.chatId, chatAliceDiana),
        eq(chatParticipants.userId, aliceId)
      )
    );

  // 4. Group Chat: Engineering & Architecture (Alice, Bob, Charlie, Diana)
  console.log("🌱 Seeding group conversation...");
  const groupTitle = "Engineering & Architecture";
  const existingGroups = await db
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.type, "group"), eq(chats.title, groupTitle)))
    .limit(1);

  let groupChatId: string;
  if (existingGroups.length > 0) {
    groupChatId = existingGroups[0].id;
    await db.delete(messages).where(eq(messages.chatId, groupChatId));
  } else {
    const [newGroup] = await db
      .insert(chats)
      .values({
        type: "group",
        title: groupTitle,
        bio: "Real-time architecture, Lexical rich-text plugins, and hybrid TanStack Query + Zustand state.",
        pictureUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150",
      })
      .returning();
    groupChatId = newGroup.id;

    await db
      .insert(chatParticipants)
      .values([
        { chatId: groupChatId, userId: aliceId, role: "admin", pinned: true },
        { chatId: groupChatId, userId: bobId, role: "member", pinned: true },
        { chatId: groupChatId, userId: charlieId, role: "member" },
        { chatId: groupChatId, userId: dianaId, role: "member" },
      ])
      .onConflictDoNothing();
  }

  const groupMessagesData = [
    {
      sender: aliceId,
      text: "Welcome team! We just migrated client server-state to TanStack Query v5 with Socket.IO cache patching.",
      offsetMinutesAgo: 25,
    },
    {
      sender: bobId,
      text: "The optimistic Lexical message pipeline and S3 presigned media uploads feel instantaneous!",
      offsetMinutesAgo: 18,
    },
    {
      sender: charlieId,
      text: "Multi-participant delivery receipts and read watermarks are passing all Playwright E2E checks.",
      offsetMinutesAgo: 12,
    },
  ];

  const allGroupUserIds = [aliceId, bobId, charlieId, dianaId];
  const groupMsgIds: string[] = [];

  for (const gMsg of groupMessagesData) {
    const msgId = randomUUID();
    groupMsgIds.push(msgId);
    const time = new Date(now - gMsg.offsetMinutesAgo * 60 * 1000);
    await db
      .insert(messages)
      .values({
        id: msgId,
        chatId: groupChatId,
        senderId: gMsg.sender,
        body: makeLexicalBody(gMsg.text),
        createdAt: time,
        forwarded: false,
      })
      .onConflictDoNothing();

    const otherParticipants = allGroupUserIds.filter((uid) => uid !== gMsg.sender);
    await db
      .insert(messageReceipts)
      .values(
        otherParticipants.map((uid) => ({
          messageId: msgId,
          userId: uid,
          status: "read" as const,
        }))
      )
      .onConflictDoNothing();
  }

  if (groupMsgIds.length >= 2) {
    await db
      .insert(messageReactions)
      .values([
        { messageId: groupMsgIds[0], userId: bobId, emoji: "🔥" },
        { messageId: groupMsgIds[0], userId: charlieId, emoji: "🚀" },
        { messageId: groupMsgIds[1], userId: aliceId, emoji: "💯" },
      ])
      .onConflictDoNothing();

    await db
      .insert(messageStars)
      .values([{ userId: aliceId, messageId: groupMsgIds[0] }])
      .onConflictDoNothing();
  }

  await db
    .update(chatParticipants)
    .set({ lastReadAt: new Date(now) })
    .where(eq(chatParticipants.chatId, groupChatId));

  console.log("✅ Database successfully seeded!");
  console.log("-------------------------------------------------------");
  console.log("Test accounts available (Password for all: Password123!)");
  console.log("1. alice@example.com   - Has active chats and unread badges");
  console.log("2. bob@example.com     - Active chat with Alice");
  console.log("3. charlie@example.com - Sent 2 unread messages to Alice");
  console.log("4. diana@example.com   - Sent 1 unread message to Alice");
  console.log("-------------------------------------------------------");
}

if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  const connectionString =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";
  const pool = new pg.Pool({ connectionString });
  try {
    await seedDb(pool);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
