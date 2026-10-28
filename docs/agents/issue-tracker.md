# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Make an issue a sub-issue of a parent**: `gh issue create --parent <parent> ...`, or `gh issue edit <parent> --add-sub-issue <child>` afterwards (`gh` 2.94+). Older `gh`: `gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>` (database id, as in **Blocking** below). Without sub-issues, put `Part of #<parent>` at the top of the child body.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh api --paginate 'repos/{owner}/{repo}/pulls?state=open' --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`.
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (see **Make an issue a sub-issue of a parent**). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.

## Ticket completion

When implementing an issue (`/implement <n>` or `/implement-spec`):
1. **Branch**: Create an isolated branch off latest `main`: `git checkout -b <type>/<n>-<short-slug>` (e.g., `feat/42-voice-player` or `fix/43-tombstone-crash`). Never commit directly to `main`.
2. **Granularity Check**: Ensure the change remains granular (target diff < 200–300 lines of code, single responsibility). If a feature expands, decompose it into child sub-issues and handle them via discrete PRs.
3. **Verify Locally**: Ensure `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass cleanly.
4. **Commit in English**: Use Conventional Commits (`git commit -m "<type>(<scope>): <summary in english>"`).
5. **Push & Create PR**: Push the branch (`git push origin <branch>`) and submit a Pull Request using the template:
   ```bash
   gh pr create --title "<type>(<scope>): <summary>" --body "Closes #<n>"
   ```
6. **Merge via Squash**: Once the automated GitHub Actions CI workflow passes cleanly, merge the PR via squash and delete the feature branch:
   ```bash
   gh pr merge --squash --delete-branch
   ```
7. **Close Ticket**: Verify the issue is closed via GitHub's auto-close keyword or close it with `gh issue close <n> --comment "Merged via PR #<pr>"`.
A ticket is not done until the code is merged to `main` via PR and the issue is closed on GitHub.

### Sandboxed Push Fallback

When operating in an agent session where `git push` or `gh` commands are denied by user permission prompts, sandbox policies, or missing remote credentials:
1. Ensure all quality gates have passed cleanly locally and code is committed.
2. Do not retry `git push` repeatedly or stall the workflow.
3. Provide the user with the exact copy-paste command to complete the remote operations manually:
   ```bash
   git push origin <branch> && gh pr create --title "<type>: <title>" --body "Closes #<n>"
   ```
4. Output the ticket completion summary and hand off cleanly.
