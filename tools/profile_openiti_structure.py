#!/usr/bin/env python3
"""Profile structural markers across an extracted OpenITI release."""

from __future__ import annotations

import argparse
from collections import Counter
import csv
from datetime import datetime, timezone
import json
from pathlib import Path
import re


TEXT_SUFFIXES = ("", ".completed", ".mARkdown", ".inProgress")
SECTION = re.compile(r"^###\s+(\|+)")
PAGE = re.compile(r"\bPageV\d+P\d+\b")
MILESTONE = re.compile(r"\bms[A-Z]?\d+\b", re.IGNORECASE)
TAG = re.compile(r"@[A-Z]{3,}\d*")


def locate_text(root: Path, metadata_path: str) -> Path | None:
    relative = Path(metadata_path)
    if relative.parts and relative.parts[0] == "data":
        relative = Path(*relative.parts[1:])
    base = root / relative
    for suffix in TEXT_SUFFIXES:
        candidate = Path(f"{base}{suffix}")
        if candidate.is_file():
            return candidate
    return None


def stage(path: Path) -> str:
    for suffix in TEXT_SUFFIXES[1:]:
        if path.name.endswith(suffix):
            return suffix[1:]
    return "plain"


def write_markdown(path: Path, summary: dict) -> None:
    marker = summary["marker_profile"]
    lines = [
        "# OpenITI 2025.1.9 Structure Profile",
        "",
        f"Generated: {summary['generated_at']}",
        "",
        "## Corpus Floor",
        "",
        f"- {summary['metadata_versions']:,} metadata versions",
        f"- {summary['unique_works']:,} unique works",
        f"- {summary['files_profiled']:,} files profiled",
        f"- {summary['missing_files']:,} missing files",
        f"- {summary['total_bytes_profiled']:,} source bytes read",
        "",
        "## Structural Signals",
        "",
        f"- OpenITI magic header: {marker['files_with_magic_header']:,} files",
        f"- metadata end marker: {marker['files_with_meta_end']:,} files",
        f"- hierarchical `### |` sections: {marker['files_with_sections']:,} files",
        f"- `PageV…P…` edition pages: {marker['files_with_page_markers']:,} files",
        f"- milestone markers: {marker['files_with_milestones']:,} files",
        f"- semantic `@TAG` annotations: {marker['files_with_tags']:,} files",
        f"- Markdown-style table rows: {marker['files_with_tables']:,} files",
        f"- poetry separators: {marker['files_with_poetry']:,} files",
        "",
        "## Adapter Decision",
        "",
        "Technical: use `version_uri` as the stable document identity and",
        "`book` as the work relationship. Parse the OpenITI header separately;",
        "segment first on hierarchical section markers, retain edition page and",
        "milestone addresses, then deterministically chunk paragraph blocks when",
        "section structure is absent or too large.",
        "",
        "Plain language: each edition keeps its own spine label while related",
        "editions remain tied to the same work. Chapter signs and printed page",
        "numbers guide the reading slips whenever they exist; books with fewer",
        "signposts receive consistent fallback slips rather than disappearing.",
        "",
        "## Stage Labels",
        "",
    ]
    for label, count in summary["stage_counts"].items():
        lines.append(f"- `{label}`: {count:,}")
    lines.extend(["", "## Section Depths", ""])
    for depth, count in summary["section_depth_counts"].items():
        lines.append(f"- depth {depth}: {count:,} headings")
    lines.extend(
        [
            "",
            "## Guardrails",
            "",
            "- Stage suffixes are quality/progress metadata, not filename noise.",
            "- Primary and secondary versions remain distinct.",
            "- Printed page markers and OpenITI milestones must remain attached",
            "  to canonical segments for auditable citation.",
            "- Tags are preserved as inherited annotations; they do not become",
            "  unquestioned project classifications.",
            "- No source text was altered by this profile.",
            "",
        ]
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--metadata", required=True, type=Path)
    parser.add_argument("--extracted-root", required=True, type=Path)
    parser.add_argument("--output-json", required=True, type=Path)
    parser.add_argument("--output-markdown", required=True, type=Path)
    args = parser.parse_args()

    stages = Counter()
    languages = Counter()
    statuses = Counter()
    section_depths = Counter()
    tag_types = Counter()
    unique_works = set()
    missing = []
    decode_fallbacks = []
    examples_no_structure = []
    files_profiled = 0
    total_bytes = 0
    line_counts = Counter()
    marker_files = Counter()
    marker_occurrences = Counter()

    with args.metadata.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle, delimiter="\t"))

    for position, row in enumerate(rows, start=1):
        unique_works.add(row["book"])
        languages[row["language"] or "[unspecified]"] += 1
        statuses[row["status"] or "[unspecified]"] += 1
        path = locate_text(args.extracted_root, row["local_path"])
        if path is None:
            missing.append(row["version_uri"])
            continue
        stages[stage(path)] += 1
        files_profiled += 1
        total_bytes += path.stat().st_size
        seen = set()
        try:
            file_handle = path.open(encoding="utf-8")
            iterator = file_handle
            for line_number, line in enumerate(iterator, start=1):
                line_counts["total"] += 1
                stripped = line.rstrip("\r\n")
                if line_number == 1 and stripped == "######OpenITI#":
                    seen.add("magic_header")
                if stripped == "#META#Header#End#":
                    seen.add("meta_end")
                if stripped.startswith("#META#"):
                    line_counts["metadata"] += 1
                match = SECTION.match(stripped)
                if match:
                    depth = len(match.group(1))
                    section_depths[str(depth)] += 1
                    marker_occurrences["sections"] += 1
                    seen.add("sections")
                pages = PAGE.findall(stripped)
                if pages:
                    marker_occurrences["page_markers"] += len(pages)
                    seen.add("page_markers")
                milestones = MILESTONE.findall(stripped)
                if milestones:
                    marker_occurrences["milestones"] += len(milestones)
                    seen.add("milestones")
                tags = TAG.findall(stripped)
                if tags:
                    marker_occurrences["tags"] += len(tags)
                    tag_types.update(tags)
                    seen.add("tags")
                if stripped.startswith("| ") or stripped.startswith("|-"):
                    marker_occurrences["tables"] += 1
                    seen.add("tables")
                if "%~%" in stripped:
                    marker_occurrences["poetry"] += stripped.count("%~%")
                    seen.add("poetry")
                if stripped.startswith("# "):
                    line_counts["paragraph_starts"] += 1
                elif stripped.startswith("~~"):
                    line_counts["paragraph_continuations"] += 1
            file_handle.close()
        except UnicodeDecodeError:
            decode_fallbacks.append(row["version_uri"])
            seen = set()
            with path.open(encoding="utf-8", errors="replace") as file_handle:
                for line_number, line in enumerate(file_handle, start=1):
                    line_counts["total"] += 1
                    stripped = line.rstrip("\r\n")
                    if line_number == 1 and stripped == "######OpenITI#":
                        seen.add("magic_header")
                    if stripped == "#META#Header#End#":
                        seen.add("meta_end")
                    match = SECTION.match(stripped)
                    if match:
                        section_depths[str(len(match.group(1)))] += 1
                        marker_occurrences["sections"] += 1
                        seen.add("sections")
                    if PAGE.search(stripped):
                        seen.add("page_markers")
                    if MILESTONE.search(stripped):
                        seen.add("milestones")
        for label in seen:
            marker_files[label] += 1
        if not ({"sections", "page_markers", "milestones"} & seen):
            if len(examples_no_structure) < 30:
                examples_no_structure.append(row["version_uri"])
        if position % 1000 == 0 or position == len(rows):
            print(f"Profiled {position:,}/{len(rows):,} metadata rows", flush=True)

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "metadata_versions": len(rows),
        "unique_works": len(unique_works),
        "files_profiled": files_profiled,
        "missing_files": len(missing),
        "total_bytes_profiled": total_bytes,
        "stage_counts": dict(stages.most_common()),
        "status_counts": dict(statuses.most_common()),
        "language_counts": dict(languages.most_common()),
        "section_depth_counts": dict(sorted(section_depths.items(), key=lambda x: int(x[0]))),
        "line_counts": dict(line_counts),
        "marker_occurrences": dict(marker_occurrences),
        "marker_profile": {
            "files_with_magic_header": marker_files["magic_header"],
            "files_with_meta_end": marker_files["meta_end"],
            "files_with_sections": marker_files["sections"],
            "files_with_page_markers": marker_files["page_markers"],
            "files_with_milestones": marker_files["milestones"],
            "files_with_tags": marker_files["tags"],
            "files_with_tables": marker_files["tables"],
            "files_with_poetry": marker_files["poetry"],
        },
        "top_tag_types": dict(tag_types.most_common(50)),
        "decode_fallback_count": len(decode_fallbacks),
        "decode_fallback_versions": decode_fallbacks,
        "missing_versions": missing,
        "examples_without_sections_pages_or_milestones": examples_no_structure,
    }
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    write_markdown(args.output_markdown, summary)
    print(json.dumps(summary["marker_profile"], indent=2), flush=True)
    return 0 if not missing else 1


if __name__ == "__main__":
    raise SystemExit(main())
