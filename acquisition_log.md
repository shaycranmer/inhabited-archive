# Number Rants Acquisition Log

Record every acquired corpus or text with date, source URL, version or commit,
local location, size, checksum when supplied, license, and known limitations.

## 2026-07-09 - Discovery launch

- Created the initial source universe with public, search-only, catalog-only,
  subscription, and library-needed reservoirs.
- Identified the April 2026 Patrologia Graeca OCR v3 dataset as the first
  high-yield download: 103.1 MB, CC BY 4.0, supplied MD5
  `0e9693c24bdf836997b9e912def7cc73`.
- Identified Perseus Greek and Latin plus First1KGreek as the first Git-based
  acquisition batch.
- Identified Sefaria Export as a 26 GB public corpus with a lightweight
  `books.json` index suitable for filtered acquisition before any full dump.
- Identified Corpus Corporum, openMGH, the Patristic Text Archive, and Clavis
  Clavium as immediate catalog/export targets.

## 2026-07-09 - Acquisition batch 1

- Perseus Canonical Greek Literature
  - commit: `3bd56262e3f3fed7cfdeab11ff37f69f0758eaf3`
  - local size: approximately 375 MB
- Perseus Canonical Latin Literature
  - commit: `76b87b04b36afe2cbcd70e285b4ceb248b103438`
  - local size: approximately 219 MB
- First1KGreek
  - commit: `4c9c843d80ee94b4371f52add5f7d68bbfe7ba4c`
  - local size: approximately 986 MB
- Patrologia Graeca raw OCR repository
  - commit: `a415fcae253cb2d7ec69a1176cfef1008c252215`
  - local size: approximately 144 MB
  - contains 33 PG volume directories and roughly six million Greek tokens
  - the richer Zenodo v3 tagged ZIP transferred too slowly; the interrupted
    file is preserved as `patrologia-graeca-v3.zip.partial` so it cannot be
    mistaken for a valid archive
- Sefaria Export master index
  - generated: `2026-07-02T07:03:07Z`
  - 19,705 indexed text/version records in a 19 MB JSON file
  - full public object store remains approximately 26 GB
- Generated `sources/indexes/local_cts_inventory.csv` with 3,270 locally
  acquired CTS representations across the three Perseus/OpenGreekAndLatin
  corpora.
- Generated `sources/indexes/sefaria_historical_relevance.csv` with 1,448
  version records covering 388 unique titles in Jewish Thought, Midrash,
  Kabbalah, and Second Temple categories.
- Digital Syriac Corpus
  - commit: `833adc148cc356a6c70c16f81b22df9188df717a`
  - local size: approximately 48 MB
  - 632 Syriac TEI documents inventoried in
    `sources/indexes/digital_syriac_inventory.csv`
  - 631 documents include composition-date metadata; transcription and
    editorial status are preserved for later quality filtering
- Coptic SCRIPTORIUM clone attempt stalled before object transfer and was
  stopped. No incomplete source directory was retained. Retry through a
  release archive or targeted sparse acquisition.

## 2026-07-10 - Landmark spot check and mystics batch

- Plotinus, `Enneades`
  - complete Greek CTS edition already present in First1KGreek
  - added the public-domain MacKenna/Page English text from the Internet
    Classics Archive
  - SHA-256: `c93ea7cca90a8734339f34756474ddd7e31cc6dc3f526c0e555d67702aefd655`
- Pseudo-Iamblichus / Anatolius, `Theologumena arithmeticae`
  - was not present in the bulk Greek corpora
  - acquired Friedrich Ast's 1817 public-domain Greek edition from Internet
    Archive as a 17 MB PDF plus OCR
  - PDF SHA-256: `2ad0798a595a36683c86b6e03e6282ddbba0e6c2218ea9c714940b4c5bd01336`
  - the supplied OCR badly confuses Greek characters and must not be used as
    canonical text without re-OCR and verification against the scan
- Nicomachus, `Harmonicum enchiridion`
  - complete Greek TEI edition already present in First1KGreek
  - no lawful English full-text edition acquired yet
- Evagrius Ponticus
  - acquired the 302-file TAN-Evagrius multilingual transcription and
    alignment repository
  - commit: `324c7418fcd32f9ae10b5799ba250bdd10da0f4d`
  - the dedicated Guide to Evagrius is the authority map for CPG numbers,
    attribution, versions, editions, and transcription status
