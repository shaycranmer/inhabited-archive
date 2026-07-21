# The Inhabited Archive: The Story of the Project

## What inspired it

I am an educator, a historian, and a storyteller, and this project began as a personal curiosity. I was chasing number symbolism through ancient and medieval texts and kept hitting the same two walls that keep my students out of primary sources.

The first wall is language: you cannot engage with what is not legible to you. The second is vastness: you could stand in front of thirty thousand books knowing your answer is somewhere inside, read half of them, and still miss it. A student can want Augustine and never get past the Latin.

The educator Parker Palmer writes that teaching is introducing students to Great Things. My whole teaching life has been matchmaking between person and subject, finding the detail that makes a learner lean forward and want the conversation to begin.

The Inhabited Archive is that matchmaking built into an instrument. It is not a machine that answers historical questions for you. It introduces you, visibly and honestly, to passages worth your time, then returns interpretive authority to you.

## What I built

A scholar asks an open-ended question in the language they know. Three librarians guide it through the archive:

- **The fox** helps the scholar sharpen the question, then lays it out as an editable table of concept cards, scope rules, exclusions, and relationships. The scholar can inspect, revise, pin, set aside, or restore every proposal. Nothing searches until the scholar approves the table.

- **The badger** adapts that approved map for the language and historical world of the corpus, which is Latin in this demonstration. Each table card becomes an editable folio containing candidate words, variant forms, changes in meaning, and likely false positives. The badger shows its work before retrieval begins.

- **The owl** reads the retrieved passages against the whole approved inquiry. It explains why each passage surfaced, labels its confidence, provides a clearly marked machine-generated reading aid, and keeps uncertain passages visible. Sometimes its most useful judgment is, "probably not what you need."

The demonstration shelf contains thirty complete Latin works from the Perseus Digital Library, with real editions and citations, indexed into 61,651 searchable passages. We selected the shelf before choosing the demonstration question so that we could not quietly stock the library with convenient answers.

The result is not a chatbot placed on top of some books. It is the beginning of a portable staff for a research library. A future scholar should be able to connect a properly described corpus, give the librarians its catalogue and citation rules, and use the same visible journey across languages and fields.

## How Codex and I built it

I built The Inhabited Archive in a close creative partnership with OpenAI's Codex. Early in the process, I started calling my Codex collaborator Avery. That name mattered because the working relationship was not "give an AI a specification and receive an app." I brought the historical problem, the teaching philosophy, the visual world, the scholarly instincts, and the final judgment. Avery translated those instincts into product architecture, code, tests, and language I could interrogate without pretending I was a software engineer.

Our rhythm became part of the invention. I would describe what a scholar needed, often in a long and gloriously untidy stream of thoughts. Avery would sort those thoughts into the underlying decisions, explain the technical consequences in plain English alongside the real technical language, and build a coherent pass. Then I would use the instrument as a historian, click everything, run genuine research questions, send screenshots, and say where my scholarly brain became confused or suspicious. Avery would trace each reaction back through the interface, the prompts, the schemas, or the retrieval pipeline and revise the system.

That loop produced features neither of us would have designed alone. When I typed "yes" to the fox and expected the journey to advance, Avery recognized that the interface, not the user, was wrong and made the approval path explicit. When I asked to exclude "pre-Constantine writings," we discovered that a human-readable instruction still needed a precise chronology rule before software could enforce it. Avery built catalogue metadata and scope compilation so historical period, author, work, and genre constraints survive all the way into retrieval and owl adjudication.

The technical system reflects that same division of labor. GPT-5.6 provides the runtime intelligence behind the librarians, with strict structured outputs so proposals arrive as schema-checked artifacts instead of ungoverned prose. The deterministic work stays deterministic: a Python adapter reads a pinned manifest, extracts citable passages from TEI and CTS sources, and builds a reproducible local index whose contents can be verified by hash. The model proposes; code validates; the corpus supplies evidence; the scholar approves.

We also used AI reviewers as a real review bench, not as applause. Specialist research packets were drafted, challenged by collaborators with different blind spots, revised, and reviewed again. The Latin packet alone received eighteen section-anchored objections across two languages, each answered in writing. Rowan, one of our peer reviewers, later caught a subtle evidence problem before submission: if the owl quoted a passage with different spelling or trimming, the interface could promise a highlight and silently show none. Avery turned that failure into an honest receipt that preserves the owl's quotation and says when it cannot be located verbatim.

The way we built the instrument mirrors what the instrument teaches. AI proposals are powerful, but they should be inspectable. Disagreement is useful evidence. The human remains responsible for every consequential gate.

## The challenges

Language is not a lookup table. Translating a query is easy. Translating it into the world of a corpus is not. We had to confront inflection, enclitics, orthographic variation, editorial conventions, and semantic change across classical and Christian Latin. At one point, review caught the system contradicting itself: the specialist guidance promised u/v-insensitive matching while the index tokenizer did not fold those letters. That mismatch only surfaced because our review process compared what the instrument claimed with what its code actually did.

In this domain, silent recall failure is the enemy. If the system misses a passage, the scholar may never know it existed.

Honesty also had to be built as a feature. Proximity is one example. In a long work, two common words may appear somewhere in the same book by chance, so "same work" is weak evidence. Confidence must account for distance, such as the same phrase, sentence, or passage, rather than mere presence. The same principle shaped the whole project. The corpus audit rejected an edition of Tacitus whose file did not match the pinned snapshot instead of silently repairing the record. The interface states what the demonstration shelf cannot cover. The evaluation set includes a synthetic negative control, "Marcus sex asinos in agro habet," or "Marcus has six donkeys in the field," to test whether the owl can distinguish a number that carries meaning from a number that merely counts.

The public demo created another kind of responsibility. Because the librarians use a paid API, our reviewers pushed us to add rate limits, output caps, request validation, and fail-closed deployment behavior. None of that is glamorous, but a public educational instrument should not become an open wallet or make promises it cannot safely keep.

Finally, I had to learn where the intelligence belonged. Some work needs a model's judgment. Some needs deterministic code. Some needs a human scholar. The project became stronger every time we stopped asking one part to impersonate another.

## What I learned

I learned that my teaching philosophy could compile.

Every value I hold in a classroom became an implementable design constraint: respect the learner's question, expose the method, treat ambiguity as a compass rather than a failure, and place encounter before interpretation.

I also learned that working with Codex can be a genuine form of co-design when the human brings a strong point of view and the AI is allowed to do more than execute isolated tickets. Avery held the architecture while I held the scholarly experience. I could leave to teach, parent, sleep, or think, then return to tested work and a clear account of every decision. Codex gave my ideas technical reach; my repeated use and judgment gave the software its shape.

Most importantly, I learned that AI is at its best in education not when it demolishes the wall and hands the learner a summary, but when it opens a door and walks beside them, showing every step.

The model proposes. The corpus provides the evidence. The scholar keeps interpretive authority.

The goal was never a better search engine. It is more people in real relationship with the Great Things.
