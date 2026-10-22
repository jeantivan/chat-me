import { describe, it, expect, beforeAll, afterAll } from "vitest";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, userSettings } from "../src/db/schema.js";
import { migrateDb } from "../src/db/migrate.js";
import { eq } from "drizzle-orm";

describe("Database Schema & Migrations Seam", () => {
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

  it("creates a user with default fields and allows querying it", async () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const [insertedUser] = await db
      .insert(users)
      .values({
        email: testEmail,
        passwordHash: "argon2_test_hash",
        name: "Test User",
      })
      .returning();

    expect(insertedUser).toBeDefined();
    expect(insertedUser.id).toBeDefined();
    expect(insertedUser.email).toBe(testEmail);
    expect(insertedUser.name).toBe("Test User");
    expect(insertedUser.bio).toBe("");
    expect(insertedUser.pictureUrl).toBe("");
    expect(insertedUser.createdAt).toBeInstanceOf(Date);
    expect(insertedUser.updatedAt).toBeInstanceOf(Date);

    // Clean up
    await db.delete(users).where(eq(users.id, insertedUser.id));
  });

  it("enforces email uniqueness on users table", async () => {
    const duplicateEmail = `dup-${Date.now()}@example.com`;
    const [user1] = await db
      .insert(users)
      .values({
        email: duplicateEmail,
        passwordHash: "hash1",
        name: "User One",
      })
      .returning();

    await expect(
      db.insert(users).values({
        email: duplicateEmail,
        passwordHash: "hash2",
        name: "User Two",
      })
    ).rejects.toThrow();

    await db.delete(users).where(eq(users.id, user1.id));
  });

  it("cascades deletion from users to user_settings", async () => {
    const testEmail = `cascade-${Date.now()}@example.com`;
    const [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        passwordHash: "hash",
        name: "Cascade User",
      })
      .returning();

    const [settings] = await db
      .insert(userSettings)
      .values({
        userId: user.id,
      })
      .returning();

    expect(settings.userId).toBe(user.id);
    expect(settings.themeMode).toBe("light");
    expect(settings.themeColor).toBe("slate-indigo");
    expect(settings.notifyAll).toBe(true);

    // Delete user
    await db.delete(users).where(eq(users.id, user.id));

    // Check user_settings is gone
    const remaining = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, user.id));
    expect(remaining.length).toBe(0);
  });
});
