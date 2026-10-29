import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import pg from "pg";
import { Redis } from "ioredis";
import type { HealthResponse } from "@chat-me/shared";
import { createDb } from "./db/index.js";
import { authRoutes } from "./routes/auth.routes.js";
import { usersRoutes } from "./routes/users.routes.js";
import { chatsRoutes } from "./routes/chats.routes.js";
import { contactsRoutes } from "./routes/contacts.routes.js";
import { setupSocketServer } from "./socket/index.js";

export interface AppOptions {
  databaseUrl?: string;
  redisUrl?: string;
  jwtSecret?: string;
  cookieSecret?: string;
}

export async function buildApp(opts: AppOptions = {}): Promise<FastifyInstance> {
  const app = fastify({
    logger: process.env.NODE_ENV !== "test",
  });

  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (req, body: string, done) => {
      if (!body || body.trim().length === 0) {
        return done(null, {});
      }
      try {
        const json = JSON.parse(body);
        done(null, json);
      } catch (err: any) {
        err.statusCode = 400;
        done(err, undefined);
      }
    }
  );

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(cookie, {
    secret: opts.cookieSecret || process.env.COOKIE_SECRET || "chat-me-cookie-secret-key-12345",
  });

  await app.register(jwt, {
    secret: opts.jwtSecret || process.env.JWT_SECRET || "chat-me-jwt-secret-key-super-secure-token",
  });

  const databaseUrl =
    opts.databaseUrl ||
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5434/chat_me";

  const redisUrl =
    opts.redisUrl ||
    process.env.REDIS_URL ||
    "redis://localhost:6379";

  const pgPool = new pg.Pool({
    connectionString: databaseUrl,
    max: 10,
  });

  const db = createDb(pgPool);
  app.decorate("db", db);

  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const payload = request.user as { sub?: string; type?: string };
      if (!payload || payload.type !== "access") {
        return reply.status(401).send({ error: "Invalid token type" });
      }
    } catch {
      reply.status(401).send({ error: "Unauthorized" });
    }
  });

  const redisClient = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });
  redisClient.on("error", () => {
    // Avoid unhandled rejection on lazy disconnect
  });

  app.addHook("onClose", async () => {
    await pgPool.end();
    redisClient.disconnect();
  });

  // Health check endpoint
  app.get("/health", async (): Promise<HealthResponse> => {
    let postgresOk = false;
    let redisOk = false;

    try {
      const client = await pgPool.connect();
      try {
        await client.query("SELECT 1");
        postgresOk = true;
      } finally {
        client.release();
      }
    } catch {
      postgresOk = false;
    }

    try {
      if (redisClient.status !== "ready") {
        await redisClient.connect();
      }
      await redisClient.ping();
      redisOk = true;
    } catch {
      redisOk = false;
    }

    const isHealthy = postgresOk && redisOk;

    return {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        postgres: postgresOk,
        redis: redisOk,
      },
    };
  });

  // API v1 routes
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(usersRoutes, { prefix: "/api/v1/users" });
  await app.register(chatsRoutes, { prefix: "/api/v1/chats" });
  await app.register(contactsRoutes, { prefix: "/api/v1/contacts" });

  const io = setupSocketServer(app, redisUrl);
  app.decorate("io", io);

  return app;
}
