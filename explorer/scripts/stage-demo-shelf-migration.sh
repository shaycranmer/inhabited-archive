#!/usr/bin/env bash
set -euo pipefail

explorer_dir="$(cd "$(dirname "$0")/.." && pwd)"
project_dir="$(cd "$explorer_dir/.." && pwd)"
source_sql="$project_dir/derived/demo_latin/perseus_latin_demo_v1.d1.sql"
target_sql="$explorer_dir/dist/.openai/drizzle/0002_seed_latin_shelf.sql"
expected_sha256="ad05cf17a79b736d3c868308a1d380adcbaca9b8a3fc3d7dc1b978b7073c4647"

if [[ ! -f "$source_sql" ]]; then
  echo "The verified D1 serving shelf is missing. Run pnpm shelf:export first." >&2
  exit 1
fi

actual_sha256="$(shasum -a 256 "$source_sql" | awk '{print $1}')"
if [[ "$actual_sha256" != "$expected_sha256" ]]; then
  echo "The D1 serving shelf does not match the reviewed deployment receipt." >&2
  exit 1
fi

mkdir -p "$(dirname "$target_sql")"
cp "$source_sql" "$target_sql"
echo "$target_sql"