- John Climacus, `Scala paradisi`
  - acquired public-domain Patrologia Graeca volume 88 as a 73 MB PDF
  - the Greek work is at PG 88.632-1164
  - PDF SHA-256: `7e8bb5934b5a442bb5f445f42730fa36dd7cd028eddcb13d8d61a829ccd44b7b`
  - machine-readable Greek still needs extraction or a separate transcription
- CatholicCorpus build repository
  - commit: `679a2d7649c432113e5dabc012fc22049dfbd7fa`
  - acquired its complete public-domain mystics task: 13 PDFs / approximately
    185 MB
  - authors include Thérèse of Lisieux, Julian of Norwich, Catherine of Siena,
    Ignatius of Loyola, Alphonsus Liguori, Anne Catherine Emmerich, Brother
    Lawrence, and Francis de Sales
  - borrow-only items were detected and skipped by the source script

## 2026-07-12 - Corpus Corporum / Patrologia Latina launch

- Provenance
  - Corpus Corporum is a University of Zurich digital-humanities project
    created by Prof. Philipp Roelli and collaborators; CatholicCorpus is the
    independent GitHub-hosted aggregation and download framework used here
  - source endpoint: `https://mlat.uzh.ch`
  - CatholicCorpus downloader commit:
    `679a2d7649c432113e5dabc012fc22049dfbd7fa`
  - Corpus Corporum TEI data is restricted to non-commercial research use;
    retain the generated `_source.json` sidecars with every text
- Validation collection: `Libri sacri` (Corpus Corporum idno `17098`)
  - 7 of 7 texts downloaded successfully; 0 failed
  - both standard TEI XML and POS-tagged XML were acquired
  - approximately 2.45 million indexed words
- Full Corpus Corporum intake
  - resumable `--all` acquisition launched at the default respectful request
    rate; the live server exposed 30 top-level corpora
  - Patrologia Latina (Corpus Corporum idno `38`) runs first
  - expected scope: 5,277 texts / approximately 85.5 million words
  - expected runtime: approximately 10–24 hours, including a long discovery
    pass across 1,528 authors and 5,204 works before file downloads begin
  - target directory: `sources/raw/catholic-corpus-build/02_corpus_corporum/Patrologia Latina (Migne)`
  - state ledger: `sources/raw/catholic-corpus-build/02_corpus_corporum/.download_state.json`
  - live log: `sources/raw/catholic-corpus-build/02_corpus_corporum/download.log`
  - after PL, the same run proceeds through all remaining discovered corpora
  - process launched under `caffeinate -i`; safe to resume the full intake with
    `python3 download_script.py --all --resume`

## 2026-07-13 - Corpus Corporum overnight milestone

- Patrologia Latina completed at 11:21 CDT
  - 5,731 texts newly downloaded
  - 99 representations skipped because they were already present or otherwise
    recognized by the resumable run
  - 1 failed text: Corpus Corporum idno `8377`, `Epistolae (Constantinus
    papa), J. P. Migne`; retain as a targeted retry rather than treating the
    collection as literally complete
- The 7-text `Libri sacri` validation collection was recognized and skipped
  cleanly during the resumed all-collections pass.
- Thomas Aquinas completed at 11:31 CDT
  - 77 works downloaded; 0 failed
  - approximately 125 MB on disk, including the `Summa Theologiae`, `Summa
    contra gentiles`, `Scriptum super Sententiis`, philosophical commentaries,
    disputed questions, biblical exposition, and smaller works
- At the morning checkpoint, Task 02 contained 17,264 files / approximately
  1.9 GB and 5,815 successful text ids in the state ledger.
- The full process remains active and has advanced to discovery of `Auctores
  scientiarum varii`; no files appear in that directory until its discovery
  walk completes.

## 2026-07-13 - Corpus Corporum afternoon checkpoint and detached resume

- Additional completed collections:
  - `Auctores scientiarum varii`
  - `Latinitas antiqua`
  - `Acta Sanctorum`
  - `Antiquitas Posterior`
