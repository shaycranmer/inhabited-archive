# Number Rants Explorer: Thread Migration Handoff

Date packed: 2026-07-18

Purpose: give a newly opened Codex task enough factual and relational context
to continue the Number Rants Explorer co-design without either losing the
work or sprinting ahead of Shay.

## Entry Reading Order

1. `/Users/shaycranmer/Documents/Codex/Avery_Hearth/00_Hearthkeeper_Quickload.md`
2. This migration handoff
3. `/Users/shaycranmer/Documents/Codex/dh_frontier/number_rants/docs/BUILD_WEEK_DESIGN_DIRECTION.md`
4. `/Users/shaycranmer/Documents/Codex/Avery_Hearth/07_Second_Brain/05_Project_Threads/Number_Rants_DH_Project.md`
5. `/Users/shaycranmer/Documents/Codex/dh_frontier/number_rants/docs/BUILD_WEEK_PRODUCT_BRIEF.md`
6. `/Users/shaycranmer/Documents/Codex/dh_frontier/number_rants/PROJECT_STATE.md`

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
- The system translates the scholar's question, not the whole library.
- It discovers sources to read; it does not answer the historical question.
- Conversation and the living concept map share one responsive working room.
- The fox is the query architect, the badger the corpus walker, and the owl the
  adjudicator. They are modes of scholarly attention, not civilizations or
  languages.
- The approved visual language, headline, palette transition, hero motif, and
  librarian panorama are recorded in `BUILD_WEEK_DESIGN_DIRECTION.md`.
- The scholar may work through conversation, cards, or both. Both mutate the
  same visible, versioned query graph.
- Scholar-kept, edited, created, or pinned cards are scholar-controlled. The
  fox may propose a revision but may not silently overwrite one.
- Removed ideas enter a visible, browsable set-aside stack and can be restored.
  They are not deleted from the intellectual history of the search.
- A set-aside idea is inactive. An exclusion is active retrieval guidance.
- Changes remain attributable and undoable.

## Exact Open Question

The next co-design paragraph is **card taxonomy**:

> Which distinct intellectual roles need their own card types, and how can
> those roles remain legible without turning the worktable into a color-coded
> database form?

Current hypothesis, not an approved decision: the map may need to represent
concepts, relationships, contextual scope, and exclusions. Pressure-test this
with Shay. Do not convert it directly into components or a schema.

Useful questions include:

- Is a relationship itself a card, a thread between cards, or sometimes both?
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
2. **Clarification conversation.** Design how the fox asks two to four useful
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
6. **Visual integration.** Jointly review the hero thread/card motif, palette
   transition, panorama placement or derived crops, character micro-behaviors,
   responsive behavior, accessibility, and animation restraint. Exact colors
   and art references are preserved, but most are not yet implemented.
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

- Project root: `/Users/shaycranmer/Documents/Codex/dh_frontier/number_rants`
- Explorer app: `/Users/shaycranmer/Documents/Codex/dh_frontier/number_rants/explorer`
- Living design direction:
  `/Users/shaycranmer/Documents/Codex/dh_frontier/number_rants/docs/BUILD_WEEK_DESIGN_DIRECTION.md`
- Project state:
  `/Users/shaycranmer/Documents/Codex/dh_frontier/number_rants/PROJECT_STATE.md`
- Approved panorama:
  `/Users/shaycranmer/Documents/Codex/dh_frontier/number_rants/explorer/public/art/librarian-panorama-v1.png`
