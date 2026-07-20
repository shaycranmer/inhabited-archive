# Latin Search-Adaptation Packet

Status: draft for review; not yet versioned as authoritative
Drafted: 2026-07-19 (Rowan)
Scope: method guidance for the badger's English-to-Latin retrieval planning
against the 30-work demonstration shelf (`docs/DEMO_LATIN_CORPUS.md`,
`sources/indexes/demo_latin_30.csv`)

This packet tells the badger how to turn a scholar-approved English concept
map into an inspectable Latin retrieval plan. It is not a history of Latin
and not an annotation of the shelf. Every substantive claim carries a
citation; citations are given at the level of the cited work, and page-level
references should be verified against the physical or digital editions before
this packet is marked final.

## 1. Six kinds of adaptation, kept distinct

Every element of a retrieval plan must be labeled as exactly one of:

1. **Lexical translation** — an English concept mapped to candidate Latin
   lemmas whose dictionary senses cover it (e.g. *domus* for "home"),
   including any syntactic frame a candidate requires to carry that sense
   (§2): the frame is part of the lexical claim, not an afterthought.
2. **Morphological expansion** — the inflected forms a lemma can take in
   running text (*domus, domūs, domui, domum, domo, domorum, domibus…*).
3. **Historical-semantic expansion** — additional lemmas or senses justified
   by documented change in usage across periods (e.g. *saeculum* acquiring
   "the present world" in Christian authors).
4. **Contextual or conceptual association** — expressions that evoke the
   concept without naming it (hearth, household gods, threshold for "home").
   These are hypotheses about evidence, not evidence.
5. **Exclusion rules** — senses, collocations, or contexts deliberately
   filtered out, each with a stated reason.
6. **Uncertainty** — what the badger does not know, stated before retrieval.

The scholar must be able to see which category licensed each proposed search
term, because the categories carry different evidential weight: a hit from
(1)+(2) is direct lexical evidence; a hit from (4) is at best an invitation
to read.

## 2. From English concept to candidate lemmas

English concepts rarely map to a single Latin word, and the mapping is
many-to-many in both directions [OLD 2012; Lewis & Short 1879].

Method:

- Enumerate the English concept's distinct senses first; translate senses,
  not the word.
- For each sense, gather candidate lemmas from a bilingual dictionary pass,
  then check each candidate's full Latin sense-range in a Latin-first
  reference (OLD for classical usage to c. AD 200; Souter 1949 and Blaise
  1954 for later and Christian usage) to discover what else the candidate
  drags in.
- Record near-synonym differentiae. Classic example: English "white" needs
  both *albus* (flat, matte white) and *candidus* (gleaming, radiant white,
  with strong metaphorical extension to moral brightness and favor); the two
  are not interchangeable, and a plan using only one will silently miss half
  the evidence [OLD 2012 s.vv.; André 1949 on Latin color terms].
- Include multi-word expressions and standing phrases, not only single
  lemmas; Latin routinely expresses concepts periphrastically (e.g. kinds of
  fear via *metum inicere*, *in timore esse*).
- Record the syntactic frame where the concept lives in a construction
  rather than a word. Latin expresses many English concepts through
  impersonal verbs and case government: pity via *miseret* (accusative of
  person, genitive of cause: *miseret me tui*), regret via *paenitet*,
  shame via *pudet*, need via *opus est* with the ablative [Allen &
  Greenough 1903]. A bare-lemma search for such concepts either drowns in
  noise or misses the construction entirely; the plan must state the frame
  (governing case, expected collocates) as part of the lexical candidate.
