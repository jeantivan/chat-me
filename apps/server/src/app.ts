import fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import pg from "pg";
import { Redis } from "ioredis";
import type { HealthResponse } from "@chat-me/shared";

export interface AppOptions {
  databaseUrl?: string;
  redisUrl?: string;
}

export async function buildApp(opts: AppOptions = {}): Promise<FastifyInstance> {
  const app = fastify({
    logger: process.env.NODE_ENV !== "test",
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
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

  const redisClient = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
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

  return app;
}