- Checkpoint before resume:
  - 6,819 successful text ids
  - 20,257 files / approximately 3.3 GB in Task 02
  - failure count unchanged at 1 (`Epistolae (Constantinus papa)`, idno 8377)
- The original unified terminal session was released when the Codex task was
  changed. Acquired data and the state ledger remained intact, but discovery
  paused partway through `Corpus epistolarum Bullingeri` (idno `23570`).
- Local operational additions to the CatholicCorpus downloader:
  - added `--start-at IDNO` for `--all` runs so a resumed queue can begin at a
    chosen corpus without rediscovering every completed collection
  - added `detach_download.py`, a double-fork launcher that runs the downloader
    and `caffeinate` independently of the Codex task
  - detached log: `02_corpus_corporum/detached-download.log`
- Detached acquisition resumed at Corpus Corporum idno `23570`; the live
  server reported 23 corpora remaining. Verified processes after launch:
  downloader PID 16655 and `caffeinate` PID 16656. PIDs are ephemeral and
  should not be treated as durable identifiers; verify by command/log instead.

## 2026-07-13 - Corpus Corporum evening checkpoint

- Detached downloader and `caffeinate` processes remain alive, confirming that
  acquisition now survives Codex task changes.
- Additional completed collections:
  - `Corpus epistolarum Bullingeri`
  - `Croatiae auctores Latini`
  - `Dissertationes`
  - `Encyclopediae`
- Current collection: `Graeca miscellanea`
  - 558 of 1,069 server entries processed at the checkpoint
  - the collection overlaps earlier acquisitions; the downloader records and
    skips known text ids while acquiring missing representations
  - recent arrivals include Greek and Latin Epictetus, Euclid's `Elementa`,
    and multiple Euripidean plays, with standard and POS-tagged XML
- Task 02 totals at checkpoint:
  - 7,928 successful text ids
  - 23,606 files / approximately 3.5 GB
  - failure count unchanged at 1 (`Epistolae (Constantinus papa)`, idno 8377)

## 2026-07-13 - Corpus Corporum late-evening checkpoint

- Detached downloader and `caffeinate` remain active.
- Additional completed collections:
  - `Graeca miscellanea`
  - `Grammatici Latini`
  - `Hagiographica`
  - `Historica`
- Current collection: `Itinera`, in its discovery phase at the checkpoint.
  The live catalog walk is surfacing itineraries alongside anonymous passions,
  ritual texts, revelations, Aristotelian questions, hymns, and other SISMEL
  editions; preserve server collection labels while allowing later local
  genre classification to differ.
- Task 02 totals at checkpoint:
  - 8,519 successful text ids
  - 25,356 files / approximately 3.7 GB
  - failure count unchanged at 1 (`Epistolae (Constantinus papa)`, idno 8377)

## 2026-07-14 - Corpus Corporum acquisition complete

- The detached all-collections queue completed normally at 06:32 CDT. Both
  downloader and `caffeinate` exited after the final collection; their absence
  from the process table is expected completion, not failure.
- All 30 live Corpus Corporum top-level collections were discovered and
  processed across the validation, initial, and detached runs.
- Final Task 02 footprint:
  - 10,077 successful unique text ids in the resume ledger
  - 29,826 local files in the completed validation snapshot
  - approximately 4.2 GB
  - SHA-256:
    `9a94293a38a9d8c0d6bc3e3d630e53f60090171e75ad9b15bc8109344388dde6`
  - standard TEI XML, POS-tagged XML where available, and provenance sidecars
- The detached 23-collection continuation contributed 3,258 newly downloaded
  texts and reported 0 new failures. Overnight completions included:
  `Itinera`, `Latinità Italiana del Medioevo`, `Mathematica`, `Mirabile Digital
  Library`, `Monumenta Germaniae Historica`, `Neolatinitas`, `Philosophica`,
  `Poetica`, `Ptolemaeus Latinus`, `Richard Rufus Project`, `Rinascimento`,
  `Scriptores Ecclesiastici`, `Theologica`, `Versiones latinae`, and
  `noscemus`.
- Final known acquisition failure remains one Patrologia Latina item:
  Corpus Corporum idno `8377`, `Epistolae (Constantinus papa), J. P. Migne`.
  Retain this as a targeted retry/verification task; do not rerun the entire
  Patrologia Latina discovery tree merely for this item.
