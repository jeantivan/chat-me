import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq, and, ilike } from "drizzle-orm";
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
  app.post<{ Body: { contactUserId?: string; email?: string; nickname?: string } }>(
    "/",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const payloadSchema = z
        .object({
          contactUserId: z.string().uuid().optional(),
          email: z.string().email().optional(),
          nickname: z.string().max(100).optional(),
        })
        .refine(
          (data) =>
            (Boolean(data.contactUserId) && !data.email) ||
            (!data.contactUserId && Boolean(data.email)),
          {
            message: "Either contactUserId or email must be provided, but not both",
          }
        );

      const parseResult = payloadSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.flatten() });
      }

      const { contactUserId, email, nickname } = parseResult.data;
      const currentUserId = (request.user as { sub: string }).sub;

      let targetUserRows: Array<typeof users.$inferSelect> = [];
      if (contactUserId) {
        targetUserRows = await app.db
          .select()
          .from(users)
          .where(eq(users.id, contactUserId))
          .limit(1);
      } else if (email) {
        targetUserRows = await app.db
          .select()
          .from(users)
          .where(ilike(users.email, email.trim()))
          .limit(1);
      }

      if (targetUserRows.length === 0) {
        return reply.status(404).send({ error: "Target contact user not found" });
      }

      const target = targetUserRows[0];

      if (currentUserId === target.id) {
        return reply.status(400).send({ error: "Cannot add self as contact" });
      }

      // Bidirectional transactional insert
      const contactRow = await app.db.transaction(async (tx) => {
        await tx
          .insert(contacts)
          .values({
            userId: currentUserId,
            contactUserId: target.id,
            nickname: nickname || null,
          })
          .onConflictDoUpdate({
            target: [contacts.userId, contacts.contactUserId],
            set: { nickname: nickname || null },
          });

        await tx
          .insert(contacts)
          .values({
            userId: target.id,
            contactUserId: currentUserId,
            nickname: null,
          })
          .onConflictDoNothing();

        const [row] = await tx
          .select()
          .from(contacts)
          .where(
            and(
              eq(contacts.userId, currentUserId),
              eq(contacts.contactUserId, target.id)
            )
          )
          .limit(1);

        return row;
      });

      const rawContact = {
        id: target.id,
        email: target.email,
        name: target.name,
        bio: target.bio,
        phone: target.phone,
        pictureUrl: target.pictureUrl,
        createdAt: target.createdAt.toISOString(),
      };

      const [sanitizedContact] = await sanitizeUserProfiles(
        app.db,
        [rawContact],
        currentUserId
      );

      const summary: ContactSummary = {
        userId: contactRow.userId,
        contactUserId: contactRow.contactUserId,
        nickname: contactRow.nickname,
        createdAt: contactRow.createdAt.toISOString(),
        contact: sanitizedContact,
      };

      return reply.status(200).send(summary);
    }
  );
};