- Consider the derivational family as separate candidate lemmas: agent
  nouns in *-tor*, abstracts in *-tas*/*-tudo*, adjectives in *-bilis*,
  diminutives in *-ulus* (which carry affective force). Derivation is
  lexical expansion, not inflection: *amator* and *amabilis* are not forms
  of *amor*, and each derivative needs its own sense check [Allen &
  Greenough 1903].
- Concepts involving persons or places need the name plus its derived
  adjectives and ethnonyms (*Roma*, *Romanus*, *Quirites*), and abbreviated
  praenomina where relevant (§13).
- For each candidate, state which English sense it serves and which of its
  Latin senses are *unwanted* — this seeds the exclusion rules (§8).

### Dimensions Latin marks that English does not

Beyond one-to-many wordlists, some concept fields are carved along different
axes in Latin than in English, and the badger should check for an axis
mismatch whenever a concept map crosses one of these fields. This is a claim
about lexical structure, not about what Latin speakers could think; the
stronger "language shapes thought" thesis is contested and the badger does
not need it [Deutscher 2010].

- Color terms often encode luster as much as hue: the *albus*/*candidus*
  pair (matte vs. gleaming white) is matched by *ater*/*niger* (flat vs.
  glossy black), and terms like *fulvus* and *purpureus* carry sheen and
  texture [André 1949]. A hue-organized English concept map needs a
  brightness column.
- Kinship marks lineage side: *patruus* (father's brother) vs. *avunculus*
  (mother's brother); *amita* vs. *matertera*. English "uncle"/"aunt"
  underdetermine the Latin.
- The mind/soul/spirit field splits as *animus* (seat of will and emotion),
  *anima* (life-breath, soul), *mens* (intellect), *ingenium* (inborn
  capacity). This is live on this shelf: term choice in Tertullian's *De
  Anima* is doctrinally loaded, and an English query for "soul" must decide
  which branches it wants [OLD 2012 s.vv.].
- Social-value vocabulary is culture-bound: *pietas* (duty toward gods,
  family, and state — not "piety"), *fides*, *virtus*, *religio* (awe,
  scruple, cult obligation — not "religion"), *otium*/*negotium*. English
  glosses import anachronism [Hellegouarc'h 1963; OLD 2012].
- Direction words carry omen valence that shifts by discourse: *dexter*/
  *sinister*, with *laevus* favorable in Roman augural usage — an
  evaluative axis English "left/right" lacks.
- Structural facts shape searchability: Latin has no articles, so English
  concepts hinging on definiteness cannot be searched as such; abstractions
  often surface as substantivized neuter adjectives (*bonum*, *summum
  bonum*, *omnia*) rather than abstract nouns; and productive prefixation
  spreads one notion across a verb family (*aspicere*, *conspicere*,
  *inspicere*, *perspicere*, all from *specere*), so a "watching/observing"
  concept needs the prefix family, not one verb.
- Register splits vocabulary between prose and verse: a sword is *gladius*
  in prose but frequently *ensis* in poetry; epic diction systematically
  avoids certain everyday words and substitutes elevated equivalents
  (*sonipes* for *equus*, *lympha* for *aqua*) [Axelson 1945]. On a shelf
  mixing Virgil, Ovid, and Prudentius with Caesar and Celsus, a
  prose-only candidate list fails silently in the poetry baskets. The
  register-restricted synonyms remain direct lexical candidates (§1
  category 1), tagged by genre, not conceptual associations.
- Greek is the donor language of Latin technical vocabulary: a
  philosophical or medical concept may live in a Greek loanword, a
  Ciceronian calque (*qualitas*, coined in the *Academica* for ποιότης), or
  a periphrasis, and Cicero discusses the coinage problem openly in his
  philosophical prefaces [Clackson & Horrocks 2007].

Operational rule: when the badger detects an axis mismatch, the plan should
surface it as a scope choice for the scholar ("gleaming white, matte white,
or both, tagged separately?") rather than silently choosing one side.

A note specific to this project's proving ground: Latin numerals are a
grammatically mixed class. Cardinals *unus*, *duo*, *tres* decline; cardinals
from *quattuor* through *centum* are indeclinable; hundreds, ordinals
(*primus*, *secundus*…), and distributives (*singuli*, *bini*…) decline as
adjectives, and numeral adverbs (*semel*, *bis*, *ter*…) do not decline
[Allen & Greenough 1903]. Roman numeral signs (VII, X) and spelled-out forms
coexist in editions, so a numeral search must plan for both notations, and
the mere-counting false-positive class (§10) applies to every numeral plan.
This is stated as method; question-specific numeral lexica belong in the
retrieval plan for that question, not in this packet.

## 3. Inflection: why headword search fails

Latin is heavily inflected. Nouns decline across five declensions, two
numbers, and up to seven case forms; adjectives additionally mark three
genders and comparison; a regular verb can realize well over a hundred
distinct finite and non-finite forms across person, number, tense, voice,
and mood, plus participles, gerund, gerundive, and supine [Allen & Greenough
1903; Clackson & Horrocks 2007]. A search for the headword *amor* misses
*amoris, amori, amorem, amore, amores, amorum, amoribus*; a search for
*fero* misses the suppletive stems *tuli* and *latum* entirely. Headword
matching therefore produces silent, systematic recall failure — worst for
exactly the high-value irregular vocabulary (*sum, fero, volo, eo*) whose
paradigms wander farthest from the lemma.

Frequent hazards the plan must name: suppletion (*fero/tuli/latum*),
deponent verbs (passive in form, active in sense), syncopated perfects
(*amasse* for *amavisse*), and heteroclite nouns such as *domus*, which
mixes second- and fourth-declension endings [Allen & Greenough 1903].

Operational rule for suppletive and heteroclite lemmas: the morphological
expansion must list every principal-part stem the index is expected to
recognize as belonging to that lexical claim (*fero*: *fer-*, *tul-*,
*lat-*). Those stems remain category 2 expansions of one lexical claim
(§1), not new lexical candidates.

## 4. Lemmatization

Lemmatization reduces an attested form to its dictionary headword. For
Latin this is genuinely ambiguous: many surface forms belong to several
lemmas or several slots of one paradigm, and correct resolution needs
context. Standard tooling descends from the Morpheus morphological analyzer
built for Perseus [Crane 1991; Smith, Rydberg-Cox & Crane 2000], with
modern pipelines in the Classical Language Toolkit and successors [Johnson
et al. 2021]. Ambiguity is not an edge case — a large fraction of Latin
tokens are morphologically ambiguous out of context [Bamman & Crane 2008].

Consequence for the plan: retrieval should run over a lemmatized index, but
the plan must state that lemmatization is a *model output with an error
rate*, name any forms it expects the lemmatizer to confuse (e.g. *canis*
"dog" vs. forms of *canere* "to sing"; *ora* to *os*, *ora*, or *orare*),
and keep surface-form search available as a cross-check.

## 5. Orthographic variation

Classical Latin writing did not distinguish *u/v* or *i/j*; these are
editorial conventions that vary by edition and era of editing [Allen 1978;
Adams 2013]. One edition prints *uita*, another *vita*; *iam* may appear as
*jam* in older editions. Other edition-dependent variation includes
assimilated vs. unassimilated prefixes (*adfero/affero*, *inp-/imp-*),
*-is/-es* accusative plurals, greek-loan spellings (*ph/f*, *y/i*), and late
or medieval spellings (*e* for *ae*, as in *seculum/saeculum*) [Adams 2013;
Löfstedt 1959].

Variation runs backward in time as well, and the shelf's early end makes it
concrete: Plautine editions preserve early Latin forms (*quom* for *cum*,
*med/ted* for *me/te*, *-os/-om* endings after *u/v*); Sallust deliberately
archaizes (*lubido* for *libido*, superlatives in *-umus* such as
*maxumus*); Lucretius keeps genitives in *-ai* (*aquai* for *aquae*)
[Clackson & Horrocks 2007; Adams 2013]. Editors normalize these to
different degrees, so archaic variants must be listed per work, not assumed
away.

The shelf makes this concrete: its 30 files come from editions digitized at
different times under different conventions (edition identifiers range from
`perseus-lat1` to `perseus-lat5` plus one `opp-lat1`). The plan must state
the normalization applied at indexing time (at minimum u→v-insensitive and
i→j-insensitive matching, case-folding, and ae/oe awareness) and must not
claim orthographic exhaustiveness beyond what the index actually
normalizes.

## 6. Enclitics and tokenization

Latin attaches enclitic particles to the preceding word: *-que* "and",
*-ve* "or", *-ne* (question marker), producing tokens like *populusque*,
*armaque*, *videsne* [Allen & Greenough 1903]. A tokenizer that treats
*armaque* as an unanalyzed token will miss a search for *arma*. Enclitic
splitting is itself ambiguous (*itaque* may be *ita+que* or the lexicalized
conjunction "therefore"; words genuinely end in *-que*, e.g. *quisque*,
*undique*). The plan must state whether the index splits enclitics and list
the known false splits the exclusion rules should catch. Assimilated
prefixes and editorially hyphenated or elided poetic forms are related
tokenization hazards.

## 7. Polysemy and homonyms

One Latin form can carry several weakly related or unrelated meanings, and
distinct lemmas can collide in surface form. The plan must list, for every
proposed term, the senses it does *not* intend. Teaching examples:

- *sacer*: both "sacred, consecrated" and "accursed, forfeited to a god for
  destruction" — near-opposite values on one lemma [OLD 2012 s.v.].
- *ius*: "law, right" and "broth, sauce" — fully distinct lexemes; a legal
  concept search will otherwise retrieve cookery [OLD 2012 s.vv.].
- *canis/cano* collision: *canes* is "dogs" or "you will sing".
- *liber*, three distinct phenomena sharing one surface form, each needing
  its own handling:
  1. true homonymy — *lĭber* "book" and *līber* "free" are separate lemmas
     whose distinguishing vowel length these editions do not print; the
     invisibility is an orthographic limitation (§13), not a semantic fact
     about the lemmas;
  2. lexicalized substantivization — *līberī* "children" is historically
     the plural of "free," but the dictionaries treat it as its own lemma
     [Lewis & Short 1879 s.v.], and only context separates "the free" from
     "the children";
  3. proper-noun collision — the god *Līber* shadows the adjective, a
     forecastable false positive (§10).

Ambiguity also lives *inside* a single paradigm. Because these editions do
not mark vowel length (§13), a first-declension nominative and ablative
singular are visually identical (*mensa/mensā*), a neuter plural in *-a*
masquerades as a feminine singular, and *-is* serves both dative and
ablative plural [Allen & Greenough 1903]. If the scholar's concept depends
on syntactic role — an instrumental ablative, an agent, a subject — surface
forms alone cannot deliver it. These overlaps usually cannot be excluded
without gutting recall, so the plan should forecast them as ambiguity
(which case roles the search cannot distinguish) and hand adjudication of
role-in-context to the owl as a demotion criterion rather than a hard
filter.

Homonym risk interacts with lemmatization (§4): the plan should say which
collisions the lemmatizer is trusted to resolve and which need contextual
filters or human review.

## 8. Direct lexical evidence vs. conceptual association

A passage containing *domus* is lexical evidence about "home" only in the
weak sense that the word occurs; a passage about hearth-fire, ancestral
masks, or homesickness may bear on the concept without containing any
candidate lemma. The instrument must keep these strictly apart:

- **Direct lexical evidence**: an approved lemma (or listed variant) occurs;
  the claim is verifiable by pointing at the token.
- **Conceptual association**: the badger proposes related expressions
  (metonyms, standing images, titles, practices) as *additional search
  hypotheses*. Each must be marked as an inference, given a reason, and
  ranked below direct hits at equal proximity.

The owl adjudicates both, but the provenance of the match — matched token
vs. proposed association — must survive into the result display, or the
scholar cannot audit the reasoning. This mirrors the retrieval-evaluation
distinction between matching and relevance [Manning, Raghavan & Schütze
2008].

## 9. Semantic change across periods

The shelf spans roughly Plautus (2nd c. BC) to Boethius (6th c. AD). Word
meanings do not hold still across that range [Clackson & Horrocks 2007;
Löfstedt 1959]. The badger's plan must therefore tag senses by period where
the difference matters, and the OLD's coverage boundary (to c. AD 200) means
late and Christian senses must be checked in Souter 1949, Blaise 1954, or
the TLL, not assumed from classical dictionaries.

Christian Latin is the sharpest case on this shelf. Christine Mohrmann's
work established that early Christian writers largely reused ordinary
classical vocabulary with altered or intensified meanings rather than
inventing a new lexicon [Mohrmann 1958–1977]. Standing examples of the
pattern: *fides* (reliability, good faith → the Faith), *gratia* (favor,
charm → grace), *saeculum* (age, generation → the present world as opposed
to the eternal), *confiteri* (admit, acknowledge → confess/praise God),
*sacramentum* (military oath, pledge → sacrament, mystery), *gentes*
(peoples → the Gentiles, pagans), *virtus* (manliness, excellence → moral
virtue, divine power, and later miracles). A plan that searches Tertullian,
Jerome, Minucius Felix, Prudentius, or Boethius' *De Fide* with only
classical senses will mislabel its strongest evidence; a plan that projects
Christian senses back onto Plautus or Lucretius will manufacture false
positives. Period-tagging cuts both ways.

## 10. Anticipating and explaining false positives

Every retrieval plan must ship with a false-positive forecast: the specific
ways this search will go wrong, stated before results exist. Recurrent
classes on this shelf:

- **Homonym hits** (§7): *ius* the sauce in Celsus or Pliny inside a legal
  query.
- **Proper-name hits**: *Candidus*, *Albus*, *Felix*, *Liber* as personal
  names or divine names inside color, fortune, or book queries.
- **Frozen idioms**: lexicalized phrases where the word no longer carries
  its concept.
- **Mere counting**: for numeral queries, a number used purely arithmetically
  (measurements in Vitruvius, dosages in Celsus, troop counts in Caesar) as
  opposed to a number doing symbolic or structural work. The distinction is
  the owl's core adjudication, but the badger must predict the counting
  noise so its volume does not surprise the scholar.
- **Quotation, reported speech, and dialogue voice**: a Christian author
  quoting a pagan source, or Gellius quoting archaic Latin, where the hit
  belongs to the quoted voice, not the quoting author's usage. Three shelf
  works are dialogues (*de Natura Deorum*, *Octavius*, *De consolatione
  philosophiae*) in which views belong to characters, some of whom exist to
  be refuted; a hit inside the Epicurean spokesman's speech is not Cicero's
  position. The plan must warn that speaker attribution is required before
  a hit counts as the author's view.
- **Negated or distanced uses**: a passage may contain the term while
  denying, mocking, or refuting the concept (*non*, *nec*, irony,
  refutation of opponents). A lexical match is not an affirmation.
- **Hyper-frequent lemmas**: terms such as *res*, *facio*, *habeo*, and
  *magnus* are too common to be discriminative alone. The plan should state
  expected hit volume for each term and constrain non-discriminative terms
  by collocation or proximity to rarer partners, rather than silently
  dropping them.
- **Period back-projection** (§9).

Each forecast entry becomes either an exclusion rule (hard filter, with the
filtered material recoverable, never silently discarded) or a demotion note
handed to the owl.

## 11. Proximity and confidence

Co-occurrence within a work is nearly meaningless in works the size of
Pliny's *Naturalis Historia*. Confidence should scale with structural
tightness, roughly ordered [cf. Manning, Raghavan & Schütze 2008 on
positional and proximity-weighted retrieval]:

1. same phrase or fixed collocation (strongest);
2. same sentence with syntactic connection;
3. same citation unit (line, section) — the shelf's practical default, since
   TEI citation units are the smallest reliably addressable spans;
4. same passage or argument (adjacent citation units within one structural
   parent);
5. same book of a work;
6. same work (weakest — report, but near-zero confidence on its own).

This scale governs multi-term plans. When a plan contains only a single
lexical candidate, the proximity scale does not apply: confidence is stated
solely in terms of the security of the lexical mapping, its period tag, and
the residual risks declared under §12.

Four cautions. First, proximity search sees only surface tokens, and Latin
continues topics anaphorically: once a subject is established, following
sentences refer back by pronoun — or, because Latin freely drops subjects,
by no surface token at all. A passage can discuss the scholar's concept for
a paragraph while the noun lemma appears once at its head, so
noun-plus-verb proximity queries systematically miss exactly the
contextually richest passages; wider windows and the conceptual-association
branch (§8) partially compensate, and the residual blindness must be
declared (§12). Second, all punctuation in these editions is editorial, so
"same sentence" boundaries are an editor's interpretation of the syntax,
not a fact of the transmitted text; tier 2 confidence inherits that
interpretation. Third, Latin hyperbaton routinely separates syntactically
bound words (an adjective from its noun) across several intervening words,
and verse enjambment crosses line boundaries, so phrase- and sentence-tier
windows must be set wider than English intuition suggests and tier
boundaries in poetry are approximations. Fourth, proximity is evidence of
*relation*, not of *the relation the scholar asked about*; the owl must
still say what the words are doing together.

## 12. Uncertainty the scholar must see before approving

The plan shown for approval must state, in ordinary language:

- which candidate lemmas are secure translations vs. speculative
  associations (the §1 category of every term);
- known coverage gaps ("I have not included medical technical vocabulary
  for this concept");
- expected lemmatizer confusions and unsplit enclitic risks;
- the anaphora blind spot: the badger cannot resolve pronouns — or Latin's
  dropped subjects — across citation units, so passages continuing a topic
  without repeating the noun lemma will be under-retrieved, and the plan
  must say so rather than imply exhaustive recall (§11);
- period restrictions and their basis;
- the false-positive forecast (§10) and every active exclusion, with its
  reason and a way to lift it;
- what the corpus cannot answer: absence from this 30-work shelf is not
  historical absence (`docs/DEMO_LATIN_CORPUS.md`), and the late antique
  basket's six works cannot support generalizations about "Christian Latin"
  beyond these witnesses;
- a confidence statement per major branch of the plan ("high for direct
  lexical branch; low for the conceptual-association branch, which is
  exploratory").

Uncertainty language should be graded and consistent (e.g. *secure /
probable / speculative*), never decorative hedging.

One escalation rule: when the badger cannot construct a confident mapping
for a concept, the plan must say so plainly and recommend consulting a
human Latinist or the fuller lexicographic record (TLL, specialist
literature) — not pad the plan with speculative associations to appear
complete. An honest "this concept exceeds my packet" is a valid and
required output.

## 13. Limitations of these Perseus editions and TEI structures

- The texts are specific historical editions, many first digitized from
  19th- and early 20th-century printings; they embody their editors'
  orthographic and textual choices, and the shelf holds one edition per
  work, so variant readings are invisible [Smith, Rydberg-Cox & Crane 2000;
  `docs/DEMO_LATIN_CORPUS.md`].
- Edition heterogeneity is visible in the manifest's mixed edition versions
  (`perseus-lat1` … `perseus-lat5`, `opp-lat1`); normalization practice is
  not uniform across them (§5).
- TEI markup gives citation structure (book/chapter/section or book/poem/
  line) but the files are not lemmatized and do not mark vowel length, so
  every lemma-level operation is derived, with error, at indexing time
  [TEI Consortium P5; §4].
- Citation-unit size varies by genre and editor, so "same citation unit"
  (§11 tier 3) is not a constant quantity of text across the shelf.
- Some files carry front matter, editorial headings, or notes inside or
  alongside the text stream, and the index may or may not have filtered
  them. The plan must state that hits on non-authorial editorial material
  are possible and hand such hits to the owl as a demotion criterion.
- The Latin shelf contains embedded Greek: Gellius's *Noctes Atticae* in
  particular quotes Greek at length, and other works carry Greek words and
  titles. The TEI may or may not tag these spans as foreign, and whether
  they are indexed is a property of the index, not of the plan. The plan
  must declare that Greek-script content is present on the shelf but
  outside a Latin retrieval plan's scope, and that hits adjacent to Greek
  quotation need voice attribution (§10).
- These are edited printed texts, not diplomatic manuscript transcriptions.
  Scribal phenomena — nomina sacra (the reverential contractions of *Deus*,
  *Christus*, *dominus* with suprascript stroke), ligatures, and medieval
  abbreviation systems — were silently expanded by the editions' editors
  [Traube 1907]. The badger will not encounter nomina sacra on this shelf
  and must not claim to search for them; a question about writing practice
  itself exceeds the declared holdings.
- Abbreviations that do survive in printed editions and must be planned
  for: Roman praenomina (*M.* = Marcus, *C.* = Gaius, *Cn.* = Gnaeus,
  *Q.* = Quintus) throughout the historians and letters; calendar terms
  (*Kal.*, *Non.*, *Id.*) in epistolary datelines; and Roman numeral signs
  (§2). A personal-name or date search that omits abbreviated forms fails
  silently, and abbreviation periods are a known sentence-segmentation
  hazard the plan should flag (§6).
- The pinned snapshot (commit `76b87b0…`) is the ground truth; claims hold
  for these files, not for "Perseus" or "Latin literature" generally.

## 14. Worked examples (method, not answers)

**"Home" (lexical + morphological + conceptual association + exclusion +
uncertainty).** Senses: dwelling; household/family;
homeland. Candidates: *domus* (dwelling, household — heteroclite paradigm,
§3), *aedes* (in singular usually "temple", plural "house": a sense-split
exclusion), *tectum* (metonymic "roof → house": conceptual association,
mid confidence), *patria* (homeland sense only), *penates/lares* (household
gods evoking home: pure conceptual association), *domicilium* (technical
residence). Exclusions: *aedes* singular in religious contexts; *domus* in
the fixed political sense "dynasty" if the scholar's question is domestic.
Uncertainty: idiomatic *domi* "at home" (locative) must be listed explicitly
or morphological expansion may miss it.

**"White" (lexical differentiation + conceptual association +
exclusion).** *Albus* vs. *candidus* (§2)
plus verbs (*candeo, albeo*) and boundary terms (*canus* "white-haired,
hoary" — related but distinct; *niveus* "snowy": simile-driven conceptual
association). Forecast: proper names *Albus/Candidus*; *alba* as feminine
adjective vs. place names. The plan states which side of the matte/gleaming
distinction the scholar's concept actually needs, or searches both tagged
separately.

**"The world" (lexical + historical-semantic + exclusion +
uncertainty).** Classical branch: *mundus*
(cosmos; also "adornment" — homonym exclusion), *orbis (terrarum)*, *natura
rerum*. Christian-period branch: *saeculum* as "this present world" (secure
in Tertullian and Prudentius; anachronistic if projected onto Lucretius —
period tag required) [Mohrmann 1958–1977; Souter 1949]. This example shows
the shape of a period-split plan: one concept, two period-tagged branches,
different confidence statements.

**"Consciousness" (uncertainty: the escalation rule exercised).** Modern
phenomenal "consciousness" has no secure Latin lexeme: *conscientia* is
shared knowledge or moral conscience [OLD 2012 s.v.], and the adjacent
candidates (*animus*, *sensus*, *mens*) each import their own fields (§2).
A correct plan says so plainly: "no secure mapping exists; the adjacent
terms below are speculative associations only; consult the TLL or a human
Latinist before treating retrieval as evidence" (§12). This output is the
method working, not the method failing.

## References

- Adams, J. N. *Social Variation and the Latin Language*. Cambridge:
  Cambridge University Press, 2013.
- Allen, J. H., and J. B. Greenough. *New Latin Grammar for Schools and
  Colleges*. Boston: Ginn, 1903.
- Allen, W. S. *Vox Latina: A Guide to the Pronunciation of Classical
  Latin*. 2nd ed. Cambridge: Cambridge University Press, 1978.
- André, J. *Étude sur les termes de couleur dans la langue latine*. Paris:
  Klincksieck, 1949.
- Axelson, B. *Unpoetische Wörter: Ein Beitrag zur Kenntnis der
  lateinischen Dichtersprache*. Lund: Gleerup, 1945.
- Bamman, D., and G. Crane. "Building a Dynamic Lexicon from a Digital
  Library." *Proceedings of the 8th ACM/IEEE-CS Joint Conference on Digital
  Libraries (JCDL)*, 2008.
- Blaise, A. *Dictionnaire latin-français des auteurs chrétiens*.
  Turnhout: Brepols, 1954.
- Clackson, J., and G. Horrocks. *The Blackwell History of the Latin
  Language*. Malden, MA: Blackwell, 2007.
- Deutscher, G. *Through the Language Glass: Why the World Looks Different
  in Other Languages*. New York: Metropolitan Books, 2010.
- Hellegouarc'h, J. *Le vocabulaire latin des relations et des partis
  politiques sous la République*. Paris: Les Belles Lettres, 1963.
- Crane, G. "Generating and Parsing Classical Greek." *Literary and
  Linguistic Computing* 6.4 (1991): 243–245. (Morpheus analyzer.)
- Johnson, K. P., et al. "The Classical Language Toolkit: An NLP Framework
  for Pre-Modern Languages." *Proceedings of ACL 2021: System
  Demonstrations*, 2021.
- Lewis, C. T., and C. Short. *A Latin Dictionary*. Oxford: Clarendon
  Press, 1879.
- Löfstedt, E. *Late Latin*. Oslo: Aschehoug, 1959.
- Manning, C. D., P. Raghavan, and H. Schütze. *Introduction to Information
  Retrieval*. Cambridge: Cambridge University Press, 2008.
- Mohrmann, C. *Études sur le latin des chrétiens*. 4 vols. Rome: Edizioni
  di Storia e Letteratura, 1958–1977.
- *Oxford Latin Dictionary*. 2nd ed. Oxford: Oxford University Press, 2012.
- Smith, D. A., J. A. Rydberg-Cox, and G. R. Crane. "The Perseus Project: A
  Digital Library for the Humanities." *Literary and Linguistic Computing*
  15.1 (2000): 15–25.
- Souter, A. *A Glossary of Later Latin to 600 A.D.* Oxford: Clarendon
  Press, 1949.
- Traube, L. *Nomina Sacra: Versuch einer Geschichte der christlichen
  Kürzung*. Munich: Beck, 1907.
- TEI Consortium. *TEI P5: Guidelines for Electronic Text Encoding and
  Interchange*. https://tei-c.org/guidelines/p5/
- *Thesaurus Linguae Latinae*. Berlin: De Gruyter (formerly Leipzig:
  Teubner), 1900–.
