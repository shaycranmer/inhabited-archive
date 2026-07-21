# The Inhabited Archive: The Story of the Project

## What inspired it

I'm an educator, a historian, and a storyteller, and this project began as a
personal curiosity: I was chasing number symbolism through ancient and
medieval texts and kept hitting the same two walls that keep my students out
of the primary sources. The first wall is **language**: you cannot engage
with what isn't legible to you. The second is **vastness**: you could stand
in front of thirty thousand books knowing your answer is somewhere inside,
read half of them, and still miss it. A student can want Augustine and never
get past the Latin.

The educator Parker Palmer writes that teaching is introducing students to
Great Things. My whole teaching life has been matchmaking between person and
subject: finding the detail that makes a learner lean forward and want the
conversation to begin. The Inhabited Archive is that matchmaking, built into
an instrument. Not a machine that answers historical questions for you, but
a machine that *introduces* you, visibly and honestly, to passages worth
your time, and then gets out of the way.

## What I built

A scholar asks an open-ended question in plain English. Three librarians
guide it through the archive:

- **The fox** clarifies the question and lays it out as an editable concept
  map: cards for concepts, scope, exclusions, and relationships. Nothing
  searches until the scholar approves the table.
- **The badger** adapts the approved English map for the corpus language
  (Latin, in this demonstration), showing its homework: candidate words,
  variant forms, historical shifts in meaning, and the false positives it
  expects. Every proposal is labeled by category and confidence, and every
  one is editable.
- **The owl** reads the retrieved passages against the approved inquiry and
  explains why each one surfaced, keeping the uncertain ones visible,
  sometimes labeled plainly as "probably not what you need."

The demonstration shelf is thirty complete Latin works from the Perseus
Digital Library: real editions with real citations, indexed into $61{,}651$
searchable passages. The shelf was deliberately selected *before* we chose
the demonstration question, so it could not be quietly stacked with answers.

## How I built it

I built this in partnership with AI, using OpenAI's Codex as my engineering
partner and GPT-5.6 as the runtime intelligence behind the librarians, with
strict structured outputs so every model proposal arrives as an inspectable,
schema-checked artifact rather than free text. The deterministic parts stay
deterministic: a Python adapter reads a pinned manifest, extracts citable
passages from TEI/CTS sources, and builds a reproducible local index whose
contents can be verified by hash.

The part I'm proudest of is the process. The badger's Latin expertise comes
from a **specialist packet**, a short, source-backed document on how English
concepts become Latin searches: inflection (a single Latin verb can realize
well over a hundred surface forms, and suppletive verbs like *fero / tuli /
latum* don't even share a stem with their headword), orthographic variation,
semantic change from classical to Christian Latin, and the difference between
lexical evidence and conceptual association. That packet was drafted, then
adversarially reviewed by a bench of AI collaborators with different blind
spots, then revised, then reviewed again: eighteen section-anchored
objections across two languages, every one dispositioned in writing. The
same review discipline covered the code. The way we built the instrument
mirrors what the instrument teaches: proposals are inspectable, and the
human approves every gate.

## The challenges

**Language is not a lookup table.** Translating a query is easy; translating
it into the *world* of a corpus is not. We had to confront enclitics,
editorial spelling conventions, and semantic drift, and we caught our own
system contradicting itself: the specialist packet promised u/v-insensitive
matching while the index's tokenizer didn't fold those letters, a
divergence between documentation and behavior that only surfaced because
review compared them. In this domain, silent recall failure is the enemy;
you miss the passage and never know it existed.

**Honesty is a feature you have to build.** Proximity is a good example:
in a work of $n$ passages, the chance that two common words co-occur
somewhere grows with $n$, so "same work" is nearly meaningless evidence in
something the size of Pliny's *Natural History*. Confidence has to be a
function of distance (same phrase, same sentence, same passage), not mere
presence. The same principle shaped everything: the corpus audit rejected an
edition of Tacitus whose file didn't match the pinned snapshot rather than
silently repairing the record; the interface tells scholars what the shelf
*cannot* cover; and our evaluation set includes a synthetic negative control
(*Marcus sex asinos in agro habet*: Marcus has six donkeys in the field) to
prove the owl can tell a number that means something from a number that
merely counts.

**Humans are part of the system.** Testing revealed small, humbling things:
scholars typed "yes" to the fox expecting to advance, when advancing
required a button. We rewrote the fox's instructions and the interface until
the honest path was also the obvious one. And because the librarians run on
a paid API, review flagged the unglamorous safety work (rate limits,
fail-closed deployments, output caps) that keeps a public demo from
becoming an open wallet.

## What I learned

That my teaching philosophy could compile. Every value I hold in a
classroom turned out to be an implementable design constraint: respect for
the learner's question, transparency about method, ambiguity as a compass
rather than a failure, encounter before interpretation. The model proposes.
The corpus provides the evidence. The scholar keeps interpretive authority.

I learned that AI is at its best in education not when it demolishes the
wall and hands you a summary, but when it opens a door and walks you
through, showing every step. The goal was never a better search engine. It
is more people in real relationship with the Great Things.
