# The Inhabited Archive: Build Week Product Brief

Status: working prototype

Build Week extension began: 2026-07-18

## One-sentence claim

The Inhabited Archive translates the question, not the library: language-aware
AI librarians adapt a scholar's research concept for original-language search
and return a small, cited reading list for human interpretation. Number Rants
is its proving ground, not its topical limit.

The broader product is a portable scholarly staffing layer for bounded digital
libraries. A source-specific adapter leaves the original corpus untouched while
projecting it into the canonical document-and-passage catalogue that the fox,
language specialists, retrieval layer, and owl understand. English corpora may
use the same catalogue and adjudication path without cross-language adaptation;
every additional source language requires its own responsible specialist
guidance and verified shelf behavior.

## What the prototype must prove

A scholar can begin with an arbitrary question in a language she knows,
inspect and revise the concept map used to interpret it, see how supported
language librarians adapt it beyond word-for-word translation, and adjudicate
passages dynamically retrieved from the installed corpus.

The prototype does **not** claim that AI has answered the historical question.
It helps a scholar discover which sources deserve careful reading.

## Topic-general vertical slice

1. Accept an English research question.
2. Build an inspectable concept map composed of concept families, visible
   scope choices, and explicit exclusion rules.
3. Let the scholar revise the map through direct card manipulation or one
   continuous fox conversation, including card-scoped discussion and
   recoverable set-aside ideas.
4. Adapt the approved query through the language specialists supported by the
   installed micro-corpus.
5. Retrieve candidates from the actual local index rather than a preselected
   answer packet.
6. Judge the relational strength of those candidates while retaining
   uncertain and liminal material for human review.
7. Display original text, working translation, evidence span, source address,
   rights, model confidence, and human review controls.

## Why Number Rants is the proving ground

Numbers occur constantly in historical texts, but most occurrences are merely
quantities. The hard task is to distinguish “six donkeys” from a passage where
six signifies perfection, balance, creation, or sacred order. That semantic
boundary makes Number Rants a useful test of an architecture intended for
other multilingual humanities questions.

“Adaptable” is the deliberate term. A new topic still needs a codebook,
concept map, language-specific vocabulary, exclusion rules, and an evaluation
set; the system is not automatically trained to investigate anything.

## Model and corpus boundary

GPT-5.6 may dynamically propose the concept map and language-specific plans.
After local retrieval it receives only the candidate records produced by the
installed index and must return a strict JSON object keyed to those stable
IDs. The application joins model judgments back to canonical source metadata.
This prevents the model from inventing a source record or silently replacing
its citation.

When `OPENAI_API_KEY` is absent or the API is unavailable, the interface may
offer lexical search and a documented deterministic tour. Demo mode is visibly
labeled and must not masquerade as open-ended conceptual or philological
reasoning.

## Owl reading-aid boundary

The owl must not leave a scholar locked outside a promising source-language
passage. Every shortlisted result keeps the original text primary while
offering a visibly labeled **machine-generated working translation**, a brief
English orientation, an exact evidence span, and a separate relevance judgment
with reason and confidence. Translation and relevance are distinct claims: the
model may not use its own smoothed translation as invisible proof that the
requested relationship exists.

The working translation supports discovery and triage, not quotation or final
interpretation. Close reading still requires the source edition, a trustworthy
human translation where available, or a qualified reader of the language.
Lower-ranked candidates should offer translation on demand rather than spending
tokens on material the scholar is unlikely to inspect. The approved contract is
`schema/OWL_READING_AID_CONTRACT_V1.md`.

## Selected Project Day corpus

The live retrieval shelf is 30 complete Latin works selected from the pinned
Perseus `canonical-latinLit` repository. Six works occupy each of five declared
genre/domain baskets. The selection predates the final video question and uses
complete editions rather than answer-bearing excerpts. Its manifest and
rights receipt are recorded in `sources/indexes/demo_latin_30.csv` and
`docs/DEMO_LATIN_CORPUS.md`.

Latin is the first supported specialist adaptation. Greek is the preferred
next extension after the Latin adapter and retrieval path work end to end.
This bounded shelf permits arbitrary questions over declared holdings; it does
not imply comprehensive Latin or premodern coverage.

The deterministic corpus layer is implemented locally. A manifest-driven
builder creates a canonical SQLite FTS5 index containing 30 documents and
61,651 provenance-locked passages, and the D1 serving projection now supports
both diagnostic proposal checks and full approved-plan retrieval in the
Explorer. Literal search remains the transparent floor, not the finished
language-specialist method.

