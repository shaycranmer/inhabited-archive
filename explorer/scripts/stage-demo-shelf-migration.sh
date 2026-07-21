#!/usr/bin/env bash
set -euo pipefail

explorer_dir="$(cd "$(dirname "$0")/.." && pwd)"
project_dir="$(cd "$explorer_dir/.." && pwd)"
source_sql="$project_dir/derived/demo_latin/perseus_latin_demo_v1.d1.sql"
migration_dir="$explorer_dir/dist/.openai/drizzle"
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

mkdir -p "$migration_dir"
split -l 12000 -a 2 "$source_sql" "$migration_dir/seed_part_"

index=2
for part in "$migration_dir"/seed_part_*; do
  printf -v migration_name "%04d_seed_latin_shelf.sql" "$index"
  mv "$part" "$migration_dir/$migration_name"
  index=$((index + 1))
done

staged_count=$((index - 2))
if [[ "$staged_count" -lt 2 ]]; then
  echo "The serving shelf did not split into the expected migration sequence." >&2
  exit 1
fi

echo "$staged_count ordered shelf migrations staged in $migration_dir"
