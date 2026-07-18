# Number Rants Explorer: Living Design Direction

Status: co-design in progress; preserve decisions without treating them as a
finished specification

Last updated: 2026-07-18

## Emotional North Star

The first encounter should feel like the world is opening. A scholar begins
with a question in a language she knows and discovers that the archive can
meet her with knowledgeable help across languages she does not yet read.

The interface should remain intellectually credible and source-auditable while
preserving part of what makes historical research pleasurable: atmosphere,
texture, strangeness, dark-academic delight, and the sense that the archive is
inhabited.

## Approved Opening Copy

Eyebrow:

> A multilingual research instrument

Headline:

> Translate the question.<br>
> Not the library.

Body:

> Ask in the language you know. Specialist librarians adapt your idea to the
> languages of the archive. They return the sources you should read and leave
> the interpretation with you.

The removed em dash is intentional. It had become an avoidable contemporary
AI-style tell.

## Approved Visual Rhythm

The hero remains spacious and quiet. It contains only a foreshadowing of the
inhabited archive:

- the rust-colored period after `question` acts as a knot;
- a fine thread travels from it through the negative space;
- the thread ends at a small index card entering from the page margin;
- one or two restrained marginal marks may appear, but no librarian does;
- the motif should be CSS decoration and `aria-hidden`, not part of the
  readable headline.

The full librarian panorama appears only after the researcher enters the work
and begins moving an English question into the multilingual query system. This
is the moment the archive wakes up.

## Palette As Meaning

The palette changes as the research question travels:

| Role | Color | Hex |
|---|---|---|
| Archive / deepest ink | Brandy rust | `#7F2F07` |
| Warm archive accent | Autumn ember | `#AB5419` |
| Connection / illumination | Harvest gold | `#C98928` |
| Parchment | Sandy clay | `#E0B17D` |
| Aged secondary tone | Faded copper-sage | `#928464` |
| Multilingual opening | Deep teal | `#00678A` |
| Multilingual depth | Lapis navy | `#041552` |

The opening hero stays in the warm archive range. Lapis and teal should first
appear when the question crosses into other languages. The color transition is
part of the explanation, not merely decoration.

## The Recurring Librarians

The characters are recurring individuals, but lightly held. They are not
mascots, named product guides, or one-to-one representations of languages or
civilizations. Their identities emerge from modes of scholarly attention:

- **Fox — query architect:** organizes catalog slips and threads conceptual
  connections; associated with the head-librarian conversation.
- **Badger — corpus walker:** digs into manuscripts, word forms, variants, and
  context; associated with retrieval and close inspection.
- **Owl — adjudicator:** examines candidates, provenance, and whether a number
  receives qualitative meaning or merely counts six donkeys.

Language-specific librarians may still exist within the architecture. Avoid
making an animal, costume, or monument stand in for Greek, Latin, Arabic,
Hebrew, or any other tradition.

Visual register: competent adult animal scholars rendered as manuscript
marginalia / fine early-print engraving. Historically strange and gently
whimsical, not baby-proportioned, coloring-book, cartoon, or generic fantasy
mascot art.

## Preserved Art

North-star panorama:

- Public asset: `explorer/public/art/librarian-panorama-v1.png`
- Dimensions: 1820 × 864 px
- SHA-256:
  `6576ae596e3aafb052894a46b62106734f70551bbd9bab7eed4aaedfe2a21d6c`
- Status: approved as the visual north star; exact crop and integration remain
  open until reviewed in the interface.

Generation brief: wide modular website backing layer; fox query architect,
badger corpus walker, and owl adjudicator; adult proportions; refined
pen-and-ink engraving on parchment; central negative space; rust, copper,
gold, lapis, and teal spot pigments; no legible text, civilization mapping,
boxed portraits, or children’s-book styling.

## Design Guardrails

- Atmosphere is part of the research invitation, not frivolous garnish.
- Scholarship and provenance establish credibility; the librarians establish
  welcome and make an invisible agent architecture graspable.
- Use the characters as inhabitants and stage markers, not constant stickers.
- Let motifs and partial crops carry continuity between full illustrations.
- Preserve negative space. The world should open rather than become crowded.
- Do not let the interface imply that the AI has answered the historical
  question. It helps the scholar discover what to read.

## Approved Working-Room Interaction

The first working room keeps conversation and the concept map visible on the
same responsive page. They are two interfaces to one shared inquiry, not a
chat followed by a separate card editor.

The fox first explains the method: before entering the library, scholar and
fox will decide what the question means, including concepts, relationships,
boundaries, and exclusions. The fox asks the minimum useful number of dynamic
clarifying questions, usually two to four, without requesting information the
scholar has already supplied.

As they talk, the fox lays proposed cards onto a visible worktable. The scholar
may manipulate cards directly or continue the conversation when an issue needs
nuance. Either route changes the same underlying query map:

- `Keep`, `Edit`, and `Remove` are direct scholar actions.
- `Why this card?` asks the fox to explain its reasoning.
- `Needs your answer` is a distinct fox-authored state marking an unresolved
  question for the scholar.
- A scholar may also request any of these operations conversationally.
- The fox may clarify, ask for more information, and propose or alter cards in
  response.

The system should not require the scholar to approve every reasonable card
individually. The scholar edits what matters, then approves the map as a whole.
Before search begins, the fox summarizes the resulting search contract in one
plain-language sentence. The language and corpus librarians enter only after
the scholar confirms that this contract represents the inquiry.

Technical model: both panes operate on one shared, versioned query graph.
Conversation produces proposed graph mutations; card interactions produce
structured mutations. Human and agent actions must remain attributable and
undoable.

## Approved Card Authority And Memory

The fox may refine its own unreviewed suggestions while the clarification
conversation is still unfolding. The moment the scholar keeps, edits, creates,
or pins a card, that card becomes scholar-controlled. The fox may question it
or propose a visible revision, but may not silently overwrite it. Direct
conversational permission such as “revise those cards” authorizes only the
named change.

No proposed idea is permanently deleted. Removing a card moves it into a
visible **set-aside stack** at the edge of the worktable. The stack shows a
count and opens into a browsable drawer where the scholar may inspect, restore,
or discuss earlier cards. Restored cards retain their origin and change
history.

Set-aside cards remain available as conversational memory so the fox does not
casually re-suggest an idea the scholar already declined. If later changes make
one newly relevant, the fox may ask whether to restore it but may not return it
to the active map automatically.

An inactive card and an exclusion card are different:

- **Set aside** means “do not use this idea in the current query.” It has no
  retrieval effect.
- **Exclusion** means “actively deprioritize or reject results matching this
  pattern,” such as dates, chapter numbers, or incidental quantities.

The interface may affectionately render the set-aside stack as a discard pile,
but the user-facing action should say `Set aside` rather than imply permanent
destruction. All mutations remain undoable.

## Still Open

The next decision is card taxonomy: which distinct intellectual roles need
their own card types, and how those types remain readable without turning the
worktable into a color-coded form.

Later decisions include character micro-behaviors, animation restraint,
responsive crops, language-specialist presentation, exact query-approval
interaction, and whether the panorama itself ships or becomes a reference for
derived production assets.
