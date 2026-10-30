import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { contacts, users } from "../db/schema.js";
import { sanitizeUserProfiles } from "../lib/privacy.js";
import type { ContactSummary } from "@chat-me/shared";

export const contactsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // GET /api/v1/contacts - List all contacts of the authenticated user
  app.get(
    "/",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const currentUserId = (request.user as { sub: string }).sub;

      const rows = await app.db
        .select({
          userId: contacts.userId,
          contactUserId: contacts.contactUserId,
          nickname: contacts.nickname,
          createdAt: contacts.createdAt,
          contactId: users.id,
          contactEmail: users.email,
          contactName: users.name,
          contactBio: users.bio,
          contactPhone: users.phone,
          contactPictureUrl: users.pictureUrl,
          contactCreatedAt: users.createdAt,
        })
        .from(contacts)
        .innerJoin(users, eq(contacts.contactUserId, users.id))
        .where(eq(contacts.userId, currentUserId));

      const rawContacts = rows.map((r) => ({
        id: r.contactId,
        email: r.contactEmail,
        name: r.contactName,
        bio: r.contactBio,
        phone: r.contactPhone,
        pictureUrl: r.contactPictureUrl,
        createdAt: r.contactCreatedAt.toISOString(),
      }));

      const sanitizedContacts = await sanitizeUserProfiles(
        app.db,
        rawContacts,
        currentUserId
      );

      const contactList: ContactSummary[] = rows.map((r, i) => ({
        userId: r.userId,
        contactUserId: r.contactUserId,
        nickname: r.nickname,
        createdAt: r.createdAt.toISOString(),
        contact: sanitizedContacts[i],
      }));

      return reply.send(contactList);
    }
  );

  // POST /api/v1/contacts - Add contact with bidirectional link
  app.post<{ Body: { contactUserId: string; nickname?: string } }>(
    "/",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const payloadSchema = z.object({
        contactUserId: z.string().uuid(),
        nickname: z.string().max(100).optional(),
      });

      const parseResult = payloadSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.flatten() });
      }

      const { contactUserId, nickname } = parseResult.data;
      const currentUserId = (request.user as { sub: string }).sub;

      if (currentUserId === contactUserId) {
        return reply.status(400).send({ error: "Cannot add self as contact" });
      }

      // Check target user exists
      const targetUser = await app.db
        .select()
        .from(users)
        .where(eq(users.id, contactUserId))
        .limit(1);

      if (targetUser.length === 0) {
        return reply.status(404).send({ error: "Target contact user not found" });
      }

      // Bidirectional insert
      await app.db
        .insert(contacts)
        .values({
          userId: currentUserId,
          contactUserId,
          nickname: nickname || null,
        })
        .onConflictDoUpdate({
          target: [contacts.userId, contacts.contactUserId],
          set: { nickname: nickname || null },
        });

      await app.db
        .insert(contacts)
        .values({
          userId: contactUserId,
          contactUserId: currentUserId,
          nickname: null,
        })
        .onConflictDoNothing();

      return reply.status(200).send({ success: true });
    }
  );
};
