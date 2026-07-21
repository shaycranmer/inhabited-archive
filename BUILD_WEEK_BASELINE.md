# OpenAI Build Week Baseline

Recorded: 2026-07-17 CDT

Submission period: 2026-07-13 09:00 PDT through 2026-07-21 17:00 PDT

Planned track: Education

Working submission name: **Number Rants Explorer**

Final submission name: **The Inhabited Archive**

Final due-day state: complete end-to-end Latin vertical slice with 30 works,
61,651 passages, 43 passing application tests, a downloadable serving shelf,
and a public no-key demonstration. The dated sections below preserve what was
known and planned when this baseline was first recorded.

## Purpose

This document separates the research project that existed before OpenAI Build
Week from the product functionality created during the submission period. It
is intentionally conservative: the submitted project is the new, runnable
Explorer experience. The larger corpus is inherited and concurrently improved
research infrastructure that makes the Explorer possible.

Official rule consulted:
<https://openai.devpost.com/rules>

## Before the Submission Period

The following intellectual and research foundations already existed before
2026-07-13 09:00 PDT:

- the research question about passages in which numbers receive qualitative,
  symbolic, theological, cosmological, ethical, sensory, or relational meaning;
- the affectionate working term **number rant**;
- the synesthesia/transmission hypothesis and its methodological caution
  against diagnosing historical people;
- a preliminary human codebook distinguishing qualitative number use from
  mere counting, measurement, or dating;
- a source-discovery map and targeted work list;
- initial acquisitions begun 2026-07-09, including Perseus Greek and Latin,
  First1KGreek, Patrologia Graeca OCR, Digital Syriac Corpus, selected public-
  domain editions, and the Sefaria master index;
- the full Corpus Corporum acquisition, launched 2026-07-12 and still running;
- the broad design intention that an English research question should
  eventually produce transparent, language-aware searches.

At the start of the submission period there was **no**:

- public or judge-runnable Number Rants application;
- conversational query-planning implementation;
- GPT-5.6 API integration;
- language-librarian implementation;
- qualitative-number classifier;
- incidental-quantity rejection layer;
- comparison or human-adjudication interface;
- rights-cleared demonstration dataset;
- Git repository or dated commit history for this project.

## Research-Infrastructure Work Added During Build Week

The following local infrastructure was created or completed after the
submission period began. It supports the submitted product but does not by
itself constitute the complete judge-facing experience:

- completion, validation, and collision recovery of the 30-collection Corpus
  Corporum acquisition;
- canonical Corpus Corporum v1 normalization: 9,939 documents and 1,491,851
  searchable segments with stable identifiers, source checksums, locators,
  language routing, provenance, and SQLite FTS5 retrieval;
- acquisition and validation of OpenITI 2025.1.9, a structured Sefaria intake,
  Patristic Text Archive, Coptic SCRIPTORIUM, and ETCBC BHSA;
- a full structural profile and frozen adapter design for OpenITI;
- regression tests, portability verification, a strict publication boundary,
  a public-surface auditor, and portfolio-safe documentation.

The acquisition log, filesystem timestamps, generated receipts, and Codex
session history provide contemporaneous evidence for this work. Because the
research project began earlier, the submission will not imply that the full
library was created from nothing during Build Week.

## New Submitted Product

The Build Week submission is a newly implemented vertical product slice. Its
completed core functionality:

1. accept a natural-language historical question in English;
2. use GPT-5.6 to produce an inspectable, structured query constellation;
3. retrieve passages deterministically from a small, explicitly licensed
   demonstration dataset built from the larger research environment;
4. distinguish qualitative or symbolic number interpretation from incidental
   quantity and visible uncertainty;
5. show evidence spans, original-language text, translation status, citation,
   provenance, license, and the query expansion responsible for each result;
6. support side-by-side comparison and human adjudication;
7. include a coherent runnable interface, tests, setup instructions, sample
   data, and a public demonstration.

The demonstration dataset is an interface and evaluation fixture. It does not
replace, define, or shrink the full research corpus.

## Human and AI Responsibilities

Shay owns the research question, inclusion criteria, interpretive judgments,
product priorities, rights decisions, and final scholarly adjudication.

Codex assisted with repository construction, data and application engineering,
test design, documentation, provenance checks, implementation alternatives,
and preparation of the runnable submission. GPT-5.6 is used inside the
product for structured research-question expansion and evidence-bounded
classification or explanation. Deterministic retrieval and source records
remain inspectable independently of model output.

## Rights Boundary

The submitted repository will not contain the complete local research library,
restricted Corpus Corporum text, full OpenITI or Sefaria payload trees, local
derived databases, or source text whose redistribution status has not been
confirmed at the edition/version level.

Adopted licensing model:

- project source code: MIT License (`LICENSE`);
- original project documentation: Creative Commons Attribution 4.0
  (`LICENSE-DOCUMENTATION.md`);
- demonstration passages and metadata: per-record source and license fields;
- third-party corpora and editions: not relicensed by this project.

See `DATA_LICENSES.md` and `docs/PUBLICATION_BOUNDARY.md` for the operational
publication rules.

## Baseline Verification

At baseline creation:

- the existing regression suite passes 13/13 tests;
- the publication auditor reports 33 public candidates, approximately 249 KB,
  with zero detected issues;
- no Git repository has yet been initialized;
- no Explorer application files exist.

## Evidence Going Forward

Build Week work will be evidenced through:

- dated Git commits beginning with this baseline;
- this Build Week document and a product changelog;
- the primary Codex task/session in which core functionality is implemented;
- tests and evaluation fixtures committed with the application;
- README documentation of human decisions and Codex/GPT-5.6 contributions;
- the required `/feedback` Codex Session ID submitted to Devpost.
