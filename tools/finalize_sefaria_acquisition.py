#!/usr/bin/env python3
"""Validate and consolidate a completed Sefaria acquisition manifest."""

from __future__ import annotations

import argparse
from collections import Counter
import csv
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
from typing import Any


FIELDS = [
    "record_id",
    "kind",
    "title",
    "hebrew_title",
    "catalog_language",
    "actual_language",
    "version_title",
    "version_source",
    "license",
    "edition_status",
    "is_primary",
    "categories",
    "section_names",
    "source_path",
    "source_url",
    "local_path",
    "bytes",
    "sha256",
    "completed_at",
]


def load_acquirer(path: Path):
    spec = importlib.util.spec_from_file_location("acquire_sefaria_json", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not import acquisition module from {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def latest_statuses(path: Path) -> dict[str, dict[str, Any]]:
    statuses: dict[str, dict[str, Any]] = {}
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            record_id = str(row.get("record_id") or "")
            if record_id:
                statuses[record_id] = row
    return statuses


def text_metadata(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        return {}
    return {
        "title": payload.get("title", ""),
        "hebrew_title": payload.get("heTitle", ""),
        "actual_language": payload.get("actualLanguage", ""),
        "version_title": payload.get("versionTitle", ""),
        "version_source": payload.get("versionSource", ""),
        "license": payload.get("license", ""),
        "edition_status": payload.get("status", ""),
        "is_primary": payload.get("isPrimary", ""),
        "section_names": " > ".join(payload.get("sectionNames") or []),
    }


def sha256_file(path: Path, chunk_size: int = 8 * 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(chunk_size):
            digest.update(chunk)
    return digest.hexdigest()


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--index", required=True, type=Path)
    parser.add_argument("--acquisition-root", required=True, type=Path)
    parser.add_argument("--acquirer", required=True, type=Path)
    args = parser.parse_args()

    acquirer = load_acquirer(args.acquirer)
    index = json.loads(args.index.read_text(encoding="utf-8"))
    queue = acquirer.build_queue(index, args.acquisition_root)
    statuses = latest_statuses(args.acquisition_root / "acquisition_manifest.jsonl")
    rows = []
    missing = []
    failures = []
    validation_errors = []
    licenses = Counter()
    languages = Counter()
    top_categories = Counter()

    for item in queue:
        status = statuses.get(item["record_id"])
        if not status:
            missing.append(item["record_id"])
            continue
        if status.get("status") != "success":
            failures.append(
                {
                    "record_id": item["record_id"],
                    "source_path": item["source_path"],
                    "error": status.get("error", ""),
                }
            )
            continue
        path = args.acquisition_root / item["local_path"]
        if not path.exists():
            validation_errors.append(
                {"record_id": item["record_id"], "error": "successful record file missing"}
            )
            continue
        expected = item.get("expected_bytes")
        if expected is not None and path.stat().st_size != int(expected):
            validation_errors.append(
                {
                    "record_id": item["record_id"],
                    "error": f"size mismatch: expected {expected}, found {path.stat().st_size}",
                }
            )
            continue

        actual_sha256 = sha256_file(path)
        recorded_sha256 = str(status.get("sha256") or "")
        if recorded_sha256 and actual_sha256 != recorded_sha256:
            validation_errors.append(
                {
                    "record_id": item["record_id"],
                    "error": "SHA-256 mismatch against acquisition manifest",
                }
            )
            continue

        if item["kind"] != "text" and path.suffix == ".json" and path.stat().st_size:
            try:
                with path.open(encoding="utf-8") as handle:
                    json.load(handle)
            except (OSError, UnicodeError, json.JSONDecodeError) as exc:
                validation_errors.append(
                    {
                        "record_id": item["record_id"],
                        "error": f"{type(exc).__name__}: {exc}",
                    }
                )
                continue

        payload_metadata = {}
        if item["kind"] == "text":
            try:
                payload_metadata = text_metadata(path)
            except (OSError, UnicodeError, json.JSONDecodeError) as exc:
                validation_errors.append(
                    {
                        "record_id": item["record_id"],
                        "error": f"{type(exc).__name__}: {exc}",
                    }
                )
                continue
        row = {
            **item,
            **payload_metadata,
            "catalog_language": item.get("language", ""),
            "categories": " > ".join(item.get("categories") or []),
            "source_url": item["url"],
            "bytes": path.stat().st_size,
            "sha256": actual_sha256,
            "completed_at": status.get("completed_at", ""),
        }
        rows.append(row)
        if item["kind"] == "text":
            licenses[str(row.get("license") or "[unspecified]")] += 1
            languages[str(row.get("actual_language") or row.get("catalog_language") or "[unspecified]")] += 1
            categories = item.get("categories") or []
            top_categories[str(categories[0] if categories else "[uncategorized]")] += 1

    manifest_path = args.acquisition_root / "corpus_manifest.csv"
    write_csv(manifest_path, rows)
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_index_generated_at": index.get("generated_at"),
        "planned_objects": len(queue),
        "validated_objects": len(rows),
        "validated_text_versions": sum(row["kind"] == "text" for row in rows),
        "validated_schemas": sum(row["kind"] == "schema" for row in rows),
        "validated_link_or_metadata_objects": sum(
            row["kind"] == "link_or_metadata" for row in rows
        ),
        "total_bytes": sum(int(row["bytes"]) for row in rows),
        "missing_count": len(missing),
        "failed_count": len(failures),
        "validation_error_count": len(validation_errors),
        "license_counts": dict(licenses.most_common()),
        "language_counts": dict(languages.most_common()),
        "top_category_counts": dict(top_categories.most_common()),
        "missing_record_ids": missing,
        "failures": failures,
        "validation_errors": validation_errors,
        "manifest": manifest_path.name,
    }
    summary_path = args.acquisition_root / "corpus_summary.json"
    summary_path.write_text(
        json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(json.dumps(summary, indent=2, ensure_ascii=False), flush=True)
    return 1 if missing or failures or validation_errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
