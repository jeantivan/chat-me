import { describe, it, expect, beforeAll, afterAll } from "vitest";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, blockedUsers } from "../src/db/schema.js";
import { migrateDb } from "../src/db/migrate.js";
import { eq, and } from "drizzle-orm";

describe("Blocked Users Schema & Migrations Seam", () => {
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

  it("creates a directional blocked user relationship with default created_at", async () => {
    const timestamp = Date.now();
    const [userA] = await db
      .insert(users)
      .values({
        email: `blocker-${timestamp}@example.com`,
        passwordHash: "hash",
        name: "User A",
      })
      .returning();

    const [userB] = await db
      .insert(users)
      .values({
        email: `blocked-${timestamp}@example.com`,
        passwordHash: "hash",
        name: "User B",
      })
      .returning();

    const [blockRow] = await db
      .insert(blockedUsers)
      .values({
        blockerId: userA.id,
        blockedId: userB.id,
      })
      .returning();

    expect(blockRow).toBeDefined();
    expect(blockRow.blockerId).toBe(userA.id);
    expect(blockRow.blockedId).toBe(userB.id);
    expect(blockRow.createdAt).toBeInstanceOf(Date);

    // Clean up
    await db.delete(users).where(eq(users.id, userA.id));
    await db.delete(users).where(eq(users.id, userB.id));
  });

  it("enforces check constraint blocker_id <> blocked_id", async () => {
    const timestamp = Date.now();
    const [user] = await db
      .insert(users)
      .values({
        email: `selfblock-${timestamp}@example.com`,
        passwordHash: "hash",
        name: "Self Blocker",
      })
      .returning();

    await expect(
      db.insert(blockedUsers).values({
        blockerId: user.id,
        blockedId: user.id,
      })
    ).rejects.toThrow();

    await db.delete(users).where(eq(users.id, user.id));
  });

  it("enforces composite primary key on (blocker_id, blocked_id)", async () => {
    const timestamp = Date.now();
    const [userA] = await db
      .insert(users)
      .values({
        email: `pk-a-${timestamp}@example.com`,
        passwordHash: "hash",
        name: "PK User A",
      })
      .returning();

    const [userB] = await db
      .insert(users)
      .values({
        email: `pk-b-${timestamp}@example.com`,
        passwordHash: "hash",
        name: "PK User B",
      })
      .returning();

    await db.insert(blockedUsers).values({
      blockerId: userA.id,
      blockedId: userB.id,
    });

    // Attempting duplicate insert should fail
    await expect(
      db.insert(blockedUsers).values({
        blockerId: userA.id,
        blockedId: userB.id,
      })
    ).rejects.toThrow();

    await db.delete(users).where(eq(users.id, userA.id));
    await db.delete(users).where(eq(users.id, userB.id));
  });

  it("cascades deletion when blocker or blocked user is deleted", async () => {
    const timestamp = Date.now();
    const [userA] = await db
      .insert(users)
      .values({
        email: `del-a-${timestamp}@example.com`,
        passwordHash: "hash",
        name: "Del User A",
      })
      .returning();

    const [userB] = await db
      .insert(users)
      .values({
        email: `del-b-${timestamp}@example.com`,
        passwordHash: "hash",
        name: "Del User B",
      })
      .returning();

    await db.insert(blockedUsers).values({
      blockerId: userA.id,
      blockedId: userB.id,
    });

    // Delete blocker
    await db.delete(users).where(eq(users.id, userA.id));

    const remainingAfterBlocker = await db
      .select()
      .from(blockedUsers)
      .where(and(eq(blockedUsers.blockerId, userA.id), eq(blockedUsers.blockedId, userB.id)));
    expect(remainingAfterBlocker.length).toBe(0);

    // Now test deletion of blocked user
    const [userC] = await db
      .insert(users)
      .values({
        email: `del-c-${timestamp}@example.com`,
        passwordHash: "hash",
        name: "Del User C",
      })
      .returning();

    await db.insert(blockedUsers).values({
      blockerId: userC.id,
      blockedId: userB.id,
    });

    await db.delete(users).where(eq(users.id, userB.id));

    const remainingAfterBlocked = await db
      .select()
      .from(blockedUsers)
      .where(and(eq(blockedUsers.blockerId, userC.id), eq(blockedUsers.blockedId, userB.id)));
    expect(remainingAfterBlocked.length).toBe(0);

    await db.delete(users).where(eq(users.id, userC.id));
  });
});
