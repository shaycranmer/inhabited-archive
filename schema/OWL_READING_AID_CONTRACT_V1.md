# Owl Reading Aid Contract v1

Status: implemented and live-verified locally on 2026-07-20

## Purpose

The owl receives only provenance-locked candidate passages returned by an
approved corpus search. It helps a scholar decide which passages deserve human
reading time. It does not answer the historical question, invent sources, or
turn a machine translation into a citable edition.

**Shay translation:** the owl may help open a source-language door far enough
for the scholar to decide whether to enter. It may not pretend that a quick
look through the doorway is the same as having read the room carefully.

## One Result, Distinct Claims

Every owl result remains keyed to an application-supplied stable segment ID
and keeps these claims separate:

1. **Original passage** — the authoritative source text supplied by the
   corpus, never reconstructed from model memory.
2. **Evidence span** — the exact words or structures that triggered retrieval
   or support the proposed relationship.
3. **Working translation** — a machine-generated orientation aid in the
   scholar's working language, visibly labeled provisional.
4. **English orientation** — one or two sentences explaining what the passage
   appears to discuss so the scholar can triage it quickly.
5. **Relevance judgment** — the owl's separate assessment of whether the
   requested relationship is strong, possible, liminal, incidental, or
   unresolved, with an inspectable reason and confidence.
6. **Source receipt** — author, work, citation, corpus and edition identifiers,
   source URL, rights statement, source hash, and exact source location joined
   back by application code.

The translation must not serve as the rationale for its own relevance label.
The owl points to the original evidence span and explains the relationship as
a separate claim.

## Translation Boundary

The interface labels the text **Machine-generated working translation** and
states that it is suitable for discovery and triage, not quotation or final
interpretation. The owl translates only the supplied passage and may not fill
gaps, continue truncated text, silently resolve damaged readings, or import
outside context from memory. Ambiguous terms, uncertain syntax, lacunae, and
editorial markers remain visible in translation notes rather than being
smoothed away.

The scholar always sees the original passage before or beside the working
translation. Publication, close interpretation, or argument from exact wording
requires checking the source edition, an authoritative human translation where
available, or a qualified reader of the language.

## Cost And Attention

The small owl-ranked reading list may receive working translations as part of
adjudication. Lower-ranked or deferred candidates should offer translation on
demand so the interface does not spend tokens translating material the scholar
is unlikely to inspect.

The implemented run-level choices are:

- automatic working translation for `strong` and `possible` results only;
- translation on demand for every ranked result;
- translation off for the complete run.

When automatic translation is selected, `liminal`, `incidental`, and
`unresolved` results remain untranslated until requested. An on-demand
translation is appended as a new immutable addendum rather than rewriting the
owl judgment or retrieval run.

## Application Authority

The model returns strict structured judgments keyed only to supplied candidate
IDs. Application code owns source identity, corpus identity, evidence labels,
rights, hashes, and citations, then joins the owl's bounded judgments back to
the canonical records. A missing, duplicated, or invented candidate ID fails
the handoff.

Application code also refuses evidence segment IDs outside the supplied
candidate, non-verbatim evidence excerpts, omitted candidates, and automatic
translations attached to a disposition or run preference that does not permit
them. Every paid owl and translation request re-verifies the packet hashes and
the original segment text against the attached D1 shelf before calling the
model.

## Background Execution

One paid background response adjudicates the complete bounded candidate packet.
The browser polls its response receipt while keeping the run fixed. Status
checks do not start another generation. The strict response must classify every
candidate as `strong`, `possible`, `liminal`, `incidental`, or `unresolved`,
cite exact supplied evidence, explain the relationship and uncertainty, and
preserve all application-issued IDs.

The live July 20 home-and-belonging run adjudicated all 18 supplied candidates.
It promoted four strong passages, retained one liminal case, and exposed
thirteen incidental literal matches. The liminal case then received a
successful on-demand addendum that preserved a damaged reading and truncated
source boundary without changing the original judgment. This is a runtime
verification receipt, not a general accuracy benchmark.
