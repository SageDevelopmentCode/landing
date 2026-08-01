#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$ROOT/scripts/load-local-supabase-env.sh"
echo "Building Next.js for e2e (local Supabase only)..."
exec npm run build
