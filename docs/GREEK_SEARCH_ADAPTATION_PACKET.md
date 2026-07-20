# Greek Search-Adaptation Packet

Status: draft for review; §13 is an explicit stub until a Greek shelf
manifest exists
Drafted: 2026-07-19 (Rowan)
Scope: method guidance for the badger's English-to-Greek retrieval
planning. No Greek corpus has been selected; every corpus-dependent claim
below is marked as awaiting the shelf manifest.

Portability note: this packet deliberately mirrors the section structure of
`docs/LATIN_SEARCH_ADAPTATION_PACKET.md`. Sections whose content survived
the Latin-to-Greek move nearly unchanged are language-generic method and
belong eventually in a shared template (see `docs/PORTABILITY.md`);
sections that had to be rewritten wholesale are the language-specific
payload. Citations are given at the level of the cited work and need a
spot-check pass before this packet is marked final.

## 1. Six kinds of adaptation, kept distinct

Identical to the Latin packet, and template material. Every element of a
retrieval plan is exactly one of: **lexical translation** (including any
required syntactic frame), **morphological expansion**,
**historical-semantic expansion**, **contextual or conceptual
association**, **exclusion rules**, or **uncertainty**. The scholar must
see which category licensed each term, because the categories carry
different evidential weight.

## 2. From English concept to candidate lemmas

Method as in the Latin packet: enumerate the English senses first;
translate senses, not words; check every candidate's full Greek
sense-range in a Greek-first reference to discover what it drags in. The
reference stack differs by period: LSJ for archaic through early imperial
usage [LSJ 1996], Lampe for patristic Greek [Lampe 1961], BDAG for the New
Testament and early Christian literature [BDAG 2000], Montanari as a
current single-volume control [Montanari 2015].

Near-synonym differentiation is at least as sharp as in Latin. The classic
teaching case: English "love" needs *erōs* (desire), *philia* (friendship,
attachment), *agapē* (in classical usage colorless "affection," later the
central Christian term), and *storgē* (familial affection) — four lemmas
with different period profiles, not one [LSJ 1996 s.vv.; BDAG 2000].

Derivational families matter even more than in Latin because Greek
compounds productively: one English concept may live in a compound series
(*philo-*, *-philia*, *mis(o)-*, *theo-*), and each compound needs its own
sense check rather than being predicted from its parts.

A note for this project's proving ground, stated as method: Greek
cardinals *heis*, *duo*, *treis*, *tessares* decline; cardinals from
*pente* through *hekaton* are indeclinable; hundreds and ordinals decline
as adjectives [Smyth 1920]. Editions may also print alphabetic (Milesian)
numeral signs with the keraia (α′, ιβ′) alongside spelled-out forms, so a
numeral search must plan for both notations, and the mere-counting
false-positive class (§10) applies to every numeral plan.

### Dimensions Greek marks that English does not

As in the Latin packet, these are claims about lexical and grammatical
structure, not about what Greek speakers could think [Deutscher 2010].

