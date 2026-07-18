# Number Rants Explorer: Build Week Product Brief

Status: working prototype

Build Week extension began: 2026-07-18

## One-sentence claim

Number Rants Explorer translates the question, not the library: language-aware
AI librarians adapt an English research concept for original-language search
and return a small, cited reading list for human interpretation.

## What the prototype proves

A scholar can begin with an English question, inspect the concept map used to
interpret it, see how Greek and Latin librarians adapt it beyond word-for-word
translation, and adjudicate a provenance-locked set of candidate passages.

The prototype does **not** claim that AI has answered the historical question.
It helps a scholar discover which sources deserve careful reading.

## Vertical slice

1. Accept an English research question.
2. Build an inspectable concept map and explicit exclusion rules.
3. Adapt the query into Ancient Greek and Latin terms, morphology, idiom, and
   numeral conventions.
4. Judge a fixed packet containing real, citable passages and a synthetic
   negative control.
5. Display original text, working translation, evidence span, source address,
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

## Model boundary

GPT-5.6 receives only a fixed packet of candidate records and must return a
strict JSON object keyed to those stable IDs. The application joins model
judgments back to canonical source metadata. This prevents the model from
inventing a source record or silently replacing its citation.

When `OPENAI_API_KEY` is absent or the API is unavailable, the same interface
loads a documented deterministic plan. Demo mode is visibly labeled and does
not masquerade as a live model run.

## First evaluation packet

- Nicomachus of Gerasa, *Introduction to Arithmetic* 1.16 — strong match;
  source XML CC BY-SA 4.0.
- Augustine, *City of God* 11.30 — strong match; ancient Latin public domain.
- “Marcus has six donkeys in the field” — synthetic incidental-quantity
  control, released as CC0.

## Success criteria for the submission

- A judge understands the method in under one minute.
- The app works without private corpus files or an API key.
- A configured deployment performs a real GPT-5.6 structured-output call.
- Every displayed passage retains source location and rights.
- A scholar can visibly disagree with the model.
- The repository distinguishes pre-Build-Week infrastructure from the new
  Explorer implementation in `BUILD_WEEK_BASELINE.md`.

## Deliberate omissions

The submission does not ship the 60 GiB research library, imply that all local
corpora are redistributable, claim comprehensive historical coverage, or use
absence from the digital archive as evidence of historical absence.
