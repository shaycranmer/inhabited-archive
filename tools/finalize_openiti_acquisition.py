#!/usr/bin/env python3
"""Validate an extracted OpenITI release against its published metadata."""

from __future__ import annotations

import argparse
from collections import Counter
import csv
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path


TEXT_SUFFIXES = ("", ".completed", ".mARkdown", ".inProgress")


def md5(path: Path, chunk_size: int = 8 * 1024 * 1024) -> str:
    digest = hashlib.md5(usedforsecurity=False)
    with path.open("rb") as handle:
        while chunk := handle.read(chunk_size):
            digest.update(chunk)
    return digest.hexdigest()


def locate_text(root: Path, metadata_path: str) -> Path | None:
    relative = Path(metadata_path)
    if relative.parts and relative.parts[0] == "data":
        relative = Path(*relative.parts[1:])
    base = root / relative
    for suffix in TEXT_SUFFIXES:
        candidate = Path(f"{base}{suffix}")
        if candidate.is_file():
            return candidate
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--metadata", required=True, type=Path)
    parser.add_argument("--extracted-root", required=True, type=Path)
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--expected-md5", required=True)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    rows = []
    missing = []
    stages = Counter()
    statuses = Counter()
    languages = Counter()
    subcorpora = Counter()
    unique_books = set()
    total_tokens = 0
    total_characters = 0

    with args.metadata.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        for row in reader:
            rows.append(row)
            unique_books.add(row["book"])
            statuses[row["status"] or "[unspecified]"] += 1
            languages[row["language"] or "[unspecified]"] += 1
            subcorpora[row["subcorpus"] or "[unspecified]"] += 1
            total_tokens += int(row["tok_length"] or 0)
            total_characters += int(row["char_length"] or 0)
            text_path = locate_text(args.extracted_root, row["local_path"])
            if text_path is None:
                missing.append(
                    {
                        "version_uri": row["version_uri"],
                        "status": row["status"],
                        "local_path": row["local_path"],
                    }
                )
            else:
                name = text_path.name
                stage = next(
                    (suffix[1:] for suffix in TEXT_SUFFIXES[1:] if name.endswith(suffix)),
                    "plain",
                )
                stages[stage] += 1

    actual_md5 = md5(args.archive)
    all_files = sum(1 for path in args.extracted_root.rglob("*") if path.is_file())
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "archive": str(args.archive),
        "archive_bytes": args.archive.stat().st_size,
        "expected_md5": args.expected_md5.lower(),
        "actual_md5": actual_md5,
        "checksum_valid": actual_md5 == args.expected_md5.lower(),
        "extracted_file_count": all_files,
        "metadata_version_count": len(rows),
        "unique_book_count": len(unique_books),
        "resolved_text_count": len(rows) - len(missing),
        "missing_text_count": len(missing),
        "status_counts": dict(statuses.most_common()),
        "text_stage_counts": dict(stages.most_common()),
        "language_counts": dict(languages.most_common()),
        "subcorpus_counts": dict(subcorpora.most_common()),
        "metadata_token_total": total_tokens,
        "metadata_character_total": total_characters,
        "missing_texts": missing,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)
    return 0 if summary["checksum_valid"] and not missing else 1


if __name__ == "__main__":
    raise SystemExit(main())
