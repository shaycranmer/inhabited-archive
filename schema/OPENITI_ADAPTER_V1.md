# OpenITI Canonical Adapter v1

Status: design frozen for mechanics implementation

Target: all 14,107 versions in OpenITI release 2025.1.9

Output: separate, rebuildable `openiti-canonical-v1` SQLite database

## Scope Rule

The full OpenITI release is the research corpus. A stratified mechanics build
will test the adapter before the full run; it does not select, canonize, or
limit the intellectual field.

## Source Evidence

The whole-corpus structure profile read 23,166,195,554 bytes across all 14,107
versions with zero missing or undecodable files.

- 14,107 have metadata-end markers and OpenITI milestones;
- 11,847 have printed-edition page markers;
- 7,871 have hierarchical section headings;
- 1,138 use poetry separators;
- 477 contain inherited semantic tags;
- 13 contain Markdown-style table rows;
- 10,023 contain the opening magic-header line.

Therefore, the magic line is useful evidence but not a validity requirement.
Milestones are the universal structural floor.

## Identity and Relationships

| Canonical field | OpenITI source | Decision |
|---|---|---|
| `document_id` | `version_uri` | `openiti:<version_uri>` |
| `source_id` | `version_uri` | preserve exactly |
| `series_id` | `book` | related editions/transcriptions share a work URI |
| collection | release | `OpenITI 2025.1.9` |
| languages | `language` | split comma-separated codes; preserve original string |
| title | `title_lat`, then `title_ar` | retain both in extension table |
| author | `author_lat`, then `author_ar` | retain both in extension table |
| estimated words | `tok_length` | provider token count, not recomputed truth |
| source path | `local_path` | project-relative; resolve stage suffix separately |
| source hash | local payload | compute SHA-256 during normalization |

**Plain language:** every particular edition keeps its own permanent spine
label. Multiple editions of the same work remain neighbors, not duplicates to
be silently collapsed.

## OpenITI Version Extension

`openiti_versions` stores source concepts that do not belong in every corpus:

- exact `version_uri` and `book_uri`;
- primary/secondary status;
- stage suffix (`plain`, `completed`, `mARkdown`, `inProgress`);
- Arabic/Persian titles and author forms;
- author date code from the URI metadata;
- subcorpus and source collection identifier;
- uncorrected-OCR flag;
- provider token and character counts;
- edition information, tags, manuscript fields, and parts metadata.

The author date code must not be placed in `publication_date`: in OpenITI it
usually describes the author/URI chronology rather than the edition's
publication date.

## Segment Parsing

1. Read until `#META#Header#End#` as the source header.
2. Treat `### |`, `### ||`, and deeper forms as hierarchical headings.
3. Ignore empty headings and record implausible depth above 15 as an ingest
   issue. The known empty 66-pipe anomaly must not alter citation context.
4. Treat `# ` as a paragraph start and `~~` as continuation text.
5. Recognize poetry separators, table rows, and other content lines without
   forcing them into prose.
6. Extract `PageV…P…`, `ms…`, and `@TAG` tokens as locators/annotations rather
   than ordinary searchable words.
7. Preserve heading stacks as `citation_path_json` and a readable
   `citation_label`.
8. Split oversized blocks deterministically, preferring sentence or whitespace
   boundaries and using the existing canonical chunk-size policy.
9. Emit stable sequence-based segment IDs:
   `openiti:<version_uri>:seg:<six-or-more-digit sequence>`.

**Plain language:** chapter signs, printed pages, and machine milestones become
maps attached to each reading slip. Technical marker strings do not clutter
the text a scholar searches.

## Locator Extension

The shared v1 core names two legacy fields `source_xpath` and
`source_xpath_end`. For compatibility, OpenITI will populate them with stable
line locators such as `openiti:line:1234`, never pretend they are XML paths.

`openiti_segment_locators` adds the format-accurate fields:

- source line start/end;
- first/last page marker;
- first/last milestone;
- section depth;
- raw heading marker when applicable;
- inherited source tags as JSON.

A future canonical schema version may rename the generic core fields to
`source_locator_start` and `source_locator_end`. The extension avoids breaking
the working Corpus Corporum v1 database merely to improve vocabulary.

## Quality and Ranking

- Primary and secondary versions are both searchable.
- Stage labels and `uncorrected_OCR` are ranking/evidence features, not silent
  exclusion rules.
- `inProgress` versions receive visible warnings.
- Provider semantic tags remain inherited evidence and never become project
  truth without adjudication.
- Multiple language codes remain multiple codes.
- Exact Arabic/Persian lexical retrieval is the transparent floor; later
  language librarians may add orthographic normalization, lemmatization, and
  semantic expansion as separately inspectable query layers.

## Coverage Metrics

Each build must report:

- metadata rows attempted and normalized;
- missing, undecodable, empty, and parse-warning counts;
- primary/secondary and stage distributions;
- normalized segment and character totals;
- heading/page/milestone/tag retention counts;
- documents using headings versus milestone/paragraph fallback;
- stable-ID duplicates, orphan locators, and SQLite integrity results;
- SHA-256 of the completed database.

## Mechanics Build

Before the full build, generate a deterministic stratified set spanning:

- primary and secondary versions;
- every stage label and language/subcorpus;
- size deciles;
- headings present/absent;
- page markers present/absent;
- prose, poetry, tags, and tables;
- the depth-66 anomaly;
- Thabit/Nicomachus and the Brethren of Purity.

Passing the mechanics build authorizes the same adapter to run across all
14,107 versions. It does not authorize adapting the rules to make only the
sample look clean.

## Rights

Record the OpenITI release license as CC BY-NC-SA 4.0 while retaining
source-level provenance and edition metadata. A normalized local database is a
research derivative, not automatically a publicly redistributable artifact.
