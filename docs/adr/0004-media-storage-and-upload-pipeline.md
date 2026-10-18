# Media Storage & Upload Pipeline: Direct-to-Object-Storage with S3 Presigned URLs

We decided to implement a **Direct-to-Object-Storage** upload architecture using S3-compatible presigned PUT URLs (Cloudflare R2 for production, MinIO for local development) rather than proxying media payloads through the Fastify backend server.

## Considered Options

- **Direct-to-Object-Storage via S3 Presigned URLs (Chosen)**:
  - Fastify server issues short-lived, signed PUT URLs with strict `Content-Type` and file size limits.
  - The client uploads binary streams directly to object storage (Cloudflare R2 in production, MinIO in local dev/testing), completely offloading binary file I/O and network bandwidth from Node.js.
  - Cloudflare R2 provides zero egress fees, crucial for chat media delivery, and MinIO provides full local S3 compatibility via Docker Compose without external credentials.
- **Fastify Proxied Multipart Uploads (Rejected)**:
  - Streaming multi-megabyte images, videos, and documents through the Fastify server monopolizes Node.js event-loop cycles, risks process memory bloat during concurrent uploads, and incurs double bandwidth (client -> server -> storage).
- **Third-Party Media SaaS (e.g. Cloudinary, Uploadcare) (Rejected)**:
  - High per-unit pricing, proprietary vendor lock-in, and unnecessary complexity when an S3-compatible bucket paired with client-side metadata extraction and CDN edge resizing solves all requirements.

## Consequences

- Node.js backend handles only lightweight JSON metadata and authorization, preserving sub-millisecond WebSocket throughput for text messaging and real-time events.
- Client extracts dimensions, orientation, duration, and blurhash client-side before upload, providing instant optimistic previews in the UI.
- Requires configuring an S3-compatible bucket and CORS policies allowing direct browser PUT requests from the web app origin.
