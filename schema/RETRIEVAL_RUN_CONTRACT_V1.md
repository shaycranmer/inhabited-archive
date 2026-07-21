# Retrieval Run Contract v1

Status: implemented and live-verified locally on 2026-07-20

## Purpose

An approved fox inquiry and its approved badger folios become one bounded,
reproducible corpus search. The result is an immutable retrieval run: a receipt
for exactly what the archive searched, what it found, what it sent to the owl,
and which earlier run it revises.

**Shay translation:** editing a folio and searching again does not erase the
old pile of passages. The archive ties a new pile to the old one so the scholar
can compare them and remember why the reading list changed.

## Run Lifecycle

1. The scholar approves every current badger folio.
2. Application code applies every resolved fox date, genre, and tradition
   boundary to reviewed work-level catalogue metadata. An unresolved catalogue
   boundary stops retrieval. A work whose date range crosses a boundary remains
   eligible under the disclosed high-recall policy.
3. Application code compiles active source-language forms into bounded literal
   FTS5 queries. Uncertainty-only proposals do not become hidden search terms.
4. The read-only D1 shelf executes each positive proposal only against eligible
   works, with a per-proposal
   cap. No model chooses or rewrites source text.
5. Same-document hits within two source segments become one reading candidate.
   Multiple proposal and fox-family receipts remain attached to that candidate.
6. Deterministic scoring rewards direct forms, cross-family convergence,
   approved relationships, and Focus of Inquiry; exclusion matches remain
   visible demotion signals.
7. The application keeps at most 18 candidates, at most three from one work,
   and at most seven source segments per candidate.
8. A complete immutable packet travels to the owl only after every supplied
   source unit is checked back against D1.

The current v1 executor is an honest literal floor. It expands the approved
forms and short phrases but does not yet lemmatize, execute abstract syntactic
frames, or claim semantic completeness.

## Immutable Receipt

Every run records:

- a unique `runId` and optional `parentRunId`;
- creation time, original question, and translation preference;
- the complete fox inquiry snapshot;
- the complete approved badger folio snapshot, with transient shelf previews
  removed;
- the compiled retrieval plan;
- the installed corpus ID, pinned source commit, and canonical content hash;
- the reviewed scope-catalogue hash, applied rules, eligible/excluded/flagged
  work counts, and the named works kept out;
- raw-match, deduplicated-unit, and returned-candidate counts;
- every candidate's stable source IDs, original text, citation, source URL,
  source hash, rights statement, matching proposal IDs, relationships,
  exclusions, and deterministic retrieval rank;
- separate hashes for the fox inquiry, badger plan, candidate texts, and the
  complete owl-bound execution packet.

The complete-packet hash covers the run identity and timestamp, question,
translation policy, parent link, fox snapshot, badger snapshot, compiled plan,
corpus receipt, candidates, displayed counts, and limitations. Changing an
issued packet without updating its receipt makes owl or translation
verification fail. This is a reproducibility checksum, not a secret signature;
the separate D1 join is what proves the supplied source units still match the
installed shelf.

## Linked Reruns

A later folio edit returns the plan to review. Approving it and searching again
creates a new run whose `parentRunId` is the run currently being viewed. The
new run is appended to connected history; it never replaces the prior run or
its owl adjudication. A zero-result rerun is also preserved and does not start
an owl call.

Current v1 history lasts for the active browser session. Durable cross-session
research-project storage or export remains future work; the shared D1 shelf
stays read-only and is not used as a private inquiry log.

## Model Boundary

The retrieval route is deterministic and never receives the OpenAI API key.
The owl receives only the versioned packet created above. Before every paid owl
or working-translation call, application code rechecks all hashes and joins
every source segment back to the installed D1 shelf. A client cannot substitute
remembered, fabricated, or altered source text merely by preserving a segment
ID.

## Live Verification Receipt

The documented home-and-belonging inquiry produced this real local funnel on
2026-07-20:

- 126 bounded literal matches;
- 121 overlap-aware candidate units;
- 18 candidates sent to the owl;
- 18 source-grounded owl judgments;
- four strong results translated automatically, one liminal result initially
  left untranslated and then translated through a separate on-demand addendum,
  and thirteen incidental matches left inspectable without automatic
  translation.

This receipt demonstrates the runtime seam; it is not an evaluation claim
about general Latin recall or owl accuracy.
