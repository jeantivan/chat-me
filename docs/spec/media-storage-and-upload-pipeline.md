# Media Storage & Upload Pipeline Specification

Specification for media asset storage, direct-to-object-storage uploads, client metadata extraction, and real-time integration for `chat-me`.

---

## 1. Architecture Overview

```
┌──────────────┐     1. Request Presigned URL (REST JSON)      ┌────────────────┐
│              ├──────────────────────────────────────────────>│                │
│              │<──────────────────────────────────────────────┤ Fastify Server │
│              │     2. Return Presigned PUT URL + mediaId     │ (Node.js)      │
│              │                                               └────────────────┘
│ Client (Vite │     3. Direct Binary PUT (with progress)       ┌────────────────┐
│  React SPA)  ├──────────────────────────────────────────────>│ Object Storage  │
│              │                                               │ (R2 / MinIO)   │
│              │     4. message:send (Socket.IO + mediaId)     │                │
│              ├──────────────────────────────────────────────>│                │
│              │<──────────────────────────────────────────────┤                │
└──────────────┘     5. message:new broadcast to participants   └────────────────┘
```

### Storage Providers
- **Production**: Cloudflare R2 (S3-compatible API, **$0 egress fees**, custom domain with Cloudflare edge caching).
- **Local Development & CI**: MinIO container (`minio/minio:latest`) running via Docker Compose (`http://localhost:9000`), ensuring 100% S3 API fidelity offline without cloud credentials.

---

## 2. Updated Database Schema: `media_attachments`

To support client-side previews, blur placeholders, and upload tracking, `media_attachments` is extended:

```sql
CREATE TABLE media_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- NULL while pending upload
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(15) NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document')),
    url TEXT NOT NULL,                          -- Public CDN / storage URL
    storage_key TEXT NOT NULL UNIQUE,           -- Internal S3 key: chats/{chatId}/{mediaId}/{filename}
    blurhash VARCHAR(64),                       -- Compact client-computed visual placeholder
    orientation VARCHAR(10) CHECK (orientation IN ('square', 'landscape', 'portrait')),
    duration INTEGER,                           -- In milliseconds for video/audio; NULL for images/docs
    width INTEGER,                              -- Native pixel width
    height INTEGER,                             -- Native pixel height
    size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'attached', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_message ON media_attachments(message_id);
CREATE INDEX idx_media_chat ON media_attachments(chat_id);
CREATE INDEX idx_media_pending ON media_attachments(status, created_at) WHERE status = 'pending';
```

---

## 3. Presign REST API Specification

### Endpoint
`POST /api/v1/chats/:chatId/media/presign`

**Authentication**: Bearer JWT (Session token in Authorization header or cookie).

### Request Payload
```typescript
export interface PresignMediaRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  type: "image" | "video" | "audio" | "document";
  orientation?: "square" | "landscape" | "portrait";
  duration?: number | null; // in milliseconds
  width?: number;
  height?: number;
  blurhash?: string;
}
```

### Validation & Limits
- **Participant Authorization**: Verify caller is an active member in `chat_participants` for `:chatId`.
- **MIME Whitelist & Size Caps**:
  | Media Category | Allowed MIME Types | Max Size |
  | :--- | :--- | :--- |
  | **Image** | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | 15 MB |
  | **Audio** | `audio/webm`, `audio/ogg`, `audio/mp4`, `audio/mpeg` | 25 MB |
  | **Video** | `video/mp4`, `video/webm` | 100 MB |
  | **Document** | `application/pdf`, `application/zip`, `application/vnd.openxmlformats-officedocument.*`, `text/plain` | 50 MB |

### Server Processing
1. Validate inputs and chat membership.
2. Generate `mediaId = gen_random_uuid()`.
3. Construct sanitized storage key: `chats/${chatId}/${mediaId}/${sanitize(filename)}`.
4. Generate signed PUT URL using `@aws-sdk/s3-request-presigner` (`PutObjectCommand`):
   - Expiration: 900 seconds (15 minutes).
   - Sign headers: `Content-Type: mimeType`, `Content-Length: sizeBytes`.
5. Persist record in `media_attachments` with `status: 'pending'`, `message_id: NULL`.
6. Return presigned upload response.

### Response Payload
```json
{
  "mediaId": "4a3b2c1d-0000-4000-8000-123456789abc",
  "uploadUrl": "https://media.chat-me.com/chats/550e8400.../photo.webp?X-Amz-Signature=...",
  "publicUrl": "https://media.chat-me.com/chats/550e8400.../photo.webp",
  "expiresAt": "2026-10-18T11:15:00.000Z"
}
```

---

## 4. Client Upload & Lifecycle State Machine

```
[User Selects File]
         │
         ▼
[Extract Metadata & Blurhash] ──> [Stage Optimistic Message (status: 'idle', local blob preview)]
         │
         ▼
[POST /presign]
         │
         ▼
[Direct HTTP PUT to R2 / MinIO] ──> [Update Progress Ring (0-100%)]
         │
         ▼
[Socket.IO message:send (mediaId)]
         │
         ▼
[Server ACK callback] ──> [Transition to status: 'send', swap local blob with publicUrl]
```

