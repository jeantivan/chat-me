import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import pg from "pg";
import { registerTestUser } from "./test-helpers.js";
import {
  canViewerAccess,
  canViewPresence,
  sanitizeUserProfile,
  canAddToGroup,
} from "../src/lib/privacy.js";
import { contacts, userSettings } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

describe("Privacy Evaluation & Audience Seam", () => {
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
      email: `alice-${Date.now()}@example.com`,
      name: "Alice",
    });
    bob = await registerTestUser(app, {
      email: `bob-${Date.now()}@example.com`,
      name: "Bob",
    });
    charlie = await registerTestUser(app, {
      email: `charlie-${Date.now()}@example.com`,
      name: "Charlie",
    });

    // Alice adds Bob to her contacts, but Bob does NOT add Alice.
    await app.db.insert(contacts).values({
      userId: alice.userId,
      contactUserId: bob.userId,
      nickname: "Bobby",
    });
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  describe("canViewerAccess (unidirectional audience)", () => {
    it("owner always has access to their own data", async () => {
      expect(await canViewerAccess(app.db, alice.userId, alice.userId, "none")).toBe(true);
      expect(await canViewerAccess(app.db, alice.userId, alice.userId, "contacts")).toBe(true);
      expect(await canViewerAccess(app.db, alice.userId, alice.userId, "all")).toBe(true);
    });

    it("audience 'all' allows anyone", async () => {
      expect(await canViewerAccess(app.db, alice.userId, bob.userId, "all")).toBe(true);
      expect(await canViewerAccess(app.db, alice.userId, charlie.userId, "all")).toBe(true);
    });

    it("audience 'none' allows nobody except owner", async () => {
      expect(await canViewerAccess(app.db, alice.userId, bob.userId, "none")).toBe(false);
      expect(await canViewerAccess(app.db, alice.userId, charlie.userId, "none")).toBe(false);
    });

    it("audience 'contacts' evaluates unidirectionally based on owner's contacts table", async () => {
      // Alice has Bob in her contacts -> Bob qualifies as contact of Alice
      expect(await canViewerAccess(app.db, alice.userId, bob.userId, "contacts")).toBe(true);

      // Alice does not have Charlie in her contacts -> Charlie does not qualify
      expect(await canViewerAccess(app.db, alice.userId, charlie.userId, "contacts")).toBe(false);

      // Bob does NOT have Alice in his contacts -> Alice does NOT qualify as contact of Bob
      expect(await canViewerAccess(app.db, bob.userId, alice.userId, "contacts")).toBe(false);
    });
  });

  describe("canViewPresence (strict reciprocity)", () => {
    it("allows presence visibility when both have privacyLastSeen='all'", async () => {
      // Both default to 'all'
      expect(await canViewPresence(app.db, alice.userId, bob.userId)).toBe(true);
      expect(await canViewPresence(app.db, bob.userId, alice.userId)).toBe(true);
    });

    it("denies presence visibility if either target or viewer has privacyLastSeen='none'", async () => {
      // Alice sets privacyLastSeen to 'none'
      await app.db
        .update(userSettings)
        .set({ privacyLastSeen: "none" })
        .where(eq(userSettings.userId, alice.userId));

      // Bob cannot see Alice's presence
      expect(await canViewPresence(app.db, alice.userId, bob.userId)).toBe(false);
      // Alice cannot see Bob's presence either (reciprocity!)
      expect(await canViewPresence(app.db, bob.userId, alice.userId)).toBe(false);
    });

    it("evaluates presence reciprocity with 'contacts' audience", async () => {
      // Alice sets privacyLastSeen to 'contacts' (Alice has Bob in her contacts)
      await app.db
        .update(userSettings)
        .set({ privacyLastSeen: "contacts" })
        .where(eq(userSettings.userId, alice.userId));

      // Bob has privacyLastSeen = 'all'
      await app.db
        .update(userSettings)
        .set({ privacyLastSeen: "all" })
        .where(eq(userSettings.userId, bob.userId));

      // Alice permits Bob (Alice has Bob in contacts) AND Bob permits Alice (Bob has 'all')
      expect(await canViewPresence(app.db, alice.userId, bob.userId)).toBe(true);
      expect(await canViewPresence(app.db, bob.userId, alice.userId)).toBe(true);

      // Now Bob changes privacyLastSeen to 'contacts'
      // Bob does NOT have Alice in contacts -> Bob's privacyLastSeen does not permit Alice
      await app.db
        .update(userSettings)
        .set({ privacyLastSeen: "contacts" })
        .where(eq(userSettings.userId, bob.userId));

      // Neither can see the other because reciprocity fails from Bob's side
      expect(await canViewPresence(app.db, alice.userId, bob.userId)).toBe(false);
      expect(await canViewPresence(app.db, bob.userId, alice.userId)).toBe(false);
    });
  });

  describe("Profile Sanitization", () => {
    it("redacts pictureUrl and bio when viewer is outside audience, keeping name visible", async () => {
      await app.db
        .update(userSettings)
        .set({
          privacyPicture: "none",
          privacyBio: "contacts",
        })
        .where(eq(userSettings.userId, alice.userId));

      const aliceProfile = {
        id: alice.userId,
        email: "alice@example.com",
        name: "Alice Wonderland",
        bio: "Curiouser and curiouser",
        pictureUrl: "https://example.com/alice.jpg",
        createdAt: new Date().toISOString(),
      };

      // Charlie is outside both audiences
      const sanitizedForCharlie = await sanitizeUserProfile(app.db, aliceProfile, charlie.userId);
      expect(sanitizedForCharlie.name).toBe("Alice Wonderland");
      expect(sanitizedForCharlie.pictureUrl).toBe("");
      expect(sanitizedForCharlie.bio).toBe("");

      // Bob is in contacts -> can see bio, but picture is 'none'
      const sanitizedForBob = await sanitizeUserProfile(app.db, aliceProfile, bob.userId);
      expect(sanitizedForBob.name).toBe("Alice Wonderland");
      expect(sanitizedForBob.pictureUrl).toBe("");
      expect(sanitizedForBob.bio).toBe("Curiouser and curiouser");

      // Alice herself sees full profile
      const sanitizedForAlice = await sanitizeUserProfile(app.db, aliceProfile, alice.userId);
      expect(sanitizedForAlice.pictureUrl).toBe("https://example.com/alice.jpg");
      expect(sanitizedForAlice.bio).toBe("Curiouser and curiouser");
    });
  });

  describe("canAddToGroup (privacyGroups)", () => {
    it("rejects group invitation if target user excludes actor", async () => {
      // Alice has privacyGroups = 'contacts' (Alice has Bob, but not Charlie)
      await app.db
        .update(userSettings)
        .set({ privacyGroups: "contacts" })
        .where(eq(userSettings.userId, alice.userId));

      expect(await canAddToGroup(app.db, alice.userId, bob.userId)).toBe(true);
      expect(await canAddToGroup(app.db, alice.userId, charlie.userId)).toBe(false);

      // If Alice sets privacyGroups = 'none', nobody can add Alice
      await app.db
        .update(userSettings)
        .set({ privacyGroups: "none" })
        .where(eq(userSettings.userId, alice.userId));

      expect(await canAddToGroup(app.db, alice.userId, bob.userId)).toBe(false);
      expect(await canAddToGroup(app.db, alice.userId, charlie.userId)).toBe(false);
    });
  });
});
