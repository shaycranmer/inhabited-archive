#!/usr/bin/env python3
"""Inventory CTS-style TEI repositories without interpreting their texts."""

from __future__ import annotations

import csv
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


CTS = {"ti": "http://chs.harvard.edu/xmlns/cts"}
XML_LANG = "{http://www.w3.org/XML/1998/namespace}lang"


def clean(value: str | None) -> str:
    return " ".join((value or "").split())


def first_text(nodes: list[ET.Element], preferred_languages: tuple[str, ...]) -> str:
    for language in preferred_languages:
        for node in nodes:
            if node.get(XML_LANG) == language and clean(node.text):
                return clean(node.text)
    for node in nodes:
        if clean(node.text):
            return clean(node.text)
    return ""


def inventory_repository(corpus: str, repository: Path):
    data = repository / "data"
    for author_dir in sorted(path for path in data.iterdir() if path.is_dir()):
        author_meta = author_dir / "__cts__.xml"
        if not author_meta.exists():
            continue
        try:
            author_root = ET.parse(author_meta).getroot()
        except ET.ParseError:
            continue
        author = first_text(
            author_root.findall("ti:groupname", CTS), ("eng", "lat", "grc")
        )
        author_urn = author_root.get("urn", "")

        for work_dir in sorted(path for path in author_dir.iterdir() if path.is_dir()):
            work_meta = work_dir / "__cts__.xml"
            if not work_meta.exists():
                continue
            try:
                work_root = ET.parse(work_meta).getroot()
            except ET.ParseError:
                continue
            title = first_text(
                work_root.findall("ti:title", CTS), ("eng", "lat", "grc")
            )
            work_urn = work_root.get("urn", "")
            for kind in ("edition", "translation"):
                for item in work_root.findall(f"ti:{kind}", CTS):
                    urn = item.get("urn", "")
                    filename = f"{urn.rsplit(':', 1)[-1]}.xml" if urn else ""
                    text_path = work_dir / filename if filename else None
                    label = first_text(
                        item.findall("ti:label", CTS), ("eng", "lat", "grc")
                    )
                    description = first_text(
                        item.findall("ti:description", CTS),
                        ("eng", "mul", "lat", "grc"),
                    )
                    yield {
                        "corpus": corpus,
                        "author": author,
                        "author_urn": author_urn,
                        "work_title": title,
                        "work_urn": work_urn,
                        "representation_type": kind,
                        "representation_urn": urn,
                        "language": item.get(XML_LANG, ""),
                        "label": label,
                        "description": description,
                        "local_path": str(text_path) if text_path else "",
                        "file_present": bool(text_path and text_path.exists()),
                    }


def main() -> int:
    if len(sys.argv) < 4 or (len(sys.argv) - 2) % 2:
        print(
            "usage: inventory_cts.py OUTPUT.csv CORPUS_NAME REPOSITORY "
            "[CORPUS_NAME REPOSITORY ...]",
            file=sys.stderr,
        )
        return 2

    output = Path(sys.argv[1])
    pairs = zip(sys.argv[2::2], sys.argv[3::2])
    rows = []
    for corpus, repository in pairs:
        rows.extend(inventory_repository(corpus, Path(repository)))

    output.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "corpus",
        "author",
        "author_urn",
        "work_title",
        "work_urn",
        "representation_type",
        "representation_urn",
        "language",
        "label",
        "description",
        "local_path",
        "file_present",
    ]
    with output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    print(f"wrote {len(rows)} representations to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