The first badger contract is now implemented beneath the interface. One
collapsed folio contains the language adaptation for one fox concept family,
while its lexical, morphological, historical, associative, exclusion, and
uncertainty proposals remain individually inspectable. A proposal can be
tested against the shelf on demand: the deterministic check reports occurrence
counts and raw citable examples without treating them as relevance judgments.
The live Latin badger route is now implemented. It accepts only an explicitly
approved fox table, uses Rowan's method packet under a strict JSON schema, and
returns exactly one draft folio for each source concept family. Application
code refuses invented source cards and prevents the model from claiming corpus
or dictionary verification. Live topic-general trials on dreams, political
friendship, and weather all produced complete inspectable plans. The visual
folio room is now wired to fox-table approval: folios are collapsed by
default, expand into editable and pinnable proposals, preserve uncertainty as
disclosure, support recoverable set-aside, and require separate per-folio
approval. The local D1 diagnostic and approved-plan bridge, immutable linked
run receipts, overlap-aware candidate construction, owl adjudication, and
translation controls now exist. Loading and verifying the public database
remains unbuilt.

The badger handoff now uses a resumable background response with short polling
requests rather than one fragile multi-minute HTTP connection. The interface
keeps the approved fox table fixed while showing queued and in-progress states.
Paid badger starts and non-generating receipt checks use separate application
routes so public request limits can protect the wallet without interrupting a
legitimate long folio build.
Background polling entails roughly ten minutes of temporary OpenAI response
retention even with `store: false`; this is an explicit operational boundary.

Each searchable badger proposal can now run a separately labeled literal shelf
check against a D1 serving projection of the thirty-work Latin corpus. The
preview reports passage/work counts, distribution across the five declared
baskets, raw examples from distinct works where possible, source links and
hashes, plus the index's orthographic limitations. It does not approve the
proposal, rank relevance, execute the full plan, or perform owl adjudication.
The local D1 import is reproducibly generated from the verified SQLite build
and must carry matching source-commit and content-hash receipts.

The approved plan now becomes one immutable retrieval run. Application code
executes bounded literal branches, combines nearby hits into reading units,
keeps at most 18 candidates and three per work, and records hashes over the
complete fox, badger, corpus, translation-policy, and source packet. A later
folio revision creates a linked child run without overwriting the older
candidate list or owl judgment. V1 history lasts for the browser session;
durable project storage/export remains open.

The owl receives the complete fox map, approved badger folios, compiled plan,
and provenance-locked candidates in one background response. Strict
reconciliation refuses invented identities, out-of-packet evidence, non-exact
quotations, or omitted candidates. Scholars may choose automatic working
translations only for strong and possible results, request weaker translations
on demand as immutable addenda, or turn translation off for the run.

A July 20 live path produced 126 raw literal matches, 121 overlap-aware units,
18 bounded candidates, and 18 owl judgments. Four were strong and translated
automatically, one was liminal and initially left untranslated, and thirteen
were incidental matches left visible without automatic translation. The
liminal result then received a successful separate on-demand addendum. This
verifies the runtime seam, not general Latin recall or model accuracy.

## First regression packet

- Nicomachus of Gerasa, *Introduction to Arithmetic* 1.16 — strong match;
  source XML CC BY-SA 4.0.
- Augustine, *City of God* 11.30 — strong match; ancient Latin public domain.
- “Marcus has six donkeys in the field” — synthetic incidental-quantity
  control, released as CC0.

This packet validates known behavior; it is not the live retrieval shelf or
the main product demonstration.

## Success criteria for the submission

- A judge understands the method in under one minute.
- The app works without private corpus files or an API key.
- A developer can add an API key and ask a question not anticipated by the
  demo script.
- A public deployment cannot spend project-owned AI tokens until the separate
  Cloudflare abuse-protection gate has been configured and verified.
- A configured installation performs real structured-output calls and searches
  a compact, publication-safe local corpus index.
- Every displayed passage retains source location and rights.
- A scholar can visibly disagree with the model.
- Weak or out-of-coverage questions produce honest limits or historically
  meaningful bridge proposals rather than fabricated holdings.
- The repository distinguishes pre-Build-Week infrastructure from the new
  Explorer implementation in `BUILD_WEEK_BASELINE.md`.

## Deliberate omissions

The submission does not ship the 60 GiB research library, imply that all local
corpora are redistributable, claim comprehensive historical coverage, or use
absence from the digital archive as evidence of historical absence.
