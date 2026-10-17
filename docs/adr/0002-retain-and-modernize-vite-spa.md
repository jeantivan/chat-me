# Retain and Modernize Vite SPA Architecture (Reject Next.js App Router)

We decided to retain and modernize the client-side Single Page Application (SPA) using Vite, React 19, TanStack Router, and TanStack Query, rather than migrating to Next.js App Router.

## Considered Options

- **Modernized Vite SPA (Chosen)**: Pure client-side SPA with Vite, TanStack Router (`/c/$chatId`), TanStack Query v5 for server state cache, and Zustand for transient UI state.
- **Next.js App Router**: Evaluated for full-stack monorepo ergonomics, but rejected because SSR/RSC offers zero benefit for an authenticated private messenger, introduces hydration errors with DOM-imperative libraries like Meta's Lexical editor, cannot hold persistent WebSocket connections serverless, and would require rewriting or adding `'use client'` to ~100% of the component tree.

## Consequences

- 100% of existing Radix UI components, Framer Motion drawers, and Lexical plugins in `src/` are preserved without hydration issues.
- Frontend builds to pure static files deployable to edge CDNs (Cloudflare Pages, S3/CloudFront) with zero compute cost.
- Routing is explicitly tracked in URLs (`/c/$chatId`) using TanStack Router while keeping the desktop dual-column layout mounted.
