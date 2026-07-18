#!/usr/bin/env python3
"""Recover Corpus Corporum records lost to filename collisions.

The original downloader named files from truncated, sanitized titles. Distinct
Corpus Corporum records could therefore overwrite one another. This script
uses the upstream numeric idno as a collision-proof basename and writes each
recovered record as an ordinary XML, optional POS payload, and provenance
sidecar triplet.

By default, ids come from a validation snapshot's ``missing_local_ids`` plus
the acquisition state's failed ids. Existing recovered triplets are skipped
unless ``--force`` is supplied.
"""

from __future__ import annotations

import argparse
import json
import os
import time
import zipfile
from datetime import datetime
from pathlib import Path
from tempfile import NamedTemporaryFile
import xml.etree.ElementTree as ET

import requests


BASE_URL = "https://mlat.uzh.ch"
DOWNLOAD_URL = f"{BASE_URL}/php_modules/download.php"
TEI_NS = {"tei": "http://www.tei-c.org/ns/1.0"}
UNAVAILABLE_POS = b"File not found. Sorry"


def normalized_text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return " ".join("".join(element.itertext()).split())


def first_text(root: ET.Element, path: str) -> str:
    return normalized_text(root.find(path, TEI_NS))


def metadata_from_tei(payload: bytes) -> dict[str, str]:
    root = ET.fromstring(payload)
    languages = []
    for language in root.findall(".//tei:langUsage/tei:language", TEI_NS):
        ident = (language.get("ident") or "").strip()
        if ident and ident not in languages:
            languages.append(ident)
    return {
        "title": first_text(
            root, ".//tei:teiHeader/tei:fileDesc/tei:titleStmt/tei:title"
        ),
        "author": first_text(
            root, ".//tei:teiHeader/tei:fileDesc/tei:titleStmt/tei:author"
        ),
        "languages": "|".join(languages),
    }


def language_label(codes: str) -> str:
    names = {
        "ara": "Arabic",
        "de": "German",
        "deu": "German",
        "el": "Ancient Greek",
        "en": "English",
        "eng": "English",
        "fr": "French",
        "fra": "French",
        "gr": "Ancient Greek",
        "grc": "Ancient Greek",
        "gre": "Ancient Greek",
        "HE": "Hebrew",
        "heb": "Hebrew",
        "ita": "Italian",
        "la": "Latin",
        "la-Latn": "Latin",
        "lat": "Latin",
        "occ": "Occitan",
        "syr": "Syriac",
    }
    labels = []
    for code in filter(None, codes.split("|")):
        label = names.get(code, code)
        if label not in labels:
            labels.append(label)
    return "; ".join(labels) or "Undetermined"


