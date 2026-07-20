# Number Rants Project State

Last updated: 2026-07-19

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

The public instrument is now named **The Inhabited Archive**. Number Rants
remains the research project and proving ground; the built-in no-key example
now uses a simpler question about travel, home, and belonging so a visitor can
understand the interface without specialized Number Rants context. The local
directory and currently empty GitHub repository have not been renamed.
The approved entry grammar is one continuous page: the librarian panorama is
the opening threshold and carries the public headline and invitation; the
scholar then scrolls directly into the fox clarification room and, after the
question has shape, the overhead concept worktable. This replaces the earlier
separate quiet hero plus short panorama transition, which repeated the entry
rather than letting the illustrated world perform it.

The approved panorama master is unchanged. The opening's current two-crop
display successfully anchors the inhabited clusters to the outer edges but
duplicates the badger; it is a provisional composition to revisit, not a
settled art treatment. In the fox room the complete dialogue block sits nearer
the fox and farther from the right marginalia; the redundant field ornament
has been removed.

The current headline, body copy, warm-to-lapis palette transition, lightly
recurring fox/badger/owl librarian roles, illustrated opening, and preserved
art are recorded in `docs/BUILD_WEEK_DESIGN_DIRECTION.md`.
Treat that file as a living conversation receipt, not a mandate to finish the
interface without Shay.

The first working-room grammar is now co-designed far enough to prototype.
Search-concept families dominate one shared worktable; scope and active
exclusions remain visible but secondary; set-aside ideas are recoverable and
distinct from exclusions; family members can be edited or pinned; card-scoped
fox conversation remains part of the one main conversation; opened cards
expand in place; and restoration always exposes its destination and
undo path.

A first overhead-table composition is implemented on the approved art. The
fox's latest note and same conversation remain visible at left; concept-family
cards dominate the center; explicit labeled relationships are editable,
pinnable, removable strings attached directly to source cards; and scope,
exclusions, set-aside memory, and coverage occupy quieter right-hand trays.
Scope and exclusion slips can be edited, pinned, added, set aside, or
explicitly converted between the two meanings. Cards can be reordered by drag or accessible move controls,
but order has no retrieval effect. Query approval currently records approval
and stops at the explicitly unbuilt language-specialist handoff.

One concept family or one child concept may be named the `Focus of Inquiry`.
This is intellectual priority, not a synonym for pinning and not a consequence
of card position: it tells the fox and later retrieval which idea should lead
while the remaining table stays in play. A scholar may also keep the inquiry
broad. The approval boundary now asks this explicitly.

The Explorer must be topic-general. A developer with an API key can ask an
arbitrary scholarly question, while the honest boundary is the coverage of the
installed corpus and supported language librarians. The Project Day artifact
should use a compact, publication-safe micro-corpus and real dynamic retrieval.
The existing three-passage packet is a regression fixture, not the live search
proof. The eventual demonstration may be scripted; the product must not be.

A local, uncommitted first-room implementation now reflects this boundary. The
live fox endpoint builds or revises a topic-general English-level map rather
than judging the same fixed passage packet for every question. The interface
implements concept families, direct child editing and pins, one continuous
main or card-scoped conversation, in-place expansion, one optional family- or
child-level Focus of Inquiry, quieter scope and exclusion areas, a recoverable
set-aside drawer, explicit restoration destinations,
card-attached editable relationship strings, rearrangement controls, an honest approval state,
visible receipts, and undo. The documented no-key workspace remains editable
but does not pretend to be a live arbitrary response. Lint, TypeScript, the
deployment build, rendered-page tests, and fixed-packet provenance tests pass.
This is a locally verified interaction foundation, not visual ratification,
commit approval, or permission to deploy.

The live fox prompt now requires immediately judgeable card language: labels
and rationales should say what a search choice will include, emphasize, or
keep out before adding methodological nuance. This responds to live output
that was technically correct but required the scholar to translate compressed
phrasing before deciding whether to accept it. The fox persona remains inline
in the API route; a separate human-readable persona card is approved future
documentation work, not yet a second prompt source.

An honest fox waiting state is now implemented. Initial generation shows a
small CSS-drawn catalogue vignette with rotating plain-language notes;
revisions leave the present table visible and state that it will not move
until the replacement is ready. The state is readable without motion and does
not claim access to precise model progress.

The next handoff has one approved principle: badger/language adaptations are
inspectable before corpus retrieval. The scholar must be able to see what each
supported language/corpus plan proposes, why, where it is uncertain, and what
false positives it anticipates. The visual schema and language-adaptation data
contract are not yet approved or built. Latin and the 30-work Perseus shelf
are the approved first language/corpus; Rowan is drafting the bounded Latin
specialist packet.

The Project Day corpus is now selected. It is a 30-complete-work Latin shelf
drawn from the pinned Perseus `canonical-latinLit` snapshot, balanced across
five declared baskets and chosen before the final demonstration question. The
machine-readable manifest is `sources/indexes/demo_latin_30.csv`; the
selection, rights boundary, coverage limits, and bounded Rowan specialist
brief are in `docs/DEMO_LATIN_CORPUS.md`.

The manifest-driven Latin adapter and lexical search floor are implemented.
`tools/build_demo_latin_corpus.py` produces a separate canonical SQLite FTS5
index; `tools/search_demo_latin_corpus.py` exposes a no-key diagnostic search
with complete source receipts. The verified build contains 30 documents and
61,651 passages, passes SQLite integrity and orphan checks, and reproduces the
same canonical content hash across two complete builds. Plautus's
*Amphitruo* retains precise act/scene/line passages with one visible 85.7%
coverage warning caused primarily by excluded speaker-label text. See
`schema/PERSEUS_LATIN_DEMO_ADAPTER_V1.md`.

This completes the corpus-builder and literal-search floor. It does not yet
connect the database to the Explorer, create the badger's inspectable Latin
adaptation plan, run model-assisted retrieval, or implement owl adjudication.

The first credentialed topic-general browser test succeeded on July 19, 2026.
An unscripted question—`What did historical writers think dreams were for?`—
produced two live fox clarification turns and a dynamic table with four unique
concept families and three explicit relationships. The first pass exposed a
duplicate-family response from the model; hydration now de-duplicates family
titles, child labels, boundary labels, and relationship records, filters
relationships whose endpoints are absent, and the fox prompt explicitly
requires unique family and child labels. The corrected live retest passed.
This validates concept-map generation and revision only; language adaptation
and Explorer-integrated retrieval remain unbuilt.

## Next Recommended Build Week Move

When Rowan's packet returns, define the inspectable Latin adaptation contract
before designing the finished badger room. The approved plan should produce
explicit lexical, morphological, semantic, exclusion, proximity, and
uncertainty records, then send only the scholar-approved search terms into the
provenance-locked Latin index.

The current Cloudflare-oriented Explorer cannot be assumed to open the local
SQLite file directly. Choose and test the runtime integration seam explicitly
rather than hiding a development-only filesystem dependency in the interface.

## Separate Research Infrastructure Move

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
- `docs/LIBRARIAN_ART_PROVENANCE.md` — exact approved panorama prompt,
  fox-room and concept-worktable prompts, generation provenance, rejected
  directions, and character-continuity guide
- `docs/THREAD_MIGRATION_HANDOFF_2026-07-18.md` — exact conversational re-entry
  point and guardrails for continuing the Explorer in a fresh Codex task
- `sources/indexes/acquisition_wave_2026-07-14/README.md` — compact acquisition
  receipt
- `Avery_Hearth/07_Second_Brain/05_Project_Threads/Number_Rants_DH_Project.md`
  — durable intellectual project note outside this directory
