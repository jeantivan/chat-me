# Agent Guidelines

## Agent skills

### Issue tracker

GitHub Issues via `gh` CLI. See `docs/agents/issue-tracker.md`.
A ticket is complete only when verified, pushed to remote, and closed (`gh issue close`).

### Coding standards

Reviewed via `/code-review`. Single source of truth is `CODING_STANDARDS.md`.

### Triage labels

Canonical 5-role defaults (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo layout (`GLOSSARY.md` + `docs/adr/` at repo root). See `docs/agents/domain.md`.

### CI/CD & GitHub Actions

Enforced via GitHub Actions (`.github/workflows/ci.yml`). See `docs/agents/ci-cd.md`.
All pipeline gates must pass cleanly before merging or completing tickets.
