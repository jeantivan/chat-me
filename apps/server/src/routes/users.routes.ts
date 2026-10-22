import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { getUserProfileAndSettings } from "../services/auth.service.js";

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
};