### Step 1: Client Metadata & Preview Extraction
Prior to uploading, the client extracts visual and temporal metadata without server intervention:
```typescript
export async function extractMediaMetadata(file: File): Promise<{
  width?: number;
  height?: number;
  orientation?: "square" | "landscape" | "portrait";
  duration?: number | null;
  blurhash?: string;
  localPreviewUrl: string;
}> {
  const localPreviewUrl = URL.createObjectURL(file);

  if (file.type.startsWith("image/")) {
    const img = await loadImage(localPreviewUrl);
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const ratio = width / height;
    const orientation = ratio >= 0.95 && ratio <= 1.05 ? "square" : ratio > 1.05 ? "landscape" : "portrait";
    const blurhash = await generateBlurhash(img);
    return { width, height, orientation, duration: null, blurhash, localPreviewUrl };
  }

  if (file.type.startsWith("video/")) {
    const video = await loadVideo(localPreviewUrl);
    const width = video.videoWidth;
    const height = video.videoHeight;
    const ratio = width / height;
    const orientation = ratio >= 0.95 && ratio <= 1.05 ? "square" : ratio > 1.05 ? "landscape" : "portrait";
    const duration = Math.round(video.duration * 1000);
    const blurhash = await captureVideoPosterBlurhash(video);
    return { width, height, orientation, duration, blurhash, localPreviewUrl };
  }

  if (file.type.startsWith("audio/")) {
    const audio = await loadAudio(localPreviewUrl);
    const duration = Math.round(audio.duration * 1000);
    return { duration, localPreviewUrl };
  }

  return { localPreviewUrl };
}
```

### Step 2: Optimistic Message Staging
The client generates `messageId = crypto.randomUUID()` and immediately inserts the message into TanStack Query's cache:
```typescript
const optimisticMessage: TMessage = {
  id: messageId,
  chatId,
  owner: currentUserId,
  body: caption || "",
  starred: false,
  forwarded: false,
  time: new Date().toISOString(),
  status: "idle", // Clock icon
  reactions: [],
  hasMedia: {
    type: mediaType,
    src: metadata.localPreviewUrl, // Instant zero-latency display
    orientation: metadata.orientation || "square",
    duration: metadata.duration ?? null,
  },
};
```

### Step 3: Direct PUT to Storage
Using `XMLHttpRequest` to capture upload progress events:
```typescript
function uploadToPresignedUrl(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with HTTP ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Network error during media upload"));
    xhr.send(file);
  });
}
```

### Step 4: Dispatch Message via Socket.IO
Once HTTP 200 is received from storage:
```typescript
socket.emit(
  "message:send",
  {
    id: messageId,
    chatId,
    body: caption || "",
    mediaId,
  },
  (ack) => {
    if (ack.success) {
      // Transition message status from 'idle' -> 'send' (single check)
      // Revoke local object URL to free memory
      URL.revokeObjectURL(metadata.localPreviewUrl);
    } else {
      // Mark as error with retry option
    }
  }
);
```

### Server-Side Attachment Finalization
When `message:send` arrives with `mediaId`:
1. Server verifies in `media_attachments` that `id = mediaId`, `uploader_id = sender.id`, and `chat_id = chatId`.
2. Updates `media_attachments.message_id = message.id` and `media_attachments.status = 'attached'`.
3. Broadcasts `message:new` event with populated `hasMedia: TMedia` to room `chat:${chatId}`.

---

## 5. Thumbnails & Media Preview Strategy

1. **Blurhash Placeholders**:
   - A $32 \times 32$ canvas computes a ~30 character blurhash string before upload.
   - Transmitted in `POST /presign` and returned in `hasMedia`.
   - Rendered using `<canvas>` or CSS SVG blur background while the full image loads, eliminating layout shift and gray empty boxes.
2. **CDN Edge Resizing (Production)**:
   - Cloudflare Images / Cloudflare R2 Transformations allow dynamic query parameters:
     - Chat bubble thumbnail: `https://media.chat-me.com/cdn-cgi/image/width=600,quality=80,format=auto/chats/...`
     - Fullscreen lightbox: `https://media.chat-me.com/chats/...` (original resolution)
3. **Local Development (MinIO)**:
   - For local development, Fastify provides an optional dynamic resizing route (`GET /api/v1/media/:mediaId/thumbnail`) powered by `sharp`, cached in memory.

---

## 6. Cleanup of Orphaned Uploads

If a user uploads a file to object storage but closes their tab before sending the message:
- A scheduled cron / background worker executes hourly:
  ```sql
  SELECT id, storage_key FROM media_attachments
  WHERE status = 'pending' AND created_at < NOW() - INTERVAL '2 hours';
  ```
- Deletes the unreferenced S3 objects via `DeleteObjectsCommand` and purges database rows, preventing storage leak.