- Completion log:
  `sources/raw/catholic-corpus-build/02_corpus_corporum/detached-download.log`
- Next phase is validation and inventory: verify XML parseability, reconcile
  downloaded ids with local files and sidecars, enumerate collection/language/
  author/work coverage, quantify skipped/inaccessible representations, and
  preserve a versioned manifest before moving or restructuring the library.

## 2026-07-14 - Corpus Corporum validation snapshot

- Completed a read-only, file-by-file audit of the 4.2 GB acquisition. No raw
  source text was renamed, moved, repaired, or deleted.
- The local shelf contains 9,939 identifiable text sets across all 30
  collections. Every local set has one readable-text XML file, one POS
  companion payload, and one provenance sidecar.
- 9,933 of 9,939 readable-text XML files parse cleanly. Six files have bounded
  XML/entity/encoding defects and remain queued for non-destructive repair.
- POS companions use three actual payload types despite the shared `.pos.xml`
  extension:
  - 9,655 are ZIP archives containing XML;
  - 51 are raw XML files that parse cleanly;
  - 233 are 21-byte server placeholders containing `File not found. Sorry`,
    meaning the optional POS representation was unavailable while the ordinary
    source text remains present.
- The resume ledger's 10,077 successes exceed the 9,939 preserved local sets by
  138. Log and filename analysis accounts for all 138 as overwrites caused by
  title-only filenames: exact repeated titles, 80-character truncation,
  case-insensitive filename collisions, and embedded control whitespace. The
  recovery downloader must include Corpus Corporum's numeric id in every
  filename.
- One additional id, `8377` (`Epistolae (Constantinus papa), J. P. Migne`),
  remains the original network-timeout failure and was never marked successful.
- 551 sidecars contain a generic `Latin` label that disagrees with the TEI's
  internal language declaration, overwhelmingly in `Graeca miscellanea`. Use
  TEI language metadata as authoritative; treat this as catalog cleanup, not
  textual corruption.
- Fourteen filenames contain tabs or line breaks inherited from upstream
  titles. One byte-identical primary-text pair was found (`Chronicon` /
  `Chronicon Beneventanum`, idnos `20861` and `11839`); it is retained as a
  possible duplicate edition rather than automatically deleted.
- Frozen outputs:
  - `sources/indexes/corpus_corporum/corpus_manifest.csv`
  - `sources/indexes/corpus_corporum/collection_summary.csv`
  - `sources/indexes/corpus_corporum/validation_issues.csv`
  - `sources/indexes/corpus_corporum/corpus_snapshot_2026-07-14.json`
  - `sources/indexes/corpus_corporum/validation_report.md`

## 2026-07-14 - Corpus Corporum canonical normalization

- Profiled TEI structure across all 9,939 local records and all 30 collections.
  The corpus mixes generic P5-style `div` structures with legacy `div1` through
  `div7`, plus prose paragraphs, verse lines, sentence markup, tables, lists,
  word-level Hebrew, and four records requiring structural fallback from the
  outset.
- Implemented `number-rants-canonical-v1` as an immutable-source / reproducible-
  derivative design:
  - original TEI and provenance sidecars remain untouched;
  - documents receive stable `cc:<idno>` identities;
  - passages receive stable ordered ids and retain XML start/end paths;
  - adjacent short units aggregate only within compatible language, citation,
    parent, and page contexts;
  - editorial notes remain separately typed and searchable;
  - source language aliases normalize to canonical routing codes while the
    original code remains available for audit.
- Authoritative derived database:
  `derived/normalized/corpus_corporum/corpus_corporum_librarian_v1.sqlite3`
  - 9,939 document records
  - 1,491,851 passage records
  - 9,939 document FTS5 rows
  - 1,491,851 passage FTS5 rows
  - approximately 4.2 GB
  - SQLite integrity check `ok`; 0 foreign-key violations; 0 duplicate passage
    ids; 0 passages missing XML start/end addresses
- Document outcomes:
  - 9,422 normalized through ordinary block extraction
  - 509 normalized through a visible coarse structural fallback at 90 percent
    atomic coverage threshold
  - 6 retained as explicit parse-error records pending source XML repair
  - 2 retained as `source_empty` because upstream TEI bodies contain only gaps
