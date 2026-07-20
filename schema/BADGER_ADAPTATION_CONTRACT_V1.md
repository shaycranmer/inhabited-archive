# Badger Adaptation Contract v1

Status: data contract, live Latin model route, inspectable folio UI, and
D1-backed diagnostic shelf preview implemented locally; public D1 loading and
approved-plan retrieval not yet built

## Purpose

The badger receives the English concept map approved at the fox's table and
adapts it to one declared language and corpus. The output is not a hidden list
of translated keywords. It is an inspectable set of folios that explains what
the system proposes to search, why, how certain it is, and how it expects the
search to fail.

**Shay translation:** each fox concept family becomes one contained research
folder. The folder stays manageable when closed, but a scholar can open it and
inspect or change every Latin proposal inside.

The topic-general TypeScript contract lives in
`explorer/lib/adaptation-plan.ts`. Rowan's method guidance lives in
`docs/LATIN_SEARCH_ADAPTATION_PACKET.md`. The contract is language-neutral;
Latin is its first implementation.

## Folio Shape

One folio corresponds to one fox concept family. Its collapsed summary can
show:

- the source concept family;
- direct and exploratory proposal counts;
- period or genre scope;
- the highest anticipated risk;
- secure, probable, or speculative overall confidence;
- untouched, scholar-edited, or approved status;
- how many proposals have received a diagnostic shelf preview.

Opening the folio reveals individually controllable proposals. A proposal
records:

- the exact fox concept that licensed it;
- Latin expression and ordinary-English sense;
- rationale and retrieval effect;
- surface forms, spelling variants, phrases, and any syntactic frame;
- period and genre tags;
- anticipated false positives and uncertainty;
- confidence and verification status;
- scholar state: active, pinned, or edited;
- an optional on-demand shelf preview.

The six adaptation categories come directly from the Latin packet:

1. lexical translation;
2. morphological expansion;
3. historical-semantic expansion;
4. conceptual association;
5. exclusion rule;
6. uncertainty.

Direct wording and speculative association remain visibly different. An
uncertainty may disclose a limitation without generating any search term.

## Verification Language

The contract distinguishes:

- `packet_guided_model_proposal`: the language model proposed it while guided
  by the reviewed method packet;
- `corpus_attested`: the proposed form was actually found on the declared
  shelf;
- `externally_verified`: a named external lexical source was genuinely
  consulted.

The interface must not claim dictionary verification merely because a model
knows dictionary-like information. Inspectability locates trust; it does not
turn a non-Latinist into a Latinist or remove the need for expert review.

The live route accepts only an explicitly approved fox table. Application
code then reconnects every returned folio and proposal to the exact approved
family and concept identifiers. A missing family, duplicate family, or
invented source card fails the handoff. The application also owns corpus
identity and verification status: model output cannot promote itself to
`corpus_attested` or `externally_verified`.

**Shay translation:** the badger cannot quietly add a new card behind your
back or declare its own Latin homework checked. It can propose; the system
keeps the label honest; you still decide what proceeds.

## On-Demand Shelf Preview

Every searchable proposal may offer **Test this term on the shelf**. The
deterministic preview reports:

- total matching passages;
- total works containing a match;
- match distribution across corpus baskets;
- up to ten raw, highlighted examples, taking the first matching authorial
  passage from different works in declared shelf order where possible;
- complete citation, source, hash, and rights receipts.

The literal diagnostic expands each query word mechanically across *u/v* and
*i/j* forms and matches case-insensitively while preserving the source's
original spelling in displayed text. It does not yet fold *ae/e* or *oe/e*,
strip diacritics, split enclitics, or lemmatize; those limitations remain
visible badger guidance rather than silent index behavior.

Run the local implementation with:

```bash
python3 tools/search_demo_latin_corpus.py domus --preview --sample-limit 3
```

The preview is deliberately not owl adjudication. It does not rank relevance,
claim that a passage answers the scholar's question, approve the proposal, or
alter any pin/edit/active state. Zero hits means only **no matches on this
shelf**. It never establishes historical absence.

The verified `domus` shelf check found 295 passages across 24 of the 30 works.
A nonsense-token check found zero and returned the declared absence warning.

## Approval Boundary

A preview may help a scholar recognize a dead end, a noisy term, an unexpected
sense, or a useful branch. The scholar may then edit, deactivate, exclude, or
retain the proposal. The complete plan remains a draft until the scholar
approves it explicitly. Only approved, active retrieval guidance may enter the
full corpus search.

## Current Runtime Boundary

The contract, hydrator, summary logic, live structured-output route, packet
guidance, inspectable folio room, preview attachment behavior, local SQLite
diagnostic, D1 serving schema, D1 preview route, and tests are real. The route starts the several-minute model response
in OpenAI background mode, returns a job receipt immediately, and lets the
browser make short status checks at a separate `/api/adapt/status` route until
the response reaches a terminal state. Separating paid job starts from status
checks lets the public deployment rate-limit them appropriately.
This avoids treating one long browser connection as durable infrastructure.
Although the request still sets `store: false`, background execution requires
roughly ten minutes of temporary response retention for polling; that boundary
is disclosed rather than hidden. The verified local D1 import contains 30
works and 61,651 searchable segments. A route-level `domus` check reproduced
the established 295 non-editorial passages across 24 works, while a nonsense
token returned the explicit no-matches-on-this-shelf warning. Three live
evaluations on unrelated questions—dream authority,
political friendship and betrayal, and unusual weather—returned complete
draft folios while preserving source-card identity and the unverified proposal
boundary. The following remain unbuilt:

- a loaded and receipt-verified public D1 shelf;
- a final packaging path for reviewers who run the project independently;
- final approved-plan execution;
- owl adjudication.

The Cloudflare-oriented Explorer now queries a D1 binding rather than opening
the ignored SQLite file. The checked-in migration creates the serving shape;
`tools/export_demo_latin_d1.py` reproducibly projects the verified SQLite shelf
into a local D1 import with a source/content receipt. That generated data remains
ignored. A local D1 success must not masquerade as a loaded public database.
