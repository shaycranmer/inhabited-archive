#!/usr/bin/env python3
"""Acquire the complete Sefaria JSON layer plus schemas and link data.

Files are stored by a stable SHA-256 of their source URL rather than by the
human title. This prevents case, Unicode-normalization, truncation, and title
collisions on case-insensitive filesystems. A JSONL manifest preserves the
original catalog metadata and source path.

The acquisition is resumable. Completed records in the manifest are skipped;
partial HTTP downloads use Range requests when the server supports them.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote, unquote

import requests


THREAD_LOCAL = threading.local()
USER_AGENT = "Number-Rants-Sefaria-Acquisition/1.0 (digital humanities research)"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".partial")
    temporary.write_text(
        json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    os.replace(temporary, path)


def session() -> requests.Session:
    value = getattr(THREAD_LOCAL, "session", None)
    if value is None:
        value = requests.Session()
        value.headers.update({"User-Agent": USER_AGENT})
        THREAD_LOCAL.session = value
    return value


def url_identity(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()


def source_object_path(url: str) -> str:
    marker = "storage.googleapis.com/sefaria-export/"
    if marker not in url:
        raise ValueError(f"unexpected Sefaria object URL: {url}")
    return unquote(url.split(marker, 1)[1])


def request_url(source_path: str) -> str:
    return "https://storage.googleapis.com/sefaria-export/" + quote(
        source_path, safe="/"
    )


def suffix_for_url(url: str) -> str:
    suffix = Path(source_object_path(url)).suffix.lower()
    return suffix if suffix in {".json", ".csv", ".txt"} else ".bin"


def local_path(root: Path, kind: str, url: str) -> Path:
    identity = url_identity(url)
    return root / "records" / kind / identity[:2] / f"{identity}{suffix_for_url(url)}"


def build_queue(index: dict[str, Any], output: Path) -> list[dict[str, Any]]:
    queue: list[dict[str, Any]] = []
    seen: set[str] = set()

    for book in index.get("books", []):
        url = str(book.get("json_url") or "")
        if not url or url in seen:
            continue
        seen.add(url)
        queue.append(
            {
                "record_id": url_identity(url),
                "kind": "text",
                "url": url,
                "source_path": source_object_path(url),
                "local_path": str(local_path(output, "text", url).relative_to(output)),
                "title": book.get("title", ""),
                "language": book.get("language", ""),
                "version_title": book.get("versionTitle", ""),
                "categories": book.get("categories") or [],
                "expected_bytes": None,
            }
        )

    permitted_special = (
        "schemas/",
        "links/",
        "misc/topic_graph.csv",
        "table_of_contents.json",
        "last_export.txt",
    )
    for item in index.get("special_files", []):
        source_path = str(item.get("path") or "")
        if not source_path.startswith(permitted_special):
            continue
        url = str(item.get("url") or "")
        if not url or url in seen:
            continue
        seen.add(url)
        kind = "schema" if source_path.startswith("schemas/") else "link_or_metadata"
        queue.append(
            {
                "record_id": url_identity(url),
                "kind": kind,
                "url": url,
                "source_path": source_path,
                "local_path": str(local_path(output, kind, url).relative_to(output)),
                "title": "",
                "language": "",
                "version_title": "",
                "categories": [],
                "expected_bytes": item.get("size"),
            }
        )

    queue.sort(key=lambda item: (item["kind"], item["source_path"]))
    return queue


def completed_ids(manifest_path: Path) -> set[str]:
    completed: set[str] = set()
    if not manifest_path.exists():
        return completed
    with manifest_path.open(encoding="utf-8") as handle:
        for line in handle:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if row.get("status") == "success" and row.get("record_id"):
                completed.add(str(row["record_id"]))
    return completed


def validate_payload(path: Path, allow_empty: bool = False) -> None:
    if allow_empty and path.stat().st_size == 0:
        return
    if path.suffix == ".json":
        with path.open(encoding="utf-8") as handle:
            json.load(handle)


def download_one(
    item: dict[str, Any], output: Path, timeout: int, retries: int
) -> dict[str, Any]:
    destination = output / item["local_path"]
    destination.parent.mkdir(parents=True, exist_ok=True)
    expected = item.get("expected_bytes")
    allow_empty = expected is not None and int(expected) == 0
    if destination.exists() and destination.stat().st_size:
        validate_payload(destination, allow_empty=allow_empty)
        actual_bytes = destination.stat().st_size
        if expected is not None and int(expected) != actual_bytes:
            raise ValueError(
                f"existing size mismatch: expected {expected}, found {actual_bytes}"
            )
        return {
            **item,
            "status": "success",
            "resumed_existing": True,
            "bytes": actual_bytes,
            "sha256": sha256_file(destination),
            "completed_at": now_iso(),
        }

    partial = destination.with_suffix(destination.suffix + ".partial")
    last_error = ""
    for attempt in range(1, retries + 1):
        try:
            existing = partial.stat().st_size if partial.exists() else 0
            headers = {"Range": f"bytes={existing}-"} if existing else {}
            response = session().get(
                request_url(item["source_path"]),
                headers=headers,
                timeout=timeout,
                stream=True,
            )
            if response.status_code == 416 and existing:
                os.replace(partial, destination)
            else:
                response.raise_for_status()
                append = existing > 0 and response.status_code == 206
                mode = "ab" if append else "wb"
                with partial.open(mode) as handle:
                    for chunk in response.iter_content(chunk_size=1024 * 1024):
                        if chunk:
                            handle.write(chunk)
                    handle.flush()
                    os.fsync(handle.fileno())
                os.replace(partial, destination)

            validate_payload(destination, allow_empty=allow_empty)
            actual_bytes = destination.stat().st_size
            if expected is not None and int(expected) != actual_bytes:
                raise ValueError(
                    f"size mismatch: expected {expected}, received {actual_bytes}"
                )
            return {
                **item,
                "status": "success",
                "resumed_existing": False,
                "bytes": actual_bytes,
                "sha256": sha256_file(destination),
                "completed_at": now_iso(),
            }
        except (requests.RequestException, OSError, ValueError, json.JSONDecodeError) as exc:
            last_error = f"{type(exc).__name__}: {exc}"
            if destination.exists():
                destination.replace(partial)
            if attempt < retries:
                time.sleep(min(30, 2 ** attempt))
    return {
        **item,
        "status": "failed",
        "error": last_error,
        "completed_at": now_iso(),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--index", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--timeout", type=int, default=120)
    parser.add_argument("--retries", type=int, default=5)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    index = json.loads(args.index.read_text(encoding="utf-8"))
    queue = build_queue(index, args.output)
    if args.limit is not None:
        queue = queue[: args.limit]

    atomic_json(
        args.output / "acquisition_plan.json",
        {
            "generated_at": now_iso(),
            "source_index": str(args.index.resolve()),
            "source_index_generated_at": index.get("generated_at"),
            "source_bucket": index.get("bucket"),
            "source_base_url": index.get("base_url"),
            "queue_count": len(queue),
            "kinds": {
                kind: sum(item["kind"] == kind for item in queue)
                for kind in sorted({item["kind"] for item in queue})
            },
            "storage_design": "sha256(source_url) content identity; original metadata retained in manifest",
            "rights_note": "Each Sefaria version has its own license or copyright status. Preserve version metadata and do not infer one corpus-wide redistribution license.",
        },
    )
    print(f"Planned {len(queue):,} unique Sefaria objects", flush=True)
    if args.dry_run:
        return 0

    manifest_path = args.output / "acquisition_manifest.jsonl"
    completed = completed_ids(manifest_path)
    pending = [item for item in queue if item["record_id"] not in completed]
    print(
        f"Resume state: {len(completed):,} completed; {len(pending):,} pending",
        flush=True,
    )
    successes = 0
    failures: list[dict[str, Any]] = []
    bytes_downloaded = 0
    started = now_iso()

    with manifest_path.open("a", encoding="utf-8") as manifest:
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            futures = {
                executor.submit(
                    download_one, item, args.output, args.timeout, args.retries
                ): item
                for item in pending
            }
            for position, future in enumerate(as_completed(futures), start=1):
                try:
                    result = future.result()
                except Exception as exc:  # keep the rest of a bulk intake alive
                    item = futures[future]
                    result = {
                        **item,
                        "status": "failed",
                        "error": f"unhandled {type(exc).__name__}: {exc}",
                        "completed_at": now_iso(),
                    }
                manifest.write(json.dumps(result, ensure_ascii=False) + "\n")
                manifest.flush()
                if result["status"] == "success":
                    successes += 1
                    bytes_downloaded += int(result.get("bytes") or 0)
                else:
                    failures.append(result)
                if position % 100 == 0 or position == len(pending):
                    print(
                        f"Processed {position:,}/{len(pending):,} pending: "
                        f"{successes:,} success, {len(failures):,} failed, "
                        f"{bytes_downloaded / (1024 ** 3):.2f} GiB",
                        flush=True,
                    )

    summary = {
        "started_at": started,
        "completed_at": now_iso(),
        "planned_count": len(queue),
        "previously_completed_count": len(completed),
        "attempted_count": len(pending),
        "successful_count": successes,
        "failed_count": len(failures),
        "bytes_in_successful_attempts": bytes_downloaded,
        "failures": [
            {key: value for key, value in row.items() if key != "categories"}
            for row in failures
        ],
    }
    atomic_json(args.output / "acquisition_summary.json", summary)
    print(json.dumps(summary, indent=2, ensure_ascii=False), flush=True)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
