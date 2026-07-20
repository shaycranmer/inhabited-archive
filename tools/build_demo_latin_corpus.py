#!/usr/bin/env python3
"""Build the Inhabited Archive's manifest-driven Perseus Latin search index.

The pinned TEI sources are read-only. This adapter writes a separate,
rebuildable SQLite database using the project's canonical document/segment
schema plus a small Perseus CTS extension.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import sqlite3
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import normalize_corpus_corporum as tei


SCHEMA_VERSION = "number-rants-canonical-v1"
NORMALIZER_VERSION = "perseus-latin-demo-normalizer-v2"
CORPUS_CODE = "perseus-latin-demo"
COLLECTION_LABEL = "Inhabited Archive Perseus Latin 30"
SOURCE_REPOSITORY = "PerseusDL/canonical-latinLit"
GITHUB_REPOSITORY = "https://github.com/PerseusDL/canonical-latinLit"
REQUIRED_FIELDS = {
    "shelf_order",
    "basket",
    "author",
    "work_title",
    "work_urn",
    "edition_urn",
    "language",
    "source_repository",
    "source_commit",
    "source_path",
    "license_spdx",
    "rights_review",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalize_metadata_text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return tei.normalize_text(" ".join(element.itertext()))


def first_element(root: ET.Element, name: str) -> ET.Element | None:
    return next((item for item in root.iter() if tei.local_name(item.tag) == name), None)


def first_metadata_text(root: ET.Element, name: str) -> str:
    return normalize_metadata_text(first_element(root, name))


def clean_cts_citations(
    segments: list[dict[str, object]], edition_urn: str
) -> list[dict[str, object]]:
    """Remove the TEI edition wrapper from the readable citation hierarchy."""

    for segment in segments:
        hierarchy = json.loads(str(segment["citation_path_json"]))
        cleaned = [
            part
            for part in hierarchy
            if not (part.get("type") == "edition" and part.get("n") == edition_urn)
        ]
        segment["citation_path_json"] = json.dumps(cleaned, ensure_ascii=False)
        segment["citation_label"] = tei.context_label(cleaned)
    return segments


def parse_manifest(path: Path, expected_documents: int | None = None) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        missing_fields = REQUIRED_FIELDS - set(reader.fieldnames or [])
        if missing_fields:
            raise ValueError(f"Manifest is missing fields: {sorted(missing_fields)}")
        records = list(reader)

    if not records:
        raise ValueError("Manifest contains no documents")
    if expected_documents is not None and len(records) != expected_documents:
        raise ValueError(
            f"Expected {expected_documents} manifest documents; found {len(records)}"
        )

    orders = [int(record["shelf_order"]) for record in records]
    if orders != list(range(1, len(records) + 1)):
        raise ValueError("Manifest shelf_order must be consecutive and begin at 1")

    for field in ("work_urn", "edition_urn", "source_path"):
        values = [record[field] for record in records]
        if len(values) != len(set(values)):
            raise ValueError(f"Manifest field {field} must be unique")
    if any(record["language"] != "lat" for record in records):
        raise ValueError("The demonstration Latin manifest may contain only language=lat")
    if any(record["source_repository"] != SOURCE_REPOSITORY for record in records):
        raise ValueError(f"Every record must use source_repository={SOURCE_REPOSITORY}")
    return records


def ensure_inside(path: Path, parent: Path) -> None:
    try:
        path.resolve().relative_to(parent.resolve())
    except ValueError as exc:
        raise ValueError(f"Source path escapes pinned repository: {path}") from exc


def current_git_commit(repository: Path) -> str:
    result = subprocess.run(
        ["git", "-C", str(repository), "rev-parse", "HEAD"],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def git_worktree_status(repository: Path) -> str:
    result = subprocess.run(
        ["git", "-C", str(repository), "status", "--porcelain", "--untracked-files=all"],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def verify_sources(
    records: list[dict[str, str]],
    project_root: Path,
    repository_root: Path,
    verify_git: bool,
) -> str:
    commits = {record["source_commit"] for record in records}
    if len(commits) != 1:
        raise ValueError(f"Manifest must pin exactly one source commit; found {sorted(commits)}")
    expected_commit = next(iter(commits))
    if verify_git:
        actual_commit = current_git_commit(repository_root)
        if actual_commit != expected_commit:
            raise ValueError(
                f"Pinned source commit mismatch: manifest={expected_commit}, checkout={actual_commit}"
            )
        dirty_status = git_worktree_status(repository_root)
        if dirty_status:
            first_change = dirty_status.splitlines()[0]
            raise ValueError(
                "Pinned source checkout is not clean; rebuild only from the exact committed "
                f"snapshot (first change: {first_change})"
            )

    for record in records:
        source_path = project_root / record["source_path"]
        ensure_inside(source_path, repository_root)
        if not source_path.is_file():
            raise FileNotFoundError(f"Manifest source is missing: {record['source_path']}")
    return expected_commit


def project_relative(path: Path, project_root: Path) -> str:
    try:
        return str(path.resolve().relative_to(project_root.resolve()))
    except ValueError:
        return str(path.resolve())


def source_url(record: dict[str, str], repository_root: Path, project_root: Path) -> str:
    local_source = project_root / record["source_path"]
    relative = local_source.resolve().relative_to(repository_root.resolve())
    return f"{GITHUB_REPOSITORY}/blob/{record['source_commit']}/{relative.as_posix()}"


def create_database(
    path: Path,
    canonical_schema: Path,
    extension_schema: Path,
    manifest: Path,
    source_commit: str,
) -> sqlite3.Connection:
    connection = sqlite3.connect(path)
    connection.execute("PRAGMA journal_mode = WAL")
    connection.execute("PRAGMA synchronous = NORMAL")
    connection.execute("PRAGMA temp_store = MEMORY")
    connection.executescript(canonical_schema.read_text(encoding="utf-8"))
    connection.executescript(extension_schema.read_text(encoding="utf-8"))
    connection.executemany(
        "INSERT INTO schema_info(key, value) VALUES (?, ?)",
        [
            ("schema_version", SCHEMA_VERSION),
            ("normalizer_version", NORMALIZER_VERSION),
            ("source_adapter", "perseus_latin_demo"),
            ("source_repository", SOURCE_REPOSITORY),
            ("source_commit", source_commit),
            ("source_manifest", str(manifest)),
        ],
    )
    return connection


def insert_issue(
    connection: sqlite3.Connection,
    document_id: str,
    record: dict[str, str],
    severity: str,
    issue_type: str,
    detail: str,
) -> None:
    connection.execute(
        """INSERT INTO ingest_issues
           (document_id, source_id, collection, severity, issue_type, source_path, detail)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            document_id,
            record["edition_urn"],
            COLLECTION_LABEL,
            severity,
            issue_type,
            record["source_path"],
            detail,
        ),
    )