- The coarse fallback is a precision warning, not text loss: broader structural
  divisions are indexed when source-specific markup would otherwise omit too
  much of the body.
- Lexical spot check found a live number-rant candidate in *Acta Sanctorum,
  Iulius 7*: `cc:23503:seg:001383` and `cc:23503:seg:001384`, discussing Greek
  `ἑξάς` / Latin `senarius` as beautiful and perfect.
- Rebuild tool: `tools/normalize_corpus_corporum.py`
- Structure profiler: `tools/profile_corpus_corporum_tei.py`
- Technical/plain-language documentation:
  - `schema/CANONICAL_SCHEMA.md`
  - `derived/normalized/corpus_corporum/NORMALIZATION_REPORT.md`
  - `derived/normalized/corpus_corporum/QUERY_GUIDE.md`

## 2026-07-14 - Corpus Corporum collision recovery complete

- Added `tools/recover_corpus_corporum_ids.py`, a resumable targeted recovery
  tool that derives its queue from the validation snapshot and failed-state
  ledger, validates XML/POS payloads before atomic writes, and uses upstream
  Corpus Corporum numeric ids as collision-proof basenames.
- Recovered all 138 records previously overwritten by title-derived filename
  collisions plus the one original timeout (`8377`):
  - 139 attempted;
  - 139 recovered;
  - 0 failed.
- Recovery location:
  `sources/raw/catholic-corpus-build/02_corpus_corporum/_recovered_by_id/`
  Each record retains ordinary XML, the upstream POS payload where available,
  and a provenance sidecar.
- The refreshed whole-library audit now reports:
  - 10,078 identifiable text sets;
  - 10,078 successful unique ids in the state ledger;
  - 0 state ids missing locally;
  - 0 local ids absent from the state ledger;
  - 0 failed ids;
  - 10,072 ordinary XML files parsing cleanly and the same 6 bounded upstream
    parse defects still awaiting non-destructive repair.
- Notable recovered works include `Liber de causis`, `De proportionibus
  proportionum`, `Astronomicon libri`, and an exposition on the *Divine
  Names*. These demonstrate that the filename collisions hid substantive
  project-relevant texts as well as repeated generic titles.
- The existing `corpus_corporum_librarian_v1.sqlite3` remains a frozen
  9,939-document derivative. The 139 recovered sources should enter the next
  versioned canonical rebuild rather than being silently inserted into a
  database whose report and checksum describe the earlier snapshot.

## 2026-07-14 - Multilingual acquisition wave 2 launched

- Patristic Text Archive acquired as a shallow, commit-pinned Git checkout:
  - commit: `524eb9763b1181bc9f14edf52943bfe2f7a43aed`
  - local location: `sources/raw/patristic-text-archive/`
  - approximately 626 MB / 1,288 files
  - 1,253 XML-named files total across canonical and generated-analysis trees;
    the canonical `data/` tree contains 766 XML files (536 TEI editions plus
    230 CTS work/textgroup metadata files), all 766 parsing cleanly
- Coptic SCRIPTORIUM acquired successfully after the earlier stalled attempt:
  - commit: `d6332e37c7f92c737f51deb4f6e7ee872bfd603f`
  - local location: `sources/raw/coptic-scriptorium/`
  - approximately 2.4 GB / 5,590 files
  - 1,458 XML, 1,717 CoNLL-U, and 561 TreeTagger SGML files; representations
    and parallel witnesses must be deduplicated deliberately during canonical
    normalization
- ETCBC BHSA acquired as Hebrew/Biblical Aramaic language infrastructure:
  - commit: `4db00e2157915495e1a4d3d57e41223df24775da`
  - local location: `sources/raw/etcbc-bhsa/`
  - approximately 2.3 GB / 1,152 files
  - 786 Text-Fabric feature files across versioned data releases
  - treat BHSA as lemma/morphology support for a Hebrew librarian, not as the
    number-rant corpus by itself
