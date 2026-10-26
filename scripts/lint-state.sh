#!/usr/bin/env bash
set -euo pipefail

# Mechanical client state linter enforcing ADR 0003 & CODING_STANDARDS.md § 1
# Prohibits reading server-persisted entities (chats, contacts, messages) from Zustand store in UI components.
# Server data MUST be accessed via TanStack Query hooks (e.g. useChats, useContacts, useChatMessages).

EXIT_CODE=0

echo "🔍 Checking client codebase for forbidden Zustand access to server collections (ADR 0003)..."

# Known legacy files grandfathered in pending dedicated migration tickets:
# - apps/web/src/components/ArchivedChats.tsx
# - apps/web/src/components/Chat/index.tsx
# - apps/web/src/components/ChatList.tsx

LEGACY_EXCLUDES=':(exclude)apps/web/src/components/ArchivedChats.tsx :(exclude)apps/web/src/components/Chat/index.tsx :(exclude)apps/web/src/components/ChatList.tsx'

matches=$(git grep -inE 'useStore\([^)]*state\.(chats|contacts|messages)' -- 'apps/web/src/components/**' $LEGACY_EXCLUDES || true)

if [ -n "$matches" ]; then
  echo "❌ Client State Lint Violation: Direct Zustand access to server collections detected in UI components!"
  echo "$matches"
  echo ""
  echo "💡 Remedy (ADR 0003 & CODING_STANDARDS.md § 1):"
  echo "   - Server entities (chats, contacts, messages) must be fetched using TanStack Query hooks (e.g. useChats(), useContacts(), useChatMessages())."
  echo "   - Zustand is strictly reserved for client-only transient UI state (drawers, modals, editor drafts)."
  EXIT_CODE=1
else
  echo "✅ State architecture lint passed: No prohibited Zustand server collection reads in components."
fi

exit "$EXIT_CODE"
