#!/usr/bin/env python3
"""Normalize Corpus Corporum TEI into the Number Rants canonical schema.

The source corpus is read-only. This script creates a derived SQLite database
with one document interface and one passage interface across all collections.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sqlite3
import unicodedata
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


SCHEMA_VERSION = "number-rants-canonical-v1"
NORMALIZER_VERSION = "corpus-corporum-normalizer-v5"
XML_LANG = "{http://www.w3.org/XML/1998/namespace}lang"
XML_ID = "{http://www.w3.org/XML/1998/namespace}id"
DIVISION_RE = re.compile(r"^div[1-7]?$")
TOKEN_RE = re.compile(r"\w+", re.UNICODE)
SPACE_RE = re.compile(r"\s+")

BASE_BLOCK_TYPES = {
    "ab": "prose",
    "cell": "table_cell",
    "l": "verse",
    "note": "editorial_note",
    "p": "prose",
    "s": "sentence",
    "td": "table_cell",
}
WRAPPER_BLOCK_TYPES = {
    "argument": "argument",
    "byline": "byline",
    "closer": "closer",
    "dateline": "dateline",
    "epigraph": "epigraph",
    "item": "list_item",
    "label": "label",
    "opener": "opener",
    "q": "quotation",
    "quote": "quotation",
    "salute": "salutation",
    "signed": "signature",
}
SKIP_TEXT_TAGS = {
    "bibl",
    "del",
    "figure",
    "figDesc",
    "fw",
    "graphic",
    "rdg",
    "witDetail",
}
SPECIAL_PREFERENCES = {
    "app": ("lem",),
    "choice": ("corr", "reg", "expan", "orig", "sic", "abbr"),
}
LANGUAGE_ALIASES = {
    "": "und",
    "ara": "ara",
    "ar": "ara",
    "codice": "und",
    "de": "deu",
    "deu": "deu",
    "el": "grc",
    "en": "eng",
    "eng": "eng",
    "fr": "fra",
    "fra": "fra",
    "fre": "fra",
    "gr": "grc",
    "grc": "grc",
    "gre": "grc",
    "grec": "grc",
    "greek": "grc",
    "he": "heb",
    "heb": "heb",
    "hr": "hrv",
    "hrv": "hrv",
    "hu": "hun",
    "hun": "hun",
    "it": "ita",
    "ita": "ita",
    "la": "lat",
    "la-latn": "lat",
    "lat": "lat",
    "latin": "lat",
    "mul": "mul",
    "occ": "occ",
    "trans-ch": "zho",
    "zh-cn": "zho",
    "zho": "zho",
}


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def normalize_text(value: str) -> str:
    return SPACE_RE.sub(" ", unicodedata.normalize("NFC", value)).strip()


def canonical_language(value: str) -> str:
    normalized = value.strip().casefold()
    return LANGUAGE_ALIASES.get(normalized, normalized or "und")


def extract_text(element: ET.Element, include_notes: bool = False) -> str:
    """Extract a conservative authorial reading from a TEI subtree."""

    def recurse(node: ET.Element) -> str:
        tag = local_name(node.tag)
        if tag == "note" and node is not element and not include_notes:
            return ""
        if tag in SKIP_TEXT_TAGS:
            return ""

        pieces = [node.text or ""]
        preferences = SPECIAL_PREFERENCES.get(tag)
        if preferences:
            children = list(node)
            chosen = next(
                (child for wanted in preferences for child in children if local_name(child.tag) == wanted),
                None,
            )
            if chosen is not None:
                pieces.append(recurse(chosen))
                pieces.append(chosen.tail or "")
                return " ".join(pieces)

        for child in node:
            pieces.append(recurse(child))
            pieces.append(child.tail or "")
        return " ".join(pieces)

    return normalize_text(recurse(element))


def chunk_text(value: str, max_chars: int, overlap_chars: int) -> list[str]:
    if len(value) <= max_chars:
        return [value]
    chunks: list[str] = []
    start = 0
    while start < len(value):
        hard_end = min(len(value), start + max_chars)
        end = hard_end
        if hard_end < len(value):
            floor = start + int(max_chars * 0.6)
            candidates = [
                value.rfind(marker, floor, hard_end)
                for marker in (". ", "? ", "! ", "; ", ": ", " ")
            ]
            boundary = max(candidates)
            if boundary >= floor:
                end = boundary + 1
        chunk = value[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(value):
            break
        next_start = max(start + 1, end - overlap_chars)
        while next_start < end and not value[next_start].isspace():
            next_start += 1
        start = next_start
    return chunks


def first_direct_head(element: ET.Element) -> str:
    for child in element:
        if local_name(child.tag) == "head":
            return extract_text(child)[:200]
    return ""


def division_context(element: ET.Element) -> dict[str, str]:
    return {
        "element": local_name(element.tag),
        "n": element.get("n", ""),
        "type": element.get("type", ""),
        "xml_id": element.get(XML_ID, element.get("id", "")),
        "label": first_direct_head(element),
    }


def context_label(context: list[dict[str, str]]) -> str:
    labels = []
    for part in context:
        label = part.get("label") or part.get("n") or part.get("type") or part.get("xml_id")
        if label and label not in labels:
            labels.append(label)
    return " > ".join(labels)[-1000:]


def ancestor_has_tag(
    element: ET.Element,
    parent_map: dict[ET.Element, ET.Element],
    tags: set[str],
) -> bool:
    parent = parent_map.get(element)
    while parent is not None:
        if local_name(parent.tag) in tags:
            return True
        parent = parent_map.get(parent)
    return False


def select_passage_elements(body: ET.Element) -> dict[ET.Element, str]:
    elements = list(body.iter())
    parent_map = {child: parent for parent in elements for child in parent}
    selected: dict[ET.Element, str] = {}
    base_tags = set(BASE_BLOCK_TYPES)

    for element in elements:
        tag = local_name(element.tag)
        if tag == "note":
            selected[element] = BASE_BLOCK_TYPES[tag]
        elif tag in BASE_BLOCK_TYPES and not ancestor_has_tag(element, parent_map, base_tags):
            selected[element] = BASE_BLOCK_TYPES[tag]

    for element in elements:
        tag = local_name(element.tag)
        if tag not in WRAPPER_BLOCK_TYPES:
            continue
        if any(local_name(descendant.tag) in base_tags for descendant in element.iter() if descendant is not element):
            continue
        if ancestor_has_tag(element, parent_map, base_tags | set(WRAPPER_BLOCK_TYPES)):
            continue
        selected[element] = WRAPPER_BLOCK_TYPES[tag]

    content_selected = set(selected)
    ancestors_with_content: set[ET.Element] = set()
    for element in content_selected:
        parent = parent_map.get(element)
        while parent is not None:
            ancestors_with_content.add(parent)
            parent = parent_map.get(parent)

    divisions = [
        element for element in elements if DIVISION_RE.match(local_name(element.tag)) or element is body
    ]
    for element in divisions:
        if element in ancestors_with_content or element in content_selected:
            continue
        descendant_divisions = [
            descendant
            for descendant in element.iter()
            if descendant is not element and DIVISION_RE.match(local_name(descendant.tag))
        ]
        if descendant_divisions:
            continue
        if not ancestor_has_tag(element, parent_map, base_tags | set(WRAPPER_BLOCK_TYPES)):
            selected[element] = "fallback_chunk"

    if not selected:
        selected[body] = "fallback_chunk"
    return selected


def unit_from_element(
    element: ET.Element,
    segment_type: str,
    path: str,
    language: str,
    page_marker: str,
    hierarchy: list[dict[str, str]],
) -> dict[str, object] | None:
    include_notes = segment_type in {"editorial_note", "fallback_chunk"}
    value = extract_text(element, include_notes=include_notes)
    minimum = 3 if segment_type == "fallback_chunk" else 20
    if len(value) < minimum:
        return None
    return {
        "segment_type": segment_type,
        "source_element": local_name(element.tag),
        "source_xpath": path,
        "source_xpath_end": path,
        "source_unit_count": 1,
        "source_xml_id": element.get(XML_ID, element.get("id", "")),
        "source_n": element.get("n", ""),
        "source_type": element.get("type", ""),
        "language_code": canonical_language(language),
        "source_language_code": language,
        "page_marker": page_marker,
        "citation_label": context_label(hierarchy),
        "citation_path_json": json.dumps(hierarchy, ensure_ascii=False),
        "text": value,
    }


def compatible_units(left: dict[str, object], right: dict[str, object]) -> bool:
    return (
        left["segment_type"] == right["segment_type"]
        and left["language_code"] == right["language_code"]
        and left["source_language_code"] == right["source_language_code"]
        and left["page_marker"] == right["page_marker"]
        and left["citation_path_json"] == right["citation_path_json"]
        and str(left["source_xpath"]).rsplit("/", 1)[0]
        == str(right["source_xpath"]).rsplit("/", 1)[0]
    )


def pack_units(
    units: list[dict[str, object]],
    document_id: str,
    max_chars: int,
    overlap_chars: int,
) -> list[dict[str, object]]:
    packed: list[dict[str, object]] = []
    current: dict[str, object] | None = None

    def flush() -> None:
        nonlocal current
        if current is not None:
            packed.append(current)
            current = None

    for unit in units:
        value = str(unit["text"])
        if len(value) > max_chars:
            flush()
            parts = chunk_text(value, max_chars, overlap_chars)
            for part_number, part in enumerate(parts, start=1):
                packed.append(
                    {
                        **unit,
                        "text": part,
                        "part_number": part_number,
                        "part_count": len(parts),
                    }
                )
            continue

        if current is None:
            current = {**unit, "part_number": 1, "part_count": 1}
            continue
        proposed = f"{current['text']}\n\n{value}"
        if compatible_units(current, unit) and len(proposed) <= max_chars:
            current["text"] = proposed
            current["source_xpath_end"] = unit["source_xpath_end"]
            current["source_unit_count"] = int(current["source_unit_count"]) + 1
            if current["source_element"] != unit["source_element"]:
                current["source_element"] = "mixed"
        else:
            flush()
            current = {**unit, "part_number": 1, "part_count": 1}
    flush()

    segments = []
    for sequence, passage in enumerate(packed, start=1):
        value = str(passage["text"])
        segments.append(
            {
                **passage,
                "segment_id": f"{document_id}:seg:{sequence:06d}",
                "document_id": document_id,
                "sequence_number": sequence,
                "char_count": len(value),
                "token_count_approx": len(TOKEN_RE.findall(value)),
            }
        )
    return segments


def coarse_units(
    body: ET.Element,
    default_language: str,
) -> tuple[list[dict[str, object]], float, int]:
    body_chars = len(extract_text(body, include_notes=True))
    counters: Counter[str] = Counter()
    targets: list[tuple[ET.Element, str]] = []
    for child in body:
        tag = local_name(child.tag)
        counters[tag] += 1
        if DIVISION_RE.match(tag):
            targets.append((child, f"/body[1]/{tag}[{counters[tag]}]"))
    if not targets:
        targets = [(body, "/body[1]")]

    units = []
    for target, path in targets:
        hierarchy = [division_context(target)] if target is not body else []
        page = next(
            (
                element.get("n") or element.get(XML_ID) or element.get("id", "")
                for element in target.iter()
                if local_name(element.tag) == "pb"
            ),
            "",
        )
        unit = unit_from_element(
            target,
            "fallback_chunk",
            path,
            target.get(XML_LANG, default_language),
            page,
            hierarchy,
        )
        if unit:
            units.append(unit)
    coverage = min(1.0, sum(len(str(unit["text"])) for unit in units) / body_chars) if body_chars else 0.0
    if coverage < 0.95 and not (len(targets) == 1 and targets[0][0] is body):
        unit = unit_from_element(body, "fallback_chunk", "/body[1]", default_language, "", [])
        units = [unit] if unit else []
        coverage = 1.0 if unit and body_chars else 0.0
    return units, coverage, body_chars


def build_segments(
    body: ET.Element,
    document_id: str,
    default_language: str,
    max_chars: int,
    overlap_chars: int,
    fallback_threshold: float,
) -> tuple[list[dict[str, object]], float, int, bool]:
    selected = select_passage_elements(body)
    units: list[dict[str, object]] = []
    covered_chars = 0
    last_page = ""

    def walk(
        element: ET.Element,
        path: str,
        hierarchy: list[dict[str, str]],
        inherited_language: str,
    ) -> None:
        nonlocal covered_chars, last_page
        tag = local_name(element.tag)
        language = element.get(XML_LANG, inherited_language)
        current_hierarchy = hierarchy
        if DIVISION_RE.match(tag):
            current_hierarchy = hierarchy + [division_context(element)]
        if tag == "pb":
            last_page = element.get("n") or element.get(XML_ID) or element.get("id", "")

        segment_type = selected.get(element)
        if segment_type:
            unit = unit_from_element(
                element, segment_type, path, language, last_page, current_hierarchy
            )
            if unit:
                covered_chars += len(str(unit["text"]))
                units.append(unit)

        counters: Counter[str] = Counter()
        for child in element:
            child_tag = local_name(child.tag)
            counters[child_tag] += 1
            walk(
                child,
                f"{path}/{child_tag}[{counters[child_tag]}]",
                current_hierarchy,
                language,
            )

    walk(body, "/body[1]", [], default_language)
    body_text_chars = len(extract_text(body, include_notes=True))
    coverage = min(1.0, covered_chars / body_text_chars) if body_text_chars else 0.0
    used_coarse_fallback = False
    if coverage < fallback_threshold:
        units, coverage, body_text_chars = coarse_units(body, default_language)
        used_coarse_fallback = True
    segments = pack_units(units, document_id, max_chars, overlap_chars)
    return segments, coverage, body_text_chars, used_coarse_fallback


def integer_or_none(value: object) -> int | None:
    try:
        return int(str(value))
    except (TypeError, ValueError):
        return None


def select_records(
    records: list[dict[str, str]],
    collections: set[str],
    only_ids: set[str],
    sample_one_per_collection: bool,
    limit: int | None,
) -> list[dict[str, str]]:
    selected = [
        record
        for record in records
        if (not collections or record["collection"] in collections)
        and (not only_ids or record["idno"] in only_ids)
    ]
    if sample_one_per_collection:
        by_collection: dict[str, list[dict[str, str]]] = defaultdict(list)
        for record in selected:
            by_collection[record["collection"]].append(record)
        selected = [
            max(group, key=lambda item: integer_or_none(item["primary_xml_bytes"]) or 0)
            for _, group in sorted(by_collection.items())
        ]
    selected.sort(key=lambda item: (item["collection"], int(item["idno"] or 0)))
    return selected[:limit] if limit else selected


def create_database(path: Path, schema_path: Path) -> sqlite3.Connection:
    if path.exists():
        raise FileExistsError(f"Refusing to replace existing derived database: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.execute("PRAGMA journal_mode = WAL")
    connection.execute("PRAGMA synchronous = NORMAL")
    connection.execute("PRAGMA temp_store = MEMORY")
    connection.executescript(schema_path.read_text(encoding="utf-8"))
    connection.executemany(
        "INSERT INTO schema_info(key, value) VALUES (?, ?)",
        [
            ("schema_version", SCHEMA_VERSION),
            ("normalizer_version", NORMALIZER_VERSION),
            ("source_adapter", "corpus_corporum"),
        ],
    )
    return connection


def insert_issue(
    connection: sqlite3.Connection,
    record: dict[str, str],
    severity: str,
    issue_type: str,
    detail: str,
) -> None:
    connection.execute(
        """INSERT INTO ingest_issues
           (document_id, source_id, collection, severity, issue_type, source_path, detail)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            f"cc:{record['idno']}",
            record["idno"],
            record["collection"],
            severity,
            issue_type,
            record["primary_xml_path"],
            detail,
        ),
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--schema", required=True, type=Path)
    parser.add_argument("--output-db", required=True, type=Path)
    parser.add_argument("--summary", required=True, type=Path)
    parser.add_argument("--collection", action="append", default=[])
    parser.add_argument("--only-id", action="append", default=[])
    parser.add_argument("--sample-one-per-collection", action="store_true")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--max-chars", type=int, default=2400)
    parser.add_argument("--overlap-chars", type=int, default=180)
    parser.add_argument("--coverage-warning", type=float, default=0.55)
    parser.add_argument("--coarse-fallback-threshold", type=float, default=0.90)
    parser.add_argument("--progress-every", type=int, default=100)
    args = parser.parse_args()

    with args.manifest.open(encoding="utf-8", newline="") as handle:
        manifest_records = list(csv.DictReader(handle))
    records = select_records(
        manifest_records,
        set(args.collection),
        set(args.only_id),
        args.sample_one_per_collection,
        args.limit,
    )
    if not records:
        raise SystemExit("No manifest records matched the requested selection")

    ingested_at = datetime.now(timezone.utc).isoformat()
    connection = create_database(args.output_db, args.schema)
    counts: Counter[str] = Counter()
    collection_counts: Counter[str] = Counter()
    segment_type_counts: Counter[str] = Counter()

    document_sql = """INSERT INTO documents (
        document_id, schema_version, normalizer_version, corpus_code, source_id,
        collection, title, author, languages_json, source_languages_json,
        publication_date, publisher,
        edition, series_id, source_url, source_path, source_sha256,
        provenance_path, rights_statement, estimated_source_words, ingest_status,
        segment_count, normalized_char_count, extraction_coverage, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"""
    segment_fields = [
        "segment_id", "document_id", "sequence_number", "segment_type",
        "source_element", "source_xpath", "source_xpath_end", "source_unit_count",
        "source_xml_id", "source_n", "source_type", "language_code", "source_language_code",
        "page_marker", "citation_label",
        "citation_path_json", "part_number", "part_count", "text",
        "char_count", "token_count_approx",
    ]
    segment_sql = (
        f"INSERT INTO segments ({', '.join(segment_fields)}) "
        f"VALUES ({', '.join('?' for _ in segment_fields)})"
    )

    try:
        for index, record in enumerate(records, start=1):
            document_id = f"cc:{record['idno']}"
            source_languages = [value for value in record["xml_language_ids"].split("|") if value]
            language_labels = [value for value in record["xml_language_labels"].split("|") if value]
            language_groups: dict[str, list[str]] = defaultdict(list)
            label_groups: dict[str, list[str]] = defaultdict(list)
            canonical_languages: list[str] = []
            for language_index, source_language in enumerate(source_languages):
                canonical = canonical_language(source_language)
                if canonical not in canonical_languages:
                    canonical_languages.append(canonical)
                if source_language not in language_groups[canonical]:
                    language_groups[canonical].append(source_language)
                if language_index < len(language_labels):
                    label = language_labels[language_index]
                    if label and label not in label_groups[canonical]:
                        label_groups[canonical].append(label)
            if not canonical_languages:
                canonical_languages = ["und"]
            title = record["title"] or record["source_name"]
            source_path = args.root / record["primary_xml_path"]
            status = "normalized"
            segments: list[dict[str, object]] = []
            coverage: float | None = None
            body_chars = 0
            used_coarse_fallback = False

            try:
                root = ET.parse(source_path).getroot()
            except (ET.ParseError, OSError, UnicodeError) as exc:
                status = "parse_error"
                counts["parse_errors"] += 1
                insert_issue(connection, record, "error", "source_xml_parse_error", f"{type(exc).__name__}: {exc}")
            else:
                body = next((element for element in root.iter() if local_name(element.tag) == "body"), None)
                if body is None:
                    status = "missing_body"
                    counts["missing_body"] += 1
                    insert_issue(connection, record, "error", "missing_tei_body", "No TEI body element found")
                elif not extract_text(body, include_notes=True):
                    status = "source_empty"
                    counts["source_empty"] += 1
                    coverage = 0.0
                    insert_issue(
                        connection,
                        record,
                        "warning",
                        "source_body_empty_or_gap_only",
                        "TEI body contains no searchable text; upstream markup may contain only a gap marker",
                    )
                else:
                    segments, coverage, body_chars, used_coarse_fallback = build_segments(
                        body,
                        document_id,
                        source_languages[0] if source_languages else "",
                        args.max_chars,
                        args.overlap_chars,
                        args.coarse_fallback_threshold,
                    )
                    if not segments:
                        status = "no_segments"
                        counts["no_segments"] += 1
                        insert_issue(connection, record, "error", "no_normalized_segments", "TEI body produced no usable passage")
                    elif used_coarse_fallback:
                        status = "normalized_with_warning"
                        counts["coarse_fallback"] += 1
                        insert_issue(
                            connection,
                            record,
                            "warning",
                            "coarse_structural_fallback",
                            f"Atomic TEI blocks covered too little text; normalized at a broader structural level ({coverage:.1%} coverage)",
                        )
                    elif coverage < args.coverage_warning:
                        status = "normalized_with_warning"
                        counts["low_coverage"] += 1
                        insert_issue(
                            connection,
                            record,
                            "warning",
                            "low_extraction_coverage",
                            f"Normalized passages cover approximately {coverage:.1%} of conservative body text",
                        )

            connection.execute(
                document_sql,
                (
                    document_id, SCHEMA_VERSION, NORMALIZER_VERSION, "cc",
                    record["idno"], record["collection"], title, record["author"],
                    json.dumps(canonical_languages, ensure_ascii=False),
                    json.dumps(source_languages, ensure_ascii=False), record["publication_date"],
                    record["publisher"], record["edition"], record["series_idno"],
                    record["source_url"], record["primary_xml_path"],
                    record["primary_xml_sha256"], record["sidecar_path"],
                    record["license"], integer_or_none(record["estimated_words"]),
                    status, len(segments), body_chars, coverage, ingested_at,
                ),
            )
            for language_index, language in enumerate(canonical_languages):
                connection.execute(
                    """INSERT INTO document_languages
                       (document_id, language_code, source_language_codes_json, language_label, is_primary)
                       VALUES (?, ?, ?, ?, ?)""",
                    (
                        document_id,
                        language,
                        json.dumps(language_groups.get(language, []), ensure_ascii=False),
                        "|".join(label_groups.get(language, [])),
                        1 if language_index == 0 else 0,
                    ),
                )
            if segments:
                connection.executemany(
                    segment_sql,
                    [tuple(segment[field] for field in segment_fields) for segment in segments],
                )
                segment_type_counts.update(str(segment["segment_type"]) for segment in segments)

            counts["documents"] += 1
            counts["segments"] += len(segments)
            counts[f"status:{status}"] += 1
            collection_counts[record["collection"]] += 1
            if index % 25 == 0:
                connection.commit()
            if index % args.progress_every == 0 or index == len(records):
                print(
                    f"Normalized {index:,}/{len(records):,} documents; {counts['segments']:,} passages",
                    flush=True,
                )

        connection.commit()
        print("Building FTS5 document and passage indexes", flush=True)
        connection.execute("INSERT INTO document_search(document_search) VALUES ('rebuild')")
        connection.execute("INSERT INTO segment_search(segment_search) VALUES ('rebuild')")
        connection.commit()
        connection.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        database_counts = {
            "documents": connection.execute("SELECT COUNT(*) FROM documents").fetchone()[0],
            "segments": connection.execute("SELECT COUNT(*) FROM segments").fetchone()[0],
            "document_search_rows": connection.execute("SELECT COUNT(*) FROM document_search").fetchone()[0],
            "search_rows": connection.execute("SELECT COUNT(*) FROM segment_search").fetchone()[0],
            "issues": connection.execute("SELECT COUNT(*) FROM ingest_issues").fetchone()[0],
        }
    finally:
        connection.close()

    summary = {
        "schema_version": SCHEMA_VERSION,
        "normalizer_version": NORMALIZER_VERSION,
        "generated_at": ingested_at,
        "source_manifest": str(args.manifest.resolve()),
        "source_root": str(args.root.resolve()),
        "database": str(args.output_db.resolve()),
        "database_bytes": args.output_db.stat().st_size,
        "selection": {
            "sample_one_per_collection": args.sample_one_per_collection,
            "collections": sorted(args.collection),
            "only_ids": sorted(args.only_id),
            "limit": args.limit,
        },
        "counts": dict(counts),
        "database_counts": database_counts,
        "collection_document_counts": dict(sorted(collection_counts.items())),
        "segment_type_counts": dict(segment_type_counts.most_common()),
        "parameters": {
            "max_chars": args.max_chars,
            "overlap_chars": args.overlap_chars,
            "coverage_warning": args.coverage_warning,
            "coarse_fallback_threshold": args.coarse_fallback_threshold,
        },
    }
    args.summary.parent.mkdir(parents=True, exist_ok=True)
    args.summary.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {args.output_db}", flush=True)
    print(f"Wrote {args.summary}", flush=True)
    print(json.dumps(database_counts, indent=2), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
