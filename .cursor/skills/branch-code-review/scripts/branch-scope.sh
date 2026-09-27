#!/usr/bin/env bash
# Read-only git triage for branch-code-review skill.
# Usage: branch-scope.sh [base-ref]
# Default base-ref: origin/main
# Reviews: current checkout (HEAD) vs base — all commits on the branch, not uncommitted changes.

set -euo pipefail

BASE="${1:-origin/main}"
HEAD_REF="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "HEAD")"
MERGE_BASE="$(git merge-base "$BASE" HEAD 2>/dev/null || true)"

echo "=== branch-scope ==="
echo "branch:     $HEAD_REF"
echo "base:       $BASE"
echo "merge-base: ${MERGE_BASE:-<none — branch may not share history with base>}"

COMMIT_COUNT="$(git rev-list --count "${BASE}..HEAD" 2>/dev/null || echo 0)"
echo "commits:    $COMMIT_COUNT (on HEAD not in $BASE)"
echo ""

if [[ "$COMMIT_COUNT" == "0" ]]; then
  echo "No commits on HEAD ahead of $BASE."
  echo "Uncommitted changes are NOT included unless the user asks for them."
  git status --short 2>/dev/null | head -20 || true
  exit 0
fi

echo "=== log (${BASE}..HEAD) ==="
git log --oneline "${BASE}..HEAD"
echo ""

echo "=== diff stat (${BASE}...HEAD) ==="
git diff --shortstat "${BASE}...HEAD"
echo ""

echo "=== per-commit (newest first) ==="
while IFS= read -r sha; do
  [[ -z "$sha" ]] && continue
  subject="$(git log -1 --format=%s "$sha")"
  stat_line="$(git show --stat --format= "$sha" | tail -1)"
  echo "--- $sha $subject"
  echo "    $stat_line"
  git show --name-only --format= "$sha" | tail -n +2
  echo ""
done < <(git rev-list --reverse "${BASE}..HEAD")
