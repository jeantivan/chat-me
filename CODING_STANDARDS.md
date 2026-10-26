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

---

## 6. Continuous Integration & Delivery (CI/CD Rules with GitHub Actions)

- **Mandatory Pipeline Gates**:
  - Every pull request and push to `main` must pass the automated GitHub Actions verification workflow (`.github/workflows/ci.yml`).
  - Required pipeline steps execute in strict deterministic order:
    1. **Dependencies**: `pnpm install --frozen-lockfile` (ensures reproducible node_modules).
    2. **Backing Services**: `docker compose up -d --wait` (PostgreSQL, Redis, MinIO health-checked).
    3. **Schema Migrations**: `pnpm db:migrate` (ensures database schema is fully migrated before tests run).
    4. **Static Linting**: `pnpm lint` (enforces ESLint, `lint:glossary`, and `lint:network`).
    5. **Static Typecheck**: `pnpm typecheck` (verifies complete monorepo TypeScript compilation without emit).
    6. **Unit & Integration Tests**: `pnpm test` (all server and web test suites run to completion).
    7. **Production Build**: `pnpm build` (ensures all packages compile and bundle for production).
    8. **Headless E2E Tests**: `pnpm --filter @chat-me/web test:e2e` (verifies user journeys in headless Chromium).
- **Zero-Bypass Policy**:
  - No skipping lint, typecheck, or tests via `--no-verify`, forced merges, or commented-out assertions.
  - A branch or PR is not eligible for merge if any CI check fails.
- **Workflow Security & Resource Hygiene**:
  - **Least Privilege**: Workflows must explicitly declare `permissions: contents: read` (or the minimal required scope).
  - **Concurrency Cancellation**: Workflows must specify concurrency groups with `cancel-in-progress: true` for PR branches to cancel redundant runs upon new commits.
  - **Explicit Timeouts**: Every workflow job must define `timeout-minutes` (max 15 minutes) to prevent runaway hung processes.
  - **Clean Container Teardown**: Backing service containers must be torn down cleanly (`docker compose down -v`) in an `always()` post-step.
- **Debuggability & Artifact Retention**:
  - E2E test failures must upload Playwright traces and test report artifacts (`apps/web/playwright-report/`) via `actions/upload-artifact` with a 7-day retention period.
- **Branch Protection**:
  - `main` requires all CI status checks to pass and linear history before merge.