def content_digest(connection: sqlite3.Connection) -> str:
    digest = hashlib.sha256()
    statements = (
        """SELECT document_id, source_id, title, author, source_sha256,
                  rights_statement, segment_count, normalized_char_count
           FROM documents ORDER BY document_id""",
        """SELECT document_id, shelf_order, basket, work_urn, edition_urn,
                  source_repository, source_commit, license_spdx, rights_review
           FROM perseus_latin_documents ORDER BY shelf_order""",
        """SELECT segment_id, document_id, sequence_number, segment_type,
                  source_xpath, source_xpath_end, source_n, citation_label,
                  citation_path_json, text
           FROM segments ORDER BY document_id, sequence_number""",
    )
    for statement in statements:
        for row in connection.execute(statement):
            digest.update(
                json.dumps(row, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
            )
            digest.update(b"\n")
    return digest.hexdigest()


def sqlite_integrity(connection: sqlite3.Connection) -> str:
    return str(connection.execute("PRAGMA integrity_check").fetchone()[0])


def build_database(
    *,
    project_root: Path,
    manifest_path: Path,
    canonical_schema: Path,
    extension_schema: Path,
    output_db: Path,
    summary_path: Path,
    repository_root: Path,
    expected_documents: int | None = None,
    max_chars: int = 1800,
    overlap_chars: int = 160,
    coverage_warning: float = 0.90,
    coarse_fallback_threshold: float = 0.80,
    verify_git: bool = True,
    replace: bool = False,
    generated_at: str | None = None,
) -> dict[str, object]:
    records = parse_manifest(manifest_path, expected_documents)
    source_commit = verify_sources(records, project_root, repository_root, verify_git)

    if output_db.exists() and not replace:
        raise FileExistsError(f"Refusing to replace existing database: {output_db}")
    if summary_path.exists() and not replace:
        raise FileExistsError(f"Refusing to replace existing summary: {summary_path}")
    output_db.parent.mkdir(parents=True, exist_ok=True)
    summary_path.parent.mkdir(parents=True, exist_ok=True)

    handle, temporary_name = tempfile.mkstemp(
        prefix=f".{output_db.name}.", suffix=".building", dir=output_db.parent
    )
    os.close(handle)
    temporary_db = Path(temporary_name)
    temporary_db.unlink()

    ingested_at = generated_at or datetime.now(timezone.utc).isoformat()
    counts: Counter[str] = Counter()
    basket_counts: Counter[str] = Counter()
    segment_type_counts: Counter[str] = Counter()
    source_bytes = 0
    source_text_bytes = 0
    connection = create_database(
        temporary_db, canonical_schema, extension_schema, manifest_path, source_commit
    )

    document_sql = """INSERT INTO documents (
        document_id, schema_version, normalizer_version, corpus_code, source_id,
        collection, title, author, languages_json, source_languages_json,
        publication_date, publisher, edition, series_id, source_url, source_path,
        source_sha256, provenance_path, rights_statement, estimated_source_words,
        ingest_status, segment_count, normalized_char_count, extraction_coverage,
        ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"""
    segment_fields = [
        "segment_id",
        "document_id",
        "sequence_number",
        "segment_type",
        "source_element",
        "source_xpath",
        "source_xpath_end",
        "source_unit_count",
        "source_xml_id",
        "source_n",
        "source_type",
        "language_code",
        "source_language_code",
        "page_marker",
        "citation_label",
        "citation_path_json",
        "part_number",
        "part_count",
        "text",
        "char_count",
        "token_count_approx",
    ]
    segment_sql = (
        f"INSERT INTO segments ({', '.join(segment_fields)}) "
        f"VALUES ({', '.join('?' for _ in segment_fields)})"
    )

    try:
        for index, record in enumerate(records, start=1):
            document_id = f"perseus-latin:{record['edition_urn']}"
            source_path = project_root / record["source_path"]
            source_bytes += source_path.stat().st_size
            source_sha256 = sha256_file(source_path)
            root = ET.parse(source_path).getroot()
            body = first_element(root, "body")
            if body is None:
                raise ValueError(f"TEI body missing: {record['source_path']}")

            text_element = first_element(root, "text")
            source_language = (
                text_element.get(tei.XML_LANG, record["language"])
                if text_element is not None
                else record["language"]
            )
            if tei.canonical_language(source_language) != "lat":
                raise ValueError(
                    f"Selected edition does not declare Latin: {record['edition_urn']} "
                    f"({source_language!r})"
                )

            segments, coverage, body_chars, used_coarse_fallback = tei.build_segments(
                body,
                document_id,
                source_language,
                max_chars,
                overlap_chars,
                coarse_fallback_threshold,
            )
            clean_cts_citations(segments, record["edition_urn"])
            if not segments:
                raise ValueError(f"TEI produced no searchable passages: {record['edition_urn']}")
            source_text_bytes += len(tei.extract_text(body, include_notes=True).encode("utf-8"))

            status = "normalized"
            if used_coarse_fallback:
                status = "normalized_with_warning"
                counts["coarse_fallback_documents"] += 1
                insert_issue(
                    connection,
                    document_id,
                    record,
                    "warning",
                    "coarse_structural_fallback",
                    f"Atomic TEI blocks covered too little text; used broader structure ({coverage:.1%})",
                )
            elif coverage < coverage_warning:
                status = "normalized_with_warning"
                counts["low_coverage_documents"] += 1
                insert_issue(
                    connection,
                    document_id,
                    record,
                    "warning",
                    "low_extraction_coverage",
                    (
                        f"Searchable authorial blocks cover {coverage:.1%} of conservative "
                        "body text; inspect excluded labels or editorial structures"
                    ),
                )

            source_desc = first_metadata_text(root, "sourceDesc")[:8000]
            publication_statement = first_element(root, "publicationStmt")
            publisher = (
                first_metadata_text(publication_statement, "publisher")[:1000]
                if publication_statement is not None
                else ""
            )
            publication_date = (
                first_metadata_text(publication_statement, "date")[:200]
                if publication_statement is not None
                else ""
            )
            estimated_words = sum(int(segment["token_count_approx"]) for segment in segments)
            rights_statement = (
                "Perseus repository default: Creative Commons "
                "Attribution-ShareAlike 4.0 International; selected file audit found "
                "no contrary file-level notice."
            )

            connection.execute(
                document_sql,
                (
                    document_id,
                    SCHEMA_VERSION,
                    NORMALIZER_VERSION,
                    CORPUS_CODE,
                    record["edition_urn"],
                    COLLECTION_LABEL,
                    record["work_title"],
                    record["author"],
                    json.dumps(["lat"]),
                    json.dumps([source_language]),
                    publication_date,
                    publisher,
                    source_desc,
                    record["work_urn"],
                    source_url(record, repository_root, project_root),
                    record["source_path"],
                    source_sha256,
                    project_relative(manifest_path, project_root),
                    rights_statement,
                    estimated_words,
                    status,
                    len(segments),
                    body_chars,
                    coverage,
                    ingested_at,
                ),
            )
            connection.execute(
                """INSERT INTO document_languages
                   (document_id, language_code, source_language_codes_json,
                    language_label, is_primary)
                   VALUES (?, 'lat', ?, 'Latin', 1)""",
                (document_id, json.dumps([source_language])),
            )
            connection.execute(
                """INSERT INTO perseus_latin_documents
                   (document_id, shelf_order, basket, work_urn, edition_urn,
                    source_repository, source_commit, license_spdx, rights_review)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    document_id,
                    int(record["shelf_order"]),
                    record["basket"],
                    record["work_urn"],
                    record["edition_urn"],
                    record["source_repository"],
                    record["source_commit"],
                    record["license_spdx"],
                    record["rights_review"],
                ),
            )
            connection.executemany(
                segment_sql,
                [tuple(segment[field] for field in segment_fields) for segment in segments],
            )

            counts["documents"] += 1
            counts["segments"] += len(segments)
            counts[f"status:{status}"] += 1
            basket_counts[record["basket"]] += 1
            segment_type_counts.update(str(segment["segment_type"]) for segment in segments)
            if index % 5 == 0 or index == len(records):
                connection.commit()
                print(
                    f"Indexed {index}/{len(records)} works; {counts['segments']:,} passages",
                    flush=True,
                )

        connection.execute("INSERT INTO document_search(document_search) VALUES ('rebuild')")
        connection.execute("INSERT INTO segment_search(segment_search) VALUES ('rebuild')")
        connection.commit()
        connection.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        journal_mode = connection.execute("PRAGMA journal_mode = DELETE").fetchone()[0]
        if str(journal_mode).lower() != "delete":
            raise RuntimeError(f"Portable database journal mode is {journal_mode!r}, not DELETE")

        database_counts = {
            "documents": connection.execute("SELECT COUNT(*) FROM documents").fetchone()[0],
            "segments": connection.execute("SELECT COUNT(*) FROM segments").fetchone()[0],
            "document_search_rows": connection.execute(
                "SELECT COUNT(*) FROM document_search"
            ).fetchone()[0],
            "segment_search_rows": connection.execute(
                "SELECT COUNT(*) FROM segment_search"
            ).fetchone()[0],
            "issues": connection.execute("SELECT COUNT(*) FROM ingest_issues").fetchone()[0],
        }
        if database_counts["documents"] != len(records):
            raise RuntimeError("Database document count does not match the manifest")
        if database_counts["segments"] != database_counts["segment_search_rows"]:
            raise RuntimeError("Passage search index is incomplete")
        integrity = sqlite_integrity(connection)
        if integrity != "ok":
            raise RuntimeError(f"SQLite integrity check failed: {integrity}")
        canonical_digest = content_digest(connection)
    except Exception:
        connection.close()
        temporary_db.unlink(missing_ok=True)
        Path(f"{temporary_db}-wal").unlink(missing_ok=True)
        Path(f"{temporary_db}-shm").unlink(missing_ok=True)
        raise
    else:
        connection.close()

    if replace:
        output_db.unlink(missing_ok=True)
        summary_path.unlink(missing_ok=True)
    os.replace(temporary_db, output_db)

    summary: dict[str, object] = {
        "schema_version": SCHEMA_VERSION,
        "normalizer_version": NORMALIZER_VERSION,
        "generated_at": ingested_at,
        "source_manifest": project_relative(manifest_path, project_root),
        "source_repository": SOURCE_REPOSITORY,
        "source_commit": source_commit,
        "database": project_relative(output_db, project_root),
        "database_bytes": output_db.stat().st_size,
        "canonical_content_sha256": canonical_digest,
        "source_xml_bytes": source_bytes,
        "source_text_utf8_bytes": source_text_bytes,
        "counts": dict(counts),
        "database_counts": database_counts,
        "basket_document_counts": dict(sorted(basket_counts.items())),
        "segment_type_counts": dict(segment_type_counts.most_common()),
        "parameters": {
            "max_chars": max_chars,
            "overlap_chars": overlap_chars,
            "coverage_warning": coverage_warning,
            "coarse_fallback_threshold": coarse_fallback_threshold,
        },
        "sqlite_integrity_check": integrity,
        "sqlite_journal_mode": "delete",
    }
    summary_path.write_text(
        json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Wrote {output_db}")
    print(f"Wrote {summary_path}")
    print(json.dumps(database_counts, indent=2))
    return summary


def main(argv: Iterable[str] | None = None) -> int:
    project_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description="Build the Inhabited Archive's 30-work Perseus Latin index"
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=project_root / "sources/indexes/demo_latin_30.csv",
    )
    parser.add_argument(
        "--repository-root",
        type=Path,
        default=project_root / "sources/raw/perseus-latin",
    )
    parser.add_argument(
        "--canonical-schema",
        type=Path,
        default=project_root / "schema/canonical_schema_v1.sql",
    )
    parser.add_argument(
        "--extension-schema",
        type=Path,
        default=project_root / "schema/perseus_latin_demo_extension_v1.sql",
    )
    parser.add_argument(
        "--output-db",
        type=Path,
        default=project_root / "derived/demo_latin/perseus_latin_demo_v1.sqlite3",
    )
    parser.add_argument(
        "--summary",
        type=Path,
        default=project_root / "derived/demo_latin/perseus_latin_demo_v1.summary.json",
    )
    parser.add_argument("--expected-documents", type=int, default=30)
    parser.add_argument("--max-chars", type=int, default=1800)
    parser.add_argument("--overlap-chars", type=int, default=160)
    parser.add_argument("--coverage-warning", type=float, default=0.90)
    parser.add_argument("--coarse-fallback-threshold", type=float, default=0.80)
    parser.add_argument("--skip-git-check", action="store_true")
    parser.add_argument("--replace", action="store_true")
    args = parser.parse_args(argv)

    build_database(
        project_root=project_root,
        manifest_path=args.manifest,
        canonical_schema=args.canonical_schema,
        extension_schema=args.extension_schema,
        output_db=args.output_db,
        summary_path=args.summary,
        repository_root=args.repository_root,
        expected_documents=args.expected_documents,
        max_chars=args.max_chars,
        overlap_chars=args.overlap_chars,
        coverage_warning=args.coverage_warning,
        coarse_fallback_threshold=args.coarse_fallback_threshold,
        verify_git=not args.skip_git_check,
        replace=args.replace,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
