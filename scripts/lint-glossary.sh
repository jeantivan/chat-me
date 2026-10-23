#!/usr/bin/env bash
set -euo pipefail

# Mechanical glossary term checker enforcing GLOSSARY.md domain rules

EXIT_CODE=0

check_prohibited() {
  local pattern="$1"
  local reason="$2"
  
  # Search within source directories, excluding dist, node_modules, tests
  local matches
  matches=$(git grep -inE "$pattern" -- 'apps/*/src/**' 'packages/*/src/**' || true)
  
  if [ -n "$matches" ]; then
    echo "❌ Glossary Violation: $reason"
    echo "$matches"
    echo ""
    EXIT_CODE=1
  fi
}

echo "🔍 Checking codebase against GLOSSARY.md terms..."

check_prohibited 'privacy_read_confirmation|privacyReadConfirmation|read_confirmation' \
  "Use 'receipt' / 'privacy_read_receipt' instead of 'confirmation' (GLOSSARY.md: Receipt)"

check_prohibited 'delivery_tag|deliveryTag' \
  "Use 'receipt' instead of 'delivery tag' (GLOSSARY.md: Receipt)"

check_prohibited 'ack_state|ackState' \
  "Use 'delivery_status' instead of 'ack state' (GLOSSARY.md: Delivery Status)"

check_prohibited 'read_pointer|readPointer' \
  "Use 'read_watermark' instead of 'read pointer' (GLOSSARY.md: Read Watermark)"

if [ "$EXIT_CODE" -eq 0 ]; then
  echo "✅ Glossary lint passed: No prohibited domain terms detected."
else
  echo "❌ Glossary lint failed: Please fix prohibited domain terms."
fi

exit "$EXIT_CODE"
