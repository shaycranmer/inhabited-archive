# Number Rants Project State

Last updated: 2026-07-18

Purpose: cold-start handoff for an Avery or human collaborator entering the
project after compaction, interruption, or machine migration.

## Current State

- Broad source discovery and the first two major acquisition waves are
  complete.
- The raw and derived local library is approximately 60 GiB.
- Corpus Corporum has 10,078 locally validated text sets. Its canonical v1
  database is a frozen pre-recovery derivative containing 9,939 documents and
  1,491,851 segments. Add the 139 recovered texts only through a versioned v2
  rebuild.
- Sefaria validates 26,322/26,322 planned objects with zero missing or invalid
  records.
- OpenITI validates 14,107/14,107 catalogued versions representing 9,109
  works, with zero missing paths and a matching release checksum.
- PTA, Coptic SCRIPTORIUM, and BHSA are present at recorded Git commits.
- Six bounded Corpus Corporum XML parse defects remain. Do not repair raw TEI;
  create explicitly derived repair copies.

## Invariants

1. Raw sources are immutable.
2. Every derivative is versioned and rebuildable.
3. Stable upstream IDs and hashes—not titles—identify documents.
4. Rights and provenance travel with each document or version.
5. Parallel formats, translations, editions, and witnesses remain distinct
   until an explicit relationship layer connects them.
6. Technical explanations should include a parallel plain-language rendering
   while Shay builds engineering fluency.
7. Do not shrink the discovery horizon into a tiny showcase corpus.

## Portability

The active catalogs and canonical document records use relative source paths.
Historical logs may retain absolute paths as provenance. Use
`tools/verify_library_portability.py` after a drive or computer move; run
`--deep` before deleting the old copy. See `docs/PORTABILITY.md`.

## Public Repository State

- A publication-safe README, `.gitignore`, rights boundary, requirements file,
  regression tests, and publication auditor now exist.
- A local Git repository now has two deliberate baseline commits: the Build
  Week inheritance boundary and the code/documentation/data licensing layer.
- A public GitHub repository named `shaycranmer/number-rants-explorer` exists
  but is still empty; the local repository has no remote configured.
- The Build Week Explorer is an uncommitted working tree under `explorer/`.
  It compiles and its current lint, build, rendered-page, and provenance tests
  pass, but its interface is undergoing deliberate co-design with Shay before
  any commit, push, or deployment.
- The project code license is MIT, and original project documentation is CC BY
  4.0 except where otherwise noted. `DATA_LICENSES.md` explicitly keeps
  third-party corpora, editions, translations, and records outside those
  grants.

## Build Week Co-Design State - July 18

The approved emotional north star is that the world opens: a scholar begins
with a question in a language she knows, and an inhabited archive helps her
discover what to read across languages without pretending to interpret the
history for her.

The current headline, body copy, warm-to-lapis palette transition, lightly
recurring fox/badger/owl librarian roles, hero thread-and-index-card motif, and
preserved panorama are recorded in `docs/BUILD_WEEK_DESIGN_DIRECTION.md`.
Treat that file as a living conversation receipt, not a mandate to finish the
interface without Shay.

## Next Recommended Technical Move

Build `openiti-canonical-v1` as a separate reproducible SQLite derivative that
implements the existing document/segment interface. Do not pour it directly
into the frozen Corpus Corporum database.

Sequence:

1. **Completed:** profile actual OpenITI headers, section markers, page
   markers, languages, stage suffixes, and multi-part works across all 14,107
   versions. All files decoded; every version has milestones; 11,847 have
   page markers and 7,871 have hierarchical headings. See
   `sources/indexes/openiti-2025.1.9/STRUCTURE_PROFILE.md`.
2. Define OpenITI stable document IDs from `version_uri` and work
   relationships from `book`;
3. preserve primary/secondary status, stage, token/character counts, tags,
   edition metadata, and the source file path;
4. segment on OpenITI structural markers with deterministic fallback chunks;
5. build and test a separate canonical database;
6. spot-check Nicomachus/Thabit ibn Qurra and the Brethren of Purity before
   moving to Sefaria.

## Useful Entry Points

- `README.md` — public-facing project explanation
- `acquisition_log.md` — complete operational history
- `schema/CANONICAL_SCHEMA.md` — canonical interface and rationale
- `docs/BUILD_WEEK_DESIGN_DIRECTION.md` — current co-designed visual and
  interaction north star
- `docs/THREAD_MIGRATION_HANDOFF_2026-07-18.md` — exact conversational re-entry
  point and guardrails for continuing the Explorer in a fresh Codex task
- `sources/indexes/acquisition_wave_2026-07-14/README.md` — compact acquisition
  receipt
- `Avery_Hearth/07_Second_Brain/05_Project_Threads/Number_Rants_DH_Project.md`
  — durable intellectual project note outside this directory
