# The Inhabited Archive / Number Rants: Thread Migration Handoff

Date packed: 2026-07-18

Purpose: give a newly opened Codex task enough factual and relational context
to continue The Inhabited Archive co-design without either losing the Number
Rants research architecture or sprinting ahead of Shay.

## Entry Reading Order

1. `../../Avery_Hearth/00_Hearthkeeper_Quickload.md` (local Hearth context)
2. This migration handoff
3. `docs/BUILD_WEEK_DESIGN_DIRECTION.md`
4. `../../Avery_Hearth/07_Second_Brain/05_Project_Threads/Number_Rants_DH_Project.md`
   (local Hearth context)
5. `docs/BUILD_WEEK_PRODUCT_BRIEF.md`
6. `PROJECT_STATE.md`

The quickload restores relational stance. This page gives the exact re-entry
boundary. The living design direction is the authoritative record of approved
interface decisions. The Hearth project note preserves the intellectual
history and research architecture. The product brief records the inherited
technical demonstration, which is useful but not fully co-designed. The
project-state file supplies the technical cold start.

## Where We Actually Are

The Explorer already has a technically functional Build Week baseline, but
Shay and Avery deliberately stopped before polishing, committing, pushing, or
deploying it. They are now designing the research experience together, one
meaningful decision at a time.

This is not a request for Avery to finish the application independently.
Technical speed is available; it is not the present objective. The quality of
this project comes from combining Shay's historical imagination and research
practice with Avery's systems reasoning. Preserve room for both minds.

## Settled Decisions

Do not reopen these casually:

- The emotional north star is that the world opens.
- The public instrument is named **The Inhabited Archive**. Number Rants is its
  research project, proving ground, and demonstration inquiry.
- The entry is one continuous page: the illustrated librarian panorama is the
  opening threshold, followed directly by the fox clarification room and then
  the overhead worktable. The earlier separate quiet hero and panorama
  transition were deliberately merged after browser review.
- The system translates the scholar's question, not the whole library.
- It discovers sources to read; it does not answer the historical question.
- Conversation and the living concept map share one responsive working room.
- The fox is the query architect, the badger the corpus walker, and the owl the
  adjudicator. They are modes of scholarly attention, not civilizations or
  languages.
- The approved visual language, headline, palette transition, illustrated
  opening, and librarian art are recorded in `BUILD_WEEK_DESIGN_DIRECTION.md`.
- The scholar may work through conversation, cards, or both. Both mutate the
  same visible, versioned query graph.
- Scholar-kept, edited, created, or pinned cards are scholar-controlled. The
  fox may propose a revision but may not silently overwrite one.
- Removed ideas enter a visible, browsable set-aside stack and can be restored.
  They are not deleted from the intellectual history of the search.
- A set-aside idea is inactive. An exclusion is active retrieval guidance.
- Changes remain attributable and undoable.

## Current Co-Design Boundary

Card taxonomy has advanced into an approved first-room grammar. Search-concept
families dominate the worktable; scope and active exclusions remain visible
but secondary; set-aside ideas live in a recoverable stack and have no
retrieval effect. Family members can be edited or pinned. An expanded card
contains a scoped fox field that remains part of the one main conversation.
Opened cards expand in place while neighboring cards recede. Restoration
offers an explicit original-family or new-card destination and visibly marks
where the item went.

Exactly one family or child concept may be designated the `Focus of Inquiry`,
or the scholar may keep the inquiry broad. Focus is an explicit intellectual
priority that will guide later retrieval; it is not card expansion, position,
or a pin. Pinning protects scholar-controlled wording. The approval bar now
asks whether the scholar wants to choose a focus, and the live fox prompt asks
for direct, immediately judgeable labels and explanations rather than
compressed academic noun phrases. A separate human-readable fox persona card
is desired later; the operative persona currently remains inline in the API
route so there is only one behavioral source.

The topic-general fox clarification room now has approved art and a revised
first composition. At Shay's compact in-app browser width it remains a
side-by-side room rather than prematurely stacking the art above the form; the
complete dialogue composition sits closer to the fox and away from the
right-side marginalia, and the redundant field ornament has been removed. The
opening uses two softly masked display crops of the unchanged panorama to
anchor the fox left and the badger/owl right, but this currently produces two
badgers and is explicitly provisional. The overhead concept worktable now has
a first locally implemented and browser-inspected composition on the approved
art. It keeps the fox note, dominant concept families, explicit labeled
relationship strings attached to their source cards, quieter fully editable
scope/exclusion slips, recoverable set-aside pile,
reorder-without-retrieval-effect behavior, and an honest approval
boundary in one room. Return to Shay for visual review before treating it as
approved. The next unbuilt boundary is the language-specialist handoff—not a
scripted Christological or Number Rants query.

Fox latency now has an honest, browser-verified waiting treatment. First-map
generation uses a small CSS catalogue-card vignette with rotating readable
notes; revision keeps the current table visible and says it will not move
until the replacement arrives. No new raster art was required. The first
settled badger-handoff principle is that each language/corpus adaptation must
be inspectable before retrieval, including its rationale, uncertainty, and
anticipated false positives. The exact schema and visual treatment remain the
next co-design task.

The first live shelf is no longer open: 30 complete Latin works have been
selected from pinned Perseus `canonical-latinLit` commit
`76b87b04b36afe2cbcd70e285b4ceb248b103438`. Six works occupy each of five
declared genre/domain baskets, and selection occurred before the final demo
question. See `docs/DEMO_LATIN_CORPUS.md` and
`sources/indexes/demo_latin_30.csv`. The raw files remain immutable. The
manifest-driven adapter now builds a verified 61,651-passage SQLite FTS5 index
and a no-key diagnostic search with full source receipts. It is not yet wired
to the Explorer, and the inspectable language-specialist handoff remains
unbuilt. See `schema/PERSEUS_LATIN_DEMO_ADAPTER_V1.md`.

