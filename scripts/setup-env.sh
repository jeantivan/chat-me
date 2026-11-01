#!/usr/bin/env bash
set -euo pipefail

# Non-interactive, idempotent environment provisioning script
# Provisions .env from .env.example and injects cryptographic secrets when absent.

TARGET_DIR="${1:-${TARGET_DIR:-.}}"

generate_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

ensure_secret() {
  local env_file="$1"
  local var_name="$2"

  local current_value
  current_value=$(grep -E "^${var_name}=" "$env_file" 2>/dev/null | tail -n 1 | cut -d '=' -f 2- | tr -d '\r\n"' | tr -d "'" || true)

  if [ -n "$current_value" ]; then
    : # Non-empty secret already present
  elif grep -qE "^${var_name}=" "$env_file"; then
    local secret
    secret=$(generate_secret)
    sed -i "s|^${var_name}=.*|${var_name}=${secret}|" "$env_file"
  else
    local secret
    secret=$(generate_secret)
    echo "${var_name}=${secret}" >> "$env_file"
  fi
}

ensure_secrets_in_file() {
  local env_file="$1"
  [ -f "$env_file" ] || return 0

  # Ensure file ends with newline before appending
  if [ -s "$env_file" ] && [ "$(tail -c 1 "$env_file")" != "" ]; then
    echo "" >> "$env_file"
  fi

  ensure_secret "$env_file" "JWT_SECRET"
  ensure_secret "$env_file" "COOKIE_SECRET"
}

provision_target() {
  local base_dir="$1"
  local example_file="${base_dir}/.env.example"
  local env_file="${base_dir}/.env"

  if [ -f "$example_file" ]; then
    if [ ! -f "$env_file" ]; then
      cp "$example_file" "$env_file"
      echo "Created ${env_file} from template."
    fi
    ensure_secrets_in_file "$env_file"
  fi
}

# Provision root / target directory if template exists
provision_target "$TARGET_DIR"

# Also provision apps/server if it exists within target directory
if [ -d "${TARGET_DIR}/apps/server" ]; then
  provision_target "${TARGET_DIR}/apps/server"
fi

echo "Environment provisioning completed."
exit 0
