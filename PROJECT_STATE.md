# Number Rants Project State

Last updated: 2026-07-21

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
- A deliberate local Git history records the Build Week inheritance boundary,
  licensing layer, co-designed artwork, live fox worktable, Latin retrieval
  floor, living project state, and Latin adaptation method as separate
  checkpoints.
- The public GitHub repository is named `shaycranmer/inhabited-archive` and is
  the publication target for this history.
- The Build Week Explorer under `explorer/` is committed locally. It compiles,
  and its current lint, build, rendered-page, and provenance tests pass.
  Pushes and deployments remain separately authorized publication actions.
- The project code license is MIT, and original project documentation is CC BY
  4.0 except where otherwise noted. `DATA_LICENSES.md` explicitly keeps
  third-party corpora, editions, translations, and records outside those
  grants.

## Build Week Co-Design State - July 20

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
but order has no retrieval effect. Query approval hands the unchanged table to
the live installed-language specialist. Approved folios now proceed through
real bounded retrieval and owl adjudication.

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

The badger handoff now has an approved folio grammar. Each fox concept family
becomes one collapsed folio; opening it exposes individually editable,
pinnable, and deactivatable lexical, morphological, historical-semantic,
conceptual, exclusion, and uncertainty proposals. Confidence, false-positive
forecasts, verification status, and scholar authority remain explicit. The
topic-general TypeScript contract and hydrator are implemented in
`explorer/lib/adaptation-plan.ts`; Rowan's completed packet is
`docs/LATIN_SEARCH_ADAPTATION_PACKET.md`.

Every searchable proposal may be tested against the declared shelf on demand.
The deterministic preview reports passage and work counts, basket distribution,
and raw highlighted contexts from different works where possible, while
preserving full source receipts. Previewing does not approve, pin, edit, or
deactivate anything, and zero matches never becomes a historical-absence
claim. The local `domus` check returns 295 passages across 24 works. See
`schema/BADGER_ADAPTATION_CONTRACT_V1.md`.

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

Rowan's July 19 review exposed and closed two silent-integrity gaps. Literal
Latin queries now expand mechanically across *u/v* and *i/j* combinations
while retaining source spelling; the documented boundary still names ae/e,
oe/e, diacritics, enclitics, and lemmatization as unimplemented. The v2
builder also refuses a dirty pinned Git checkout and reads publisher/date only
inside TEI `publicationStmt`. Two full v2 rebuilds reproduced all 61,651
passages, the 97,337,344-byte database, SQLite integrity `ok`, and canonical
hash `a9a8c77a89a1ca89beb8ac199239b66066ac8c99e60ceb0660d6240ccbd87405`.

This completes the corpus-builder, literal-search floor, badger data contract,
live Latin adaptation route, local term-preview machinery, approved-plan
retrieval, and owl handoff. The badger route uses
strict structured output, receives only an explicitly approved fox table,
requires exactly one folio per source family, refuses invented source-card
identifiers, and fixes corpus identity plus verification status in application
code. Public D1 loading and deployment remain separate work.

The first badger folio room is now connected to fox-table approval. While the
live route works, an honest rotating desk notice says that the handoff may take
several minutes and that the approved map will not change. Returned folios
are collapsed by default and summarize direct versus exploratory proposal
counts, cautions, confidence, highest risk, and review status. Opening a folio
exposes ordinary-English senses, rationales, literal forms, phrase or syntax
patterns, period/genre tags, false-positive forecasts, uncertainties, and
evidence status. The scholar can edit and pin a proposal, set it aside and
restore it, or approve and reopen each folio. Approval now recollapses the
folio; reopening it for inspection does not silently revoke that approval.
Uncertainty disclosures cannot silently become search terms. Folio approval
remains explicitly separate from corpus execution.

The fox clarification threshold now distinguishes listening from table work.
Submitting a question enters the conversation immediately and shows a quiet,
plain-language thinking turn rather than the catalogue/worktable animation.
The saved path explicitly resets to its preserved question and labels its
conversation and table as prewritten documentation rather than suggesting a
live response. The worktable backing art now fades into the continuing room so
cards extending below the illustration do not appear to enter a new category.

A dedicated upper-left Latin badger folio-room illustration is integrated as
an atmospheric backing layer. Its exact prompt, dimensions, hash, and role are
preserved in `docs/LIBRARIAN_ART_PROVENANCE.md`.

