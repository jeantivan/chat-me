import { describe, it, expect, beforeAll, afterAll } from "vitest";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, chats, messages, mediaAttachments } from "../src/db/schema.js";
import { migrateDb } from "../src/db/migrate.js";
import { eq } from "drizzle-orm";

describe("Database Schema & Relational Integrity Seam (Media Attachments)", () => {
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

  it("inserts a media attachment with full metadata and defaults status to pending", async () => {
    const [user] = await db
      .insert(users)
      .values({
        email: `media-user-${Date.now()}@example.com`,
        name: "Media Uploader",
      })
      .returning();

    const [chat] = await db
      .insert(chats)
      .values({
        type: "direct",
      })
      .returning();

    const storageKey = `chats/${chat.id}/test-media-${Date.now()}/image.webp`;
    const [attachment] = await db
      .insert(mediaAttachments)
      .values({
        chatId: chat.id,
        uploaderId: user.id,
        type: "image",
        url: `http://localhost:9000/chat-media/${storageKey}`,
        storageKey,
        blurhash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
        orientation: "landscape",
        duration: null,
        width: 1920,
        height: 1080,
        sizeBytes: 102400,
        mimeType: "image/webp",
      })
      .returning();

    expect(attachment).toBeDefined();
    expect(attachment.id).toBeDefined();
    expect(attachment.status).toBe("pending");
    expect(attachment.orientation).toBe("landscape");
    expect(attachment.width).toBe(1920);
    expect(attachment.height).toBe(1080);
    expect(attachment.blurhash).toBe("LEHV6nWB2yk8pyo0adR*.7kCMdnj");
    expect(attachment.createdAt).toBeInstanceOf(Date);

    // Clean up
    await db.delete(chats).where(eq(chats.id, chat.id));
    await db.delete(users).where(eq(users.id, user.id));
  });

  it("links message with mediaId and cascades deletion cleanly", async () => {
    const [user] = await db
      .insert(users)
      .values({
        email: `media-cascade-${Date.now()}@example.com`,
        name: "Cascade User",
      })
      .returning();

    const [chat] = await db
      .insert(chats)
      .values({
        type: "direct",
      })
      .returning();

    const storageKey = `chats/${chat.id}/cascade-${Date.now()}/video.mp4`;
    const [attachment] = await db
      .insert(mediaAttachments)
      .values({
        chatId: chat.id,
        uploaderId: user.id,
        type: "video",
        url: `http://localhost:9000/chat-media/${storageKey}`,
        storageKey,
        orientation: "landscape",
        duration: 12000,
        width: 1280,
        height: 720,
        sizeBytes: 5242880,
        mimeType: "video/mp4",
      })
      .returning();

    const messageId = crypto.randomUUID();
    const [msg] = await db
      .insert(messages)
      .values({
        id: messageId,
        chatId: chat.id,
        senderId: user.id,
        body: "Check out this video",
        mediaId: attachment.id,
      })
      .returning();

    expect(msg.mediaId).toBe(attachment.id);

    // Update attachment status to attached and link messageId
    await db
      .update(mediaAttachments)
      .set({
        messageId: msg.id,
        status: "attached",
      })
      .where(eq(mediaAttachments.id, attachment.id));

    const [updatedAttachment] = await db
      .select()
      .from(mediaAttachments)
      .where(eq(mediaAttachments.id, attachment.id));

    expect(updatedAttachment.messageId).toBe(msg.id);
    expect(updatedAttachment.status).toBe("attached");

    // Deleting chat should cascade delete media attachments and messages
    await db.delete(chats).where(eq(chats.id, chat.id));

    const remainingAttachments = await db
      .select()
      .from(mediaAttachments)
      .where(eq(mediaAttachments.id, attachment.id));
    expect(remainingAttachments.length).toBe(0);

    await db.delete(users).where(eq(users.id, user.id));
  });
});
