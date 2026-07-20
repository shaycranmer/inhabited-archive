import { hydrateWorkspace } from "../../lib/query-plan.ts";

function workspace(model) {
  return hydrateWorkspace({
    foxReply: "The fox has clarified the question and brought the approved map to the table.",
    nextQuestion: "The map is ready for language adaptation.",
    coverageStatus: "coverage_uncertain",
    coverageNote: "Corpus coverage has not yet been tested.",
    bridgeSuggestions: [],
    relationships: [],
    scopeChoices: [],
    exclusions: [],
    ...model,
  });
}

export const badgerEvalCases = [
  {
    id: "dreams-and-authority",
    question: "How do historical writers decide whether a dream carries divine authority or is merely deceptive?",
    workspace: workspace({
      framing: "Find passages that distinguish authoritative dreams from misleading or ordinary ones.",
      conceptFamilies: [
        {
          title: "Kinds of dream",
          rationale: "Separate dreams presented as divine messages from false, anxious, or ordinary dreams.",
          terms: [
            { label: "divine dream", rationale: "A dream attributed to a god or sacred source." },
            { label: "deceptive dream", rationale: "A dream that misleads, tempts, or proves false." },
            { label: "ordinary dream", rationale: "A dream explained without divine authority." },
          ],
        },
        {
          title: "Testing authority",
          rationale: "Look for the signs, interpreters, outcomes, or moral tests used to judge a dream.",
          terms: [
            { label: "interpretation", rationale: "Someone explains what the dream means." },
            { label: "fulfilled outcome", rationale: "Later events confirm or disprove the dream." },
            { label: "trust and doubt", rationale: "The writer or dreamer accepts, questions, or rejects it." },
          ],
        },
      ],
      relationships: [{
        sourceTitle: "Kinds of dream",
        targetTitle: "Testing authority",
        label: "is judged through",
        rationale: "Retrieve passages where a dream's kind and the grounds for trusting it appear together.",
      }],
      scopeChoices: [{
        label: "Include different genres",
        rationale: "Keep poetry, history, letters, and religious writing visible while marking their differences.",
      }],
      exclusions: [{
        label: "Sleep without a dream",
        rationale: "Do not prioritize passages that mention sleeping but contain no dream or vision.",
      }],
    }),
  },
  {
    id: "friendship-and-betrayal",
    question: "How do historical writers describe the point where political friendship becomes betrayal?",
    workspace: workspace({
      framing: "Find passages where loyalty between political allies breaks, is tested, or is redefined as betrayal.",
      conceptFamilies: [
        {
          title: "Political friendship",
          rationale: "Track personal and public bonds between allies, patrons, clients, or companions.",
          terms: [
            { label: "friendship", rationale: "A bond explicitly described as friendship or affection." },
            { label: "loyalty", rationale: "Faithfulness to a person, party, office, or shared cause." },
            { label: "obligation", rationale: "Duties created by favors, patronage, kinship, or oath." },
          ],
        },
        {
          title: "The break",
          rationale: "Identify actions and judgments that turn disagreement or withdrawal into betrayal.",
          terms: [
            { label: "desertion", rationale: "Abandoning an ally or cause at a consequential moment." },
            { label: "treachery", rationale: "Deliberate breach of trust or secret plotting." },
            { label: "accusation", rationale: "Language used to name another person's act as betrayal." },
          ],
        },
      ],
      relationships: [{
        sourceTitle: "Political friendship",
        targetTitle: "The break",
        label: "breaks under",
        rationale: "Look for the obligation whose breach makes an act legible as betrayal.",
      }],
      scopeChoices: [{
        label: "Keep public and personal motives distinct",
        rationale: "Show whether the writer frames the rupture as private disloyalty, public duty, or both.",
      }],
      exclusions: [{
        label: "Unrelated battlefield defeat",
        rationale: "Do not prioritize military defeat unless a broken alliance or charge of betrayal is involved.",
      }],
    }),
  },
  {
    id: "weather-and-order",
    question: "How do historical writers use unusual weather to argue for divine or natural order?",
    workspace: workspace({
      framing: "Find passages where unusual weather is interpreted as a sign and where its cause is explained.",
      conceptFamilies: [
        {
          title: "Unusual weather",
          rationale: "Retrieve striking atmospheric events rather than routine seasonal description.",
          terms: [
            { label: "storm", rationale: "Violent wind, rain, thunder, or lightning." },
            { label: "drought", rationale: "Sustained absence of rain or destructive dryness." },
            { label: "celestial disturbance", rationale: "Darkened skies, fiery appearances, or other unusual events above." },
          ],
        },
        {
          title: "Explanations of order",
          rationale: "Distinguish divine sign, moral judgment, natural cause, and orderly recurrence.",
          terms: [
            { label: "divine sign", rationale: "Weather treated as communication, warning, or judgment from a god." },
            { label: "natural cause", rationale: "Weather explained through physical processes or regular patterns." },
            { label: "human interpretation", rationale: "A narrator or community argues over what the event means." },
          ],
        },
      ],
      relationships: [{
        sourceTitle: "Unusual weather",
        targetTitle: "Explanations of order",
        label: "is explained as",
        rationale: "Require the event and its proposed meaning or cause to be contextually connected.",
      }],
      scopeChoices: [{
        label: "Preserve disagreement",
        rationale: "Include passages where competing divine and natural explanations are contrasted.",
      }],
      exclusions: [{
        label: "Decorative weather",
        rationale: "Do not prioritize weather used only to set a scene without interpretation or causal explanation.",
      }],
    }),
  },
];
