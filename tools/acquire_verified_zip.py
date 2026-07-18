#!/usr/bin/env python3
"""Resumably download, verify, and safely extract a versioned ZIP dataset."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import zipfile

import requests


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def digest_file(path: Path, algorithm: str) -> str:
    digest = hashlib.new(algorithm)
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(4 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".partial")
    temporary.write_text(
        json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    os.replace(temporary, path)


def safe_member_path(root: Path, member: str) -> Path:
    destination = (root / member).resolve()
    root_resolved = root.resolve()
    if destination != root_resolved and root_resolved not in destination.parents:
        raise ValueError(f"unsafe ZIP member path: {member!r}")
    return destination


def download(
    url: str, archive: Path, timeout: int, retries: int, user_agent: str
) -> None:
    archive.parent.mkdir(parents=True, exist_ok=True)
    partial = archive.with_suffix(archive.suffix + ".partial")
    session = requests.Session()
    session.headers.update({"User-Agent": user_agent})
    last_error = ""
    for attempt in range(1, retries + 1):
        try:
            existing = partial.stat().st_size if partial.exists() else 0
            headers = {"Range": f"bytes={existing}-"} if existing else {}
            response = session.get(url, headers=headers, timeout=timeout, stream=True)
            if response.status_code == 416 and existing:
                os.replace(partial, archive)
                return
            response.raise_for_status()
            append = existing > 0 and response.status_code == 206
            mode = "ab" if append else "wb"
            with partial.open(mode) as handle:
                since_report = 0
                for chunk in response.iter_content(chunk_size=4 * 1024 * 1024):
                    if not chunk:
                        continue
                    handle.write(chunk)
                    since_report += len(chunk)
                    if since_report >= 256 * 1024 * 1024:
                        print(
                            f"Downloaded {handle.tell() / (1024 ** 3):.2f} GiB",
                            flush=True,
                        )
                        since_report = 0
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(partial, archive)
            return
        except (requests.RequestException, OSError) as exc:
            last_error = f"{type(exc).__name__}: {exc}"
            if archive.exists():
                archive.replace(partial)
            if attempt < retries:
                time.sleep(min(60, 2 ** attempt))
    raise RuntimeError(f"download failed after {retries} attempts: {last_error}")


def extract_resumably(archive: Path, output: Path) -> tuple[int, int]:
    output.mkdir(parents=True, exist_ok=True)
    extracted = 0
    skipped = 0
    with zipfile.ZipFile(archive) as bundle:
        members = bundle.infolist()
        print(f"ZIP contains {len(members):,} members", flush=True)
        for index, member in enumerate(members, start=1):
            destination = safe_member_path(output, member.filename)
            if member.is_dir():
                destination.mkdir(parents=True, exist_ok=True)
                continue
            if destination.exists() and destination.stat().st_size == member.file_size:
                skipped += 1
                continue
            destination.parent.mkdir(parents=True, exist_ok=True)
            temporary = destination.with_suffix(destination.suffix + ".partial")
            with bundle.open(member) as source, temporary.open("wb") as target:
                while True:
                    chunk = source.read(4 * 1024 * 1024)
                    if not chunk:
                        break
                    target.write(chunk)
                target.flush()
                os.fsync(target.fileno())
            os.replace(temporary, destination)
            extracted += 1
            if index % 500 == 0 or index == len(members):
                print(
                    f"Extraction {index:,}/{len(members):,}: "
                    f"{extracted:,} written, {skipped:,} resumed",
                    flush=True,
                )
    return extracted, skipped


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--extract-to", required=True, type=Path)
    parser.add_argument("--checksum", required=True)
    parser.add_argument("--algorithm", default="md5", choices=("md5", "sha256"))
    parser.add_argument("--timeout", type=int, default=300)
    parser.add_argument("--retries", type=int, default=8)
    parser.add_argument("--source-name", required=True)
    args = parser.parse_args()

    started = now_iso()
    if not args.archive.exists():
        download(
            args.url,
            args.archive,
            args.timeout,
            args.retries,
            "Number-Rants-Archive-Acquisition/1.0 (digital humanities research)",
        )
    print(
        f"Verifying {args.algorithm.upper()} for {args.archive.name} "
        f"({args.archive.stat().st_size / (1024 ** 3):.2f} GiB)",
        flush=True,
    )
    actual = digest_file(args.archive, args.algorithm)
    if actual.casefold() != args.checksum.casefold():
        raise RuntimeError(
            f"checksum mismatch: expected {args.checksum}, received {actual}"
        )
    print("Checksum verified", flush=True)

    extracted, skipped = extract_resumably(args.archive, args.extract_to)
    summary = {
        "source_name": args.source_name,
        "source_url": args.url,
        "started_at": started,
        "completed_at": now_iso(),
        "archive_path": str(args.archive.resolve()),
        "archive_bytes": args.archive.stat().st_size,
        "checksum_algorithm": args.algorithm,
        "checksum": actual,
        "extract_path": str(args.extract_to.resolve()),
        "members_written_this_run": extracted,
        "members_resumed_existing": skipped,
    }
    atomic_json(args.extract_to.parent / "acquisition_summary.json", summary)
    print(json.dumps(summary, indent=2), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
