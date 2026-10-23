import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { getUserProfileAndSettings } from "../services/auth.service.js";
import { isUserOnline } from "../socket/index.js";
import { users } from "../db/schema.js";
import type { UserPresence } from "@chat-me/shared";

export const usersRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // GET /api/v1/users/me
  app.get("/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const profile = await getUserProfileAndSettings(app.db, userId);

    if (!profile) {
      return reply.status(404).send({ error: "User not found" });
    }

    return reply.status(200).send(profile);
  });

  // GET /api/v1/users/:id/presence
  app.get<{ Params: { id: string } }>(
    "/:id/presence",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const targetUserId = request.params.id;
      const targetUser = await app.db
        .select()
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (targetUser.length === 0) {
        return reply.status(404).send({ error: "User not found" });
      }

      const online = isUserOnline(targetUserId);
      const response: UserPresence = {
        userId: targetUserId,
        status: online ? "online" : "offline",
        lastSeenAt: targetUser[0].updatedAt.toISOString(),
      };

      return reply.status(200).send(response);
    }
  );
};
