#!/usr/bin/env python3
"""Create a reproducible structural snapshot of acquired Git corpora."""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET


def git(path: Path, *arguments: str) -> str:
    return subprocess.check_output(
        ["git", "-C", str(path), *arguments], text=True
    ).strip()


def directory_bytes(path: Path) -> int:
    return sum(item.stat().st_size for item in path.rglob("*") if item.is_file())


def suffix_counts(files: list[Path]) -> dict[str, int]:
    counts = Counter()
    for path in files:
        name = path.name.casefold()
        if name.endswith(".tei.xml"):
            counts[".tei.xml"] += 1
        elif name.endswith(".pos.xml"):
            counts[".pos.xml"] += 1
        else:
            counts[path.suffix.casefold() or "[no suffix]"] += 1
    return dict(sorted(counts.items(), key=lambda item: (-item[1], item[0])))


def xml_profile(files: list[Path]) -> dict[str, object]:
    roots = Counter()
    languages = Counter()
    parse_errors = []
    for path in files:
        try:
            root = ET.parse(path).getroot()
        except (ET.ParseError, OSError, UnicodeError) as exc:
            parse_errors.append({"path": str(path), "error": f"{type(exc).__name__}: {exc}"})
            continue
        roots[root.tag.rsplit("}", 1)[-1]] += 1
        for language in root.iter():
            if language.tag.rsplit("}", 1)[-1] != "language":
                continue
            ident = (language.get("ident") or "").strip()
            if ident:
                languages[ident] += 1
    return {
        "files_profiled": len(files),
        "parse_ok": len(files) - len(parse_errors),
        "parse_error_count": len(parse_errors),
        "root_elements": dict(roots.most_common()),
        "declared_language_occurrences": dict(languages.most_common()),
        "parse_errors": parse_errors,
    }


def snapshot(name: str, path: Path) -> dict[str, object]:
    files = [item for item in path.rglob("*") if item.is_file()]
    content_files = [item for item in files if ".git" not in item.parts]
    xml_files = [item for item in content_files if item.suffix.casefold() == ".xml"]
    record = {
        "name": name,
        "path": str(path.resolve()),
        "remote": git(path, "remote", "get-url", "origin"),
        "commit": git(path, "rev-parse", "HEAD"),
        "commit_date": git(path, "show", "-s", "--format=%cI", "HEAD"),
        "shallow_checkout": git(path, "rev-parse", "--is-shallow-repository") == "true",
        "all_files_including_git": len(files),
        "content_files": len(content_files),
        "directory_bytes_including_git": directory_bytes(path),
        "content_suffix_counts": suffix_counts(content_files),
        "xml_profile": xml_profile(xml_files),
    }
    canonical_data = path / "data"
    if canonical_data.is_dir():
        canonical_xml = [
            item for item in canonical_data.rglob("*")
            if item.is_file() and item.suffix.casefold() == ".xml"
        ]
        record["canonical_data_xml_profile"] = xml_profile(canonical_xml)
    return record


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("corpora", nargs="+", help="NAME=PATH")
    args = parser.parse_args()
    records = []
    for specification in args.corpora:
        name, raw_path = specification.split("=", 1)
        path = Path(raw_path)
        print(f"Profiling {name}: {path}", flush=True)
        records.append(snapshot(name, path))
    result = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "corpora": records,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix(args.output.suffix + ".partial")
    temporary.write_text(
        json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    temporary.replace(args.output)
    print(f"Wrote {args.output}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
