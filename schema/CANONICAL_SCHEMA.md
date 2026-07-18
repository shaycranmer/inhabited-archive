# Number Rants Canonical Text Schema v1

Status: implemented for Corpus Corporum; designed to accept additional source
adapters without changing the downstream librarian interface.

## Two-layer rule

The source layer is immutable. Original TEI XML, provenance sidecars, and
checksums remain untouched.

The canonical layer is reproducible. A normalizer reads the source layer and
creates a derived SQLite database whose records all follow the same schema.
Deleting and rebuilding the canonical database must never damage the sources.

**Plain language:** the original books stay exactly as acquired. We build a
standard card catalog and a set of searchable reading slips beside them.

## Stable identity

- `document_id`: globally stable corpus-prefixed identifier, initially
  `cc:<Corpus Corporum idno>`.
- `segment_id`: document identifier plus a deterministic sequence number,
  initially `cc:<idno>:seg:<six digits>`.
- `source_id`: the upstream repository's own permanent identifier.
- `source_sha256`: a cryptographic fingerprint of the exact source file used.

**Plain language:** title strings are labels, not identities. Two works can be
called *Testimonia* without colliding because the permanent numeric id—not the
title—is the real spine label.

## Core tables

### `documents`

One row per source text. It stores normalized descriptive metadata, the raw
file and provenance locations, source checksum, rights statement, ingest
status, and passage totals.

### `document_languages`

One row per language declared inside a document. This supports multilingual
texts without pretending every work has exactly one language. Canonical codes
use a single stable vocabulary (`lat`, `grc`, `heb`, `eng`, and so on), while
the source's original aliases remain in `source_language_codes_json`.

### `segments`

One row per searchable passage. A passage retains:

- its document and deterministic order;
- normalized Unicode text;
- passage type (`prose`, `verse`, `heading`, `sentence`, `table_cell`, or
  `fallback_chunk`);
- effective language;
- canonical language plus the source's original language tag;
- original TEI element, attributes, XML start/end paths, and the number of
  source units combined into the passage;
- page marker when available;
- hierarchical citation context derived from enclosing divisions and heads;
- chunk-part information when a source paragraph is too long for useful
  retrieval.

**Plain language:** librarian agents search consistent passage cards, but each
card carries a map back to the exact shelf, book, division, page marker, and
XML location it came from.

### `ingest_issues`

Machine-readable exceptions such as malformed XML, missing bodies, or texts
that produced no usable passages. An ingest run can finish without hiding the
documents it could not normalize.

### `document_search` and `segment_search`

SQLite FTS5 full-text indexes over documents and normalized passages. They use
the canonical tables as external content, so the index does not store another
full copy of titles, authors, collections, and passage text. This is a
transparent lexical retrieval baseline, not the eventual cross-lingual
semantic system.

**Plain language:** this gives us a fast literal word-search librarian now.
Later Greek, Latin, Syriac, Hebrew, Arabic, and semantic librarians can query
the same passage records without learning thirty source-specific layouts.

## Text extraction policy

The searchable text is Unicode-normalized to NFC and whitespace-normalized.
The raw XML is never rewritten.

The normalizer prefers authorial text over editorial machinery:

- for `<choice>`, prefer corrected or regularized forms when supplied;
- for `<app>`, prefer the lemma over variant readings;
- exclude editorial notes, alternate readings, figures, running headers, and
  deletion markup from the normalized search text;
- retain the raw source path so any extraction decision is auditable.

## Structural adapter policy

Corpus Corporum includes both generic `<div>` and legacy numbered divisions
such as `<div1>` through `<div7>`. It also represents passages as paragraphs,
verse lines, sentences, list items, quotations, table cells, and occasionally
word-level or line-break-only structures.

The adapter therefore:

1. extracts known atomic text blocks without nesting duplicates;
2. preserves headings as searchable context;
3. falls back to the deepest unsegmented structural division when a document
   has no ordinary paragraph or line blocks;
4. splits very long blocks into deterministic retrieval-sized parts;
5. records the precise source element and XML path for every result.

## Deliberate non-goals for v1

- no automatic translation;
- no embeddings or semantic ranking;
- no number-rant classification;
- no correction of the six malformed source XML files;
- no mutation of inaccurate upstream sidecars;
- no attempt to collapse duplicate editions automatically.

Those operations belong to later, separately versioned layers.
