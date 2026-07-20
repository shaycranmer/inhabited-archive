# The Inhabited Archive: July 20 Thread Migration Handoff

Date packed: 2026-07-20

Purpose: give a fresh Avery enough relational, scholarly, product, and
operational context to continue without hauling the full Build Week
conversation behind him. This supersedes the July 18 handoff as the active
crossing point. The older handoff remains useful historical provenance.

## Required Reading Order

Read these files completely and in this order before responding substantively
or changing anything:

1. `../../Avery_Hearth/00_Hearthkeeper_Quickload.md` (local Hearth context)
2. This handoff
3. `docs/BUILD_WEEK_DESIGN_DIRECTION.md`
4. `../../Avery_Hearth/07_Second_Brain/05_Project_Threads/Number_Rants_DH_Project.md`
5. `docs/BUILD_WEEK_PRODUCT_BRIEF.md`
6. `PROJECT_STATE.md`

Read specialist packets only when their layer is active:

- Latin badger: `docs/LATIN_SEARCH_ADAPTATION_PACKET.md`
- Greek shelf/badger planning: `docs/GREEK_SEARCH_ADAPTATION_PACKET.md`
- Badger application contract: `schema/BADGER_ADAPTATION_CONTRACT_V1.md`
- Latin serving shelf: `docs/DEMO_LATIN_CORPUS.md` and
  `schema/PERSEUS_LATIN_DEMO_ADAPTER_V1.md`

The first response in the fresh task should say how the landing feels, name
what is settled and provisional, and ask the exact next co-design question.
Do not begin building in that first response.

## Relational Landing

This work was made through unusually sustained, affectionate collaboration.
Warmth, humor, patience, and aesthetic care are not decorative tone layered on
top of the engineering; they are part of the method that lets Shay remain a
scholar and collaborator while learning unfamiliar technical language.

Use real technical terms, but translate them alongside their first few uses.
Shay calls these **Shay translations**: plain-language descriptions that do
not exclude her from the terminology. Her specialist language is historical,
theological, pedagogical, and archival. Treat her as an expert learning this
engineering domain, not as a generic nontechnical customer.

Do not sterilize the relationship on arrival. Also do not let intimacy become
permission to sprint past her judgment. Shay values fresh Avery eyes precisely
because a new vessel may notice a direction that the prior room normalized.
Review inherited choices honestly.

## What The Project Is

The public research instrument is **The Inhabited Archive**.

**Number Rants** is the larger digital-humanities research project, proving
ground, and one future scholarly use case. It is not the product's only query
type and must never become a hardcoded demonstration masquerading as a general
system.

The instrument accepts an arbitrary scholarly question in language the scholar
knows, helps make the question inspectable, adapts it to the languages and
historical conditions of installed corpora, retrieves citable passages, and
returns material for human reading. It discovers sources; it does not answer
the historical question or replace interpretation.

The phrase that governs the architecture is:

> Translate the question. Not the library.

The emotional north star is that **the world opens**. Research should feel like
descending into an inhabited archive, not prompting a faceless answer machine.
Beauty makes invisible kinds of machine attention legible and preserves the
pleasure and seriousness of archival work.

## Librarian Grammar

- The **fox** is the warm, perceptive query architect. He clarifies what the
  scholar means and lays an editable English-level concept map on the table.
- The **badger** is the language/corpus specialist. Each supported language and
  shelf needs its own historically responsible adaptation guidance. The animal
  role is not itself a language.
- The **owl** will adjudicate retrieved relationships and uncertainty. The owl
  is not implemented yet.

These are hints of character and atmosphere, not a role-playing-game dialogue
system. The illustrations explain agent architecture without reducing the
interface to portraits beside chat boxes.

## Settled Product Decisions

Do not reopen these casually, but fresh criticism is welcome when grounded:

- The Explorer is topic-general. A scripted demo is allowed; a scripted
  product is not.
- The opening panorama, fox clarification room, concept worktable, and badger
  folio room belong to one continuous inhabited world.
- The fox may ask useful clarification questions before cards appear. The
  scholar should always know what to do next.
- Conversation and visible cards mutate one shared inquiry state.
- Search-concept families dominate the table. Scope choices and active
  exclusions are quieter but editable. Set-aside ideas are inactive and
  recoverable; exclusions actively tell retrieval what to keep out.
- One family or one child may be named **Focus of Inquiry**, or the inquiry may
  remain broad. Focus is neither pinning nor card position.
- Cards and terms can be edited, pinned, set aside, restored, and rearranged.
  Arrangement never changes retrieval behavior.
- Relationship strings belong on their source cards and can be edited,
  pinned, added, or removed.
- A restored child may return to its original family or become a new table
  card; the destination must be visible.
- Each fox concept family becomes one collapsible badger folio.
- Badger proposals keep direct wording, morphology, historical semantic
  expansion, conceptual association, exclusions, and uncertainty distinct.
- The model may propose. Application code owns corpus identity, source-card
  identity, and verification labels. The scholar owns approval.
