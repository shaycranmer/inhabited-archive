#!/usr/bin/env python3

import csv
import hashlib
import sqlite3
import subprocess
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
    <teiHeader><revisionDesc><change><date>2026-07-19</date>Fixture revision</change></revisionDesc>
    <fileDesc><titleStmt><title>{title}</title><author>Tester</author></titleStmt>
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
                "Domus viatoris procul posita desiderium patriae excitat. Vita brevis est. "
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
            self.assertEqual(summary["sqlite_journal_mode"], "delete")

            read_only = sqlite3.connect(f"file:{root / 'demo.sqlite3'}?mode=ro", uri=True)
            try:
                self.assertEqual(
                    read_only.execute("PRAGMA integrity_check").fetchone()[0],
                    "ok",
                )
                self.assertEqual(
                    read_only.execute("SELECT COUNT(*) FROM segments").fetchone()[0],
                    2,
                )
            finally:
                read_only.close()

            connection = sqlite3.connect(root / "demo.sqlite3")
            try:
                results = searcher.search_database(connection, '"somnia"', limit=5)
                document = connection.execute(
                    """SELECT d.source_sha256, p.work_urn, p.edition_urn, d.publication_date
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
            self.assertEqual(document[3], "1900")

    def test_verified_build_rejects_a_dirty_pinned_checkout(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            manifest, repository = self.make_fixture(root)
            subprocess.run(["git", "init", "-q", str(repository)], check=True)
            subprocess.run(
                ["git", "-C", str(repository), "config", "user.email", "fixture@example.test"],
                check=True,
            )
            subprocess.run(
                ["git", "-C", str(repository), "config", "user.name", "Fixture"],
                check=True,
            )
            subprocess.run(["git", "-C", str(repository), "add", "."], check=True)
            subprocess.run(
                ["git", "-C", str(repository), "commit", "-q", "-m", "fixture"],
                check=True,
            )
            records = builder.parse_manifest(manifest, expected_documents=2)
            commit = builder.current_git_commit(repository)
            for record in records:
                record["source_commit"] = commit

            self.assertEqual(
                builder.verify_sources(records, root, repository, verify_git=True),
                commit,
            )
            source = repository / "data/a/w1/a.w1.demo-lat1.xml"
            source.write_text(source.read_text(encoding="utf-8") + "\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "not clean"):
                builder.verify_sources(records, root, repository, verify_git=True)

    def test_canonical_content_digest_is_reproducible(self) -> None:
        with tempfile.TemporaryDirectory() as first_temporary, tempfile.TemporaryDirectory() as second_temporary:
            first = self.build_fixture(Path(first_temporary), "first")
            second = self.build_fixture(Path(second_temporary), "second")
            self.assertEqual(
                first["canonical_content_sha256"], second["canonical_content_sha256"]
            )

    def test_literal_query_quotes_words_and_rejects_punctuation_only(self) -> None:
        query_any = searcher.literal_fts_query("domus patria", "any")
        query_all = searcher.literal_fts_query("domus patria", "all")
        self.assertIn('"domus"', query_any)
        self.assertIn('"domvs"', query_any)
        self.assertIn('("patria" OR "patrja")', query_any)
        self.assertIn(') AND ("patria" OR "patrja")', query_all)
        with self.assertRaises(ValueError):
            searcher.literal_fts_query("---", "any")

    def test_literal_query_is_mechanically_uv_and_ij_insensitive(self) -> None:
        self.assertEqual(
            set(searcher.latin_orthographic_variants("vita")),
            {"uita", "vita", "ujta", "vjta"},
        )
        self.assertEqual(
            set(searcher.latin_orthographic_variants("iam")),
            {"iam", "jam"},
        )
        with self.assertRaises(ValueError):
            searcher.latin_orthographic_variants("i" * 7)

        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.build_fixture(root, "orthography")
            connection = sqlite3.connect(root / "orthography.sqlite3")
            try:
                results = searcher.search_database(
                    connection,
                    searcher.literal_fts_query("uita", "any"),
                    limit=5,
                )
            finally:
                connection.close()
            self.assertEqual(len(results), 1)
            self.assertIn("Vita brevis est", results[0]["text"])

    def test_preview_counts_matches_and_samples_distinct_works(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.build_fixture(root, "preview")
            connection = sqlite3.connect(root / "preview.sqlite3")
            try:
                preview = searcher.preview_database(
                    connection, '"memoriam"', sample_limit=3
                )
                empty = searcher.preview_database(
                    connection, '"nonexistentterm"', sample_limit=3
                )
            finally:
                connection.close()

            self.assertEqual(preview["status"], "matches_found")
            self.assertEqual(preview["total_segment_matches"], 2)
            self.assertEqual(preview["total_document_matches"], 2)
            self.assertEqual(len(preview["samples"]), 2)
            self.assertEqual(
                len({sample["document_id"] for sample in preview["samples"]}), 2
            )
            self.assertTrue(
                all(sample["source_sha256"] for sample in preview["samples"])
            )
            self.assertTrue(
                all("⟦memoriam⟧" in sample["snippet"] for sample in preview["samples"])
            )
            self.assertIn("not relevance judgments", preview["notice"])
            self.assertIn("u/v and i/j", preview["orthographic_matching"])
            self.assertEqual(empty["status"], "no_matches")
            self.assertEqual(empty["total_segment_matches"], 0)
            self.assertEqual(empty["samples"], [])

    def test_preview_rejects_unbounded_sample_requests(self) -> None:
        connection = sqlite3.connect(":memory:")
        try:
            with self.assertRaises(ValueError):
                searcher.preview_database(connection, '"domus"', sample_limit=0)
            with self.assertRaises(ValueError):
                searcher.preview_database(connection, '"domus"', sample_limit=11)
        finally:
            connection.close()


if __name__ == "__main__":
    unittest.main()