A later browser trial exposed that a complete folio plan could take roughly
five minutes and outlive one ordinary browser request. The badger route now
starts an OpenAI background response and returns a job receipt immediately;
the browser checks status through a separate short-request route until the plan completes or
reaches another terminal state. This keeps queued and in-progress work inside
the badger room and prevents a dropped long connection from masquerading as a
failed scholarly plan. `store: false` remains set, while the documented
background-mode boundary acknowledges the roughly ten minutes of temporary
response retention required for polling.

The paid `/api/adapt` start and the non-generating `/api/adapt/status` receipt
check are separate public surfaces. This prevents the frequent status checks
needed for a long folio build from consuming the strict rate-limit budget that
guards new model generations.

The first topic-general badger evaluations succeeded on July 19, 2026. Three
unrelated approved maps tested dream authority, political friendship and
betrayal, and unusual weather interpreted through divine or natural order.
Each returned complete draft folios on GPT-5.6, separated direct lexical
proposals from conceptual associations and uncertainty, forecast broad-word
false positives, and preserved the explicit claim that no dictionary or
corpus verification had occurred. Full two-family plans took roughly two
minutes in the local test and produced about 13–18 proposals, confirming that
the collapsed-folio design and honest waiting state are functional needs.

Public AI spending now fails closed by default. Every model route requires an
exact same-origin request; the fox is capped at 8,000 output tokens, the badger
and owl at 16,000 apiece, and one on-demand translation at 4,000. Shared
response parsing and question cleaning live in one server-only helper.
Production calls remain disabled until an external
Cloudflare rate limit or equivalent protection is installed, verified, and
acknowledged with `AI_RATE_LIMIT_CONFIGURED=true`. This environment flag is a
deployment interlock rather than a rate limiter. See
`docs/PUBLIC_AI_DEPLOYMENT_GATE.md`.

The first credentialed topic-general browser test succeeded on July 19, 2026.
An unscripted question—`What did historical writers think dreams were for?`—
produced two live fox clarification turns and a dynamic table with four unique
concept families and three explicit relationships. The first pass exposed a
duplicate-family response from the model; hydration now de-duplicates family
titles, child labels, boundary labels, and relationship records, filters
relationships whose endpoints are absent, and the fox prompt explicitly
requires unique family and child labels. The corrected live retest passed.
Separate badger evaluations and the live folio room now validate the first
inspectable language-adaptation layer.

The first runtime retrieval seam is now implemented locally with Cloudflare D1.
The verified 97 MB SQLite derivative projects into a 48 MB D1 SQL import with
the same pinned source commit and canonical content hash. The local D1 instance
contains 30 works and 61,651 FTS5 rows. `POST /api/shelf-preview` requires an
exact corpus receipt, builds only bounded quoted literal queries, and returns
passage/work counts, basket distribution, five distinct-work examples where
possible, and source/hash/rights receipts. A `domus` route trial reproduced 295
non-editorial passages across 24 works; a nonsense token returned zero with the
historical-absence warning.

The July 20 co-design pass generalized the badger room's public grammar and its
proposal contract. Generic room, loading, approval, and error language no
longer presents the product as a Latin-only table; the structured proposal
field is now `sourceLanguageExpression` rather than `latinExpression`. The
installed demonstration corpus and its receipts remain explicitly Latin, as
they must. The shelf action is now **Check literal coverage on this shelf** and
states that counts apply to the proposed forms alone, not the complete inquiry.
Raw source-language examples remain collapsed behind a note that they are most
useful to a reader of that language. A preview still attaches without changing
proposal activity, pins, edits, folio status, or plan approval, and editing
search forms clears a stale preview.

The owl reading-aid runtime is now implemented. Shortlisted results keep the
original passage primary while separating an exact evidence span, visibly
provisional machine-generated working translation, brief English orientation,
and reasoned relevance judgment. See
`schema/OWL_READING_AID_CONTRACT_V1.md`. This supports rapid triage without
presenting model translation as a citable edition or final interpretation.

The complete Latin scholar journey is now locally implemented. Every approved
folio plan compiles into bounded literal FTS5 branches; nearby same-work hits
are combined into reading units; deterministic ranking rewards direct forms,
cross-family convergence, approved relationships, and Focus of Inquiry; and
exclusion matches remain visible demotion signals. The application keeps at
most 18 candidates, no more than three per work, and no more than seven source
segments per candidate.