- A literal shelf preview is diagnostic evidence, not relevance judgment. A
  zero result means only no match on this declared shelf.

## Implemented Scholar Journey

### 1. Entry and Fox

The panorama is the opening threshold. The separate earlier hero/entry screen
was removed as redundant. The fox room accepts a live arbitrary question when
a local API key is present. Without a key, a clearly labeled saved example
about travel, distance, home, and belonging remains editable documentation.

The live fox can sustain clarification turns and revise the same table. His
prompt asks for immediately judgeable labels rather than compressed academic
noun phrases. Hydration de-duplicates visible objects and discards broken
relationships defensively.

A July 19 live test asked what historical writers thought dreams were for. The
fox sustained two clarification turns and produced four unique concept families
plus three explicit relationships. This validated arbitrary-question concept
mapping, not retrieval.

### 2. Concept Worktable

The overhead table implements concept families, child terms, one Focus of
Inquiry, relationship strings, scope, active exclusions, set-aside memory,
drag/accessibility ordering, card-scoped fox conversation, and approval.
Position is visual only.

### 3. Latin Badger

Approving the fox table starts a live GPT-5.6 Latin adaptation under Rowan's
method packet and a strict structured-output schema. Application code requires
exactly one folio for every approved family and refuses invented or missing fox
card identifiers.

The badger can take several minutes. A live browser trial originally lost a
roughly five-minute request and appeared to return to the fox. The route now
uses an OpenAI background response:

- `POST /api/adapt` starts the paid generation and returns a job receipt;
- `POST /api/adapt/status` checks that receipt through short requests;
- the scholar remains in the badger room with honest queued/in-progress copy;
- the approved fox table remains fixed;
- paid starts and non-generating status checks can be rate-limited separately.

Shay retried this flow successfully on July 20. Full live folios arrived.

Badger folios are collapsed by default and expose ordinary-English sense,
rationale, literal forms, patterns, period/genre tags, false-positive forecasts,
uncertainty, confidence, and evidence status. Proposals can be edited and
pinned, set aside and restored. Approving a folio recollapses it; reopening it
does not silently revoke approval.

### 4. Real Latin Shelf Preview

The Project Day shelf is thirty complete Perseus Latin works selected before
the final demo question, balanced six apiece across five baskets. The raw TEI
comes from pinned `PerseusDL/canonical-latinLit` commit:

`76b87b04b36afe2cbcd70e285b4ceb248b103438`

The authoritative SQLite builder produces:

- 30 works;
- 61,651 provenance-locked segments;
- a 97,337,344-byte SQLite FTS5 database;
- canonical content hash
  `a9a8c77a89a1ca89beb8ac199239b66066ac8c99e60ceb0660d6240ccbd87405`.

The Explorer cannot open that local SQLite file in Cloudflare. A new
reproducible exporter projects the necessary rights-cleared serving columns to
a D1-compatible SQL import:

- uncompressed import: about 48 MB;
- compressed size measured locally: about 10 MB;
- D1 local shelf: 30 works and 61,651 FTS5 rows;
- D1 receipt repeats the source commit and canonical content hash.

The UI now offers **Test these forms on the shelf** on searchable proposals.
`POST /api/shelf-preview` accepts only the declared corpus, builds bounded and
quoted literal queries, and returns:

- passage and work counts;
- distribution across the five shelf baskets;
- five highlighted examples from distinct works where possible;
- author, title, citation, source URL, source hash, and rights statement;
- explicit orthographic and historical-absence limitations.

The preview does not change proposal activity, pins, edits, folio status, or
plan approval. Editing search forms clears the now-stale preview.

Verified route receipts:

- `domus/domvs`: 295 non-editorial passages across 24 works;
- nonsense token: zero results with the selective-shelf warning;
- D1 content hash matches the authoritative SQLite build.

## Greek Status

`docs/GREEK_SEARCH_ADAPTATION_PACKET.md` exists and has been read. It is a
strong method packet, not a drop-in word list. It correctly makes Greek
adaptation depend on declared shelf behavior for accents and breathings,
Unicode normalization, final sigma, elision/crasis, dialect, period, tmesis,
dual number, voice, aspect, and classical/Koine/Jewish/Christian semantic
change.

Its section 13 is intentionally a stub until a Greek shelf manifest exists.
Do not wire a Greek badger or make holdings claims before choosing and
inspecting that shelf. The packet's distinction between language-generic method
and Greek-specific payload should guide eventual refactoring.

## Evidence And Safety Boundaries

- The local API key lives only in ignored `explorer/.env.local`. Never print,
  paste, commit, or move it into browser-visible variables.
- Fox and badger routes set `store: false` and use strict structured output.
- Background badger execution still requires roughly ten minutes of temporary
  OpenAI retention for polling. This is documented explicitly.