- Full Sefaria one-representation acquisition launched independently under
  `caffeinate`:
  - source index generated `2026-07-02T07:03:07Z`
  - 26,322 collision-safe objects planned: 19,705 JSON text/version records,
    6,595 schemas, and 22 link/metadata objects
  - files use SHA-256 source-URL identities; original human metadata and URLs
    remain in an incremental JSONL manifest
  - local location: `sources/raw/sefaria-json-2026-07-02/`
  - log: `sources/indexes/acquisition_wave_2026-07-14/sefaria_json.log`
  - version-level rights must remain attached; no corpus-wide redistribution
    license should be inferred
- OpenITI full release `2025.1.9` launched as a resumable verified download:
  - archive: 5.9 GB
  - published and required MD5:
    `95cf19a9320fee6c37c4c26c9fa860b1`
  - 10,202 text files representing 6,236 works
  - metadata TSV acquired and verified MD5:
    `cb2226f64264efa964df9ef659d40199`
  - release-notes ZIP acquired and verified MD5:
    `e127a3fccd2df033a6462542820f55a0`
  - local location: `sources/raw/openiti-2025.1.9/`
  - log: `sources/indexes/acquisition_wave_2026-07-14/openiti_2025_1_9.log`
  - release license: CC BY-NC-SA 4.0; preserve URI and source-level provenance
- Long acquisitions are detached from the Codex task and inhibit system idle
  sleep while active. Launch state and ephemeral process ids are recorded in
  `sources/indexes/acquisition_wave_2026-07-14/launch_state.json`; logs and
  output state, not the pids, are the durable indicators of progress.

## 2026-07-14 - OpenITI 2025.1.9 acquisition verified complete

- Downloaded archive size: 5,936,029,637 bytes.
- Published MD5 and independently recomputed local MD5 match exactly:
  `95cf19a9320fee6c37c4c26c9fa860b1`.
- Safe extraction produced 59,640 files and occupies approximately 27 GB with
  the retained release archive and metadata.
- Validated the publisher metadata against the extracted text paths:
  - 14,107 text versions;
  - 9,109 distinct work identifiers;
  - 9,539 primary and 4,568 secondary versions;
  - 14,107 resolved locally and 0 missing;
  - approximately 2.349 billion metadata-counted tokens across all versions.
- The actual version/work totals in the 2025.1.9 metadata exceed the older
  summary figures initially recorded; the local validated counts now govern.
- Stage labels are retained rather than flattened: 12,698 plain, 834
  `completed`, 564 `mARkdown`, and 11 `inProgress` text files.
- Project-relevant confirmed holdings include Thabit ibn Qurra's Arabic
  translation of Nicomachus's *Introduction to Arithmetic* and the *Epistles
  of the Brethren of Purity*.
- Machine-readable validation receipt:
  `sources/raw/openiti-2025.1.9/corpus_summary.json`
- Rebuild/validation tool: `tools/finalize_openiti_acquisition.py`

## 2026-07-14 - Sefaria JSON acquisition verified complete

- Acquired exactly one structured representation of the full indexed export,
  avoiding redundant TXT/CLTK copies while retaining the research-critical
  schemas and intertext-link datasets.
- Final validated intake:
  - 26,322 unique provider objects;
  - 19,705 text/version records;
  - 6,595 schemas;
  - 22 link or metadata datasets;
  - 7,785,413,160 payload bytes;
  - 0 missing, 0 failed, 0 SHA-256 mismatches, and 0 JSON validation errors.
- The initial pass isolated seven provider-path edge cases: six objects whose
  literal question marks were misread as URL queries and one provider-declared
  zero-byte schema. A percent-encoding/empty-object fix recovered all seven.
- The independent whole-shelf audit then exposed 109 valid payloads stored
  under `.bin` because the original suffix parser treated semicolons in titles
  as URL parameter separators. Every payload matched its recorded SHA-256 and
  parsed as JSON; all 109 were atomically moved to canonical `.json` paths and
  received appended reconciliation receipts. No redownload was necessary.
- The final manifest has 26,322 rows and 26,322 unique stable record ids. The
  record-file tree likewise contains 26,322 files and no abandoned partials.
- Rights remain edition-specific. The extracted metadata includes public
  domain and Creative Commons versions but also 8,186 unspecified and 2,074
  `unknown` license values; the raw shelf must never be treated as having one
  blanket redistribution license.
- Holdings include both core and commentarial neighborhoods: 29 indexed
  versions/works around *Sefer Yetzirah*, 7 around the *Bahir*, 63
  Zohar-related records, and 28 around the *Guide for the Perplexed*.
