import "fastify";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../db/schema.js";

declare module "fastify" {
  interface FastifyInstance {
    db: NodePgDatabase<typeof schema>;
    authenticate: (
      request: import("fastify").FastifyRequest,
      reply: import("fastify").FastifyReply
    ) => Promise<void>;
    io: import("socket.io").Server<
      import("@chat-me/shared").ClientToServerEvents,
      import("@chat-me/shared").ServerToClientEvents,
      Record<string, never>,
      { userId: string }
    >;
  }
}
