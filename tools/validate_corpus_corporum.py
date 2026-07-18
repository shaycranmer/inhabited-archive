#!/usr/bin/env python3
"""Inventory and validate the local Corpus Corporum acquisition.

The source library is read-only. Generated manifests and reports are written
under sources/indexes/corpus_corporum.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


TEI_NS = {"tei": "http://www.tei-c.org/ns/1.0"}
IDNO_RE = re.compile(r"Corpus Corporum idno:\s*(\d+)")
LANGUAGE_NAMES = {
    "HE": "Hebrew",
    "ara": "Arabic",
    "de": "German",
    "deu": "German",
    "el": "Ancient Greek",
    "en": "English",
    "eng": "English",
    "fr": "French",
    "fra": "French",
    "fre": "French",
    "gre": "Ancient Greek",
    "grec": "Ancient Greek",
    "greek": "Ancient Greek",
    "grc": "Ancient Greek",
    "heb": "Hebrew",
    "ita": "Italian",
    "la": "Latin",
    "la-Latn": "Latin",
    "lat": "Latin",
    "occ": "Occitan",
    "syr": "Syriac",
    "trans-ch": "Chinese",
    "zh-cn": "Chinese",
}


MANIFEST_FIELDS = [
    "record_key",
    "collection",
    "shard",
    "idno",
    "source_name",
    "source_url",
    "title",
    "author",
    "xml_language_ids",
    "xml_language_labels",
    "sidecar_language",
    "publication_date",
    "publisher",
    "edition",
    "series_idno",
    "estimated_words",
    "primary_xml_path",
    "primary_xml_bytes",
    "primary_xml_sha256",
    "primary_xml_parse_ok",
    "pos_xml_path",
    "pos_xml_bytes",
    "pos_xml_sha256",
    "pos_xml_parse_ok",
    "pos_payload_format",
    "pos_archive_members",
    "sidecar_path",
    "sidecar_bytes",
    "sidecar_sha256",
    "date_downloaded",
    "license",
    "attribution_required",
    "filename_has_control_whitespace",
]


SUMMARY_FIELDS = [
    "collection",
    "text_sets",
    "unique_idnos",
    "primary_xml_files",
    "pos_xml_files",
    "sidecars",
    "primary_xml_bytes",
    "primary_parse_errors",
    "pos_unavailable",
    "pos_parse_errors",
    "language_ids",
]


ISSUE_FIELDS = ["severity", "issue_type", "collection", "idno", "path", "detail"]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalized_text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return " ".join("".join(element.itertext()).split())


def first_text(root: ET.Element, path: str) -> str:
    return normalized_text(root.find(path, TEI_NS))


def parse_tei(path: Path) -> tuple[dict[str, str], str | None]:
    try:
        tree = ET.parse(path)
    except (ET.ParseError, OSError, UnicodeError) as exc:
        return {}, f"{type(exc).__name__}: {exc}"

    root = tree.getroot()
    languages = []
    language_labels = []
    for language in root.findall(".//tei:langUsage/tei:language", TEI_NS):
        ident = (language.get("ident") or "").strip()
        label = normalized_text(language)
        if ident and ident not in languages:
            languages.append(ident)
        if label and label not in language_labels:
            language_labels.append(label)

    metadata = {
        "title": first_text(root, ".//tei:teiHeader/tei:fileDesc/tei:titleStmt/tei:title"),
        "author": first_text(root, ".//tei:teiHeader/tei:fileDesc/tei:titleStmt/tei:author"),
        "publication_date": first_text(
            root, ".//tei:teiHeader/tei:fileDesc/tei:publicationStmt/tei:date"
        ),
        "publisher": first_text(
            root, ".//tei:teiHeader/tei:fileDesc/tei:publicationStmt/tei:publisher"
        ),
        "edition": first_text(
            root, ".//tei:teiHeader/tei:fileDesc/tei:editionStmt/tei:edition"
        ),
        "series_idno": first_text(
            root, ".//tei:teiHeader/tei:fileDesc/tei:seriesStmt/tei:idno"
        ),
        "xml_language_ids": "|".join(languages),
        "xml_language_labels": "|".join(language_labels),
        "root_tag": root.tag,
    }
    return metadata, None


def parse_pos_payload(path: Path) -> tuple[str, int, str | None]:
    """Validate raw XML or a ZIP archive containing one or more XML files."""
    if path.read_bytes() == b"File not found. Sorry":
        return "unavailable", 0, "Corpus Corporum returned 'File not found. Sorry'"

    if zipfile.is_zipfile(path):
        try:
            with zipfile.ZipFile(path) as archive:
                members = [name for name in archive.namelist() if not name.endswith("/")]
                xml_members = [name for name in members if name.casefold().endswith(".xml")]
                if not xml_members:
                    return "zip", len(members), "ZIP archive contains no XML member"
                for name in xml_members:
                    try:
                        with archive.open(name) as handle:
                            ET.parse(handle)
                    except (ET.ParseError, OSError, UnicodeError, zipfile.BadZipFile) as exc:
                        return "zip", len(members), f"{name}: {type(exc).__name__}: {exc}"
                return "zip", len(members), None
        except (OSError, zipfile.BadZipFile) as exc:
            return "zip", 0, f"{type(exc).__name__}: {exc}"

    _, parse_error = parse_tei(path)
    return "xml", 1, parse_error


def classify_file(path: Path) -> tuple[str | None, str | None]:
    value = str(path)
    if value.endswith(".source.json"):
        return value[: -len(".source.json")], "sidecar"
    if value.endswith(".pos.xml"):
        return value[: -len(".pos.xml")], "pos"
    if value.endswith(".xml"):
        return value[: -len(".xml")], "primary"
    return None, None


def has_control_whitespace(value: str) -> bool:
    return any(character in value for character in ("\n", "\r", "\t"))


def issue(
    issues: list[dict[str, str]],
    severity: str,
    issue_type: str,
    collection: str = "",
    idno: str = "",
    path: str = "",
    detail: str = "",
) -> None:
    issues.append(
        {
            "severity": severity,
            "issue_type": issue_type,
            "collection": collection,
            "idno": idno,
            "path": path,
            "detail": detail,
        }
    )


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, object]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--snapshot-date", default="2026-07-14")
    args = parser.parse_args()

    root = args.root.resolve()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)

    groups: dict[str, dict[str, Path]] = defaultdict(dict)
    all_files = [path for path in root.rglob("*") if path.is_file()]
    for path in all_files:
        base, kind = classify_file(path)
        if base and kind:
            groups[base][kind] = path

    state_path = root / ".download_state.json"
    state = json.loads(state_path.read_text(encoding="utf-8"))
    state_ids = {str(value) for value in state.get("downloaded", [])}
    state_failures = state.get("failed", [])

    rows: list[dict[str, object]] = []
    issues: list[dict[str, str]] = []
    sidecar_ids: dict[str, list[str]] = defaultdict(list)
    primary_hashes: dict[str, list[str]] = defaultdict(list)

    ordered_groups = sorted(groups.items(), key=lambda item: item[0])
    total_groups = len(ordered_groups)
    print(f"Discovered {total_groups:,} local text sets", flush=True)

    for index, (base, parts) in enumerate(ordered_groups, start=1):
        relative_base = str(Path(base).relative_to(root))
        relative_parts = Path(relative_base).parts
        collection = relative_parts[0] if relative_parts else ""
        shard = relative_parts[1] if len(relative_parts) > 1 else ""
        primary = parts.get("primary")
        pos = parts.get("pos")
        sidecar_path = parts.get("sidecar")
        record: dict[str, object] = {field: "" for field in MANIFEST_FIELDS}
        record.update(
            {
                "record_key": relative_base,
                "collection": collection,
                "shard": shard,
                "filename_has_control_whitespace": has_control_whitespace(relative_base),
            }
        )

        sidecar: dict[str, object] = {}
        if sidecar_path:
            relative_sidecar = str(sidecar_path.relative_to(root))
            record["sidecar_path"] = relative_sidecar
            record["sidecar_bytes"] = sidecar_path.stat().st_size
            record["sidecar_sha256"] = sha256_file(sidecar_path)
            try:
                sidecar = json.loads(sidecar_path.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError, UnicodeError) as exc:
                issue(
                    issues,
                    "error",
                    "sidecar_json_error",
                    collection,
                    path=relative_sidecar,
                    detail=f"{type(exc).__name__}: {exc}",
                )
            else:
                notes = str(sidecar.get("notes", ""))
                match = IDNO_RE.search(notes)
                idno = match.group(1) if match else ""
                record.update(
                    {
                        "idno": idno,
                        "source_name": sidecar.get("source_name", ""),
                        "source_url": sidecar.get("source_url", ""),
                        "sidecar_language": sidecar.get("language", ""),
                        "estimated_words": sidecar.get("estimated_words", ""),
                        "date_downloaded": sidecar.get("date_downloaded", ""),
                        "license": sidecar.get("license", ""),
                        "attribution_required": sidecar.get("attribution_required", ""),
                    }
                )
                if idno:
                    sidecar_ids[idno].append(relative_base)
                else:
                    issue(
                        issues,
                        "warning",
                        "sidecar_missing_idno",
                        collection,
                        path=relative_sidecar,
                        detail="No Corpus Corporum idno found in notes",
                    )
        else:
            issue(
                issues,
                "error",
                "missing_sidecar",
                collection,
                path=relative_base,
                detail="Local text set has no .source.json provenance sidecar",
            )

        idno = str(record.get("idno", ""))
        if primary:
            relative_primary = str(primary.relative_to(root))
            primary_hash = sha256_file(primary)
            metadata, parse_error = parse_tei(primary)
            record.update(
                {
                    "primary_xml_path": relative_primary,
                    "primary_xml_bytes": primary.stat().st_size,
                    "primary_xml_sha256": primary_hash,
                    "primary_xml_parse_ok": not bool(parse_error),
                    **{key: value for key, value in metadata.items() if key in record},
                }
            )
            primary_hashes[primary_hash].append(relative_base)
            if parse_error:
                issue(
                    issues,
                    "error",
                    "primary_xml_parse_error",
                    collection,
                    idno,
                    relative_primary,
                    parse_error,
                )
        else:
            issue(
                issues,
                "error",
                "missing_primary_xml",
                collection,
                idno,
                relative_base,
                "Local text set has no ordinary XML representation",
            )

        if pos:
            relative_pos = str(pos.relative_to(root))
            payload_format, archive_members, parse_error = parse_pos_payload(pos)
            record.update(
                {
                    "pos_xml_path": relative_pos,
                    "pos_xml_bytes": pos.stat().st_size,
                    "pos_xml_sha256": sha256_file(pos),
                    "pos_xml_parse_ok": not bool(parse_error),
                    "pos_payload_format": payload_format,
                    "pos_archive_members": archive_members,
                }
            )
            if parse_error:
                if payload_format == "unavailable":
                    issue(
                        issues,
                        "warning",
                        "pos_payload_unavailable",
                        collection,
                        idno,
                        relative_pos,
                        parse_error,
                    )
                else:
                    issue(
                        issues,
                        "error",
                        "pos_xml_parse_error",
                        collection,
                        idno,
                        relative_pos,
                        parse_error,
                    )
        else:
            issue(
                issues,
                "warning",
                "missing_pos_xml",
                collection,
                idno,
                relative_base,
                "Local text set has no POS-tagged XML representation",
            )

        if record["filename_has_control_whitespace"]:
            issue(
                issues,
                "warning",
                "filename_contains_control_whitespace",
                collection,
                idno,
                relative_base,
                "Filename contains a newline, carriage return, or tab",
            )

        language_ids = set(str(record.get("xml_language_ids", "")).split("|")) - {""}
        sidecar_language = str(record.get("sidecar_language", "")).casefold()
        sidecar_languages = {
            value.strip()
            for value in re.split(r"[;|]", sidecar_language)
            if value.strip()
        }
        expected_names = {LANGUAGE_NAMES.get(code, code).casefold() for code in language_ids}
        if language_ids and sidecar_languages and expected_names.isdisjoint(sidecar_languages):
            issue(
                issues,
                "warning",
                "sidecar_language_mismatch",
                collection,
                idno,
                str(record.get("sidecar_path", "")),
                f"Sidecar says {record.get('sidecar_language')!r}; TEI declares {sorted(language_ids)}",
            )

        rows.append(record)
        if index % 500 == 0 or index == total_groups:
            print(f"Validated {index:,}/{total_groups:,} text sets", flush=True)

    local_ids = set(sidecar_ids)
    missing_local_ids = sorted(state_ids - local_ids, key=int)
    ids_missing_from_state = sorted(local_ids - state_ids, key=int)
    duplicate_idnos = {key: value for key, value in sidecar_ids.items() if len(value) > 1}
    duplicate_content = {key: value for key, value in primary_hashes.items() if len(value) > 1}

    for idno in missing_local_ids:
        issue(
            issues,
            "error",
            "state_id_missing_local_record",
            idno=idno,
            detail="Download state reports success but no local sidecar identifies this idno",
        )
    for idno in ids_missing_from_state:
        issue(
            issues,
            "warning",
            "local_id_missing_state",
            idno=idno,
            detail="A local sidecar identifies this idno but it is absent from downloaded state",
        )
    for idno, keys in sorted(duplicate_idnos.items(), key=lambda item: int(item[0])):
        issue(
            issues,
            "warning",
            "duplicate_idno",
            idno=idno,
            detail=f"The same idno appears in {len(keys)} local text sets: {' | '.join(keys)}",
        )

    collection_rows: list[dict[str, object]] = []
    by_collection: dict[str, list[dict[str, object]]] = defaultdict(list)
    for row in rows:
        by_collection[str(row["collection"])].append(row)
    for collection, collection_records in sorted(by_collection.items()):
        language_ids = sorted(
            {
                language
                for row in collection_records
                for language in str(row.get("xml_language_ids", "")).split("|")
                if language
            }
        )
        collection_rows.append(
            {
                "collection": collection,
                "text_sets": len(collection_records),
                "unique_idnos": len({str(row.get("idno", "")) for row in collection_records} - {""}),
                "primary_xml_files": sum(bool(row.get("primary_xml_path")) for row in collection_records),
                "pos_xml_files": sum(bool(row.get("pos_xml_path")) for row in collection_records),
                "sidecars": sum(bool(row.get("sidecar_path")) for row in collection_records),
                "primary_xml_bytes": sum(int(row.get("primary_xml_bytes") or 0) for row in collection_records),
                "primary_parse_errors": sum(row.get("primary_xml_parse_ok") is False for row in collection_records),
                "pos_unavailable": sum(row.get("pos_payload_format") == "unavailable" for row in collection_records),
                "pos_parse_errors": sum(
                    row.get("pos_xml_parse_ok") is False
                    and row.get("pos_payload_format") != "unavailable"
                    for row in collection_records
                ),
                "language_ids": "|".join(language_ids),
            }
        )

    manifest_path = output / "corpus_manifest.csv"
    summary_path = output / "collection_summary.csv"
    issues_path = output / "validation_issues.csv"
    snapshot_path = output / f"corpus_snapshot_{args.snapshot_date}.json"
    report_path = output / "validation_report.md"
    write_csv(manifest_path, MANIFEST_FIELDS, rows)
    write_csv(summary_path, SUMMARY_FIELDS, collection_rows)
    write_csv(issues_path, ISSUE_FIELDS, issues)

    issue_counts = Counter(item["issue_type"] for item in issues)
    severity_counts = Counter(item["severity"] for item in issues)
    content_file_bytes = sum(
        int(row.get(field) or 0)
        for row in rows
        for field in ("primary_xml_bytes", "pos_xml_bytes", "sidecar_bytes")
    )
    upstream_collection_rows = [
        row for row in collection_rows if not str(row["collection"]).startswith("_")
    ]
    technical_shelf_rows = [
        row for row in collection_rows if str(row["collection"]).startswith("_")
    ]
    snapshot = {
        "snapshot_date": args.snapshot_date,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "Corpus Corporum via CatholicCorpus downloader",
        "source_url": "https://mlat.uzh.ch",
        "local_root": str(root),
        "rights_note": "Corpus Corporum TEI data is retained for non-commercial research; preserve attribution sidecars.",
        "counts": {
            "upstream_collections": len(upstream_collection_rows),
            "technical_recovery_shelves": len(technical_shelf_rows),
            "all_local_files": len(all_files),
            "local_text_sets": len(rows),
            "state_downloaded_ids": len(state_ids),
            "local_sidecar_ids": len(local_ids),
            "state_ids_missing_local_record": len(missing_local_ids),
            "local_ids_missing_state": len(ids_missing_from_state),
            "state_failures": len(state_failures),
            "primary_xml_files": sum(bool(row.get("primary_xml_path")) for row in rows),
            "pos_xml_files": sum(bool(row.get("pos_xml_path")) for row in rows),
            "sidecars": sum(bool(row.get("sidecar_path")) for row in rows),
            "content_file_bytes": content_file_bytes,
            "duplicate_idnos": len(duplicate_idnos),
            "exact_duplicate_primary_hash_groups": len(duplicate_content),
            "issues": len(issues),
        },
        "issue_counts": dict(sorted(issue_counts.items())),
        "severity_counts": dict(sorted(severity_counts.items())),
        "state_failures": state_failures,
        "missing_local_ids": missing_local_ids,
        "ids_missing_from_state": ids_missing_from_state,
        "collections": collection_rows,
    }
    snapshot_path.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    manifest_hash = sha256_file(manifest_path)
    snapshot["artifacts"] = {
        "manifest": manifest_path.name,
        "manifest_sha256": manifest_hash,
        "collection_summary": summary_path.name,
        "validation_issues": issues_path.name,
        "validation_report": report_path.name,
    }
    snapshot_path.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    report_lines = [
        "# Corpus Corporum Validation Report",
        "",
        f"Snapshot date: {args.snapshot_date}",
        "",
        "## Plain-language result",
        "",
        f"The local library contains {len(rows):,} identifiable text sets across {len(upstream_collection_rows)} upstream collections plus {len(technical_shelf_rows)} collision-safe recovery shelf.",
        f"The downloader ledger reports {len(state_ids):,} successful ids; {len(missing_local_ids):,} of those ids were overwritten by filename collisions and need targeted recovery with id-based filenames.",
        f"Of the {sum(bool(row.get('primary_xml_path')) for row in rows):,} readable-text XML files, {sum(row.get('primary_xml_parse_ok') is True for row in rows):,} parse cleanly and {sum(row.get('primary_xml_parse_ok') is False for row in rows):,} need small XML or encoding repairs.",
        f"The library also contains {sum(bool(row.get('pos_xml_path')) for row in rows):,} POS companion payloads: {sum(row.get('pos_payload_format') == 'zip' for row in rows):,} ZIP archives, {sum(row.get('pos_payload_format') == 'xml' for row in rows):,} raw XML files, and {sum(row.get('pos_payload_format') == 'unavailable' for row in rows):,} server placeholders saying that the optional POS file was unavailable.",
        f"The original acquisition failure ledger contains {len(state_failures)} item(s).",
        "The source texts were not renamed, moved, repaired, or deleted during validation.",
        "",
        "## Issue counts",
        "",
    ]
    if issue_counts:
        report_lines.extend(f"- `{name}`: {count:,}" for name, count in sorted(issue_counts.items()))
    else:
        report_lines.append("- No issues detected.")
    report_lines.extend(
        [
            "",
            "## Duplicate-content note",
            "",
            f"There are {len(duplicate_content):,} SHA-256 groups in which two or more ordinary XML files are byte-for-byte identical. These are not automatically errors; they may be repeated editions or collection overlap and require metadata-aware review.",
            "",
            "## Rights",
            "",
            "Retain the `.source.json` sidecar with every text. Corpus Corporum permits non-commercial research use of the TEI data; do not treat the local library as a redistributable GitHub dataset.",
            "",
        ]
    )
    report_path.write_text("\n".join(report_lines), encoding="utf-8")

    print(f"Wrote {manifest_path}", flush=True)
    print(f"Wrote {summary_path}", flush=True)
    print(f"Wrote {issues_path}", flush=True)
    print(f"Wrote {snapshot_path}", flush=True)
    print(f"Wrote {report_path}", flush=True)
    print(json.dumps(snapshot["counts"], indent=2), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
