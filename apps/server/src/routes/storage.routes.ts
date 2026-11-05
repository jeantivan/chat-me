import { FastifyInstance, FastifyPluginAsync } from "fastify";
import path from "node:path";
import {
  verifyStorageSignature,
  saveLocalObject,
  readLocalObject,
} from "../services/storage.service.js";

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

export const mediaStorageRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // PUT /api/v1/media/storage/*
  app.put<{
    Params: { "*": string };
    Querystring: { exp?: string; sig?: string };
  }>("/storage/*", async (request, reply) => {
    const key = request.params["*"];
    const exp = Number(request.query.exp);
    const sig = request.query.sig;

    if (!key || !exp || !sig) {
      return reply.status(400).send({ error: "Missing required key, exp, or sig query parameters" });
    }

    if (!verifyStorageSignature(key, exp, sig)) {
      return reply.status(403).send({ error: "Forbidden: Invalid or expired upload signature" });
    }

    let buffer: Buffer;
    if (Buffer.isBuffer(request.body)) {
      buffer = request.body;
    } else if (typeof request.body === "string") {
      buffer = Buffer.from(request.body);
    } else if (request.body && typeof request.body === "object") {
      buffer = Buffer.from(JSON.stringify(request.body));
    } else {
      buffer = Buffer.alloc(0);
    }

    await saveLocalObject(key, buffer);
    return reply.status(200).send({ success: true, key });
  });

  // GET /api/v1/media/storage/*
  app.get<{
    Params: { "*": string };
  }>("/storage/*", async (request, reply) => {
    const key = request.params["*"];
    if (!key) {
      return reply.status(400).send({ error: "Missing storage key" });
    }

    const data = await readLocalObject(key);
    if (!data) {
      return reply.status(404).send({ error: "Storage object not found" });
    }

    const ext = path.extname(key).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    reply.header("Content-Type", contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(data);
  });
};