- **The definite article exists and does heavy work** — the single biggest
  structural difference from Latin. Greek substantivizes freely with the
  article (*to agathon* "the good," *hoi polloi* "the many," *to on*
  "being"), builds articular infinitives (*to legein* "the act of
  speaking"), and turns participles into noun phrases (*ho legōn* "the one
  saying") [Smyth 1920]. English concepts that are abstract nouns often
  surface in Greek as article + adjective/infinitive/participle, so the
  candidate list must include these constructions as syntactic frames, and
  — unlike Latin — definiteness itself is partially searchable.
- **Color often encodes light and value as much as hue**: *leukos*
  (bright/white), *melas* (dark/black), *glaukos* (gleaming gray-blue),
  *chlōros* (pale green-yellow, fresh, of living things), and the famous
  wine-faced sea; the axis Shay's instinct predicted for Greek is real and
  is the canonical case in the literature on color language [Deutscher
  2010]. A hue-organized English concept map needs a brightness/vitality
  column.
- **The middle voice** marks self-involvement or subject-affectedness that
  English expresses lexically or not at all; some verbs change sense
  between active and middle (*archō* "rule" / *archomai* "begin") [Smyth
  1920]. A concept can hide in a voice, not a lemma.
- **Verbal aspect carries meaning**: the aorist/present/perfect stem
  contrast (single event vs. process vs. resulting state) can itself be
  the concept's carrier, and the stems differ enough to defeat naive form
  matching (§3).
- **Discourse particles** (*men/de*, *gar*, *dē*, *ara*) structure
  argument and stance with no stable English equivalents [Denniston
  1954]. They are also hyper-frequent and non-discriminative alone — a
  standing entry for the §10 forecast.
- **Value-laden social vocabulary is culture-bound**, as in Latin:
  *aretē* (excellence, not "virtue" narrowly), *kalos* (beautiful/noble),
  *sōphrosynē* (soundness of mind, self-mastery), *xenia*
  (guest-friendship), *polis*-vocabulary generally.
- **Dialect and register layer the lexicon**: Homeric, Attic, Ionic,
  Doric, and Koine forms of the same lemma can differ in stem and ending
  (§5), and poetic vocabulary splits from prose vocabulary as in Latin
  (register-restricted synonyms stay in category 1, tagged by genre).

Operational rule (template): an axis mismatch becomes a scope question
shown to the scholar, never a silent choice.

## 3. Inflection: why headword search fails

Greek inflection is heavier than Latin's on the verb side. A verb has up
to six principal parts and builds forms across three voices, four moods,
and multiple aspect stems; the augment (*e-*) and reduplication prefix
past and perfect forms so that the word does not even *begin* the way the
lemma does: *elegon* "I was saying" from *legō*; *lelyka* from *lyō*
[Smyth 1920]. Suppletion is common in the highest-value verbs: *legō /
erō / eipon / eirēka* "say"; *pherō / oisō / ēnenka* "carry"; *horaō /
opsomai / eidon* "see"; *erchomai / ēlthon* "come" [Smyth 1920]. Contract
verbs (*-aō, -eō, -oō*) fuse vowels; athematic (*-mi*) verbs follow
archaic patterns. Nouns decline across three declensions with dialectal
variation, and the dual number appears in Homer and older Attic.

Operational rule (template, from the Latin packet): for suppletive
paradigms the morphological expansion must list every principal-part stem
the index is expected to recognize as belonging to the lexical claim
(*pherō*: *pher-*, *ois-*, *enenk-*); those stems remain category 2
expansions of one lexical claim, not new lexical candidates.

Two early-Greek hazards must be operationalized, not merely mentioned:

- **Tmesis.** Early Greek — Homeric poetry above all — splits compound
  verbs, with the preverb standing words away from its verb: classical
  *katabainō* "go down" appears as *kata* … *bainō* [Smyth 1920]. A
  lemmatizer will read a preposition plus a simplex verb and never
  reconstruct the compound lemma. The plan must declare this
  irresolvability as uncertainty (§12) whenever a concept leans on
  compound verbs in archaic poetry. It may add a syntactic frame
  (preverb + simplex verb within a short window, §11) as a substitute,
  but that frame is a lossy reconstruction, not an ordinary lexical
  candidate: it is capped below secure confidence and always carries a
  standing category 6 disclosure. It must never appear in a plan with
  the same evidential standing as a true category 1 candidate.
- **The dual number.** Homer and older Attic inflect naturally paired
  things (eyes, hands, horses, opposing sides) in the dual [Smyth 1920].
  For paired concepts on early or epic shelves, the morphological
  expansion (category 2) must generate dual forms alongside the plurals,
  or the earliest and most poetic attestations silently vanish.

Operational rule for voice and aspect: when a concept lives in a voice or
aspect contrast — *archō* "rule" vs. *archomai* "begin"; an aorist-stem
event against a present-stem process — the restriction is part of the
lexical claim (category 1): the candidate is "*archomai*, middle," not
"*archō*, anywhere." The category 2 expansion then lists only the forms
that realize the restriction (middle endings, the aorist stem). Because
Greek surface forms are voice- and aspect-ambiguous — middle and passive
share their forms outside the future and aorist [Smyth 1920] — the plan
must also declare the residual blindness under category 6: the search
selects forms, and forms only partially select meanings.

## 4. Lemmatization

Morpheus, the morphological analyzer behind Perseus, was built for Greek
first [Crane 1991], with modern pipelines in the Classical Language
Toolkit and successors [Johnson et al. 2021]. Everything the Latin packet
says about lemmatization being a model output with an error rate is
template material and applies here. Greek adds one twist: analysis is
accent-sensitive, so the lemmatizer's behavior depends on whether the
index preserved accents (§5) — strip them and formerly distinct forms
merge before the lemmatizer ever sees them. The plan must state which
known confusions it expects (e.g. forms of *eimi* "be" vs. *eimi* "go";
*ōn* the participle vs. *hōn* the relative) and keep surface-form search
available as a cross-check.

## 5. Orthographic variation

The Greek analogue of Latin's u/v problem is **accents and breathings**,
and it is bigger:

- Accent marks and breathings are editorial apparatus in origin —
  systematized long after the classical texts were written, and applied by
  modern editors to texts whose earliest copies lacked them [Allen 1987].
  Printed literary editions are polytonic; the marks embody editorial
  judgment.
- **Digitally, accented Greek is a minefield the plan must name.** The
  same visible character can be encoded as different Unicode codepoints
  (precomposed "Greek Extended" forms with oxia vs. "Greek" block forms
  with tonos; precomposed vs. combining marks). Text not normalized to a
  single Unicode form will silently split identical words into distinct
  search tokens [Unicode Consortium]. Whether the index normalizes (NFC
  vs. NFD, tonos/oxia unification, accent-folding or not) is *the*
  corpus-dependent fact this packet cannot state until the shelf exists
  (§13).
- Stripping accents to simplify search creates homograph collisions (§7);
  keeping them makes search hostage to encoding consistency. Either choice
  must be declared to the scholar.
- Final sigma (ς) vs. medial sigma (σ) is a positional variant one
  codepoint apart; whether the tokenizer folds them must be verified, not
  assumed. Some older digitizations use lunate sigma (c) throughout.
- Iota subscript vs. adscript (*ᾠδή* / *ωιδη*) varies by edition and
  affects matching.
- **Movable nu** (*esti* / *estin*) makes common forms two spellings each.
- **Dialect spelling is systematic, not noise**: Ionic *ē* where Attic has
  long *a* (*thalassa/thalatta* also differ), Doric long *a*, Homeric
  uncontracted and metrically stretched forms. A lemma's dialect variants
  must be listed per work, exactly as the Latin packet lists archaic
  spellings per work [Horrocks 2010].
- Later texts and their editions can show itacism and related spelling
  drift [Horrocks 2010].

## 6. Enclitics and other tokenization problems

Greek enclitics (*tis*, *pote*, *ge*, *te*, forms of *eimi*) are written
as separate words — easier than Latin's attached *-que* — but they shift
accents on preceding words, which matters if matching is accent-sensitive
[Smyth 1920]. The genuine tokenization hazards are:

- **Elision**: *d᾽* for *de*, *all᾽* for *alla* — an apostrophe-bearing
  fragment the tokenizer must reunite with its lemma or the plan must
  list separately;
- **Crasis**: two words fused with a breathing-like mark (*kagō* = *kai
  egō*; *tounoma* = *to onoma*) — a single token containing two lemmas,
  invisible to search for either unless split or listed;
- Greek punctuation (the ano teleia · and the Greek question mark ;) and
  editorial sigla, which segmentation must not misread.

The plan must state whether the index splits elision and crasis, and list
known un-splittable fusions among its search forms.

## 7. Polysemy and homonyms

The load-bearing Greek lemmas are famously polysemous, and several
demonstration-grade cases should anchor any plan:

- *logos*: word, speech, account, argument, reason, ratio, and in
  Christian usage the Word — one lemma spanning rhetoric, mathematics,
  philosophy, and theology [LSJ 1996 s.v.; Lampe 1961 s.v.];
- *kosmos*: order, adornment, and world — the same double life as Latin
  *mundus*, which suggests the pairing is a translation-layer fact worth
  telling the scholar about;
- *archē*: beginning, first principle, rule, empire, magistracy;
- *pneuma*: wind, breath, spirit — period tag decisive;
- *nomos* "law/custom" vs. *nomós* "pasture, district": distinct lemmas
  separated *only by accent*, like *bios* "life" vs. *biós* "bow." These
  pairs are the concrete argument for accent-aware indexing (§5): strip
  accents and they merge; the plan must forecast the merges it inherits.
- Accent-stripped search also merges high-frequency grammatical words:
  *pote* "when?" vs. enclitic *pote* "ever"; *ē* covering the article,
  the relative, the particle "truly," and a subjunctive of "be."

Intra-paradigm ambiguity (template point from the Latin packet) applies:
neuter plural vs. feminine singular in *-a*, genitive plural *-ōn* across
all declensions, and identical dative/locative shapes; role-dependent
concepts hand adjudication to the owl as a demotion criterion, not a hard
filter.

## 8. Direct lexical evidence vs. conceptual association

Template material — identical to the Latin packet. The provenance of a
match (matched token vs. proposed association) must survive into the
result display [Manning, Raghavan & Schütze 2008].

## 9. Semantic change across periods

The Greek arc is longer than the Latin one: Homeric epic, archaic lyric,
classical Attic, Hellenistic Koine, and Jewish and Christian Greek, with
Koine simplifying morphology and shifting vocabulary along the way
[Horrocks 2010]. Two mechanisms deserve the badger's explicit attention:

- **Septuagint calquing**: Jewish translation Greek bent ordinary words
  toward Hebrew senses — *doxa* (opinion, reputation → glory), *diathēkē*
  (testament, will → covenant), *kyrios* (master → the Lord) — and those
  senses then flowed into all later Christian Greek [BDAG 2000; Horrocks
  2010].
- **Christian resemanticization**, the direct parallel to Mohrmann's Latin
  story: *agapē* elevated from colorless affection to the central
  theological virtue; *ekklēsia* (civic assembly → church); *baptizō*
  (dip, sink → baptize); *martys* (witness → martyr); *pistis* (trust,
  persuasion → the Faith); *euangelion* (reward for good news → gospel)
  [Lampe 1961; BDAG 2000].

Period-tagging cuts both ways, exactly as in Latin: classical senses
projected forward and Christian senses projected backward both
manufacture false positives. The reference stack enforces the discipline:
LSJ alone under-reports Christian senses; Lampe and BDAG alone
over-report them for classical texts.

**Syntax shifts across periods too, and category 3 covers it.** Because a
syntactic frame is part of the lexical claim (§1, category 1), the
period-drift of a frame is historical-semantic expansion exactly as a
sense-shift is. Two Koine facts the badger must build in [Horrocks 2010;
BDAG 2000]:

- **Prepositional frame drift**: Koine replaces classical bare-case
  constructions with prepositional phrases — the instrumental dative
  yields to *en* + dative, *eis* and *en* begin to merge, and the cases
  some prepositions govern shift. A frame written from classical grammar
  will under-retrieve Koine and patristic texts, and vice versa; frames
  must be period-tagged like senses.
- **The optative collapse**: the optative mood withers in Koine,
  surviving mainly in fossils (*mē genoito*), its work absorbed by the
  subjunctive and other constructions [Horrocks 2010]. A concept that
  rides on optative nuance — wish, potentiality, hesitation — cannot be
  found by form in later texts because the form has ceased to exist.
  This is a mandatory chronological scope warning (§12). The general
  rule: whenever a grammatical carrier (a mood, the dual, a
  construction) does not exist throughout the corpus period, the plan
  must say in which periods the search is structurally blind.

## 10. Anticipating and explaining false positives

The Latin packet's forecast classes are template material and all apply:
homonym hits, proper-name hits (*Charis*, *Eirēnē*, *Nikē* are common
names and divinities), frozen idioms, mere counting for numerals,
quotation and reported speech, dialogue voice (Plato's speakers exist to
be examined and refuted; patristic authors quote opponents at length),
negated or distanced uses, period back-projection, and hyper-frequent
lemmas. Greek sharpens two of them:

- **Particles and grammatical words are unsearchably frequent** (*de*,
  *kai*, *gar*, forms of *eimi*); any plan touching them must constrain by
  collocation or drop to disclosure-only.
- **Quotation density is extreme in later Greek prose**: church fathers
  quoting scripture, scripture quoting the Septuagint, commentators
  quoting Homer. Speaker attribution is required before a hit counts as
  the quoting author's usage.

## 11. Proximity and confidence

The six-tier proximity ladder, the single-lemma rule, and the four
cautions (anaphora and dropped subjects — Greek is also pro-drop;
editorial punctuation; hyperbaton and enjambment; proximity shows
relation, not the relation asked about) are template material and carry
over unchanged from the Latin packet [Manning, Raghavan & Schütze 2008].
One Greek-specific note: postpositive particles guarantee that the second
word of a clause is often a particle, so token-distance windows should
discount particles when measuring adjacency.

## 12. Uncertainty the scholar must see before approving

Template material, unchanged in structure: category labels for every
term; coverage gaps; expected lemmatizer confusions; period restrictions
and their basis; the false-positive forecast with liftable exclusions;
what the corpus cannot answer; graded confidence per branch
(secure/probable/speculative); and the escalation rule — when no
confident mapping exists, say so and recommend the TLG, the full
lexicographic record, or a human Hellenist rather than padding the plan.
Greek adds a standing declaration block and two per-concept disclosures.
The standing block states, once per plan and up front, the index-inherited
policies every branch obeys identically: whether matching is
accent-sensitive, whether final sigma is folded, and whether elision and
crasis are split (§5, §6, §7). These are properties of the shelf's index,
not choices the badger may make — and certainly not re-decide — inside
individual branches; every downstream confidence claim depends on them.
The per-concept disclosures: tmesis irresolvability whenever compound
verbs matter in archaic poetry (§3), and a chronological scope warning
whenever a concept relies on a grammatical carrier — the optative, the
dual, a classical case-frame — that does not exist throughout the corpus
period (§3, §9).

## 13. Limitations of the chosen editions and encodings — STUB

**Awaiting the Greek shelf manifest. Nothing here may be asserted yet.**
When the corpus decision exists, this section must answer, per work:

1. source repository and pinned snapshot (First1KGreek and
   canonical-greekLit are the natural candidates, since the TEI/CTS
   adapter is reusable — but this is an expectation, not a decision);
2. Unicode normalization form and tonos/oxia policy of the actual files,
   verified by inspection, not assumed;
3. whether the index folds accents, breathings, and final sigma, and what
   the tokenizer actually does with them (verify against the FTS
   configuration; see the u/v lesson from the Latin build, where the
   packet's assumption and the index's behavior diverged);
4. dialect composition of the shelf and per-work variant lists;
5. citation granularity per genre and editor;
6. embedded non-Greek content (Latin, Hebrew names, editorial apparatus);
7. edition vintages, known digitization quirks, and rights/provenance,
   mirroring `docs/DEMO_LATIN_CORPUS.md`.

Until then, the badger must not claim any Greek holdings at all.

## 14. Worked examples (method, not answers)

**"Love" (lexical differentiation + historical-semantic + uncertainty).**
Four lemmas (*erōs*, *philia*, *agapē*, *storgē*) with different period
profiles; *agapē* requires a period-split branch (weak classical
attestation; dominant in Jewish and Christian Greek) [LSJ 1996; BDAG
2000]. The plan states which senses the scholar's concept needs, tags
branches by period, and discloses that English "love" questions usually
conflate at least two of the four.

**"The good" (syntactic frame + exclusion).** The concept lives in an
article construction, *to agathon* / *ta agatha*, not in a bare lemma;
searching *agathos* alone drowns in ordinary adjectival uses ("good
man," "good things" as possessions). The frame — article + neuter
adjective, philosophical prose — is part of the lexical claim (§1), and
adjectival noise is the forecast exclusion.

**"Word/reason" (polysemy forecast + escalation).** *Logos* spans word,
account, ratio, argument, reason, and the Word. A plan that searches
*logos* without sense-splitting retrieves everything and evidences
nothing; the correct plan splits the scholar's intended sense into
period- and genre-tagged branches, forecasts the mathematical and
financial senses as exclusions where irrelevant, and — if the scholar
wants "reason as a faculty" — discloses that *logos*, *nous*, and
*phronēsis* divide that territory and the mapping is not secure without
clarification (§12).

**"Wish and possibility" (historical-syntactic + uncertainty: the
chronological scope warning exercised).** The classical carrier of remote
wish and potentiality is not a lemma but a mood — the optative, with
particles (*eithe*, *ei gar*, *an*) — which forces both hard disclosures
at once. First, a literal search floor cannot select by mood, so
form-based retrieval of "wishing" is structurally partial from the start
(§12). Second, the optative withers in Koine (§9), so whatever the plan
achieves for classical texts goes blind in later ones, and the warning
must say so: after the classical period the concept migrates into lexical
carriers (*euchomai* "pray, wish," *thelō*, *boulomai*), which form a
separate period-tagged branch. The particle *an* is hyper-frequent and
non-discriminative (§10) and may be used only inside collocational
frames. A plan that presented "wish" as one untagged branch would be
wrong in both periods at once; the split, and the blindness statement,
are the deliverable.

## References

- Allen, W. S. *Vox Graeca: The Pronunciation of Classical Greek*. 3rd
  ed. Cambridge: Cambridge University Press, 1987.
- BDAG: Danker, F. W., et al. *A Greek-English Lexicon of the New
  Testament and Other Early Christian Literature*. 3rd ed. Chicago:
  University of Chicago Press, 2000.
- Crane, G. "Generating and Parsing Classical Greek." *Literary and
  Linguistic Computing* 6.4 (1991): 243–245. (Morpheus analyzer.)
- Denniston, J. D. *The Greek Particles*. 2nd ed. Oxford: Clarendon
  Press, 1954.
- Deutscher, G. *Through the Language Glass: Why the World Looks
  Different in Other Languages*. New York: Metropolitan Books, 2010.
- Horrocks, G. *Greek: A History of the Language and its Speakers*. 2nd
  ed. Chichester: Wiley-Blackwell, 2010.
- Johnson, K. P., et al. "The Classical Language Toolkit: An NLP
  Framework for Pre-Modern Languages." *Proceedings of ACL 2021: System
  Demonstrations*, 2021.
- Lampe, G. W. H. *A Patristic Greek Lexicon*. Oxford: Clarendon Press,
  1961.
- LSJ: Liddell, H. G., R. Scott, and H. S. Jones. *A Greek-English
  Lexicon*. 9th ed. with revised supplement. Oxford: Clarendon Press,
  1996.
- Manning, C. D., P. Raghavan, and H. Schütze. *Introduction to
  Information Retrieval*. Cambridge: Cambridge University Press, 2008.
- Montanari, F. *The Brill Dictionary of Ancient Greek*. Leiden: Brill,
  2015.
- Smyth, H. W. *Greek Grammar*. Cambridge, MA: Harvard University Press,
  1920 (rev. G. Messing, 1956).
- TEI Consortium. *TEI P5: Guidelines for Electronic Text Encoding and
  Interchange*. https://tei-c.org/guidelines/p5/
- Unicode Consortium. *The Unicode Standard*, Greek and Greek Extended
  blocks and normalization forms (UAX #15).
