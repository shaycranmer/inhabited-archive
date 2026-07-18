#!/usr/bin/env python3
"""Verify that the Number Rants library survived a drive or computer move.

The quick audit checks the card catalogs, expected files, pinned Git commits,
and canonical SQLite database. ``--deep`` additionally recomputes large-file
and per-record content hashes; it is slower but appropriate before deleting an
old copy of the library.
"""

from __future__ import annotations

import argparse
import csv
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
from typing import Any, Callable


EXPECTED_COMMITS = {
    "patristic-text-archive": "524eb9763b1181bc9f14edf52943bfe2f7a43aed",
    "coptic-scriptorium": "d6332e37c7f92c737f51deb4f6e7ee872bfd603f",
    "etcbc-bhsa": "4db00e2157915495e1a4d3d57e41223df24775da",
}


def digest_file(path: Path, algorithm: str, chunk_size: int = 8 * 1024 * 1024) -> str:
    digest = hashlib.new(algorithm)
    with path.open("rb") as handle:
        while chunk := handle.read(chunk_size):
            digest.update(chunk)
    return digest.hexdigest()


class Audit:
    def __init__(self) -> None:
        self.checks: list[dict[str, Any]] = []

    def check(self, name: str, action: Callable[[], str]) -> None:
        try:
            detail = action()
            self.checks.append({"name": name, "status": "pass", "detail": detail})
        except Exception as exc:  # report the whole shelf instead of stopping early
            self.checks.append(
                {
                    "name": name,
                    "status": "fail",
                    "detail": f"{type(exc).__name__}: {exc}",
                }
            )

    @property
    def passed(self) -> bool:
        return all(item["status"] == "pass" for item in self.checks)


def require(condition: bool, detail: str) -> None:
    if not condition:
        raise ValueError(detail)


def main() -> int:
    default_project = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", type=Path, default=default_project)
    parser.add_argument("--deep", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    project = args.project.resolve()
    raw = project / "sources" / "raw"
    indexes = project / "sources" / "indexes"
    derived = project / "derived" / "normalized" / "corpus_corporum"
    audit = Audit()

    def project_layout() -> str:
        required = [project / "tools", raw, indexes, derived]
        missing = [str(path) for path in required if not path.exists()]
        require(not missing, f"missing paths: {missing}")
        return f"project root {project}"

    audit.check("project layout", project_layout)

    def corpus_corporum_catalog() -> str:
        manifest = indexes / "corpus_corporum" / "corpus_manifest.csv"
        source_root = raw / "catholic-corpus-build" / "02_corpus_corporum"
        with manifest.open(encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        require(len(rows) == 10078, f"expected 10,078 records, found {len(rows):,}")
        missing = []
        for row in rows:
            relative = row.get("primary_xml_path") or ""
            if not relative or not (source_root / relative).is_file():
                missing.append(relative or row.get("source_id") or "[unknown]")
        require(not missing, f"{len(missing):,} primary XML files missing")
        return "10,078/10,078 catalogued text sets resolve locally"

    audit.check("Corpus Corporum catalog", corpus_corporum_catalog)

    def canonical_database() -> str:
        database = derived / "corpus_corporum_librarian_v1.sqlite3"
        require(database.is_file(), f"missing {database}")
        connection = sqlite3.connect(f"file:{database}?mode=ro", uri=True)
        try:
            integrity = connection.execute("PRAGMA quick_check").fetchone()[0]
            documents = connection.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
            passages = connection.execute("SELECT COUNT(*) FROM segments").fetchone()[0]
        finally:
            connection.close()
        require(integrity == "ok", f"SQLite quick_check returned {integrity!r}")
        require(documents == 9939, f"expected 9,939 documents, found {documents:,}")
        require(passages == 1491851, f"expected 1,491,851 passages, found {passages:,}")
        return "SQLite ok; 9,939 documents and 1,491,851 passages"

    audit.check("canonical Corpus Corporum database", canonical_database)

    def sefaria_catalog() -> str:
        root = raw / "sefaria-json-2026-07-02"
        summary = json.loads((root / "corpus_summary.json").read_text(encoding="utf-8"))
        require(summary["validated_objects"] == 26322, "validated object count changed")
        require(summary["missing_count"] == 0, "summary reports missing objects")
        require(summary["failed_count"] == 0, "summary reports failed objects")
        require(summary["validation_error_count"] == 0, "summary reports validation errors")
        files = sum(1 for path in (root / "records").rglob("*") if path.is_file())
        require(files == 26322, f"expected 26,322 record files, found {files:,}")
        return "26,322/26,322 structured objects present"

    audit.check("Sefaria catalog", sefaria_catalog)

    def openiti_catalog() -> str:
        root = raw / "openiti-2025.1.9"
        summary = json.loads((root / "corpus_summary.json").read_text(encoding="utf-8"))
        require(summary["checksum_valid"] is True, "stored release checksum is not valid")
        require(summary["metadata_version_count"] == 14107, "metadata version count changed")
        require(summary["missing_text_count"] == 0, "summary reports missing texts")
        files = sum(1 for path in (root / "extracted").rglob("*") if path.is_file())
        require(files == 59640, f"expected 59,640 extracted files, found {files:,}")
        return "14,107/14,107 versions resolve; 59,640 extracted files present"

    audit.check("OpenITI catalog", openiti_catalog)

    for directory, expected in EXPECTED_COMMITS.items():
        def git_commit(directory: str = directory, expected: str = expected) -> str:
            path = raw / directory
            completed = subprocess.run(
                ["git", "-C", str(path), "rev-parse", "HEAD"],
                check=True,
                capture_output=True,
                text=True,
            )
            actual = completed.stdout.strip()
            require(actual == expected, f"expected {expected}, found {actual}")
            return actual

        audit.check(f"pinned Git commit: {directory}", git_commit)

    if args.deep:
        def openiti_archive_hash() -> str:
            path = raw / "openiti-2025.1.9" / "OpenITI_data_2025-1-9.zip"
            actual = digest_file(path, "md5")
            expected = "95cf19a9320fee6c37c4c26c9fa860b1"
            require(actual == expected, f"expected {expected}, found {actual}")
            return actual

        audit.check("deep hash: OpenITI release archive", openiti_archive_hash)

        def canonical_database_hash() -> str:
            path = derived / "corpus_corporum_librarian_v1.sqlite3"
            actual = digest_file(path, "sha256")
            expected = "9a94293a38a9d8c0d6bc3e3d630e53f60090171e75ad9b15bc8109344388dde6"
            require(actual == expected, f"expected {expected}, found {actual}")
            return actual

        audit.check("deep hash: canonical Corpus Corporum database", canonical_database_hash)

        def sefaria_record_hashes() -> str:
            root = raw / "sefaria-json-2026-07-02"
            manifest = root / "corpus_manifest.csv"
            checked = 0
            with manifest.open(encoding="utf-8", newline="") as handle:
                for row in csv.DictReader(handle):
                    path = root / row["local_path"]
                    require(path.is_file(), f"missing {row['local_path']}")
                    actual = digest_file(path, "sha256")
                    require(actual == row["sha256"], f"hash mismatch: {row['record_id']}")
                    checked += 1
            require(checked == 26322, f"expected 26,322 hashes, checked {checked:,}")
            return "26,322/26,322 record hashes match"

        audit.check("deep hashes: Sefaria records", sefaria_record_hashes)

    result = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "project": str(project),
        "mode": "deep" if args.deep else "quick",
        "status": "pass" if audit.passed else "fail",
        "checks": audit.checks,
    }
    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered, end="")
    return 0 if audit.passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
