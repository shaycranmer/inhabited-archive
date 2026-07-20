#!/usr/bin/env python3

import csv
import hashlib
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"
sys.path.insert(0, str(TOOLS))

import build_demo_latin_corpus as builder  # noqa: E402
import search_demo_latin_corpus as searcher  # noqa: E402


TEI = "http://www.tei-c.org/ns/1.0"


def source_xml(edition_urn: str, title: str, text: str) -> str:
    return f"""<TEI xmlns="{TEI}" xml:lang="lat">
    <teiHeader><fileDesc><titleStmt><title>{title}</title><author>Tester</author></titleStmt>
    <publicationStmt><publisher>Test Press</publisher><date>1900</date></publicationStmt>
    <sourceDesc><bibl>Test public-domain edition</bibl></sourceDesc></fileDesc></teiHeader>
    <text xml:lang="lat"><body><div type="edition" n="{edition_urn}">
    <div type="textpart" subtype="book" n="1"><head>Book One</head>
    <div type="textpart" subtype="chapter" n="1"><p n="1">{text}</p></div>
    </div></div></body></text></TEI>"""


class DemoLatinCorpusTests(unittest.TestCase):
    def make_fixture(self, directory: Path) -> tuple[Path, Path]:
        repository = directory / "sources/raw/perseus-latin"
        first = repository / "data/a/w1/a.w1.demo-lat1.xml"
        second = repository / "data/b/w2/b.w2.demo-lat1.xml"
        first.parent.mkdir(parents=True)
        second.parent.mkdir(parents=True)
        first.write_text(
            source_xml(
                "urn:cts:latinLit:a.w1.demo-lat1",
                "First Work",
                "Somnia homines monent et memoriam renovant in nocte quieta. "
                "Interpretes causas somniorum diligenter inter se comparant.",
            ),
            encoding="utf-8",
        )
        second.write_text(
            source_xml(
                "urn:cts:latinLit:b.w2.demo-lat1",
                "Second Work",
                "Domus viatoris procul posita desiderium patriae excitat. "
                "Epistulae absentium memoriam amicorum cotidie conservant.",
            ),
            encoding="utf-8",
        )
        manifest = directory / "manifest.csv"
        fields = [
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
        ]
        rows = [
            [
                "1",
                "test",
                "First Author",
                "First Work",
                "urn:cts:latinLit:a.w1",
                "urn:cts:latinLit:a.w1.demo-lat1",
                "lat",
                builder.SOURCE_REPOSITORY,
                "test-commit",
                str(first.relative_to(directory)),
                "CC-BY-SA-4.0",
                "fixture",
            ],
            [
                "2",
                "test",
                "Second Author",
                "Second Work",
                "urn:cts:latinLit:b.w2",
                "urn:cts:latinLit:b.w2.demo-lat1",
                "lat",
                builder.SOURCE_REPOSITORY,
                "test-commit",
                str(second.relative_to(directory)),
                "CC-BY-SA-4.0",
                "fixture",
            ],
        ]
        with manifest.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.writer(handle)
            writer.writerow(fields)
            writer.writerows(rows)
        return manifest, repository

    def build_fixture(self, directory: Path, name: str) -> dict[str, object]:
        manifest, repository = self.make_fixture(directory)
        return builder.build_database(
            project_root=directory,
            manifest_path=manifest,
            canonical_schema=ROOT / "schema/canonical_schema_v1.sql",
            extension_schema=ROOT / "schema/perseus_latin_demo_extension_v1.sql",
            output_db=directory / f"{name}.sqlite3",
            summary_path=directory / f"{name}.summary.json",
            repository_root=repository,
            expected_documents=2,
            verify_git=False,
            generated_at="2026-07-19T00:00:00+00:00",
        )

    def test_build_preserves_sources_and_searches_with_receipts(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            manifest, repository = self.make_fixture(root)
            source = repository / "data/a/w1/a.w1.demo-lat1.xml"
            before = hashlib.sha256(source.read_bytes()).hexdigest()
            summary = builder.build_database(
                project_root=root,
                manifest_path=manifest,
                canonical_schema=ROOT / "schema/canonical_schema_v1.sql",
                extension_schema=ROOT / "schema/perseus_latin_demo_extension_v1.sql",
                output_db=root / "demo.sqlite3",
                summary_path=root / "demo.summary.json",
                repository_root=repository,
                expected_documents=2,
                verify_git=False,
                generated_at="2026-07-19T00:00:00+00:00",
            )
            after = hashlib.sha256(source.read_bytes()).hexdigest()
            self.assertEqual(before, after)
            self.assertEqual(summary["database_counts"]["documents"], 2)
            self.assertEqual(summary["sqlite_integrity_check"], "ok")

            connection = sqlite3.connect(root / "demo.sqlite3")
            try:
                results = searcher.search_database(connection, '"somnia"', limit=5)
                document = connection.execute(
                    """SELECT d.source_sha256, p.work_urn, p.edition_urn
                       FROM documents d JOIN perseus_latin_documents p USING(document_id)
                       WHERE p.shelf_order = 1"""
                ).fetchone()
            finally:
                connection.close()
            self.assertEqual(len(results), 1)
            self.assertEqual(results[0]["author"], "First Author")
            self.assertEqual(results[0]["citation_label"], "Book One > 1")
            self.assertEqual(document[0], before)
            self.assertEqual(document[1], "urn:cts:latinLit:a.w1")
            self.assertEqual(document[2], "urn:cts:latinLit:a.w1.demo-lat1")

    def test_canonical_content_digest_is_reproducible(self) -> None:
        with tempfile.TemporaryDirectory() as first_temporary, tempfile.TemporaryDirectory() as second_temporary:
            first = self.build_fixture(Path(first_temporary), "first")
            second = self.build_fixture(Path(second_temporary), "second")
            self.assertEqual(
                first["canonical_content_sha256"], second["canonical_content_sha256"]
            )

    def test_literal_query_quotes_words_and_rejects_punctuation_only(self) -> None:
        self.assertEqual(searcher.literal_fts_query("domus patria", "any"), '"domus" OR "patria"')
        self.assertEqual(searcher.literal_fts_query("domus patria", "all"), '"domus" AND "patria"')
        with self.assertRaises(ValueError):
            searcher.literal_fts_query("---", "any")


if __name__ == "__main__":
    unittest.main()
