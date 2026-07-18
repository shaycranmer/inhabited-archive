#!/usr/bin/env python3

import sys
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path


TOOLS = Path(__file__).resolve().parents[1] / "tools"
sys.path.insert(0, str(TOOLS))

import normalize_corpus_corporum as normalizer  # noqa: E402


TEI = "http://www.tei-c.org/ns/1.0"


def body_from(xml: str) -> ET.Element:
    root = ET.fromstring(xml)
    return next(element for element in root.iter() if normalizer.local_name(element.tag) == "body")


class TextExtractionTests(unittest.TestCase):
    def test_language_aliases_normalize_without_losing_source_vocabulary(self) -> None:
        self.assertEqual(normalizer.canonical_language("la-Latn"), "lat")
        self.assertEqual(normalizer.canonical_language("greek"), "grc")
        self.assertEqual(normalizer.canonical_language("HE"), "heb")
        self.assertEqual(normalizer.canonical_language(""), "und")

    def test_prefers_corrected_and_lemma_text_and_omits_notes(self) -> None:
        element = ET.fromstring(
            f"""<p xmlns="{TEI}">Alpha
            <choice><sic>eror</sic><corr>error</corr></choice>
            <app><lem>six</lem><rdg>seven</rdg></app>
            <note>editorial interruption</note> omega.</p>"""
        )
        self.assertEqual(normalizer.extract_text(element), "Alpha error six omega.")

    def test_direct_note_is_searchable_but_nested_note_is_separable(self) -> None:
        note = ET.fromstring(f"<note xmlns=\"{TEI}\">A substantial editorial witness.</note>")
        self.assertEqual(normalizer.extract_text(note), "A substantial editorial witness.")

        paragraph = ET.fromstring(
            f"<p xmlns=\"{TEI}\">Authorial sentence.<note>Editorial witness.</note> Continues.</p>"
        )
        self.assertEqual(normalizer.extract_text(paragraph), "Authorial sentence. Continues.")


class PassageNormalizationTests(unittest.TestCase):
    def test_legacy_division_heading_and_verse_lines_are_aggregated(self) -> None:
        body = body_from(
            f"""<TEI xmlns="{TEI}"><text><body><div1 n="1">
            <head>Book One</head>
            <l>First sufficiently long line of verse.</l>
            <l>Second sufficiently long line of verse.</l>
            <l>Third sufficiently long line of verse.</l>
            </div1></body></text></TEI>"""
        )
        segments, coverage, _, coarse = normalizer.build_segments(
            body, "cc:test", "lat", 2400, 180, 0.90
        )
        self.assertFalse(coarse)
        self.assertEqual(len(segments), 1)
        self.assertEqual(segments[0]["source_unit_count"], 3)
        self.assertEqual(segments[0]["source_xpath"], "/body[1]/div1[1]/l[1]")
        self.assertEqual(segments[0]["source_xpath_end"], "/body[1]/div1[1]/l[3]")
        self.assertEqual(segments[0]["citation_label"], "Book One")
        self.assertGreater(coverage, 0.70)

    def test_unusual_word_level_text_remains_searchable(self) -> None:
        body = body_from(
            f"""<TEI xmlns="{TEI}"><text><body><div1 n="Genesis">
            <div2 n="1"><w>In</w><w>principio</w><w>creavit</w>
            <w>Deus</w><w>caelum</w><w>et</w><w>terram</w></div2>
            </div1></body></text></TEI>"""
        )
        segments, coverage, _, _ = normalizer.build_segments(
            body, "cc:hebrew-test", "HE", 2400, 180, 0.90
        )
        self.assertEqual(len(segments), 1)
        self.assertEqual(segments[0]["segment_type"], "fallback_chunk")
        self.assertIn("principio", segments[0]["text"])
        self.assertGreaterEqual(coverage, 0.99)


if __name__ == "__main__":
    unittest.main()
