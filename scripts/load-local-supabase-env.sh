#!/usr/bin/env bash
# Loads keys from local `supabase start` only. Never reads .env.local or production.
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI is required. Install: https://supabase.com/docs/guides/cli"
  exit 1
fi

SUPABASE_ENV_FILE="${TMPDIR:-/tmp}/sagefield-supabase-env.$$"
if ! supabase status -o env > "$SUPABASE_ENV_FILE" 2>/dev/null; then
  rm -f "$SUPABASE_ENV_FILE"
  echo "Local Supabase is not running. Run: npm run db:start"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$SUPABASE_ENV_FILE"
set +a
rm -f "$SUPABASE_ENV_FILE"

export NEXT_PUBLIC_SUPABASE_URL="${API_URL:-http://127.0.0.1:54321}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${ANON_KEY:-}"
export SUPABASE_SERVICE_ROLE_KEY="${SECRET_KEY:-${SERVICE_ROLE_KEY:-}}"
export SECRET_KEY="${SECRET_KEY:-}"
export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_e2e_placeholder}"
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3000}"

if [[ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
  echo "Missing local Supabase keys from supabase status."
  exit 1
fi

# Hard block: never run e2e against hosted Supabase (production or staging).
case "$NEXT_PUBLIC_SUPABASE_URL" in
  *127.0.0.1*|*localhost*)
    ;;
  *)
    echo "ERROR: E2E must use local Supabase only (127.0.0.1 or localhost)."
    echo "Refusing to run with URL: $NEXT_PUBLIC_SUPABASE_URL"
    echo "Production keys from .env.local are NOT used — start local stack: npm run db:start"
    exit 1
    ;;
esac

if [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"supabase.co"* ]]; then
  echo "ERROR: E2E must not use hosted Supabase (supabase.co)."
  exit 1
fi
