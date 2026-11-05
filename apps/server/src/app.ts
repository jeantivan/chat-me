import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import fastifyStatic from "@fastify/static";
import pg from "pg";
import { Redis } from "ioredis";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { HealthResponse } from "@chat-me/shared";
import { createDb } from "./db/index.js";
import { authRoutes } from "./routes/auth.routes.js";
import { usersRoutes } from "./routes/users.routes.js";
import { chatsRoutes } from "./routes/chats.routes.js";
import { contactsRoutes } from "./routes/contacts.routes.js";
import { mediaStorageRoutes } from "./routes/storage.routes.js";
import { setupSocketServer } from "./socket/index.js";
import type { DemoAutoReplyDelays } from "./socket/demo-responder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AppOptions {
  databaseUrl?: string;
  redisUrl?: string;
  jwtSecret?: string;
  cookieSecret?: string;
  enableDemoAutoReply?: boolean;
  demoAutoReplyDelays?: Partial<DemoAutoReplyDelays>;
  serveStaticWeb?: boolean;
  staticWebDir?: string;
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

  // Content parser for raw uploads (PUT /api/v1/media/storage/*)
  const binaryContentTypes = [
    "application/octet-stream",
    "application/pdf",
    /^image\/.+/,
    /^video\/.+/,
    /^audio\/.+/,
    /^text\/.+/,
  ];
  for (const ct of binaryContentTypes) {
    app.addContentTypeParser(
      ct,
      { parseAs: "buffer" },
      (req, body, done) => {
        done(null, body);
      }
    );
  }

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

  const rawRedisUrl = opts.redisUrl !== undefined ? opts.redisUrl : process.env.REDIS_URL;
  const isRedisEnabled = rawRedisUrl !== undefined && rawRedisUrl !== "" && rawRedisUrl !== "none";
  const redisUrl = isRedisEnabled ? rawRedisUrl : undefined;

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

  let redisClient: Redis | null = null;
  if (isRedisEnabled && redisUrl) {
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
    redisClient.on("error", () => {
      // Avoid unhandled rejection on lazy disconnect
    });
  }

  app.addHook("onClose", async () => {
    await pgPool.end();
    if (redisClient) {
      redisClient.disconnect();
    }
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

    if (!isRedisEnabled || !redisClient) {
      // Single-node mode without Redis cluster: reports true / healthy
      redisOk = true;
    } else {
      try {
        if (redisClient.status !== "ready") {
          await redisClient.connect();
        }
        await redisClient.ping();
        redisOk = true;
      } catch {
        redisOk = false;
      }
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
  await app.register(mediaStorageRoutes, { prefix: "/api/v1/media" });

  const io = setupSocketServer(app, redisUrl, {
    enableDemoAutoReply: opts.enableDemoAutoReply,
    demoAutoReplyDelays: opts.demoAutoReplyDelays,
  });
  app.decorate("io", io);

  // Static web SPA hosting fallback
  const shouldServeStatic =
    opts.serveStaticWeb !== undefined
      ? opts.serveStaticWeb
      : process.env.SERVE_STATIC_WEB === "true" ||
        (process.env.NODE_ENV === "production" && process.env.SERVE_STATIC_WEB !== "false");

  const staticDir =
    opts.staticWebDir ||
    process.env.STATIC_WEB_DIR ||
    path.resolve(__dirname, "../../web/dist");

  if (shouldServeStatic && fs.existsSync(staticDir)) {
    await app.register(fastifyStatic, {
      root: staticDir,
      wildcard: false,
      preCompressed: false,
    });

    app.setNotFoundHandler(async (request, reply) => {
      if (request.raw.url && request.raw.url.startsWith("/api/")) {
        return reply.status(404).send({ error: "Not Found" });
      }

      const indexPath = path.join(staticDir, "index.html");
      if (fs.existsSync(indexPath)) {
        return reply.type("text/html").sendFile("index.html");
      }
      return reply.status(404).send({ error: "Not Found" });
    });
  }

  return app;
}