Each retrieval is an immutable run with a unique ID, optional parent-run link,
complete fox and badger snapshots, corpus receipt, source metadata, and hashes
over both component records and the complete owl-bound packet. Editing and
reapproving a folio creates a connected child run rather than overwriting the
old candidate list or judgment. Zero-result runs are preserved without buying
an owl call. V1 history lasts for the browser session; durable cross-session
storage/export remains open. See `schema/RETRIEVAL_RUN_CONTRACT_V1.md`.

One background owl response receives the entire fox map, approved badger
folios, compiled plan, and provenance-locked candidate units. Application code
re-verifies every hash and source segment against D1 before each paid owl or
translation call. Strict reconciliation rejects invented or omitted candidate
IDs, evidence outside the candidate, and non-exact quotations. Scholars may
select automatic working translation for strong/possible results, translation
on demand, or translation off. On-demand work becomes an immutable addendum.

The July 20 live documented path returned 126 raw literal matches, 121
overlap-aware units, 18 bounded candidates, and 18 owl judgments. Four strong
results received automatic working translations; one liminal result remained
untranslated until a successful on-demand addendum was requested; thirteen
incidental word matches remained inspectable without automatic translation.
This verifies the runtime seam, not general
Latin recall or owl accuracy. Production build, TypeScript, ESLint, and 40
Explorer tests pass.

The first focused badger-to-owl visual pass is now implemented and locally
verified. A new partial badger margin layer lets the full corpus walker recede
into a muzzle, forepaw, magnifying lens, and indexed folios during long review.
Badger folios and proposals accumulate restrained pigment according to their
declared confidence without making weaker material illegible. The owl now has
a dedicated right-edge lectern room with one balanced feather, the fullest
archive palette, honest stage-specific waiting copy, and a pale central field
for real receipts and results. Ranked results read as annotated leaves:
strong evidence receives the richest lapis/teal/gold illumination; possible,
liminal, unresolved, and incidental evidence progressively loses ornament but
not text contrast; working translation is a visibly separate tipped-in aid.
Exact prompts, the rejected badger-drift draft, targeted owl correction,
dimensions, and hashes are preserved in `docs/LIBRARIAN_ART_PROVENANCE.md`.

A fresh credentialed browser run used the saved fox example, generated and
approved three live badger folios, retrieved 140 raw literal matches into 131
deduplicated units and 18 candidates, and returned 18 owl reading leaves.
Rendered QA passed at 1440 x 1000 and 390 x 844 with no browser console errors.
The owl entrance, waiting room, strong translated leaf, incidental leaf, and
badger folio bridge were all inspected with real run data. This ratifies the
new badger/owl visual grammar, not the promised final whole-product polish
pass.

The July 21 catalogue-scope pass adds reviewed composition-date ranges, date
certainty, genre tags, and tradition tags for all thirty demo works. Fox scope
and keep-out cards now carry an inspectable catalogue interpretation.
Historically loose labels such as “pre-Constantinian” remain unresolved until
the fox asks which turning point the scholar means. Resolved rules execute
deterministically before literal retrieval; uncertain-border works are retained
and flagged, the receipt names every excluded work, and the owl receives only
eligible passages together with their catalogue metadata.

## Next Recommended Build Week Move

Package the roughly 10 MB compressed D1 shelf as a separately downloaded,
receipt-locked release asset and connect the public Sites database without
turning the repository into an unexplained data blob. Keep the promised final
whole-product visual ratification pass separate: fox, badger, owl, responsive
spacing, and all transitions should be judged together after the public shelf
connection is stable.

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
- `docs/THREAD_MIGRATION_HANDOFF_2026-07-20.md` — active conversational,
  scholarly, operational, and cost-aware re-entry point for a fresh Codex task
- `docs/THREAD_MIGRATION_HANDOFF_2026-07-18.md` — preserved earlier co-design
  crossing point and historical provenance
- `sources/indexes/acquisition_wave_2026-07-14/README.md` — compact acquisition
  receipt
- `Avery_Hearth/07_Second_Brain/05_Project_Threads/Number_Rants_DH_Project.md`
  — durable intellectual project note outside this directory
