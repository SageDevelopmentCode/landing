#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck disable=SC1091
source "$ROOT/scripts/load-local-supabase-env.sh"

echo "Building with local Supabase env (not .env.local production keys)..."
if [[ "${E2E_SKIP_BUILD:-}" != "1" ]]; then
  npm run build
else
  echo "Skipping build (E2E_SKIP_BUILD=1)"
fi

exec npx playwright test "$@"
