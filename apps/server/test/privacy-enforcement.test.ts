import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";
import pg from "pg";
import { registerTestUser } from "./test-helpers.js";
import { contacts, userSettings } from "../src/db/schema.js";
import { eq } from "drizzle-orm";
import type { ChatSummary, ContactSummary } from "@chat-me/shared";

describe("Privacy Enforcement Seam (Contacts, Profiles, and Group Addition)", () => {
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
      email: `alice-enf-${Date.now()}@example.com`,
      name: "Alice Enforcer",
    });
    bob = await registerTestUser(app, {
      email: `bob-enf-${Date.now()}@example.com`,
      name: "Bob Enforcer",
    });
    charlie = await registerTestUser(app, {
      email: `charlie-enf-${Date.now()}@example.com`,
      name: "Charlie Enforcer",
    });

    // Set Alice's profile info
    await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me/profile",
      headers: { authorization: `Bearer ${alice.accessToken}` },
      payload: {
        bio: "Alice secret bio",
        pictureUrl: "https://example.com/alice.png",
      },
    });

    // Set Bob's profile info
    await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me/profile",
      headers: { authorization: `Bearer ${bob.accessToken}` },
      payload: {
        bio: "Bob open bio",
        pictureUrl: "https://example.com/bob.png",
      },
    });
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  describe("Contact list profile sanitization (GET /api/v1/contacts)", () => {
    it("redacts pictureUrl and bio when viewer is outside audience", async () => {
      // Alice restricts picture to 'contacts' and bio to 'none'
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/settings",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: {
          privacyPicture: "contacts",
          privacyBio: "none",
        },
      });

      // Charlie adds Alice as a contact
      await app.db.insert(contacts).values({
        userId: charlie.userId,
        contactUserId: alice.userId,
        nickname: "Alice Contact",
      });

      // Alice has NOT added Charlie to her contacts.
      // So Charlie viewing contacts should see Alice's name, but pictureUrl="" and bio=""
      const resCharlie = await app.inject({
        method: "GET",
        url: "/api/v1/contacts",
        headers: { authorization: `Bearer ${charlie.accessToken}` },
      });

      expect(resCharlie.statusCode).toBe(200);
      const contactList = resCharlie.json() as ContactSummary[];
      const aliceEntry = contactList.find((c) => c.contactUserId === alice.userId);
      expect(aliceEntry).toBeDefined();
      expect(aliceEntry?.contact.name).toBe("Alice Enforcer");
      expect(aliceEntry?.contact.pictureUrl).toBe("");
      expect(aliceEntry?.contact.bio).toBe("");

      // Now Alice adds Charlie to her contacts
      await app.db.insert(contacts).values({
        userId: alice.userId,
        contactUserId: charlie.userId,
        nickname: "Chuck",
      });

      // Now Charlie is a contact of Alice -> pictureUrl should be revealed, but bio is 'none' so bio remains ""
      const resCharlie2 = await app.inject({
        method: "GET",
        url: "/api/v1/contacts",
        headers: { authorization: `Bearer ${charlie.accessToken}` },
      });
      const aliceEntry2 = (resCharlie2.json() as ContactSummary[]).find(
        (c) => c.contactUserId === alice.userId
      );
      expect(aliceEntry2?.contact.pictureUrl).toBe("https://example.com/alice.png");
      expect(aliceEntry2?.contact.bio).toBe("");
    });
  });

  describe("Group Addition Privacy (privacyGroups)", () => {
    it("rejects creating a group chat with 403 Forbidden if any invitee excludes actor", async () => {
      // Bob sets privacyGroups to 'none'
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/settings",
        headers: { authorization: `Bearer ${bob.accessToken}` },
        payload: {
          privacyGroups: "none",
        },
      });

      // Alice attempts to create a group chat with Bob and Charlie
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/chats",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: {
          type: "group",
          title: "Secret Society",
          participantIds: [bob.userId, charlie.userId],
        },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error).toMatch(/forbidden/i);
    });

    it("rejects adding a participant to an existing group chat with 403 Forbidden if target excludes actor", async () => {
      // Charlie allows groups from 'all'
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/settings",
        headers: { authorization: `Bearer ${charlie.accessToken}` },
        payload: {
          privacyGroups: "all",
        },
      });

      // Alice creates a group chat with Charlie
      const createRes = await app.inject({
        method: "POST",
        url: "/api/v1/chats",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: {
          type: "group",
          title: "Alice and Charlie",
          participantIds: [charlie.userId],
        },
      });

      expect(createRes.statusCode).toBe(201);
      const chat = createRes.json() as ChatSummary;

      // Bob still has privacyGroups = 'none'
      // Alice tries to add Bob to the group
      const addRes = await app.inject({
        method: "POST",
        url: `/api/v1/chats/${chat.id}/participants`,
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: {
          userIds: [bob.userId],
        },
      });

      expect(addRes.statusCode).toBe(403);
      expect(addRes.json().error).toMatch(/forbidden/i);
    });

    it("allows adding participants when their privacyGroups setting permits the actor", async () => {
      // Bob changes privacyGroups to 'all'
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/settings",
        headers: { authorization: `Bearer ${bob.accessToken}` },
        payload: {
          privacyGroups: "all",
        },
      });

      // Alice creates a group chat with Bob
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/chats",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: {
          type: "group",
          title: "Friends",
          participantIds: [bob.userId],
        },
      });

      expect(res.statusCode).toBe(201);
      const chat = res.json() as ChatSummary;
      expect(chat.participants.some((p) => p.userId === bob.userId)).toBe(true);
    });
  });

  describe("Chat Summary Participant profile sanitization", () => {
    it("redacts participant profiles according to privacy rules when fetching chats", async () => {
      // Bob sets privacyPicture to 'none' and privacyBio to 'none'
      await app.inject({
        method: "PATCH",
        url: "/api/v1/users/me/settings",
        headers: { authorization: `Bearer ${bob.accessToken}` },
        payload: {
          privacyPicture: "none",
          privacyBio: "none",
        },
      });

      // Alice creates direct chat with Bob
      const directRes = await app.inject({
        method: "POST",
        url: "/api/v1/chats",
        headers: { authorization: `Bearer ${alice.accessToken}` },
        payload: {
          type: "direct",
          targetUserId: bob.userId,
        },
      });

      expect(directRes.statusCode).toBe(200);
      const directChat = directRes.json() as ChatSummary;
      const bobParticipant = directChat.participants.find((p) => p.userId === bob.userId);
      expect(bobParticipant?.user.name).toBe("Bob Enforcer");
      expect(bobParticipant?.user.pictureUrl).toBe("");
      expect(bobParticipant?.user.bio).toBe("");

      // Bob viewing his chats sees his own picture and bio
      const bobRes = await app.inject({
        method: "GET",
        url: "/api/v1/chats",
        headers: { authorization: `Bearer ${bob.accessToken}` },
      });
      expect(bobRes.statusCode).toBe(200);
      const bobChats = bobRes.json() as ChatSummary[];
      const bobChat = bobChats.find((c) => c.id === directChat.id);
      expect(bobChat).toBeDefined();
      const bobHimself = bobChat?.participants.find((p) => p.userId === bob.userId);
      expect(bobHimself?.user.pictureUrl).toBe("https://example.com/bob.png");
      expect(bobHimself?.user.bio).toBe("Bob open bio");
    });
  });
});
