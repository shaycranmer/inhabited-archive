#!/usr/bin/env python3
"""Audit the files intended for a public Number Rants repository."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re


ALLOWED_INDEX_FILE = Path(
    "sources/indexes/acquisition_wave_2026-07-14/README.md"
)
EXCLUDED_PARTS = {
    ".git",
    ".venv",
    "venv",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
}
EXCLUDED_SUFFIXES = {
    ".db",
    ".log",
    ".partial",
    ".pem",
    ".key",
    ".pyc",
    ".sqlite",
    ".sqlite3",
    ".tgz",
    ".zip",
}
TEXT_SUFFIXES = {
    "",
    ".cff",
    ".csv",
    ".json",
    ".md",
    ".py",
    ".sql",
    ".txt",
    ".yaml",
    ".yml",
}
SENSITIVE_PATTERNS = {
    "personal absolute macOS path": re.compile("/" + r"Users/[^/\s]+/"),
    "OpenAI-style secret": re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
    "GitHub-style secret": re.compile(r"\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b"),
    "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
}


def publication_candidate(project: Path, path: Path) -> bool:
    relative = path.relative_to(project)
    if any(part in EXCLUDED_PARTS for part in relative.parts):
        return False
    if relative.parts[:2] == ("sources", "raw"):
        return False
    if relative.parts and relative.parts[0] == "derived":
        return False
    if relative.parts[:2] == ("sources", "indexes") and relative != ALLOWED_INDEX_FILE:
        return False
    if path.suffix.lower() in EXCLUDED_SUFFIXES:
        return False
    if path.name.startswith(".env") or path.name == ".DS_Store":
        return False
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--project", type=Path, default=Path(__file__).resolve().parents[1]
    )
    parser.add_argument("--output", type=Path)
    parser.add_argument("--max-file-mib", type=float, default=5.0)
    args = parser.parse_args()

    project = args.project.resolve()
    candidates = [
        path
        for path in project.rglob("*")
        if path.is_file() and publication_candidate(project, path)
    ]
    candidates.sort()
    issues = []
    total_bytes = 0
    max_bytes = int(args.max_file_mib * 1024 * 1024)

    for path in candidates:
        relative = str(path.relative_to(project))
        size = path.stat().st_size
        total_bytes += size
        if size > max_bytes:
            issues.append(
                {
                    "path": relative,
                    "issue": "large public candidate",
                    "detail": f"{size} bytes exceeds {args.max_file_mib:.1f} MiB",
                }
            )
        if path.suffix.lower() not in TEXT_SUFFIXES or size > 10 * 1024 * 1024:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for label, pattern in SENSITIVE_PATTERNS.items():
            if pattern.search(text):
                issues.append(
                    {"path": relative, "issue": label, "detail": "pattern matched"}
                )

    result = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "project": str(project),
        "status": "pass" if not issues else "fail",
        "candidate_file_count": len(candidates),
        "candidate_total_bytes": total_bytes,
        "excluded_roots": ["sources/raw/", "derived/", "sources/indexes/ by default"],
        "issues": issues,
        "candidate_files": [str(path.relative_to(project)) for path in candidates],
    }
    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered, end="")
    return 0 if not issues else 1


if __name__ == "__main__":
    raise SystemExit(main())