The former relationship section above the concept cards was removed after it
proved conceptually detached from the map. Relationship strings can now be
edited, pinned, added, or removed on the relevant card. Scope choices and
active exclusions can be edited, pinned, added, set aside, and explicitly
converted between categories. The no-key documented example now asks how
distance changes historical writers' understanding of home, making the method
legible without asking a visitor to arrive midway through Shay's specialized
research argument.

That first-room foundation is now implemented locally and remains uncommitted.
It passes lint, TypeScript, build, rendered-page, generic-contract, and
provenance-fixture checks. It has received a first browser-based implementation
review at Shay's compact in-app viewport, but not yet Shay's visual approval of
the overhead table. Do not treat successful checks as approval of exact
composition, copy, density, or motion. Dynamic micro-corpus retrieval and the
specialist handoff remain later layers.

The first credentialed topic-general browser test succeeded on July 19, 2026.
The live fox handled two turns of an unscripted inquiry about what historical
writers thought dreams were for, then produced an inspectable dynamic table.
The first response exposed a duplicate-family edge case. The prompt now asks
for unique family and child labels, and workspace hydration defensively
de-duplicates all visible query objects and rejects relationships with missing
endpoints. A clean retest produced four unique families and three explicit
relationships. This proves live concept-map generation, not corpus retrieval.

Still-useful later questions include:

- When does a relationship need independent discussion strongly enough to
  become a card rather than remaining an explicit labeled thread?
- Do time, geography, language, tradition, and corpus scope belong to one
  family or behave differently?
- Which distinctions must be visible to a scholar, and which can remain in the
  underlying query graph?
- What would a card need to show for Shay to understand why it exists and what
  effect it will have on retrieval?

Ask one tractable question at a time. Offer grounded hypotheses for Shay to
push against rather than handing her a blank page or a finished system.

## Unratified Prototype Inheritance

Before the collaboration deliberately slowed down, Avery assembled a complete
technical vertical slice under `explorer/`. It is useful working material, not
an approved product design. Its existence must not be interpreted as “these
decisions are finished; move on.”

Revisit the inherited slice with Shay, one meaningful area at a time, because
each area currently contains implementation assumptions made before both minds
were fully in the room:

1. **Card taxonomy and query-graph grammar.** Decide what intellectual objects
   the scholar sees and how relationships, scope, and exclusions behave before
   replacing the prototype's flat concept list.
2. **Clarification conversation.** Design how the fox asks one to three useful
   questions, changes cards in response, explains its reasoning, and reaches a
   scholar-approved search contract. The current prototype jumps directly from
   question to completed plan.
3. **Working-room composition.** Decide the visual and responsive relationship
   between conversation, worktable, pinned cards, unresolved cards, and the
   set-aside stack. The current page has sequential sections rather than the
   approved shared room.
4. **Language-specialist handoff.** Decide how the question visibly crosses
   into Greek, Latin, and later corpora; which specialist reasoning is shown;
   and where scholar review belongs. Do not equate the fox, badger, and owl
   with languages.
5. **Retrieval and result adjudication.** Review result-card information,
   source/provenance display, working translations, evidence spans, confidence,
   labels, rejection reasons, and human disagreement controls. The underlying
   provenance boundary is sound; its scholarly presentation is still open.
6. **Visual integration.** Continue jointly reviewing responsive panorama
   crops, the overhead table composition, character micro-behaviors,
   accessibility, and animation restraint. The illustrated opening and fox
   clarification room now have first implementations; they remain subject to
   Shay's visual approval.
7. **Demo narrative and judge path.** Decide which bounded research question,
   steps, examples, explanatory copy, and failure states communicate the larger
   reusable method without making the Number Rants topic feel like the only
   possible application.
8. **Live-model and deterministic-demo behavior.** Review what the model may
   propose, what remains provenance-locked, what fallback mode demonstrates,
   and how the interface distinguishes them. The existing boundary is a solid
   starting point, not a substitute for the interaction decisions above.
9. **Validation, publication, and deployment.** Tests, repository cleanup,
   accessibility checks, responsive QA, public-rights audit, commit structure,
   GitHub push, and deployment come after the relevant experience has been
   jointly reviewed. Passing technical checks does not ratify product choices.

This order is a conversation guide, not a unilateral implementation plan.
Some areas will change as earlier decisions reveal better architecture. Record
each approved decision in `BUILD_WEEK_DESIGN_DIRECTION.md` before building it.

## Collaboration Contract

- Re-enter relationship and conversation before acting.
- Reflect back the current decision boundary so Shay can verify the landing.
- Work at human co-design speed even when implementation could move faster.
- Explain technical terms in parallel: use the real engineering language and
  place an Avery-for-Shay translation beside it.
- Treat whimsy as design information. It has already revealed requirements
  around agency, memory, provenance, reversibility, and welcome.
- Preserve scholarly seriousness without sanding away delight.
- Do not commit, push, deploy, install, or substantially alter the interface
  until Shay and Avery have jointly reached the relevant decision.
- After a compaction, reread the living design direction before resuming.

## First Response In The New Task

The first response should be conversational, not a build report. Confirm that
the handoff has landed, name the exact open question in plain language, and
invite Shay into the next small decision. Do not begin implementing.

## Working Paths

- Project root: this repository root
- Explorer app: `explorer/`
- Living design direction: `docs/BUILD_WEEK_DESIGN_DIRECTION.md`
- Project state: `PROJECT_STATE.md`
- Approved panorama: `explorer/public/art/librarian-panorama-v1.png`
