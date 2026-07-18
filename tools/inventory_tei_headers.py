#!/usr/bin/env python3
"""Inventory generic TEI files from their headers."""

from __future__ import annotations

import csv
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


TEI = {"tei": "http://www.tei-c.org/ns/1.0"}
XML_LANG = "{http://www.w3.org/XML/1998/namespace}lang"


def text(node: ET.Element | None) -> str:
    return " ".join("".join(node.itertext()).split()) if node is not None else ""


def main() -> int:
    if len(sys.argv) != 4:
        print("usage: inventory_tei_headers.py CORPUS INPUT_DIR OUTPUT.csv", file=sys.stderr)
        return 2

    corpus, input_dir, output_name = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
    rows = []
    for path in sorted(input_dir.rglob("*.xml")):
        try:
            root = ET.parse(path).getroot()
        except ET.ParseError:
            continue
        header = root.find("tei:teiHeader", TEI)
        if header is None:
            continue
        titles = header.findall(".//tei:titleStmt/tei:title", TEI)
        main_title = next((node for node in titles if node.get("level") == "a"), None)
        if main_title is None and titles:
            main_title = titles[0]
        series_title = next((node for node in titles if node.get("level") == "s"), None)
        author = header.find(".//tei:titleStmt/tei:author", TEI)
        identifier = header.find(".//tei:publicationStmt/tei:idno", TEI)
        creation = header.find(".//tei:profileDesc/tei:creation/tei:origDate", TEI)
        language = header.find(".//tei:profileDesc/tei:langUsage/tei:language", TEI)
        licence = header.find(".//tei:publicationStmt//tei:licence", TEI)
        revision = header.find(".//tei:revisionDesc", TEI)
        rows.append(
            {
                "corpus": corpus,
                "title": text(main_title),
                "series_title": text(series_title),
                "author": text(author),
                "work_ref": main_title.get("ref", "") if main_title is not None else "",
                "document_uri": text(identifier),
                "language_code": language.get("ident", "") if language is not None else "",
                "language_label": text(language),
                "composition_date": text(creation),
                "revision_status": revision.get("status", "") if revision is not None else "",
                "license_url": licence.get("target", "") if licence is not None else "",
                "local_path": str(path),
            }
        )

    output_name.parent.mkdir(parents=True, exist_ok=True)
    with output_name.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"wrote {len(rows)} TEI documents to {output_name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
