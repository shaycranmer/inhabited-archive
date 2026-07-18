#!/usr/bin/env python3

import sys
import sqlite3
import tempfile
import unittest
from pathlib import Path


TOOLS = Path(__file__).resolve().parents[1] / "tools"
sys.path.insert(0, str(TOOLS))

import acquire_sefaria_json as sefaria  # noqa: E402
import acquire_verified_zip as archive  # noqa: E402
import finalize_openiti_acquisition as openiti  # noqa: E402


class SefariaPathTests(unittest.TestCase):
    def test_literal_question_mark_is_preserved_then_percent_encoded(self) -> None:
        url = (
            "https://storage.googleapis.com/sefaria-export/"
            "schemas/One_People?_Tradition.json"
        )
        source_path = sefaria.source_object_path(url)
        self.assertEqual(source_path, "schemas/One_People?_Tradition.json")
        self.assertEqual(
            sefaria.request_url(source_path),
            "https://storage.googleapis.com/sefaria-export/"
            "schemas/One_People%3F_Tradition.json",
        )

    def test_semicolon_title_retains_json_suffix(self) -> None:
        url = (
            "https://storage.googleapis.com/sefaria-export/"
            "schemas/Giving;_A_Kabbalah_Reader.json"
        )
        self.assertEqual(sefaria.suffix_for_url(url), ".json")

    def test_provider_object_named_dot_json_uses_neutral_suffix(self) -> None:
        url = (
            "https://storage.googleapis.com/sefaria-export/"
            "json/Example/English/.json"
        )
        self.assertEqual(sefaria.suffix_for_url(url), ".bin")

    def test_url_identity_is_stable_and_collision_safe(self) -> None:
        first = "https://storage.googleapis.com/sefaria-export/json/A.json"
        second = "https://storage.googleapis.com/sefaria-export/json/a.json"
        self.assertEqual(sefaria.url_identity(first), sefaria.url_identity(first))
        self.assertNotEqual(sefaria.url_identity(first), sefaria.url_identity(second))


class ArchiveSafetyTests(unittest.TestCase):
    def test_zip_member_cannot_escape_extraction_root(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaises(ValueError):
                archive.safe_member_path(root, "../outside.txt")

    def test_normal_zip_member_resolves_inside_root(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            destination = archive.safe_member_path(root, "author/work/text.txt")
            self.assertEqual(
                destination, (root / "author" / "work" / "text.txt").resolve()
            )


class OpenITIPathTests(unittest.TestCase):
    def test_metadata_data_prefix_and_stage_suffix_resolve(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            relative = Path("0001Author/0001Author.Work/0001Author.Work.Source-ara1")
            destination = Path(f"{root / relative}.completed")
            destination.parent.mkdir(parents=True)
            destination.write_text("######OpenITI#\n", encoding="utf-8")
            located = openiti.locate_text(root, f"data/{relative}")
            self.assertEqual(located, destination)


class OpenITISchemaTests(unittest.TestCase):
    def test_extension_installs_over_canonical_schema(self) -> None:
        schema_root = Path(__file__).resolve().parents[1] / "schema"
        canonical = (schema_root / "canonical_schema_v1.sql").read_text(encoding="utf-8")
        extension = (schema_root / "openiti_extension_v1.sql").read_text(encoding="utf-8")
        connection = sqlite3.connect(":memory:")
        try:
            connection.executescript(canonical)
            connection.executescript(extension)
            tables = {
                row[0]
                for row in connection.execute(
                    "SELECT name FROM sqlite_master WHERE type = 'table'"
                )
            }
        finally:
            connection.close()
        self.assertIn("openiti_versions", tables)
        self.assertIn("openiti_segment_locators", tables)


if __name__ == "__main__":
    unittest.main()
