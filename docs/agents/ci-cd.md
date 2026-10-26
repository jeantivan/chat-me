# CI/CD & GitHub Actions Guidelines

Automated continuous integration and delivery pipeline standards for the `chat-me` monorepo.

---

## 1. Pipeline Overview

All code pushed to `main` or proposed in pull requests must validate through the automated GitHub Actions pipeline located in `.github/workflows/ci.yml`.

### Triggers & Concurrency

- **Triggers**:
  - `push` to `main`
  - `pull_request` targeting `main`
- **Concurrency**:
  - Group: `${{ github.workflow }}-${{ github.ref }}`
  - `cancel-in-progress: true` on PRs (avoids wasting runner minutes on superseded commits).
  - Main branch pushes run to completion to preserve an uninterrupted build record.
- **Permissions**:
  - Restricted to `contents: read` following the principle of least privilege.
- **Timeout**:
  - Strict 15-minute job timeout (`timeout-minutes: 15`).

---

## 2. Verification Gates (Strict Sequence)

The CI workflow executes the following steps in deterministic order:

| Step | Command | Purpose |
| :--- | :--- | :--- |
| **1. Install Dependencies** | `pnpm install --frozen-lockfile` | Ensures deterministic, reproducible dependency tree from `pnpm-lock.yaml`. |
| **2. Playwright Browsers** | `pnpm --filter @chat-me/web exec playwright install --with-deps chromium` | Installs headless Chromium browser binaries and system dependencies for E2E testing. |
| **3. Infrastructure Containers** | `docker compose up -d --wait` | Spins up PostgreSQL (port 5434), Redis (port 6379), and MinIO (port 9000/9001) with built-in healthchecks. |
| **4. Database Migrations** | `pnpm db:migrate` | Runs Drizzle schema migrations against PostgreSQL before tests execute. |
| **5. Static Linting** | `pnpm lint` | Runs Turborepo ESLint checks, `scripts/lint-glossary.sh` (domain terms), and `scripts/lint-network.sh` (relative client paths). |
| **6. Static Typechecking** | `pnpm typecheck` | Monorepo-wide `tsc --noEmit` across `@chat-me/shared`, `@chat-me/server`, and `@chat-me/web`. |
| **7. Unit & Integration Tests** | `pnpm test` | Vitest suites across backend Fastify endpoints and frontend React components. |
| **8. Production Build** | `pnpm build` | Compiles server TypeScript to `dist/` and runs Vite production build for client assets. |
| **9. End-to-End Tests** | `pnpm --filter @chat-me/web test:e2e` | Headless Playwright integration verifying real authentication, messaging, and chat workflows against live servers. |
| **10. Container Teardown** | `docker compose down -v` (`if: always()`) | Cleans up ephemeral containers, volumes, and networks cleanly. |
| **11. Artifact Upload** | `actions/upload-artifact@v4` (`if: failure()`) | Uploads Playwright HTML report, traces, and screenshots for diagnostic inspection (retained for 7 days). |

---

## 3. Failure Investigation & Artifacts

When an E2E test fails in CI:
1. Navigate to the failed GitHub Actions run under the **Actions** tab.
2. In the **Artifacts** section at the bottom of the run summary, download the `playwright-report` zip archive.
3. Unzip and view the report locally:
   ```bash
   npx playwright show-report ./playwright-report
   ```
4. Inspect the execution trace, DOM snapshots, network payloads, and failure screenshots to pinpoint the root cause.

---

## 4. Local Pre-Flight Check

Before committing or pushing any branch to remote, verify that the local environment matches CI:

```bash
# 1. Start backing services
docker compose up -d --wait

# 2. Run migrations
pnpm db:migrate

# 3. Run linters (ESLint + GLOSSARY + Network)
pnpm lint

# 4. Run TypeScript checks
pnpm typecheck

# 5. Run unit & integration tests
pnpm test

# 6. Run production build
pnpm build

# 7. Run E2E tests
pnpm --filter @chat-me/web test:e2e
```

---

## 5. Branch Protection Rules (`main`)

Repository administrators enforce the following protections on the `main` branch:

- **Require a pull request before merging**.
- **Require status checks to pass before merging**:
  - The `validate` job status check must be green.
- **Require branches to be up to date before merging**.
- **Require linear history** (squash or rebase merges preferred).
- **Do not allow bypassing the above settings**.
