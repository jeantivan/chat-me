import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import pg from "pg";
import { registerTestUser } from "./test-helpers.js";
import {
  isBlockActiveBetween,
  hasUserBlocked,
  canViewPresence,
  sanitizeUserProfile,
  sanitizeUserProfiles,
  canAddToGroup,
  assertGroupAdditionAllowed,
} from "../src/lib/privacy.js";
import { blockedUsers, userSettings } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

describe("Privacy Block Isolation Seam (Unit & Lib)", () => {
  let app: FastifyInstance;
  let pool: pg.Pool;

  let alice: { userId: string; accessToken: string };
  let bob: { userId: string; accessToken: string };
  let charlie: { userId: string; accessToken: string };

  const databaseUrl =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5434/chat_me";

  beforeAll(async () => {
    app = await buildApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    pool = new pg.Pool({ connectionString: databaseUrl });

    alice = await registerTestUser(app, {
      email: `block-lib-alice-${Date.now()}@example.com`,
      name: "Alice",
    });
    bob = await registerTestUser(app, {
      email: `block-lib-bob-${Date.now()}@example.com`,
      name: "Bob",
    });
    charlie = await registerTestUser(app, {
      email: `block-lib-charlie-${Date.now()}@example.com`,
      name: "Charlie",
    });
  });

  afterEach(async () => {
    await app.db.delete(blockedUsers);
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it("evaluates hasUserBlocked and isBlockActiveBetween correctly", async () => {
    expect(await isBlockActiveBetween(app.db, alice.userId, bob.userId)).toBe(false);
    expect(await hasUserBlocked(app.db, alice.userId, bob.userId)).toBe(false);
    expect(await hasUserBlocked(app.db, bob.userId, alice.userId)).toBe(false);

    // Alice blocks Bob
    await app.db.insert(blockedUsers).values({
      blockerId: alice.userId,
      blockedId: bob.userId,
    });

    expect(await hasUserBlocked(app.db, alice.userId, bob.userId)).toBe(true);
    expect(await hasUserBlocked(app.db, bob.userId, alice.userId)).toBe(false);

    // Bidirectional check returns true for either order
    expect(await isBlockActiveBetween(app.db, alice.userId, bob.userId)).toBe(true);
    expect(await isBlockActiveBetween(app.db, bob.userId, alice.userId)).toBe(true);

    // Charlie is unblocked
    expect(await isBlockActiveBetween(app.db, alice.userId, charlie.userId)).toBe(false);

    // Clean up
    await app.db.delete(blockedUsers).where(eq(blockedUsers.blockerId, alice.userId));
  });

  it("canViewPresence hides mutual presence when block exists in either direction", async () => {
    // Both Alice and Bob have privacyLastSeen = "all"
    await app.db
      .update(userSettings)
      .set({ privacyLastSeen: "all" })
      .where(eq(userSettings.userId, alice.userId));
    await app.db
      .update(userSettings)
      .set({ privacyLastSeen: "all" })
      .where(eq(userSettings.userId, bob.userId));

    expect(await canViewPresence(app.db, alice.userId, bob.userId)).toBe(true);
    expect(await canViewPresence(app.db, bob.userId, alice.userId)).toBe(true);

    // Alice blocks Bob
    await app.db.insert(blockedUsers).values({
      blockerId: alice.userId,
      blockedId: bob.userId,
    });

    // Both directions should now return false
    expect(await canViewPresence(app.db, alice.userId, bob.userId)).toBe(false);
    expect(await canViewPresence(app.db, bob.userId, alice.userId)).toBe(false);

    // Clean up
    await app.db.delete(blockedUsers).where(eq(blockedUsers.blockerId, alice.userId));
  });

  it("sanitizeUserProfile redacts pictureUrl and bio when a block exists in either direction", async () => {
    const bobProfile = {
      id: bob.userId,
      email: "bob@example.com",
      name: "Bob Builder",
      bio: "Can we fix it?",
      pictureUrl: "https://example.com/bob.jpg",
      createdAt: new Date().toISOString(),
    };

    // Before block: Alice can see Bob's picture and bio (default 'all')
    const beforeBlock = await sanitizeUserProfile(app.db, bobProfile, alice.userId);
    expect(beforeBlock.pictureUrl).toBe("https://example.com/bob.jpg");
    expect(beforeBlock.bio).toBe("Can we fix it?");

    // Bob blocks Alice
    await app.db.insert(blockedUsers).values({
      blockerId: bob.userId,
      blockedId: alice.userId,
    });

    // Sanitized for Alice: pictureUrl and bio are empty string, name intact
    const sanitizedForAlice = await sanitizeUserProfile(app.db, bobProfile, alice.userId);
    expect(sanitizedForAlice.name).toBe("Bob Builder");
    expect(sanitizedForAlice.pictureUrl).toBe("");
    expect(sanitizedForAlice.bio).toBe("");

    // Batch version also redacts
    const batchSanitized = await sanitizeUserProfiles(app.db, [bobProfile], alice.userId);
    expect(batchSanitized[0].pictureUrl).toBe("");
    expect(batchSanitized[0].bio).toBe("");

    // Bob viewing his own profile is never redacted
    const bobOwnProfile = await sanitizeUserProfile(app.db, bobProfile, bob.userId);
    expect(bobOwnProfile.pictureUrl).toBe("https://example.com/bob.jpg");
    expect(bobOwnProfile.bio).toBe("Can we fix it?");

    // Clean up
    await app.db.delete(blockedUsers).where(eq(blockedUsers.blockerId, bob.userId));
  });

  it("canAddToGroup rejects adding a user who blocked the actor", async () => {
    // By default, privacyGroups = 'all'
    expect(await canAddToGroup(app.db, bob.userId, alice.userId)).toBe(true);

    // Bob blocks Alice
    await app.db.insert(blockedUsers).values({
      blockerId: bob.userId,
      blockedId: alice.userId,
    });

    // Alice tries to add Bob -> rejected
    expect(await canAddToGroup(app.db, bob.userId, alice.userId)).toBe(false);

    const assertRes = await assertGroupAdditionAllowed(app.db, [bob.userId], alice.userId);
    expect(assertRes.allowed).toBe(false);

    // Clean up
    await app.db.delete(blockedUsers).where(eq(blockedUsers.blockerId, bob.userId));
  });
});
