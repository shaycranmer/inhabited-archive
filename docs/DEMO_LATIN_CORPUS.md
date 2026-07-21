# Inhabited Archive Demonstration Latin Corpus

Status: selected; canonical index built; Explorer integration not yet begun
Decision date: 2026-07-19
Machine-readable manifest: `sources/indexes/demo_latin_30.csv`
Reviewed scope catalogue: `sources/indexes/demo_latin_catalogue_scope.csv`

## Decision

The Project Day demonstration corpus is a 30-work Latin shelf drawn from the
Perseus Digital Library's `canonical-latinLit` repository. It is deliberately
larger and more varied than the eventual video query while remaining small
enough to package as a local, inspectable search index.

The selected source snapshot is Git commit
`76b87b04b36afe2cbcd70e285b4ceb248b103438`. The source XML uses TEI (Text
Encoding Initiative) structure and CTS (Canonical Text Services) identifiers.
Raw source files remain immutable; the application will search a rebuildable
derived index.

## Selection Rule

The shelf was selected before choosing the final demonstration question. It
contains six complete works in each of five declared baskets:

1. poetry and drama;
2. history and biography;
3. philosophy and rhetoric;
4. knowledge and everyday life, including medicine, agriculture,
   architecture, natural history, miscellany, and letters;
5. late antique and early Christian writing.

The shelf contains 30 edition-level documents representing 30 distinct works
and 26 distinct named authors. Repeated authors occur only where a second work
materially widens the shelf: Cicero, Tertullian, Boethius, and Prudentius.

All 30 works also have reviewed work-level scope metadata: inclusive
composition-date ranges, date certainty, genre tags, tradition tags, and a
short dating note. Composition dates remain separate from modern edition
publication dates. Approved catalogue boundaries are therefore enforceable
before passage retrieval; an uncertain range that crosses a boundary is kept
and flagged rather than silently discarded.

Selection favored:

- complete primary-language works rather than hand-picked passages;
- stable CTS work and edition identifiers;
- different genres, domains, centuries, and discourse situations;
- texts that let retrieval succeed, fail, and surface unexpected relations;
- one edition per selected work;
- a size suitable for a portable local index.

Selection did not use the eventual video question, the existing Number Rants
regression examples, or known answer passages.

## Coverage Boundary

This is a Latin demonstration shelf, not a representative history of all
premodern thought. Its surviving-text and Perseus-collection biases must be
visible in the application. Absence from this shelf is not evidence of
historical absence.

The shelf supports arbitrary questions only within its declared holdings. A
question about a later technology, a non-Latin tradition, or a missing genre
may receive a historically useful bridge proposal from the fox, but the
badger must not claim that the shelf contains evidence it does not contain.

Greek is the preferred second-language extension because the same TEI/CTS
adapter can be reused. Syriac remains a later, stronger portability test once
the Latin retrieval path is stable.

## Rights and Provenance Boundary

Perseus states that repository contents are licensed by default under Creative
Commons Attribution-ShareAlike 4.0 International unless otherwise indicated,
while also warning that individual materials can vary in copyright status.
The selected-file audit therefore requires both the repository license and a
check for contrary file-level notices.

For the selected 30 files:

- every source path resolves inside the pinned repository snapshot;
- no selected XML file contains a contrary copyright or license declaration;
- the manifest records the repository-default license basis rather than
  pretending each TEI header supplies an independent license grant;
- attribution, the source repository, the pinned commit, the edition URN, and
  the source bibliography must travel into every derivative document record;
- transformed or redistributed derivatives must preserve the applicable
  CC BY-SA 4.0 obligations.

This is a project provenance review, not legal advice. A publication audit
must run again after derived files exist and before any public push.

## Selection Audit Receipt

The local audit on 2026-07-19 found:

- 30 manifest rows, 30 unique work URNs, and 30 unique edition URNs;
- exactly six works in each declared basket;
- 26 distinct named authors;
- all 30 relative source paths present at the pinned clean Git snapshot;
- all 30 XML documents well formed;
- every manifest edition URN present in its corresponding TEI document;
- a `titleStmt`, `sourceDesc`, and numbered citation structure in every file;
- no file-level notice that conflicts with the repository-default CC BY-SA
  4.0 license;
- 37,581,349 bytes of selected source XML and approximately 23,675,702 bytes
  of primary text before normalization.

The audit rejected the inventory's listed Tacitus *Annales* edition because
that exact file was absent from the pinned snapshot. Tacitus's *Historiae*,
whose file and edition URN agree, occupies the history slot instead. The
manifest therefore describes files that actually exist rather than silently
repairing an upstream identifier mismatch.

## Rowan's Bounded Specialist Packet

Rowan's next task is a short, sourced Latin search-adaptation packet, not a
general history of Latin and not annotations of these 30 works. The final
packet should be reviewed and versioned in this repository and should explain:

1. how English concepts become candidate Latin lemmas and related terms;
2. inflection, lemmatization, orthographic variation, and enclitics;
3. classical-to-late-antique and Christian semantic change;
4. literal wording versus conceptual association;
5. dangerous homonyms, polysemy, and predictable false positives;
6. proximity and contextual evidence needed before calling a relationship
   meaningful;
7. corpus-specific limitations of these Perseus editions and TEI structures;
8. uncertainty language the scholar should see;
9. citations for every substantive linguistic or methodological claim.

The packet may include a few worked examples, but those examples should teach
method rather than supply expected answers to the future demo question.

## Implemented Corpus Floor

The deterministic adapter now reads this manifest without rewriting the raw
TEI, extracts citable passages, preserves source and edition metadata, and
builds a local SQLite full-text index. The verified build contains 30
documents and 61,651 passage records. An independent second build produced the
same canonical content hash. See
`schema/PERSEUS_LATIN_DEMO_ADAPTER_V1.md` for commands, metrics, the one
explicit Plautus coverage warning, and the plain-language receipt.

The inspectable Latin adaptation contract and first explicit runtime bridge are
now implemented. The verified SQLite shelf exports into a receipt-locked local
D1 serving database; a scholar can test an individual badger proposal without
approving it or invoking relevance judgment. Public D1 loading and complete
approved-plan retrieval remain the next technical boundaries.
