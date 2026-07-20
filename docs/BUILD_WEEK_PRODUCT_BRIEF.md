# The Inhabited Archive: Build Week Product Brief

Status: working prototype

Build Week extension began: 2026-07-18

## One-sentence claim

The Inhabited Archive translates the question, not the library: language-aware
AI librarians adapt a scholar's research concept for original-language search
and return a small, cited reading list for human interpretation. Number Rants
is its proving ground, not its topical limit.

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
61,651 provenance-locked passages, and a diagnostic command returns literal
Latin matches with stable citations, source hashes, rights, and neighboring
context. This proves corpus ingestion and lexical retrieval only. The index is
not yet connected to the Explorer, and literal search is not being presented
as the finished language-specialist method.

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
