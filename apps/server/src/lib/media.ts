import type { MediaPayload, MediaType, MediaOrientation } from "@chat-me/shared";
import type { MediaAttachment } from "../db/schema.js";

export function toMediaPayload(row: MediaAttachment): MediaPayload {
  return {
    id: row.id,
    type: row.type as MediaType,
    src: row.url,
    orientation: (row.orientation || "square") as MediaOrientation,
    duration: row.duration ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    blurhash: row.blurhash ?? null,
  };
}
