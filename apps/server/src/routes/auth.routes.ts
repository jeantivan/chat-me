import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { users, userSettings } from "../db/schema.js";
import {
  hashPassword,
  verifyPassword,
  sendAuthResponse,
  getUserProfileAndSettings,
} from "../services/auth.service.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // POST /api/v1/auth/register
  app.post("/register", async (request, reply) => {
    const parseResult = registerSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        issues: parseResult.error.issues,
      });
    }

    const { email, password, name } = parseResult.data;

    // Check if user exists
    const [existing] = await app.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    const passwordHash = await hashPassword(password);

    const { user, settings } = await app.db.transaction(async (tx) => {
      const [createdUser] = await tx
        .insert(users)
        .values({
          email,
          passwordHash,
          name,
        })
        .returning();

      const [createdSettings] = await tx
        .insert(userSettings)
        .values({
          userId: createdUser.id,
        })
        .returning();

      return { user: createdUser, settings: createdSettings };
    });

    return sendAuthResponse(app, reply, user, settings, 201);
  });

  // POST /api/v1/auth/login
  app.post("/login", async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        issues: parseResult.error.issues,
      });
    }

    const { email, password } = parseResult.data;

    const [user] = await app.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    const isValid = await verifyPassword(user.passwordHash, password);
    if (!isValid) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    const [settings] = await app.db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, user.id))
      .limit(1);

    return sendAuthResponse(app, reply, user, settings, 200);
  });

  // POST /api/v1/auth/refresh
  app.post("/refresh", async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      return reply.status(401).send({ error: "Missing refresh token" });
    }

    let payload: { sub: string; email: string; type?: string };
    try {
      payload = app.jwt.verify(refreshToken);
    } catch {
      return reply.status(401).send({ error: "Invalid refresh token" });
    }

    if (payload.type !== "refresh") {
      return reply.status(401).send({ error: "Invalid token type" });
    }

    const [user] = await app.db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user) {
      return reply.status(401).send({ error: "User not found" });
    }

    const [settings] = await app.db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, user.id))
      .limit(1);

    return sendAuthResponse(app, reply, user, settings, 200);
  });

  // POST /api/v1/auth/logout
  app.post("/logout", async (_request, reply) => {
    reply.clearCookie("refreshToken", { path: "/" });
    return reply.status(200).send({ success: true });
  });

  // GET /api/v1/auth/me
  app.get("/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = (request.user as { sub: string }).sub;
    const profile = await getUserProfileAndSettings(app.db, userId);

    if (!profile) {
      return reply.status(404).send({ error: "User not found" });
    }

    return reply.status(200).send(profile);
  });
};
