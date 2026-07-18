# Library Portability and External-Drive Migration

## Short Answer

Yes. The Number Rants library can move to an external drive or a future Mac.
The active catalogs use stable source IDs and mostly project-relative paths;
the canonical Corpus Corporum database also stores source paths relative to
its corpus root. Absolute paths in old launch logs and historical receipts are
provenance, not the addresses the librarians must use forever.

Current footprint on 2026-07-14:

- `sources/raw/`: approximately 46 GiB
- `derived/`: approximately 13 GiB
- combined raw and derived library: approximately 60 GiB

## Recommended Drive

For a Mac-only research library, use an SSD formatted **APFS**. APFS
Encrypted is a good choice if the drive may travel. Avoid using an exFAT drive
as the only working copy: it is useful for broad device compatibility but has
weaker filesystem semantics and resilience for a large active research tree.

An external drive is a new location, not automatically a backup. Keep the
original copy until verification passes, and eventually maintain another copy
through Time Machine or a second storage device.

## Option A: Move the Whole Project

This is the simplest future-computer strategy. Copy the complete
`number_rants/` directory so code, catalogs, raw sources, and derivatives keep
the same relative relationship.

Example, replacing the destination volume name as needed:

```bash
SOURCE="$HOME/Documents/Codex/dh_frontier/number_rants"
DEST="/Volumes/NumberRants/number_rants"

mkdir -p "$DEST"
rsync -aE --progress "$SOURCE/" "$DEST/"

python3 "$DEST/tools/verify_library_portability.py" \
  --project "$DEST" \
  --deep \
  --output "$DEST/migration_verification.json"
```

Do not delete the source copy until the deep verifier reports `"status":
"pass"` and the project has been opened and queried successfully from the new
location.

## Option B: Keep Code Local and Put Data on the Drive

This is useful if the public Git repository remains on the internal disk while
large, unpublishable corpora live externally. Place `sources/raw/` and
`derived/` on the external drive, then use symbolic links at their expected
project locations.

Conceptual layout:

```text
number_rants/
├── tools/                 # local / GitHub-safe
├── schema/                # local / GitHub-safe
├── sources/
│   └── raw -> /Volumes/NumberRants/raw
└── derived -> /Volumes/NumberRants/derived
```

The current command-line tools also accept explicit input and output paths,
so a later configuration layer can replace symbolic links if the project
needs to run across multiple machines or operating systems.

## Verification Command

Quick everyday check:

```bash
python3 tools/verify_library_portability.py
```

This checks catalog-to-file resolution, the canonical SQLite database,
Sefaria and OpenITI counts, and pinned Git commits.

Deep pre-deletion check:

```bash
python3 tools/verify_library_portability.py --deep
```

Deep mode additionally recomputes the OpenITI archive checksum, the canonical
database SHA-256, and all 26,322 Sefaria record hashes. Use it after a move and
before removing an old copy.

## What May Still Show the Old Computer Path

Historical launch-state JSON, acquisition logs, and some generated reports
record the absolute path used when a process ran. Preserve those strings as
provenance. Rebuild a derivative or generate a new migration receipt when a
current machine-readable path is needed; do not rewrite history merely to make
old receipts look tidy.

## Drive-Name Guardrail

macOS mounts external volumes under `/Volumes/<name>`. If the volume name
changes, symbolic links that point into it must be recreated. Stable IDs,
checksums, relative manifest paths, and the verification tool prevent that
minor address change from becoming a loss of intellectual provenance.
