#!/usr/bin/env python3

import json
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

import export_demo_latin_d1 as exporter  # noqa: E402


class D1ExportTests(unittest.TestCase):
    def test_projects_a_small_verified_shelf_with_receipts_and_escaped_text(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            database = root / "shelf.sqlite3"
            connection = sqlite3.connect(database)
            try:
                connection.executescript(
                    """
                    CREATE TABLE documents (
                      document_id TEXT, title TEXT, author TEXT, source_url TEXT,
                      source_sha256 TEXT, rights_statement TEXT
                    );
                    CREATE TABLE segments (
                      segment_id TEXT, document_id TEXT, sequence_number INTEGER,
                      segment_type TEXT, source_xpath TEXT, source_xpath_end TEXT,
                      source_n TEXT, citation_label TEXT, text TEXT
                    );
                    CREATE TABLE perseus_latin_documents (
                      document_id TEXT, shelf_order INTEGER, basket TEXT,
                      work_urn TEXT, edition_urn TEXT
                    );
                    """
                )
                connection.execute(
                    "INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?)",
                    (
                        "doc-1",
                        "A Test Work",
                        "Tester",
                        "https://example.test/source",
                        "a" * 64,
                        "CC BY-SA 4.0",
                    ),
                )
                connection.execute(
                    "INSERT INTO segments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (
                        "seg-1",
                        "doc-1",
                        1,
                        "prose",
                        "/text/p",
                        "/text/p",
                        "1",
                        "1",
                        "Domus viatoris isn't silent.",
                    ),
                )
                connection.execute(
                    "INSERT INTO perseus_latin_documents VALUES (?, ?, ?, ?, ?)",
                    ("doc-1", 1, "test", "urn:work", "urn:edition"),
                )
                connection.commit()
            finally:
                connection.close()

            summary = root / "summary.json"
            summary.write_text(
                json.dumps({
                    "source_commit": "b" * 40,
                    "canonical_content_sha256": "c" * 64,
                }),
                encoding="utf-8",
            )
            migration = root / "migration.sql"
            migration.write_text(
                """CREATE TABLE shelf_receipt (key TEXT, value TEXT);
                CREATE TABLE work_catalogue_scope (
                  work_urn TEXT, composition_start_year INTEGER, composition_end_year INTEGER,
                  date_label TEXT, date_certainty TEXT, genre_tags_json TEXT,
                  tradition_tags_json TEXT, scope_note TEXT
                );
                """,
                encoding="utf-8",
            )
            catalogue = root / "catalogue.csv"
            catalogue.write_text(
                "work_urn,composition_start_year,composition_end_year,date_label,date_certainty,genre_tags,tradition_tags,scope_note\n"
                "urn:work,100,110,c. 100–110 CE,probable,history|letters,classical_latin,Fixture scope metadata.\n",
                encoding="utf-8",
            )
            output = root / "import.sql"

            receipt = exporter.export_d1_import(
                database=database,
                summary_path=summary,
                migration_path=migration,
                output_path=output,
                expected_documents=1,
                expected_segments=1,
                catalogue_path=catalogue,
            )
            text = output.read_text(encoding="utf-8")
            self.assertEqual(receipt["segments"], 1)
            self.assertIn("isn''t silent", text)
            self.assertIn("'source_commit', '" + "b" * 40 + "'", text)
            self.assertIn("INSERT INTO segment_search(segment_search) VALUES('rebuild')", text)
            self.assertIn("work_catalogue_scope", text)
            self.assertIn("catalogue_scope_sha256", text)

    def test_refuses_to_replace_an_existing_import(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            output = root / "exists.sql"
            output.write_text("keep", encoding="utf-8")
            with self.assertRaises(FileExistsError):
                exporter.export_d1_import(
                    database=root / "missing.sqlite3",
                    summary_path=root / "missing.json",
                    migration_path=root / "missing.sql",
                    output_path=output,
                )


if __name__ == "__main__":
    unittest.main()
