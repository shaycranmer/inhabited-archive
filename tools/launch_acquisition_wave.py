#!/usr/bin/env python3
"""Launch long Number Rants acquisitions independently of a Codex task."""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime
from pathlib import Path
import subprocess
import sys


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True, type=Path)
    args = parser.parse_args()
    project = args.project.resolve()
    tools = project / "tools"
    raw = project / "sources" / "raw"
    logs = project / "sources" / "indexes" / "acquisition_wave_2026-07-14"
    logs.mkdir(parents=True, exist_ok=True)

    jobs = {
        "sefaria_json": [
            sys.executable,
            str(tools / "acquire_sefaria_json.py"),
            "--index",
            str(project / "sources" / "indexes" / "sefaria-books.json"),
            "--output",
            str(raw / "sefaria-json-2026-07-02"),
            "--workers",
            "6",
            "--timeout",
            "180",
            "--retries",
            "6",
        ],
        "openiti_2025_1_9": [
            sys.executable,
            str(tools / "acquire_verified_zip.py"),
            "--url",
            "https://zenodo.org/records/17767721/files/OpenITI_data_2025-1-9.zip?download=1",
            "--archive",
            str(raw / "openiti-2025.1.9" / "OpenITI_data_2025-1-9.zip"),
            "--extract-to",
            str(raw / "openiti-2025.1.9" / "extracted"),
            "--algorithm",
            "md5",
            "--checksum",
            "95cf19a9320fee6c37c4c26c9fa860b1",
            "--source-name",
            "OpenITI 2025.1.9 full release",
        ],
    }

    launched = {}
    for name, command in jobs.items():
        log_path = logs / f"{name}.log"
        log_handle = log_path.open("ab", buffering=0)
        wrapped = ["/usr/bin/caffeinate", "-i", *command]
        process = subprocess.Popen(
            wrapped,
            cwd=project,
            stdin=subprocess.DEVNULL,
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            start_new_session=True,
            close_fds=True,
        )
        launched[name] = {
            "pid": process.pid,
            "command": wrapped,
            "log": str(log_path),
            "launched_at": datetime.now().astimezone().isoformat(),
        }
        log_handle.close()

    state_path = logs / "launch_state.json"
    temporary = state_path.with_suffix(".json.partial")
    temporary.write_text(json.dumps(launched, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, state_path)
    print(json.dumps(launched, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
