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

The full build on 2026-07-19 produced:

- 30 documents;
- 61,651 passages;
- 47,313 prose passages;
- 10,652 separately typed editorial-note passages;
- 3,685 verse passages;
- 1 quotation passage;
- 30 document-search rows and 61,651 passage-search rows;
- zero orphan document or passage records;
- SQLite integrity result `ok`;
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

## Current Boundary

The database and command-line diagnostic are real. They are not yet connected
to the Explorer, the badger interface, an OpenAI call, or owl adjudication.
The current Cloudflare-oriented Explorer cannot be assumed to open a local
SQLite file directly; the application integration boundary must be designed
explicitly rather than hidden inside this adapter.

When Rowan's Latin packet returns, the next layer should define an inspectable
language-adaptation contract and send its approved lexical plan into this
retrieval floor. The UI should consume provenance-locked candidate records,
not raw model recollections of Latin texts.
