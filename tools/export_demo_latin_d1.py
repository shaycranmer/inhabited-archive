#!/usr/bin/env python3
"""Export the verified local Latin shelf into a D1-compatible SQL import.

The 97 MB SQLite derivative remains ignored. This creates a rebuildable serving
artifact from its small, rights-cleared public projection without modifying the
source database.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sqlite3
from pathlib import Path
from typing import Iterable


def sql_literal(value: object) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, bytes):
        return f"X'{value.hex()}'"
    return "'" + str(value).replace("'", "''") + "'"


def insert_statement(table: str, columns: tuple[str, ...], row: Iterable[object]) -> str:
    values = ", ".join(sql_literal(value) for value in row)
    return f"INSERT OR REPLACE INTO {table} ({', '.join(columns)}) VALUES ({values});\n"


def export_d1_import(
    *,
    database: Path,
    summary_path: Path,
    migration_path: Path,
    output_path: Path,
    expected_documents: int = 30,
    expected_segments: int = 61651,
    catalogue_path: Path | None = None,
) -> dict[str, object]:
    if output_path.exists():
        raise FileExistsError(f"Refusing to replace existing D1 import: {output_path}")
    if not database.is_file():
        raise FileNotFoundError(f"Latin demonstration database not found: {database}")
    if not summary_path.is_file():
        raise FileNotFoundError(f"Latin build receipt not found: {summary_path}")
    if not migration_path.is_file():
        raise FileNotFoundError(f"D1 schema migration not found: {migration_path}")
    catalogue_path = catalogue_path or Path(__file__).resolve().parents[1] / "sources/indexes/demo_latin_catalogue_scope.csv"
    if not catalogue_path.is_file():
        raise FileNotFoundError(f"Reviewed catalogue scope metadata not found: {catalogue_path}")
    catalogue_bytes = catalogue_path.read_bytes()
    with catalogue_path.open(encoding="utf-8", newline="") as catalogue_handle:
        catalogue_rows = list(csv.DictReader(catalogue_handle))
    if len(catalogue_rows) != expected_documents:
        raise ValueError(
            f"The reviewed scope catalogue has {len(catalogue_rows)} works; expected {expected_documents}"
        )
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    source_commit = str(summary.get("source_commit", ""))
    content_sha256 = str(summary.get("canonical_content_sha256", ""))
    if len(source_commit) != 40 or len(content_sha256) != 64:
        raise ValueError("The Latin build receipt is missing its source or content hash")

    migration = migration_path.read_text(encoding="utf-8").replace(
        "--> statement-breakpoint", ""
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(f"file:{database}?mode=ro", uri=True)
    try:
        connection.row_factory = sqlite3.Row
        counts = {
            "documents": connection.execute("SELECT COUNT(*) FROM documents").fetchone()[0],
            "segments": connection.execute("SELECT COUNT(*) FROM segments").fetchone()[0],
            "shelf_documents": connection.execute(
                "SELECT COUNT(*) FROM perseus_latin_documents"
            ).fetchone()[0],
        }
        expected_counts = {
            "documents": expected_documents,
            "segments": expected_segments,
            "shelf_documents": expected_documents,
        }
        if counts != expected_counts:
            raise ValueError(f"The Latin shelf shape is unexpected: {counts}")

        with output_path.open("x", encoding="utf-8", newline="\n") as handle:
            handle.write("-- Generated from the verified Perseus Latin demonstration shelf.\n")
            handle.write("-- Do not edit by hand; rerun tools/export_demo_latin_d1.py.\n")
            handle.write(migration)
            if not migration.endswith("\n"):
                handle.write("\n")

            document_columns = (
                "document_id",
                "title",
                "author",
                "source_url",
                "source_sha256",
                "rights_statement",
            )
            for row in connection.execute(
                f"SELECT {', '.join(document_columns)} FROM documents ORDER BY rowid"
            ):
                handle.write(insert_statement("documents", document_columns, row))

            segment_columns = (
                "rowid",
                "segment_id",
                "document_id",
                "sequence_number",
                "segment_type",
                "source_xpath",
                "source_xpath_end",
                "source_n",
                "citation_label",
                "text",
            )
            for row in connection.execute(
                f"SELECT {', '.join(segment_columns)} FROM segments ORDER BY rowid"
            ):
                handle.write(insert_statement("segments", segment_columns, row))

            shelf_columns = (
                "document_id",
                "shelf_order",
                "basket",
                "work_urn",
                "edition_urn",
            )
            for row in connection.execute(
                f"SELECT {', '.join(shelf_columns)} "
                "FROM perseus_latin_documents ORDER BY shelf_order"
            ):
                handle.write(
                    insert_statement("perseus_latin_documents", shelf_columns, row)
                )

            catalogue_columns = (
                "work_urn",
                "composition_start_year",
                "composition_end_year",
                "date_label",
                "date_certainty",
                "genre_tags_json",
                "tradition_tags_json",
                "scope_note",
            )
            for row in catalogue_rows:
                handle.write(insert_statement(
                    "work_catalogue_scope",
                    catalogue_columns,
                    (
                        row["work_urn"],
                        int(row["composition_start_year"]),
                        int(row["composition_end_year"]),
                        row["date_label"],
                        row["date_certainty"],
                        json.dumps(row["genre_tags"].split("|"), separators=(",", ":")),
                        json.dumps(row["tradition_tags"].split("|"), separators=(",", ":")),
                        row["scope_note"],
                    ),
                ))

            receipt_rows = (
                ("corpus_id", "perseus-latin-demo-v1"),
                ("source_commit", source_commit),
                ("content_sha256", content_sha256),
                ("document_count", str(counts["documents"])),
                ("segment_count", str(counts["segments"])),
                ("catalogue_scope_sha256", hashlib.sha256(catalogue_bytes).hexdigest()),
            )
            for row in receipt_rows:
                handle.write(
                    insert_statement("shelf_receipt", ("key", "value"), row)
                )
            handle.write("INSERT INTO segment_search(segment_search) VALUES('rebuild');\n")
    finally:
        connection.close()

    return {
        "output": str(output_path),
        "output_bytes": output_path.stat().st_size,
        "source_commit": source_commit,
        "content_sha256": content_sha256,
        **counts,
    }


def main() -> int:
    project_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--database",
        type=Path,
        default=project_root / "derived/demo_latin/perseus_latin_demo_v1.sqlite3",
    )
    parser.add_argument(
        "--catalogue",
        type=Path,
        default=project_root / "sources/indexes/demo_latin_catalogue_scope.csv",
    )
    parser.add_argument(
        "--summary",
        type=Path,
        default=project_root / "derived/demo_latin/perseus_latin_demo_v1.summary.json",
    )
    parser.add_argument(
        "--migration",
        type=Path,
        default=project_root / "explorer/drizzle/0000_latin_shelf.sql",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=project_root / "derived/demo_latin/perseus_latin_demo_v1.d1.sql",
    )
    args = parser.parse_args()
    print(
        json.dumps(
            export_d1_import(
                database=args.database,
                summary_path=args.summary,
                migration_path=args.migration,
                output_path=args.output,
                catalogue_path=args.catalogue,
            ),
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
