#!/usr/bin/env python3
"""Reconcile pre-fix Sefaria `.bin` paths with canonical JSON paths.

The initial downloader used URL parsing that treated semicolons as parameter
separators when deriving a suffix. Content identity was always the full source
URL, so affected payloads can be validated and moved without redownloading.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import importlib.util
import json
import os
from pathlib import Path


def load_module(path: Path):
    spec = importlib.util.spec_from_file_location("acquire_sefaria_json", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not import {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def latest_statuses(path: Path) -> dict[str, dict]:
    result = {}
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if row.get("record_id"):
                result[row["record_id"]] = row
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--index", required=True, type=Path)
    parser.add_argument("--acquisition-root", required=True, type=Path)
    parser.add_argument("--acquirer", required=True, type=Path)
    args = parser.parse_args()

    acquirer = load_module(args.acquirer)
    index = json.loads(args.index.read_text(encoding="utf-8"))
    queue = acquirer.build_queue(index, args.acquisition_root)
    manifest_path = args.acquisition_root / "acquisition_manifest.jsonl"
    statuses = latest_statuses(manifest_path)
    reconciled = []
    errors = []

    with manifest_path.open("a", encoding="utf-8") as manifest:
        for item in queue:
            status = statuses.get(item["record_id"])
            if not status or status.get("status") != "success":
                continue
            canonical = args.acquisition_root / item["local_path"]
            if canonical.exists():
                continue
            old_relative = status.get("local_path")
            old_path = args.acquisition_root / str(old_relative or "")
            try:
                if not old_relative or not old_path.is_file():
                    raise FileNotFoundError("recorded successful payload not found")
                expected = item.get("expected_bytes")
                if expected is not None and old_path.stat().st_size != int(expected):
                    raise ValueError(
                        f"size mismatch: expected {expected}, found {old_path.stat().st_size}"
                    )
                acquirer.validate_payload(
                    old_path, allow_empty=expected is not None and int(expected) == 0
                )
                actual_hash = acquirer.sha256_file(old_path)
                recorded_hash = status.get("sha256")
                if recorded_hash and actual_hash != recorded_hash:
                    raise ValueError("SHA-256 mismatch against acquisition manifest")
                canonical.parent.mkdir(parents=True, exist_ok=True)
                os.replace(old_path, canonical)
                receipt = {
                    **item,
                    "status": "success",
                    "resumed_existing": True,
                    "reconciled_from": str(old_relative),
                    "bytes": canonical.stat().st_size,
                    "sha256": actual_hash,
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                }
                manifest.write(json.dumps(receipt, ensure_ascii=False) + "\n")
                manifest.flush()
                reconciled.append(receipt)
            except (OSError, ValueError, json.JSONDecodeError) as exc:
                errors.append(
                    {
                        "record_id": item["record_id"],
                        "canonical_path": item["local_path"],
                        "recorded_path": old_relative,
                        "error": f"{type(exc).__name__}: {exc}",
                    }
                )

    summary = {
        "reconciled_count": len(reconciled),
        "error_count": len(errors),
        "errors": errors,
    }
    (args.acquisition_root / "path_reconciliation_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
