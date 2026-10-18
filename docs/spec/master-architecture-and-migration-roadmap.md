# Master Architecture Specification & Phased Migration Roadmap

**Project**: `chat-me`  
**Target Architecture**: Full-Stack Real-Time Messaging Platform (WhatsApp / Telegram Web Parity)  
**Status**: Ready for Developer Implementation Handoff  

---

## 1. Executive Summary & System Topology

`chat-me` is transitioning from a static mock-driven React client into a production-grade, full-stack real-time messaging application. The architecture prioritizes **sub-5ms WebSocket delivery**, **optimistic client interactions**, **strict type safety across the wire**, and **complete local development offline parity**.

```
                           ┌────────────────────────────────────────┐
                           │          Client (Web Browser)          │
                           │   Vite 6 + React 19 + TanStack Router  │
                           │   TanStack Query v5 (Server Cache)     │
                           │   Zustand (Transient UI State)         │
                           └───────┬──────────────────▲─────────────┘
                                   │                  │
                 HTTP REST / Auth  │                  │  Socket.IO (WebSocket)
             Presigned URL Request │                  │  Bi-directional Events
                                   ▼                  │  (sub-5ms Latency)
                           ┌──────────────────────────┴─────────────┐
                           │      Fastify API & Real-Time Server    │
                           │      Node.js (TypeScript) + Fastify    │
                           │      Socket.IO + Socket.IO Redis       │
                           └───────┬──────────────────┬─────────────┘
                                   │                  │
                  PostgreSQL / SQL │                  │ Pub/Sub
                  via Drizzle ORM  │                  │ Scaleout
                                   ▼                  ▼
                           ┌──────────────┐   ┌──────────────┐
                           │  PostgreSQL  │   │ Redis PubSub │
                           │  (Primary DB)│   │ (Cluster Bus)│
                           └──────────────┘   └──────────────┘
                                   │
                                   │ Direct S3 PUT
                                   ▼
                           ┌────────────────────────────────────────┐
                           │             Object Storage             │
                           │   Production: Cloudflare R2 ($0 egress)│
                           │   Local Dev:  MinIO Docker Container   │
                           └────────────────────────────────────────┘
```

---

## 2. Architectural Decisions Summary

