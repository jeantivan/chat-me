# Dedicated Fastify + Socket.IO Backend with PostgreSQL and Drizzle ORM

We decided to build a standalone Node.js/TypeScript backend service using Fastify, Socket.IO, PostgreSQL, and Drizzle ORM instead of Supabase BaaS or Next.js serverless route handlers.

## Considered Options

- **Dedicated Fastify + Socket.IO (Chosen)**: Full-duplex WebSocket connections with sub-5ms latency, native event acknowledgment callbacks for delivery status receipts (`send` -> `received` -> `read`), and unmetered typing/presence broadcast.
- **Supabase BaaS**: Rejected due to 50–250ms WAL logical decoding replication delays, strict presence rate limits (`ClientPresenceRateLimitReached`), and vendor lock-in.
- **Next.js Full-Stack (Serverless)**: Rejected because serverless route handlers cannot maintain persistent WebSocket state without costly external pub/sub services (Pusher/Ably), and SSE requires separate HTTP POST round-trips for client-to-server messaging.

## Consequences

- Full control over WebSocket lifecycle and delivery status state machine.
- Requires deploying a long-running Node.js process (e.g. Fly.io, Railway, or VPS) alongside a managed PostgreSQL database, rather than deploying pure static/serverless functions.