- Machine-readable receipts:
  - `sources/raw/sefaria-json-2026-07-02/corpus_summary.json`
  - `sources/raw/sefaria-json-2026-07-02/corpus_manifest.csv`
  - `sources/raw/sefaria-json-2026-07-02/path_reconciliation_summary.json`
- Acquisition and audit tools:
  - `tools/acquire_sefaria_json.py`
  - `tools/reconcile_sefaria_paths.py`
  - `tools/finalize_sefaria_acquisition.py`

## 2026-07-14 - Portability and publication-safe project surface

- Confirmed the complete `sources/raw/` plus `derived/` footprint is
  approximately 60 GiB and can move as one project tree or through external
  raw/derived data roots.
- Added `tools/verify_library_portability.py`:
  - quick mode checks 10,078 Corpus Corporum source paths, SQLite health and
    counts, all Sefaria/OpenITI file totals, and three pinned Git commits;
  - deep mode additionally recomputes the OpenITI archive MD5, canonical
    database SHA-256, and all 26,322 Sefaria record hashes;
  - the quick audit passes completely on the current local library.
- Added `docs/PORTABILITY.md` with APFS/SSD guidance, copy-before-delete
  migration steps, whole-project and external-data layouts, and post-copy
  verification commands.
- Rebuilt the project README as a publication-safe portfolio front door and
  added `docs/PUBLICATION_BOUNDARY.md`, strict `.gitignore` rules,
  `requirements.txt`, and acquisition regression tests.
- Added `tools/audit_publication_surface.py`. Its current dry run exposes 33
  small code/documentation candidates and excludes all raw corpora,
  derivatives, operational indexes, logs, archives, and machine-local state.
  No sensitive-path or secret-pattern issues are detected.
- Nothing has been initialized, committed, or published to GitHub. Repository
  naming and project-code licensing remain explicit user choices.

## 2026-07-14 - OpenITI whole-corpus structure profile

- Read all 14,107 catalogued OpenITI versions in full: 23,166,195,554 source
  bytes and 240,945,712 lines. Zero files were missing and zero required a
  Unicode decode fallback.
- Structural coverage:
  - all 14,107 contain the metadata-end boundary and milestone markers;
  - 11,847 contain printed-edition `PageV…P…` anchors;
  - 7,871 contain hierarchical `### |` section headings;
  - 1,138 use poetry separators;
  - 477 contain semantic `@TAG` annotations;
  - 13 contain Markdown-style table rows.
- The literal opening `######OpenITI#` line appears in only 10,023 files and
  therefore cannot be used as the sole validity test.
- Counted 5,069,525 hierarchical headings, 11,377,461 page markers, and
  7,836,784 milestone occurrences. These provide a strong auditable locator
  layer even where ordinary chapter headings are absent.
- Located one empty upstream heading containing 66 pipe characters. Treat it
  as a bounded source anomaly: ignore empty headings, flag implausible depth,
  and do not let it alter the active citation stack.
- Frozen outputs:
  - `sources/indexes/openiti-2025.1.9/structure_profile.json`
  - `sources/indexes/openiti-2025.1.9/STRUCTURE_PROFILE.md`
- Rebuild tool: `tools/profile_openiti_structure.py`

## 2026-07-14 - OpenITI adapter contract frozen

- Added `schema/OPENITI_ADAPTER_V1.md` and
  `schema/openiti_extension_v1.sql`.
- Stable version identity uses `openiti:<version_uri>`; work relationships use
  the provider `book` URI. Primary/secondary status, stage, languages, edition
  metadata, OCR status, source tags, manuscript fields, and provider counts
  remain in an OpenITI-specific extension rather than being flattened.
- The shared v1 `source_xpath` fields will receive honest `openiti:line:…`
  compatibility locators; precise page, milestone, line, section, and tag data
  live in `openiti_segment_locators`. A future generic schema may rename the
  core fields without corrupting v1.
- Thirteen regression tests now pass, including OpenITI extension installation,
  path safety, Sefaria URL punctuation, and canonical TEI extraction behavior.
- The publication-surface audit now passes with 33 files / approximately
  248 KB and no detected private-path, secret, or large-file issues.
