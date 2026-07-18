#!/usr/bin/env python3
"""Profile observed TEI structures in the Corpus Corporum acquisition."""

from __future__ import annotations

import argparse
import csv
import json
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


BLOCK_TAGS = {
    "ab",
    "argument",
    "byline",
    "cell",
    "closer",
    "dateline",
    "epigraph",
    "head",
    "item",
    "l",
    "label",
    "opener",
    "p",
    "q",
    "quote",
    "s",
    "salute",
    "signed",
    "td",
}


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def namespace(tag: str) -> str:
    return tag[1:].split("}", 1)[0] if tag.startswith("{") else ""


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    fields = [
        "collection",
        "documents",
        "parse_errors",
        "missing_body",
        "documents_with_div",
        "documents_with_numbered_div",
        "documents_with_p",
        "documents_with_l",
        "documents_with_s",
        "documents_with_w",
        "documents_requiring_fallback",
        "top_body_tags",
        "namespaces",
    ]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--output-json", required=True, type=Path)
    parser.add_argument("--output-csv", required=True, type=Path)
    args = parser.parse_args()

    with args.manifest.open(encoding="utf-8", newline="") as handle:
        records = list(csv.DictReader(handle))

    collections: dict[str, dict[str, object]] = defaultdict(
        lambda: {
            "documents": 0,
            "parse_errors": 0,
            "missing_body": 0,
            "documents_with_div": 0,
            "documents_with_numbered_div": 0,
            "documents_with_p": 0,
            "documents_with_l": 0,
            "documents_with_s": 0,
            "documents_with_w": 0,
            "documents_requiring_fallback": 0,
            "tag_document_frequency": Counter(),
            "tag_occurrences": Counter(),
            "namespaces": Counter(),
        }
    )
    global_tags: Counter[str] = Counter()
    global_namespaces: Counter[str] = Counter()

    for index, record in enumerate(records, start=1):
        collection = record["collection"]
        stats = collections[collection]
        stats["documents"] = int(stats["documents"]) + 1
        path = args.root / record["primary_xml_path"]
        try:
            root = ET.parse(path).getroot()
        except (ET.ParseError, OSError, UnicodeError):
            stats["parse_errors"] = int(stats["parse_errors"]) + 1
            continue

        body = next((element for element in root.iter() if local_name(element.tag) == "body"), None)
        if body is None:
            stats["missing_body"] = int(stats["missing_body"]) + 1
            continue

        tags = Counter(local_name(element.tag) for element in body.iter())
        namespaces = Counter(namespace(element.tag) for element in body.iter())
        present = set(tags)
        stats["tag_document_frequency"].update(present)
        stats["tag_occurrences"].update(tags)
        stats["namespaces"].update(namespaces)
        global_tags.update(tags)
        global_namespaces.update(namespaces)

        tests = {
            "documents_with_div": "div" in present,
            "documents_with_numbered_div": any(f"div{level}" in present for level in range(1, 8)),
            "documents_with_p": "p" in present,
            "documents_with_l": "l" in present,
            "documents_with_s": "s" in present,
            "documents_with_w": "w" in present,
        }
        for key, value in tests.items():
            if value:
                stats[key] = int(stats[key]) + 1
        if not (present & BLOCK_TAGS):
            stats["documents_requiring_fallback"] = int(stats["documents_requiring_fallback"]) + 1

        if index % 500 == 0 or index == len(records):
            print(f"Profiled {index:,}/{len(records):,} documents", flush=True)

    collection_rows = []
    detail = {}
    for collection, stats in sorted(collections.items()):
        tag_occurrences = stats.pop("tag_occurrences")
        tag_document_frequency = stats.pop("tag_document_frequency")
        namespaces = stats.pop("namespaces")
        row = dict(stats)
        row.update(
            {
                "collection": collection,
                "top_body_tags": "|".join(
                    f"{tag}:{count}" for tag, count in tag_occurrences.most_common(20)
                ),
                "namespaces": "|".join(
                    f"{name or '[none]'}:{count}" for name, count in namespaces.most_common()
                ),
            }
        )
        collection_rows.append(row)
        detail[collection] = {
            **stats,
            "tag_document_frequency": dict(tag_document_frequency.most_common()),
            "tag_occurrences": dict(tag_occurrences.most_common()),
            "namespaces": dict(namespaces.most_common()),
        }

    output = {
        "schema_version": "tei-structure-profile-v1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "documents_in_manifest": len(records),
        "collections": detail,
        "global_tag_occurrences": dict(global_tags.most_common()),
        "global_namespaces": dict(global_namespaces.most_common()),
    }
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_csv(args.output_csv, collection_rows)
    print(f"Wrote {args.output_json}", flush=True)
    print(f"Wrote {args.output_csv}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
