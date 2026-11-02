#!/usr/bin/env bash
set -euo pipefail

# Mechanical client state linter enforcing ADR 0003 & CODING_STANDARDS.md § 1
# Prohibits reading server-persisted entities (chats, contacts, messages) from Zustand store in UI components.
# Server data MUST be accessed via TanStack Query hooks (e.g. useChats, useContacts, useChatMessages).

EXIT_CODE=0

echo "🔍 Checking client codebase for forbidden Zustand access to server collections (ADR 0003)..."

matches_reads=$(git grep -inE 'useStore\([^)]*state\.(chats|contacts|messages)' -- 'apps/web/src/components/**' || true)
matches_mutations=$(git grep -inE 'useStore\([^)]*state\.(pinChat|muteChat|deleteChat|archiveChat)' -- 'apps/web/src/components/**' || true)

if [ -n "$matches_reads" ]; then
  echo "❌ Client State Lint Violation: Direct Zustand read of server collections detected in UI components!"
  echo "$matches_reads"
  echo ""
  echo "💡 Remedy (ADR 0003 & CODING_STANDARDS.md § 1):"
  echo "   - Server entities (chats, contacts, messages) must be fetched using TanStack Query hooks (e.g. useChats(), useContacts(), useChatMessages())."
  echo "   - Zustand is strictly reserved for client-only transient UI state (drawers, modals, editor drafts)."
  EXIT_CODE=1
fi

if [ -n "$matches_mutations" ]; then
  echo "❌ Client State Lint Violation: Direct Zustand mutation of server entities detected in UI components!"
  echo "$matches_mutations"
  echo ""
  echo "💡 Remedy (ADR 0003 & CODING_STANDARDS.md § 1):"
  echo "   - Server mutations must be executed using TanStack Query hooks (e.g. useUpdateChatParticipant(), useDeleteChat(), useClearChat())."
  echo "   - Zustand must not manage server entity lifecycle."
  EXIT_CODE=1
fi

if [ "$EXIT_CODE" -eq 0 ]; then
  echo "✅ State architecture lint passed: No prohibited Zustand server collection reads or mutations in components."
fi

exit "$EXIT_CODE"