| Domain | Architecture Decision | Canonical Reference | Rationale |
| :--- | :--- | :--- | :--- |
| **Backend & Protocol** | Dedicated Node.js Fastify + Socket.IO service | [ADR 0001](file:///home/jeanpaul/Escritorio/dev/chat-me/docs/adr/0001-fastify-socketio-backend.md) | Sub-5ms delivery latency, native ACK callbacks for receipts, unmetered presence. |
| **Frontend Framework** | Modernized Vite 6 + React 19 SPA + TanStack Router | [ADR 0002](file:///home/jeanpaul/Escritorio/dev/chat-me/docs/adr/0002-retain-and-modernize-vite-spa.md) | Avoids SSR hydration issues with Lexical editor; 100% component preservation. |
| **Client State Sync** | Hybrid: TanStack Query v5 (server data) + Zustand (UI) | [ADR 0003](file:///home/jeanpaul/Escritorio/dev/chat-me/docs/adr/0003-hybrid-tanstack-query-zustand-state.md) | Cursor pagination (`useInfiniteQuery`), direct cache patching from Socket.IO events. |
| **Media Pipeline** | Direct-to-Object-Storage with S3 Presigned URLs (R2/MinIO) | [ADR 0004](file:///home/jeanpaul/Escritorio/dev/chat-me/docs/adr/0004-media-storage-and-upload-pipeline.md) | Zero Node.js streaming bottlenecks, zero egress costs (R2), full local dev parity (MinIO). |
| **Data Model & Events**| PostgreSQL via Drizzle ORM + Typed Socket.IO Events | [Data Model Spec](file:///home/jeanpaul/Escritorio/dev/chat-me/docs/spec/data-model-and-event-contracts.md) | Normalized multi-user receipt tracking, client UUID deduplication, deterministic hashing. |

---

## 3. Core Component Specifications

### 3.1 Backend Service Layer (`apps/server`)
- **Fastify HTTP Engine**:
  - `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`.
  - `GET /api/v1/users/me`, `PATCH /api/v1/users/me`, `GET /api/v1/contacts`.
  - `GET /api/v1/chats`, `POST /api/v1/chats` (direct or group).
  - `GET /api/v1/chats/:chatId/messages` (cursor-paginated: `?cursor=<created_at>&limit=40`).
  - `POST /api/v1/chats/:chatId/media/presign` (issues short-lived S3 PUT URLs).
- **Socket.IO Engine**:
  - JWT authentication during connection handshake (`io.use(authMiddleware)`).
  - Rooms: Each user joins room `user:${userId}`; active chat participants join room `chat:${chatId}`.
  - Event Handling:
    - `message:send` with client UUID -> DB persistence -> ACK callback -> broadcast `message:new`.
    - `message:ack_received` & `message:ack_read` -> batch update `message_receipts` -> broadcast `message:status_changed`.
    - `message:reaction` -> upsert/delete `message_reactions` -> broadcast `message:reaction_updated`.
    - `chat:typing` -> ephemeral broadcast `chat:typing_updated` (no DB write).
    - `presence:heartbeat` -> in-memory Redis TTL tracking -> broadcast `presence:updated`.

### 3.2 Relational Database Schema (PostgreSQL 16 + Drizzle ORM)
Ten normalized, index-optimized relational tables:
1. `users`: Core identity, password hash (argon2id), profile bio, avatar URL.
2. `user_settings`: 1-to-1 preferences (`theme`, `notifications`, `privacy`).
3. `contacts`: Bidirectional contact graph with custom nicknames.
4. `chats`: Containers for `direct` or `group` threads with `direct_pair_hash` uniqueness.
5. `chat_participants`: Membership, role (`admin` | `member`), pinned/muted flags, `last_read_at` watermark.
6. `messages`: Messages with client-supplied UUID for deduplication, soft deletes (`deleted_at`).
7. `media_attachments`: Media records with S3 key, URL, blurhash, orientation, width, height, and duration.
8. `message_receipts`: Multi-user delivery (`received`) and view (`read`) tracking per participant.
9. `message_reactions`: Atomic single-reaction per user with emoji shortcodes/glyphs.
10. `message_stars`: Per-user message bookmarking.

### 3.3 Frontend Client Architecture (`apps/web`)
- **Modernized Toolchain**:
  - Vite 6 + React 19.
  - `@tanstack/react-router` replacing hash/window routing:
    - `/` : Chat list view (desktop dual-pane default, mobile chat drawer).
    - `/c/$chatId` : Active chat timeline with auto-focus and URL sync.
    - `/settings` : Settings dialog / slideover routing.
- **Data & Real-Time Sync**:
  - `useInfiniteQuery` loads 40-message batches upwards (`hasPreviousPage`, `fetchPreviousPage`).
  - `useSocketSync` hook subscribes to Socket.IO events and directly mutates TanStack Query cache (`setQueryData`), ensuring zero redundant network fetches.
  - Optimistic sending: Staging message immediately with `status: 'idle'` (clock icon); Socket.IO ACK callback promotes to `status: 'send'` (single tick); `message:status_changed` transitions to double gray (`received`) and double blue (`read`).
- **Preserved UI Assets**:
  - Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-popover`, `@radix-ui/react-tooltip`).
  - Tailwind CSS custom token themes (`slate-indigo`, `mauve-violet`, etc.).
  - Lexical Rich Text Composer with custom plugins.

### 3.4 Media Storage & Upload Pipeline
- **Upload Flow**:
  1. Client extracts native dimensions, orientation, duration, and canvas blurhash.
  2. Client stages message optimistically with local `URL.createObjectURL(file)`.
  3. Client calls `POST /api/v1/chats/:chatId/media/presign`.
  4. Client streams file directly to S3 / R2 / MinIO via HTTP `PUT` with `xhr.upload.onprogress`.
  5. Client sends `message:send` via Socket.IO carrying `mediaId`.
  6. Server links `media_attachments` record and broadcasts `message:new`.

---

## 4. Repository Monorepo Structure

Transition the project into a clean Turborepo / pnpm workspace monorepo:

```
chat-me/
├── apps/
│   ├── web/                          # Modernized Vite 6 + React 19 SPA
│   │   ├── src/
│   │   │   ├── components/           # Radix + Tailwind components
│   │   │   ├── hooks/                # useSocket, useChatQuery, useMediaUpload
│   │   │   ├── routes/               # TanStack Router file routes
│   │   │   └── lib/                  # Zustand UI store, queryClient
│   │   └── package.json
│   └── server/                       # Fastify + Socket.IO Backend
│       ├── src/
│       │   ├── db/                   # Drizzle schema, migrations, connection pool
│       │   ├── routes/               # REST route plugins (auth, chats, media)
│       │   ├── socket/               # Socket.IO handlers & event contracts
│       │   ├── services/             # Media presigning, presence, auth services
│       │   └── index.ts              # Fastify server bootstrap
│       └── package.json
├── packages/
│   ├── shared/                       # Shared TypeScript types & Socket.IO contracts
│   │   ├── src/
│   │   │   ├── types.ts              # TMessage, TChat, TUser, TMedia
│   │   │   └── events.ts             # ClientToServerEvents, ServerToClientEvents
│   │   └── package.json
│   └── tsconfig/                     # Base TypeScript configurations
├── docker-compose.yml                # Local PostgreSQL 16 + Redis + MinIO
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 5. Phased Implementation Roadmap

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Phase 0: Monorepo Foundation & Local Infrastructure (PostgreSQL, Redis, MinIO)   │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Database Schema (Drizzle ORM), Migrations, Seed Data & Fastify Auth      │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Socket.IO Real-Time Engine, Delivery Receipts & Presence Heartbeat       │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Frontend Modernization (Vite 6, React 19, TanStack Router)               │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Phase 4: Client Real-Time Sync Bridge, Infinite Query Pagination & Optimistic UI  │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Phase 5: Direct Media Upload Pipeline (S3 Presigning, Blurhash, Progress Rings)   │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Phase 6: Hardening, End-to-End Testing (Playwright), and Production Deployment    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Phase 0: Monorepo & Local Infrastructure Setup
- Initialize `pnpm-workspace.yaml` and `turbo.json`.
- Move existing client to `apps/web`.
- Create `packages/shared` for shared DTOs and Socket.IO interfaces.
- Configure `docker-compose.yml`:
  - PostgreSQL 16 (`5432`)
  - Redis 7 (`6379`)
  - MinIO S3 server (`9000` / console `9001`) with automatic bucket creation (`chat-media`).

### Phase 1: Database Schema, Migrations & Authentication
- Install Drizzle ORM, `drizzle-kit`, and `pg` in `apps/server`.
- Implement normalized relational schema (10 tables) matching [Data Model Spec](file:///home/jeanpaul/Escritorio/dev/chat-me/docs/spec/data-model-and-event-contracts.md).
- Create database migration script (`pnpm --filter server db:migrate`) and comprehensive seed script (`pnpm --filter server db:seed`) generating test users, conversations, and historical messages.
- Implement Fastify authentication routes using `@fastify/jwt` and `@fastify/cookie` with Argon2id password hashing.

### Phase 2: Real-Time Engine & Event Contracts
- Initialize Socket.IO server on Fastify with `@socket.io/redis-adapter` for horizontal scalability.
- Implement connection handshake JWT authentication.
- Implement message delivery and status receipt state machine:
  - `message:send` handler with client UUID idempotency check.
  - `message:ack_received` handler batch-updating `message_receipts`.
  - `message:ack_read` handler updating participant `last_read_at` watermark.
- Implement heartbeat presence tracking and `chat:typing` broadcast.

### Phase 3: Frontend Modernization & TanStack Router
- Upgrade `apps/web` dependencies to React 19 and Vite 6.
- Install and configure `@tanstack/react-router`.
- Establish routes:
  - `/__root.tsx` : App shell and theme wrapper.
  - `/index.tsx` : Default desktop layout (chat list + placeholder).
  - `/c/$chatId.tsx` : Active chat timeline bound to URL param `$chatId`.
- Integrate `@tanstack/react-query` v5 provider.

### Phase 4: Client Real-Time Sync & Optimistic UI
- Replace mock data stores with TanStack Query hooks:
  - `useChats()`: Query for active chat conversation previews.
  - `useChatMessages(chatId)`: `useInfiniteQuery` loading 40-message pages.
- Implement `useSocketSync()` bridge:
  - Listens to `message:new` -> injects message into query cache without network refetch.
  - Listens to `message:status_changed` -> patches message status tick marks.
  - Listens to `message:reaction_updated` -> updates message reaction array.
- Wire Lexical editor submission to optimistic cache mutation and Socket.IO `message:send` ACK callback.

### Phase 5: Media Upload Pipeline & Blurhash
- Implement `POST /api/v1/chats/:chatId/media/presign` in `apps/server` using `@aws-sdk/s3-request-presigner`.
- Implement `extractMediaMetadata` in `apps/web` (extracts dimensions, orientation, duration, and canvas blurhash).
- Implement `useMediaUpload` hook with `XMLHttpRequest.upload.onprogress` for visual upload progress rings.
- Connect `SendFiles.tsx` and `Editor/index.tsx` to the presigned upload pipeline.

### Phase 6: Hardening, Testing & Deployment
- Write automated Playwright end-to-end tests:
  - Two simulated browser sessions chatting in real time.
  - Receipt verification (clock -> single tick -> double gray -> double blue).
  - Media drag-and-drop upload and preview verification.
- Create production multi-stage `Dockerfile` for `apps/server` and static build for `apps/web`.
- Configure deployment configuration (Fly.io / Railway / Docker Compose) with environment variables for PostgreSQL, Redis, and Cloudflare R2 credentials.

---

## 6. Implementation Readiness Sign-Off

With the completion of this specification, all architectural decisions, database models, event protocols, state management boundaries, and execution sequences are finalized. The route is unblocked and ready for immediate engineering execution.
