# Multilingual Acquisition Wave - 2026-07-14

This is the compact receipt for the second Number Rants acquisition wave.
Detailed provenance and repair notes remain in the project-level
`acquisition_log.md`.

## What Was Acquired

| Shelf | Technical receipt | Avery-to-Shay translation |
|---|---|---|
| Patristic Text Archive | Commit `524eb9763b1181bc9f14edf52943bfe2f7a43aed`; 1,253 XML-named files; 766 canonical-tree XML files parse cleanly | A frozen, reproducible multilingual early-Christian shelf rather than a website we hope stays the same |
| Coptic SCRIPTORIUM | Commit `d6332e37c7f92c737f51deb4f6e7ee872bfd603f`; 1,458 XML, 1,717 CoNLL-U, 561 TreeTagger files | Coptic texts plus several machine-readable linguistic views; we must avoid counting the same book three times |
| ETCBC BHSA | Commit `4db00e2157915495e1a4d3d57e41223df24775da`; 786 Text-Fabric feature files | A word-by-word Hebrew/Biblical Aramaic language engine for the future Hebrew librarian |
| OpenITI 2025.1.9 | MD5-verified 5,936,029,637-byte archive; 59,640 extracted files; 14,107/14,107 metadata text paths resolve; 9,109 works | A very large Arabic/Persian Islamicate library whose catalog and shelves agree exactly |
| Sefaria JSON | 26,322/26,322 SHA-256-checked objects: 19,705 texts, 6,595 schemas, 22 links/metadata; zero missing or invalid | The Jewish textual library, its maps, and its cross-references are all here in one nonredundant structured representation |

## Important Early Finds

- OpenITI includes Thabit ibn Qurra's Arabic translation of Nicomachus's
  *Introduction to Arithmetic* (29,400 metadata-counted tokens).
- OpenITI includes the *Epistles of the Brethren of Purity* (431,535
  metadata-counted tokens).
- Coptic SCRIPTORIUM includes the complete four-book *Pistis Sophia* in 28
  CTS-addressable parts.
- Sefaria supplies both core texts and their commentarial neighborhoods,
  including *Sefer Yetzirah*, the *Bahir*, the Zohar, and the *Guide for the
  Perplexed*.

## Integrity Vocabulary

- **Commit-pinned:** we recorded the exact Git state, so a later changed
  website does not silently change what we studied.
- **Checksum / hash:** a mathematical fingerprint of a file. A matching
  fingerprint gives strong evidence that the local file is byte-for-byte the
  expected file.
- **Manifest:** the machine-readable card catalog connecting stable IDs,
  source metadata, rights, and local file locations.
- **Canonical path:** the address our own system consistently uses, even when
  the provider's naming conventions are awkward.
- **Deduplication:** identifying parallel formats, editions, or witnesses so
  they remain available without being mistaken for independent works.

## Rights Guardrail

Local acquisition for research does not create a blanket right to republish.
OpenITI is CC BY-NC-SA 4.0 with source-level provenance variation. Sefaria
rights are version-specific and include many unspecified or unknown records.
PTA and Coptic licenses must remain attached at item or collection level.
BHSA data is CC BY-NC 4.0. Dicta was deliberately left as a search and gap-
discovery reservoir until lawful bulk access and reuse terms are resolved.

## Next Technical Move

Build separate, versioned canonical adapters for Sefaria JSON, OpenITI
mARkdown, PTA TEI, Coptic's parallel formats, and BHSA Text-Fabric. Preserve
all raw files and inherited metadata; expose one stable passage interface to
the language-specialist librarians. Do not pour these formats directly into
the frozen Corpus Corporum v1 database.
