#!/usr/bin/env python3
"""Create a broad source inventory from the Sefaria public export index."""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


DEFAULT_TOP_CATEGORIES = {"Jewish Thought", "Kabbalah", "Midrash", "Second Temple"}


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: filter_sefaria_index.py BOOKS.json OUTPUT.csv", file=sys.stderr)
        return 2

    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    data = json.loads(source.read_text(encoding="utf-8"))
    rows = []
    for book in data.get("books", []):
        categories = book.get("categories") or []
        if not categories or categories[0] not in DEFAULT_TOP_CATEGORIES:
            continue
        rows.append(
            {
                "title": book.get("title", ""),
                "language": book.get("language", ""),
                "version_title": book.get("versionTitle", ""),
                "categories": " > ".join(categories),
                "json_url": book.get("json_url", ""),
                "txt_url": book.get("txt_url", ""),
                "cltk_full_url": book.get("cltk_full_url", ""),
                "cltk_flat_url": book.get("cltk_flat_url", ""),
            }
        )

    rows.sort(key=lambda row: (row["categories"], row["title"], row["language"], row["version_title"]))
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"wrote {len(rows)} Sefaria source/version records to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
