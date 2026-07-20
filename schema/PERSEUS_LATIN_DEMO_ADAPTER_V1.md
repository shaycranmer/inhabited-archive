# Perseus Latin Demonstration Adapter v1

Status: implemented and locally verified
Source selection: `sources/indexes/demo_latin_30.csv`
Source commit: `76b87b04b36afe2cbcd70e285b4ceb248b103438`

## Purpose

This adapter turns the Inhabited Archive's 30 complete Perseus Latin works
into the same canonical document-and-passage interface used by the larger
Number Rants research infrastructure.

The raw TEI (Text Encoding Initiative) XML remains untouched. The adapter
creates a rebuildable SQLite database with FTS5 (SQLite Full-Text Search 5)
indexes, stable source identifiers, hashes, rights, bibliographic metadata,
and exact paths back into the XML.

**Plain language:** the books do not move or change. The builder creates a
portable card catalogue and 61,651 searchable reading slips beside them.

## Build

From the repository root:

```bash
python3 tools/build_demo_latin_corpus.py
```

The command verifies the pinned source commit and refuses to overwrite an
existing derivative unless `--replace` is supplied explicitly. It writes:

- `derived/demo_latin/perseus_latin_demo_v1.sqlite3`
- `derived/demo_latin/perseus_latin_demo_v1.summary.json`

Both remain ignored local derivatives until the publication packaging choice
is approved.

## Canonical Identity

| Field | Value |
|---|---|
| `document_id` | `perseus-latin:<edition_urn>` |
| `source_id` | exact CTS edition URN |
| `series_id` | exact CTS work URN |
| `segment_id` | document ID plus deterministic six-digit sequence |
| `source_sha256` | SHA-256 of the exact TEI file |

CTS means Canonical Text Services. Work and edition identifiers remain
separate so a future second edition can be related without being collapsed.

`perseus_latin_documents` records the selection-specific fields that do not
belong in every corpus: shelf order, basket, work and edition URNs, repository,
pinned commit, SPDX license expression, and the rights-review receipt.

When Git verification is enabled, the builder now requires both the exact
pinned commit and a completely clean source checkout. A tracked modification
or untracked file stops the build before any XML is read. Publication date and
publisher metadata are scoped to TEI `publicationStmt`; a revision-history
date can no longer be mistaken for an edition publication date.

## Passage Policy

The adapter reuses the tested canonical TEI extraction policy:

- prefer corrected or regularized forms supplied by `<choice>`;
- prefer the lemma in an apparatus `<app>`;
- exclude alternate readings, deletion markup, figures, and running headers
  from the authorial search text;
- preserve headings and numbered divisions as citation context;
- keep editorial notes as separately typed passages;
- split long passages deterministically at readable boundaries;
- retain source XML paths, page markers, language tags, and structural labels.

The diagnostic search excludes `editorial_note` passages by default. The
notes remain available for later scholarly inspection but do not silently
outrank the primary text.

The Perseus edition wrapper is removed from the human-readable citation label
while its full edition URN remains attached as metadata. Thus a scholar sees a
locus such as `Book One > 1` rather than the edition URN repeated as a heading.

## Verified Build Receipt

The full build on 2026-07-19, repeated after the
`perseus-latin-demo-normalizer-v2` metadata-scope correction, produced:

- 30 documents;
- 61,651 passages;
- 47,313 prose passages;
- 10,652 separately typed editorial-note passages;
- 3,685 verse passages;
- 1 quotation passage;
- 30 document-search rows and 61,651 passage-search rows;
- zero orphan document or passage records;
- SQLite integrity result `ok`;
- final SQLite journal mode `delete`, so the packaged database opens read-only
  without WAL sidecar files;
- 97,337,344 database bytes;
- approximately 23,734,650 bytes when gzip-compressed;
- canonical content SHA-256
  `a9a8c77a89a1ca89beb8ac199239b66066ac8c99e60ceb0660d6240ccbd87405`.

An independent second full build produced the same canonical content hash and
the same database size. The content hash deliberately excludes the build
timestamp and filesystem location.

One explicit warning remains. Plautus's *Amphitruo* has 1,409 numbered lines
inside 585 marked speeches. Searchable authorial lines cover 85.7 percent of
the conservative body-text measurement because repeated speaker labels and
some editorial structures are not indexed as authorial verse. The adapter
retains 451 precise act/scene/line passage groups and records the warning. It
does not replace good citations with anonymous fallback chunks.

## Diagnostic Search

Search literal Latin terms without an API key:

```bash
python3 tools/search_demo_latin_corpus.py somnium --limit 5
python3 tools/search_demo_latin_corpus.py "domus patria" --mode any --limit 5
python3 tools/search_demo_latin_corpus.py memoria --json --context 1
python3 tools/search_demo_latin_corpus.py domus --preview --sample-limit 3
```

Each result includes its document and segment IDs, author, work, readable
citation, CTS work and edition URNs, XML start/end paths, source hash, pinned
source URL, rights statement, match snippet, and optional neighboring context.

The diagnostic layer performs literal lexical retrieval only. For example,
`somnium` already surfaces citable candidates across Horace, Livy, Plautus,
and Pliny the Younger, while requiring both `numerus` and `perfectus` returns
no hit. The latter is not proof that the concepts are absent. It demonstrates
why the inspectable Latin specialist must add lemmas, inflected forms,
orthographic variants, semantic relations, and uncertainty before retrieval.

Literal queries now expand mechanically across every *u/v* and *i/j*
combination and match case-insensitively, so `uita` can retrieve source text
printed as `vita` without changing the displayed source. The current floor
does not fold *ae/e* or *oe/e*, strip diacritics, split enclitics, or lemmatize.
Raw `--fts-query` mode deliberately bypasses this safety expansion.

Preview mode counts the matches for one proposed term and returns examples
from different works in declared shelf order where possible. These examples
are diagnostic rather than relevance-ranked. A verified `domus` preview found
295 passages across 24 works; a nonsense-token preview returned zero with an
explicit reminder that shelf absence is not historical absence.

## Current Boundary

The database, command-line diagnostic, live badger route, folio interface, and
local D1 diagnostic bridge are real. The Explorer does not open this SQLite
file: `tools/export_demo_latin_d1.py` projects its serving columns into a D1
import carrying the same source commit and canonical content hash. The public
D1 database is not yet loaded, and owl adjudication remains unbuilt.

The inspectable language-adaptation and preview contracts are defined in
`schema/BADGER_ADAPTATION_CONTRACT_V1.md`. The folio's diagnostic term-test
control now consumes provenance-locked D1 records rather than model
recollections. The next layer sends only approved guidance into full search.