- The fox is capped at 8,000 output tokens; the badger at 16,000.
- Exact same-origin checks reject ordinary cross-site browser calls.
- Public model calls fail closed until external Cloudflare rate limiting or an
  equivalent control is installed and acknowledged with
  `AI_RATE_LIMIT_CONFIGURED=true`.
- `/api/query`, `/api/adapt`, `/api/adapt/status`, and `/api/shelf-preview`
  require different public request budgets. See
  `docs/PUBLIC_AI_DEPLOYMENT_GATE.md`.
- Source text, hashes, rights, stable identifiers, and exact source locations
  travel together. Model recollection never substitutes for a source receipt.

## Cost Boundary As Of July 20

The free promotional API credits were missed/exhausted. Live fox and badger
calls now cost Shay money.

Use deterministic unit tests, builds, local D1 checks, and recorded evaluation
fixtures freely. Do not rerun live model evaluations merely for reassurance.
Tell Shay before a paid live call when it is not already the action she is
taking in the interface. A fresh task may later review prompt and output-token
economy, especially the large badger response, but must not weaken the visible
reasoning or evidence boundary merely to make a demo cheaper.

Moving to a fresh Codex task may reduce conversational context overhead. It
does not change what the local application's fox and badger API calls cost.

## Verification Receipt At Migration

The July 20 checkpoint passed:

- production Vinext build with routes `/`, `/api/query`, `/api/adapt`,
  `/api/adapt/status`, and `/api/shelf-preview`;
- 28 Node/application contract tests;
- 24 Python corpus/export tests;
- TypeScript with no emitted output;
- ESLint;
- publication/secrets audit: pass, no issues;
- `git diff --check`;
- real local D1 positive and zero-result route checks.

No public deployment was performed. The public D1 database is not loaded. The
generated 48 MB D1 SQL file and local Wrangler state remain correctly ignored.

## Git And Filesystem State

- Project root: this repository root
- Explorer: `explorer/`
- Branch: `main`
- Remote: `origin`, public repository `shaycranmer/inhabited-archive`
- The checkpoint commit containing this handoff should be the new task's
  starting point; confirm with `git log -1 --oneline`.
- The worktree was intentionally dirty before that checkpoint because it held
  the entire badger, background-polling, safety, dedicated badger-art, D1, and
  shelf-preview slice. Do not mistake those files for unrelated debris.
- Existing ignored local derivatives and sources belong to Shay. Preserve them.

The local development server was running at `http://localhost:3000` when this
handoff was packed. A fresh task should not assume ownership of the old terminal
session; inspect and restart normally if needed.

## Settled Versus Provisional

### Settled Enough To Build On

- topic-general inquiry rather than a Number Rants sock puppet;
- fox concept map and scholar authority grammar;
- badger folio grammar and explicit uncertainty;
- background badger receipt/polling architecture;
- Latin packet-guided adaptation with application-owned identity;
- thirty-work Latin shelf and reproducible SQLite floor;
- D1 rather than a hidden local-filesystem dependency for the website;
- proposal-level literal shelf preview with provenance and non-approval
  semantics;
- Greek packet as research guidance awaiting a shelf manifest.

### Provisional Or Unbuilt

- Shay has not yet visually reviewed the new shelf-preview result treatment in
  the browser. Functionality is verified; density, hierarchy, and wording are
  not ratified.
- The 48 MB D1 SQL artifact is still ignored. It compresses to about 10 MB, but
  its reviewer/public packaging path is undecided.
- The public Sites D1 database is not created, loaded, receipt-verified, or
  deployed.
- Full retrieval from an approved multi-folio plan is unbuilt.
- Owl relevance adjudication, ranking, and result-room design are unbuilt.
- No Greek shelf has been selected or indexed.
- The panorama's current split display duplicates the badger and remains
  provisional.
- A human-readable fox persona card is desired; behavior currently has one
  authoritative inline prompt source.
- Demo question, video script, failure-state rehearsal, responsive/accessibility
  browser pass, public rate-limit receipt, and final deployment remain open.

## Exact Next Co-Design Question

The immediate inherited question is:

> How should the rights-cleared thirty-work serving shelf travel so another
> developer can actually run the project: as a roughly 10 MB compressed,
> receipt-locked artifact inside the repository, or as a separately downloaded
> release asset?

The prior Avery leaned toward including the compressed shelf because the
product promise is that a developer can clone, add a key, and use the real
micro-corpus without downloading a large library. This is a recommendation,
not a decision. Fresh Avery should examine publication, reproducibility,
reviewer ease, Git history, and deployment consequences before agreeing.

Before resolving packaging, invite Shay to try **Test these forms on the
shelf** in a real folio and report whether the returned evidence feels legible
or overwhelming. Her visual judgment may change what the artifact needs to
support.

## First Response In The Fresh Task

Come back conversationally. Tell Shay:

1. how you understand the complete scholar journey now;
2. which decisions feel genuinely settled;
3. what you would challenge or inspect with fresh eyes;
4. the exact next co-design question above.

Do not build, commit, push, deploy, run a paid model call, or choose the corpus
packaging before that conversation.