def atomic_write(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(dir=path.parent, delete=False) as handle:
        temporary = Path(handle.name)
        handle.write(payload)
        handle.flush()
        os.fsync(handle.fileno())
    temporary.replace(path)


def validate_pos(payload: bytes) -> None:
    if payload == UNAVAILABLE_POS:
        return
    with NamedTemporaryFile() as handle:
        handle.write(payload)
        handle.flush()
        candidate = Path(handle.name)
        if zipfile.is_zipfile(candidate):
            with zipfile.ZipFile(candidate) as archive:
                members = [
                    name for name in archive.namelist()
                    if name.casefold().endswith(".xml")
                ]
                if not members:
                    raise ValueError("POS ZIP contains no XML member")
                for member in members:
                    with archive.open(member) as xml_handle:
                        ET.parse(xml_handle)
            return
    ET.fromstring(payload)


def fetch(session: requests.Session, idno: str, kind: str, timeout: int) -> bytes:
    response = session.get(
        DOWNLOAD_URL,
        params={"type": kind, "idno": idno},
        timeout=timeout,
    )
    response.raise_for_status()
    return response.content


def make_sidecar(idno: str, metadata: dict[str, str]) -> dict[str, object]:
    title = metadata["title"] or f"Corpus Corporum text {idno}"
    return {
        "corpus": "Corpus Corporum via CatholicCorpus.org",
        "source_name": title,
        "source_url": f"https://mlat.uzh.ch/browser#/{idno}",
        "upstream_url": BASE_URL,
        "description": "Corpus Corporum TEI record recovered with an id-based filename after a local filename collision.",
        "language": language_label(metadata["languages"]),
        "source_language_codes": metadata["languages"],
        "date_downloaded": datetime.now().strftime("%Y-%m-%d"),
        "license": "Non-commercial use permitted; underlying texts are public domain",
        "license_url": None,
        "license_details": "Corpus Corporum permits non-commercial use of TEI XML text data for research.",
        "attribution_required": True,
        "attribution_text": "Text provided by Corpus Corporum (mlat.uzh.ch), University of Zurich.",
        "credit": {
            "digitized_by": "Corpus Corporum team, University of Zurich",
            "digitizer_url": BASE_URL,
            "original_author": metadata["author"] or "Unknown",
            "publisher": "University of Zurich (digital edition)",
        },
        "format": "TEI XML",
        "estimated_words": "unknown",
        "recovery_reason": "collision_safe_id_filename",
        "notes": f"Corpus Corporum idno: {idno}. Non-commercial use only.",
    }


def load_target_ids(snapshot: Path, state_path: Path, include_failures: bool) -> list[str]:
    snapshot_data = json.loads(snapshot.read_text(encoding="utf-8"))
    target_ids = {str(value) for value in snapshot_data.get("missing_local_ids", [])}
    if include_failures:
        state = json.loads(state_path.read_text(encoding="utf-8"))
        target_ids.update(str(item["idno"]) for item in state.get("failed", []))
    return sorted(target_ids, key=int)


def update_state(state_path: Path, recovered_ids: set[str]) -> None:
    state = json.loads(state_path.read_text(encoding="utf-8"))
    downloaded = {str(value) for value in state.get("downloaded", [])}
    downloaded.update(recovered_ids)
    state["downloaded"] = sorted(downloaded, key=int)
    state["failed"] = [
        item for item in state.get("failed", [])
        if str(item.get("idno")) not in recovered_ids
    ]
    atomic_write(
        state_path,
        (json.dumps(state, indent=2, ensure_ascii=False) + "\n").encode("utf-8"),
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot", required=True, type=Path)
    parser.add_argument("--state", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--delay", type=float, default=1.5)
    parser.add_argument("--timeout", type=int, default=120)
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--exclude-failures", action="store_true")
    args = parser.parse_args()

    target_ids = load_target_ids(
        args.snapshot, args.state, include_failures=not args.exclude_failures
    )
    args.output.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "Number-Rants-Recovery/1.0 (non-commercial research)",
            "Accept": "application/xml, text/xml, application/zip, */*",
            "Referer": BASE_URL,
        }
    )

    recovered: set[str] = set()
    skipped: set[str] = set()
    failed: dict[str, str] = {}
    print(f"Recovery target: {len(target_ids):,} Corpus Corporum ids", flush=True)

    for index, idno in enumerate(target_ids, start=1):
        xml_path = args.output / f"{idno}.xml"
        pos_path = args.output / f"{idno}.pos.xml"
        sidecar_path = args.output / f"{idno}.source.json"
        if not args.force and all(path.exists() for path in (xml_path, pos_path, sidecar_path)):
            skipped.add(idno)
            print(f"[{index}/{len(target_ids)}] {idno}: already present", flush=True)
            continue

        last_error = ""
        for attempt in range(1, args.retries + 1):
            try:
                xml_payload = fetch(session, idno, "file-xml", args.timeout)
                metadata = metadata_from_tei(xml_payload)
                time.sleep(args.delay)
                pos_payload = fetch(session, idno, "file-pos-xml", args.timeout)
                validate_pos(pos_payload)
                sidecar_payload = (
                    json.dumps(make_sidecar(idno, metadata), indent=2, ensure_ascii=False)
                    + "\n"
                ).encode("utf-8")
                atomic_write(xml_path, xml_payload)
                atomic_write(pos_path, pos_payload)
                atomic_write(sidecar_path, sidecar_payload)
                recovered.add(idno)
                print(
                    f"[{index}/{len(target_ids)}] {idno}: recovered {metadata['title']!r}",
                    flush=True,
                )
                break
            except (requests.RequestException, ET.ParseError, OSError, ValueError) as exc:
                last_error = f"{type(exc).__name__}: {exc}"
                if attempt < args.retries:
                    time.sleep(args.delay * attempt)
        else:
            failed[idno] = last_error
            print(f"[{index}/{len(target_ids)}] {idno}: FAILED {last_error}", flush=True)
        time.sleep(args.delay)

    update_state(args.state, recovered | skipped)
    report = {
        "generated_at": datetime.now().astimezone().isoformat(),
        "target_count": len(target_ids),
        "recovered_count": len(recovered),
        "skipped_count": len(skipped),
        "failed_count": len(failed),
        "recovered_ids": sorted(recovered, key=int),
        "skipped_ids": sorted(skipped, key=int),
        "failures": failed,
    }
    atomic_write(
        args.output / "recovery_report.json",
        (json.dumps(report, indent=2, ensure_ascii=False) + "\n").encode("utf-8"),
    )
    print(
        f"Done: {len(recovered)} recovered, {len(skipped)} skipped, {len(failed)} failed",
        flush=True,
    )
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
