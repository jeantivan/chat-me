# Coding Standards

Engineering standards and conventions enforced across the `chat-me` monorepo. The `/code-review` agent checks all diffs against these rules.

---

## 1. State Separation & Data Layer (ADR 0003)

- **TanStack Query v5 for Server Entities**:
  - `chats`, `messages` (cursor-paginated infinite queries), `contacts`, and `userProfile` belong strictly in the TanStack Query cache.
  - Inbound Socket.IO events patch query caches via `queryClient.setQueryData`.
- **Zustand for Transient UI Only**:
  - Zustand is reserved for client-only transient state: drawer visibility (`LeftDrawer`, `RightDrawer`), active modals, search query filters, and local editor drafts.
  - Never store collections of server entities in a monolithic Zustand store.

---

## 2. Authentication & Token Security

- **Argon2id Hashing**:
  - All credentials stored in PostgreSQL must be hashed with Argon2id using recommended memory and parallelism parameters.
- **Strict JWT Token Types**:
  - Fastify authentication handlers must explicitly sign and verify token type claims (`type: "access"` for Bearer tokens, `type: "refresh"` for cookie tokens).
  - Middleware must explicitly reject tokens whose `type` claim is not `"access"`.
- **HTTP-Only Refresh Cookies**:
  - Long-lived refresh tokens must only be exchanged via secure, HTTP-only cookies (`path: "/"`). Never persist refresh tokens in `localStorage` or client memory.
- **Client Session Cleanup**:
  - `logout()` must wipe both React auth state and any local client storage/Zustand user identity.

---

## 3. Client API Calls & Network Seams

- **Relative API Base**:
  - Client API clients (e.g. `authClient`) must use relative paths (`/api/v1/...`) or `import.meta.env.VITE_API_BASE_URL` so development requests route through Vite's local proxy to port `3001`.
  - Hardcoded localhost ports in client code are strictly prohibited.

---

## 4. Domain Terminology (GLOSSARY.md)

- Code, database columns, types, event names, and comments must strictly use the canonical terms in [`GLOSSARY.md`](file:///home/jeanpaul/Escritorio/dev/chat-me/GLOSSARY.md):
  - **Receipt**: Use `receipt` or `privacy_read_receipt`. Prohibited: `confirmation`, `delivery_tag`.
  - **Delivery Status**: Use `idle`, `send`, `received`, `read`. Prohibited: `message status`, `ack state`.
  - **Chat**: Use `chat` or `direct_chat`. Prohibited: `room`, `channel`, `thread`.
  - **Read Watermark**: Use `read_watermark` or `last_read_at`. Prohibited: `read pointer`, `unread counter`.
- Enforced deterministically via `pnpm lint:glossary`.

---

## 5. Non-Interactive Tooling Conventions

- **Database CLI (`psql`)**:
  - Always execute `psql` queries with `-P pager=off` (or `--no-align`) to avoid interactive terminal hangs in automated runs.
