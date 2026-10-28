# Agent Guidelines

## Agent skills

### Issue tracker

GitHub Issues via `gh` CLI. See `docs/agents/issue-tracker.md`.
A ticket is complete only when implemented on a dedicated branch, verified via CI, merged to `main` via a granular Pull Request (`gh pr create`), and closed (`gh issue close`).

### Coding standards

Reviewed via `/code-review`. Single source of truth is `CODING_STANDARDS.md`.

### Language & Documentation Policy

All persisted code, comments, docstrings, commit messages, PRs, GitHub issues, grilling session outputs, ADRs, and documentation MUST be written strictly in technical English, regardless of whether conversational interaction with the user occurs in Spanish or another language.

### Branching, PR Lifecycle & Granularity

- **Isolated Branches**: Never commit directly to `main`. Every issue or sub-issue must be developed in an isolated branch (`feat/<issue-id>-<short-slug>` or `fix/<issue-id>-<short-slug>`).
- **Granular PRs**: Pull requests must be small and scoped to a single responsibility (target diff < 200–300 lines). Complex features must be split into multiple sub-issues with independent PRs.
- **Squash & Merge**: Merge PRs via Squash and Merge after all CI pipeline gates pass cleanly.

### Triage labels

Canonical 5-role defaults (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo layout (`GLOSSARY.md` + `docs/adr/` at repo root). See `docs/agents/domain.md`.

### CI/CD & GitHub Actions

Enforced via GitHub Actions (`.github/workflows/ci.yml`). See `docs/agents/ci-cd.md`.
All pipeline gates must pass cleanly before merging or completing tickets.
