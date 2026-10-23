#!/usr/bin/env bash
set -euo pipefail

# Mechanical network linter enforcing CODING_STANDARDS.md § 3
# Prohibits hardcoded localhost ports in client-side code (apps/web/src)

EXIT_CODE=0

echo "🔍 Checking client codebase for hardcoded localhost network endpoints..."

# Match localhost:[0-9]+ or 127.0.0.1:[0-9]+ inside apps/web/src, ignoring test files
matches=$(git grep -inE '(localhost|127\.0\.0\.1):[0-9]+' -- 'apps/web/src/**' || true)

if [ -n "$matches" ]; then
  echo "❌ Network Lint Violation: Hardcoded localhost ports detected in client code (CODING_STANDARDS.md § 3)"
  echo "$matches"
  echo ""
  echo "💡 Remedy: Use relative API endpoints (/api/v1/...) or import.meta.env.VITE_API_BASE_URL so requests route via Vite's proxy."
  EXIT_CODE=1
else
  echo "✅ Network lint passed: No hardcoded localhost ports in client code."
fi

exit "$EXIT_CODE"
