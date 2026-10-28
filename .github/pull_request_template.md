## Description

<!-- Provide a brief, concise summary of the changes introduced in this PR. -->

## Linked Issue

Closes #<!-- issue number -->

## Type of Change

- [ ] `feat`: New user-facing or platform capability
- [ ] `fix`: Bug fix
- [ ] `refactor`: Internal structure change with no behavioral modification
- [ ] `docs`: Documentation updates only
- [ ] `test`: New or updated tests
- [ ] `chore`: Build system, toolchain, or dependency updates

## Granularity Self-Check

- [ ] **Small Diff**: Changes are within ~200–300 lines of code (excluding generated lockfiles/fixtures).
- [ ] **Single Responsibility**: This PR addresses exactly one logical fix, component, or endpoint seam.
- [ ] **Language Check**: All code, comments, docstrings, commit messages, and PR descriptions are written in technical English.

## Quality Gates Checklist

- [ ] `pnpm lint` passed cleanly (ESLint, `lint:glossary`, `lint:network`).
- [ ] `pnpm typecheck` passed cleanly across all packages.
- [ ] `pnpm test` passed cleanly with unit and integration tests covering this change.
- [ ] `pnpm build` compiled production bundles without errors.
