import type { MediaPayload, MediaType, MediaOrientation } from "@chat-me/shared";
import type { MediaAttachment } from "../db/schema.js";

export function toMediaPayload(row: MediaAttachment): MediaPayload {
  const filename = row.storageKey ? row.storageKey.split("/").pop() ?? "file" : "file";
  return {
    id: row.id,
    type: row.type as MediaType,
    src: row.url,
    orientation: (row.orientation || "square") as MediaOrientation,
    duration: row.duration ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    blurhash: row.blurhash ?? null,
    filename,
    sizeBytes: Number(row.sizeBytes),
    mimeType: row.mimeType,
    createdAt: (row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)).toISOString(),
  };
}
