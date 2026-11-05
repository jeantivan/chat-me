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
  mediaAttachments,
  messageReceipts,
  messageReactions,
  messageStars,
  generateDirectPairHash,
} from "./schema.js";
import { hashPassword } from "../services/auth.service.js";
import { makeLexicalBody } from "../services/onboarding.service.js";
import { migrateDb } from "./migrate.js";
import { SEED_USERS, SAMPLE_IMAGES, getRandomPhrase } from "./seed-data.js";

export async function seedDb(pool: pg.Pool) {
  const db = drizzle(pool, { schema });

  console.log("🌱 Running database migrations before seeding...");
  await migrateDb(pool);

  console.log("🌱 Creating test users...");
  const defaultPassword = "Password123!";
  const passwordHash = await hashPassword(defaultPassword);

  const seededUsers: Record<string, string> = {}; // email -> userId

  for (const u of SEED_USERS) {
    const existing = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, u.email))
      .limit(1);

    if (existing.length > 0) {
      seededUsers[u.email] = existing[0].id;
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
  const edwardId = seededUsers["edward@example.com"];
  const fionaId = seededUsers["fiona@example.com"];
  const georgeId = seededUsers["george@example.com"];
  const hannahId = seededUsers["hannah@example.com"];
  const ianId = seededUsers["ian@example.com"];
  const juliaId = seededUsers["julia@example.com"];

  console.log("🌱 Establishing bidirectional contacts for Alice and Bob...");
  const otherUsersForAlice = SEED_USERS.filter((u) => u.email !== "alice@example.com").map(
    (u) => seededUsers[u.email]
  );
  const otherUsersForBob = SEED_USERS.filter((u) => u.email !== "bob@example.com").map(
    (u) => seededUsers[u.email]
  );

  const contactRows: Array<typeof contacts.$inferInsert> = [];
  for (const targetId of otherUsersForAlice) {
    contactRows.push({ userId: aliceId, contactUserId: targetId });
    contactRows.push({ userId: targetId, contactUserId: aliceId });
  }
  for (const targetId of otherUsersForBob) {
    contactRows.push({ userId: bobId, contactUserId: targetId });
    contactRows.push({ userId: targetId, contactUserId: bobId });
  }

  await db.insert(contacts).values(contactRows).onConflictDoNothing();

  async function getOrCreateDirectChat(userA: string, userB: string) {
    const pairHash = generateDirectPairHash(userA, userB);
    const existing = await db
      .select({ id: chats.id })
      .from(chats)
      .where(eq(chats.directPairHash, pairHash))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(mediaAttachments).where(eq(mediaAttachments.chatId, existing[0].id));
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

  async function seedMessagesForDirectChat(
    chatId: string,
    user1Id: string,
    user2Id: string,
    options?: {
      unreadForUser1?: number;
      chatSeedOffset?: number;
    }
  ) {
    const unreadCount = options?.unreadForUser1 ?? 0;
    const chatSeedOffset = options?.chatSeedOffset ?? 0;
    const messageCount = 52;
    const imageIndices = [8, 24, 42];

    const newMediaRows: Array<typeof mediaAttachments.$inferInsert> = [];
    const mediaLinks: Array<{ mediaId: string; msgId: string }> = [];
    const newMsgRows: Array<typeof messages.$inferInsert> = [];
    const newReceiptRows: Array<typeof messageReceipts.$inferInsert> = [];

    const now = Date.now();

    for (let i = 0; i < messageCount; i++) {
      const msgId = randomUUID();
      const sender = i % 4 === 1 || i % 4 === 2 ? user2Id : user1Id;
      const recipient = sender === user1Id ? user2Id : user1Id;
      const offsetMinutes = Math.max(1, (messageCount - i) * 35 - (chatSeedOffset % 15));
      const msgTime = new Date(now - offsetMinutes * 60 * 1000);

      let mediaId: string | null = null;
      let textBody: string;

      if (imageIndices.includes(i)) {
        mediaId = randomUUID();
        const sampleImg = SAMPLE_IMAGES[(chatSeedOffset + i) % SAMPLE_IMAGES.length];
        newMediaRows.push({
          id: mediaId,
          messageId: null,
          chatId,
          uploaderId: sender,
          type: "image",
          url: sampleImg.url,
          storageKey: `seed/images/${mediaId}.jpg`,
          blurhash: sampleImg.blurhash,
          orientation: sampleImg.orientation,
          width: sampleImg.width,
          height: sampleImg.height,
          sizeBytes: sampleImg.sizeBytes,
          mimeType: "image/jpeg",
          status: "attached",
          createdAt: msgTime,
        });
        mediaLinks.push({ mediaId, msgId });
        textBody = sampleImg.caption;
      } else {
        textBody = getRandomPhrase(chatSeedOffset + i);
      }

      newMsgRows.push({
        id: msgId,
        chatId,
        senderId: sender,
        mediaId,
        body: makeLexicalBody(textBody),
        createdAt: msgTime,
        forwarded: i % 17 === 0,
      });

      const isUnreadForRecipient =
        sender === user2Id && recipient === user1Id && i >= messageCount - unreadCount;
      newReceiptRows.push({
        messageId: msgId,
        userId: recipient,
        status: isUnreadForRecipient ? "received" : "read",
      });
    }

    if (newMediaRows.length > 0) {
      await db.insert(mediaAttachments).values(newMediaRows).onConflictDoNothing();
    }
    await db.insert(messages).values(newMsgRows).onConflictDoNothing();

    for (const link of mediaLinks) {
      await db
        .update(mediaAttachments)
        .set({ messageId: link.msgId })
        .where(eq(mediaAttachments.id, link.mediaId));
    }

    await db.insert(messageReceipts).values(newReceiptRows).onConflictDoNothing();

    if (newMsgRows.length > 10) {
      await db
        .insert(messageStars)
        .values([
          { userId: user1Id, messageId: newMsgRows[imageIndices[0]].id },
          { userId: user2Id, messageId: newMsgRows[1].id },
        ])
        .onConflictDoNothing();

      await db
        .insert(messageReactions)
        .values([
          { messageId: newMsgRows[0].id, userId: user2Id, emoji: "🎉" },
          { messageId: newMsgRows[imageIndices[0]].id, userId: user1Id, emoji: "❤️" },
          { messageId: newMsgRows[imageIndices[1]].id, userId: user2Id, emoji: "🚀" },
        ])
        .onConflictDoNothing();
    }

    if (unreadCount > 0) {
      const unreadThresholdTime = new Date(now - unreadCount * 45 * 60 * 1000);
      await db
        .update(chatParticipants)
        .set({ lastReadAt: unreadThresholdTime })
        .where(and(eq(chatParticipants.chatId, chatId), eq(chatParticipants.userId, user1Id)));
      await db
        .update(chatParticipants)
        .set({ lastReadAt: new Date(now) })
        .where(and(eq(chatParticipants.chatId, chatId), eq(chatParticipants.userId, user2Id)));
    } else {
      await db
        .update(chatParticipants)
        .set({ lastReadAt: new Date(now) })
        .where(eq(chatParticipants.chatId, chatId));
    }
  }

  console.log("🌱 Seeding direct conversations (8 for Alice, 8 for Bob)...");
  // 1. Shared direct chat: Alice & Bob
  const chatAliceBob = await getOrCreateDirectChat(aliceId, bobId);
  await seedMessagesForDirectChat(chatAliceBob, aliceId, bobId, { chatSeedOffset: 1 });

  // 2-8. Alice's direct chats with 7 other users
  const alicePartners = [
    { id: charlieId, unread: 2, offset: 2 },
    { id: dianaId, unread: 1, offset: 3 },
    { id: edwardId, unread: 0, offset: 4 },
    { id: fionaId, unread: 0, offset: 5 },
    { id: georgeId, unread: 0, offset: 6 },
    { id: hannahId, unread: 0, offset: 7 },
    { id: ianId, unread: 0, offset: 8 },
  ];

  const aliceDirectChatIds: string[] = [chatAliceBob];
  for (const partner of alicePartners) {
    const cId = await getOrCreateDirectChat(aliceId, partner.id);
    aliceDirectChatIds.push(cId);
    await seedMessagesForDirectChat(cId, aliceId, partner.id, {
      unreadForUser1: partner.unread,
      chatSeedOffset: partner.offset * 10,
    });
  }

  // Bob's direct chats with 7 other users
  const bobPartners = [
    { id: charlieId, offset: 12 },
    { id: dianaId, offset: 13 },
    { id: edwardId, offset: 14 },
    { id: fionaId, offset: 15 },
    { id: georgeId, offset: 16 },
    { id: hannahId, offset: 17 },
    { id: ianId, offset: 18 },
  ];

  const bobDirectChatIds: string[] = [chatAliceBob];
  for (const partner of bobPartners) {
    const cId = await getOrCreateDirectChat(bobId, partner.id);
    bobDirectChatIds.push(cId);
    await seedMessagesForDirectChat(cId, bobId, partner.id, {
      chatSeedOffset: partner.offset * 10,
    });
  }

  // Clean up any extraneous direct chats for Alice and Bob
  const directChatCleanupTargets = [
    { userId: aliceId, validChatIds: new Set(aliceDirectChatIds) },
    { userId: bobId, validChatIds: new Set(bobDirectChatIds) },
  ];

  for (const { userId, validChatIds } of directChatCleanupTargets) {
    const existingDirectChats = await db
      .select({ chatId: chatParticipants.chatId })
      .from(chatParticipants)
      .innerJoin(chats, eq(chatParticipants.chatId, chats.id))
      .where(and(eq(chatParticipants.userId, userId), eq(chats.type, "direct")));

    for (const { chatId } of existingDirectChats) {
      if (!validChatIds.has(chatId)) {
        await db.delete(chats).where(eq(chats.id, chatId));
      }
    }
  }

  console.log("🌱 Seeding 2 group conversations...");
  async function getOrCreateGroupChat(
    title: string,
    bio: string,
    pictureUrl: string,
    members: Array<{ userId: string; role: "admin" | "member"; pinned?: boolean }>
  ) {
    const existing = await db
      .select({ id: chats.id })
      .from(chats)
      .where(and(eq(chats.type, "group"), eq(chats.title, title)))
      .limit(1);

    let groupChatId: string;
    if (existing.length > 0) {
      groupChatId = existing[0].id;
      await db.delete(mediaAttachments).where(eq(mediaAttachments.chatId, groupChatId));
      await db.delete(messages).where(eq(messages.chatId, groupChatId));
    } else {
      const [newGroup] = await db
        .insert(chats)
        .values({
          type: "group",
          title,
          bio,
          pictureUrl,
        })
        .returning();
      groupChatId = newGroup.id;

      await db.insert(chatParticipants).values(
        members.map((m) => ({
          chatId: groupChatId,
          userId: m.userId,
          role: m.role,
          pinned: m.pinned ?? false,
        }))
      );
    }
    return groupChatId;
  }

  async function seedMessagesForGroupChat(
    chatId: string,
    participantIds: string[],
    groupSeedOffset: number
  ) {
    const messageCount = 52;
    const imageIndices = [6, 20, 36, 48];

    const newMediaRows: Array<typeof mediaAttachments.$inferInsert> = [];
    const mediaLinks: Array<{ mediaId: string; msgId: string }> = [];
    const newMsgRows: Array<typeof messages.$inferInsert> = [];
    const newReceiptRows: Array<typeof messageReceipts.$inferInsert> = [];

    const now = Date.now();

    for (let i = 0; i < messageCount; i++) {
      const msgId = randomUUID();
      const sender = participantIds[(i + groupSeedOffset) % participantIds.length];
      const offsetMinutes = Math.max(1, (messageCount - i) * 30);
      const msgTime = new Date(now - offsetMinutes * 60 * 1000);

      let mediaId: string | null = null;
      let textBody: string;

      if (imageIndices.includes(i)) {
        mediaId = randomUUID();
        const sampleImg = SAMPLE_IMAGES[(groupSeedOffset + i) % SAMPLE_IMAGES.length];
        newMediaRows.push({
          id: mediaId,
          messageId: null,
          chatId,
          uploaderId: sender,
          type: "image",
          url: sampleImg.url,
          storageKey: `seed/images/${mediaId}.jpg`,
          blurhash: sampleImg.blurhash,
          orientation: sampleImg.orientation,
          width: sampleImg.width,
          height: sampleImg.height,
          sizeBytes: sampleImg.sizeBytes,
          mimeType: "image/jpeg",
          status: "attached",
          createdAt: msgTime,
        });
        mediaLinks.push({ mediaId, msgId });
        textBody = sampleImg.caption;
      } else {
        textBody = getRandomPhrase(groupSeedOffset + i);
      }

      newMsgRows.push({
        id: msgId,
        chatId,
        senderId: sender,
        mediaId,
        body: makeLexicalBody(textBody),
        createdAt: msgTime,
        forwarded: false,
      });

      const otherParticipants = participantIds.filter((uid) => uid !== sender);
      for (const uid of otherParticipants) {
        newReceiptRows.push({
          messageId: msgId,
          userId: uid,
          status: "read",
        });
      }
    }

    if (newMediaRows.length > 0) {
      await db.insert(mediaAttachments).values(newMediaRows).onConflictDoNothing();
    }
    await db.insert(messages).values(newMsgRows).onConflictDoNothing();

    for (const link of mediaLinks) {
      await db
        .update(mediaAttachments)
        .set({ messageId: link.msgId })
        .where(eq(mediaAttachments.id, link.mediaId));
    }

    await db.insert(messageReceipts).values(newReceiptRows).onConflictDoNothing();

    if (newMsgRows.length > 5) {
      await db
        .insert(messageReactions)
        .values([
          { messageId: newMsgRows[0].id, userId: participantIds[1], emoji: "🔥" },
          { messageId: newMsgRows[imageIndices[0]].id, userId: participantIds[0], emoji: "💯" },
          { messageId: newMsgRows[imageIndices[1]].id, userId: participantIds[2], emoji: "🚀" },
        ])
        .onConflictDoNothing();

      await db
        .insert(messageStars)
        .values([{ userId: participantIds[0], messageId: newMsgRows[imageIndices[0]].id }])
        .onConflictDoNothing();
    }

    await db
      .update(chatParticipants)
      .set({ lastReadAt: new Date(now) })
      .where(eq(chatParticipants.chatId, chatId));
  }

  // Group 1: Engineering & Architecture
  const group1Id = await getOrCreateGroupChat(
    "Engineering & Architecture",
    "Real-time architecture, Lexical rich-text plugins, and hybrid TanStack Query + Zustand state.",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150",
    [
      { userId: aliceId, role: "admin", pinned: true },
      { userId: bobId, role: "member", pinned: true },
      { userId: charlieId, role: "member" },
      { userId: dianaId, role: "member" },
      { userId: edwardId, role: "member" },
      { userId: fionaId, role: "member" },
    ]
  );
  await seedMessagesForGroupChat(group1Id, [aliceId, bobId, charlieId, dianaId, edwardId, fionaId], 100);

  // Group 2: Product & Design Team
  const group2Id = await getOrCreateGroupChat(
    "Product & Design Team",
    "User research, component libraries, interaction design, and design system tokens.",
    "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150",
    [
      { userId: aliceId, role: "admin" },
      { userId: bobId, role: "member" },
      { userId: georgeId, role: "member" },
      { userId: hannahId, role: "member" },
      { userId: ianId, role: "member" },
      { userId: juliaId, role: "member" },
    ]
  );
  await seedMessagesForGroupChat(group2Id, [aliceId, bobId, georgeId, hannahId, ianId, juliaId], 200);

  console.log("✅ Database successfully seeded!");
  console.log("----------------------------------------------------------------------");
  console.log("Test accounts available (Password for all: Password123!)");
  console.log("• Alice: alice@example.com (20 contacts, 10 chats [8 direct, 2 groups], 12 contacts to start new chats)");
  console.log("• Bob:   bob@example.com   (20 contacts, 10 chats [8 direct, 2 groups], 12 contacts to start new chats)");
  console.log("• Each chat contains 50+ messages with varied phrases and example image attachments.");
  console.log("----------------------------------------------------------------------");
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
