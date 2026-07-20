import { slug } from "./identifiers.ts";

export type CardOrigin = "fox" | "scholar";

export type ConceptTerm = {
  id: string;
  label: string;
  rationale: string;
  pinned: boolean;
  inquiryFocus: boolean;
  origin: CardOrigin;
  restored?: boolean;
};

export type ConceptFamily = {
  id: string;
  title: string;
  rationale: string;
  pinned: boolean;
  inquiryFocus: boolean;
  origin: CardOrigin;
  terms: ConceptTerm[];
  restored?: boolean;
};

export type BoundaryCard = {
  id: string;
  label: string;
  rationale: string;
  pinned: boolean;
  origin: CardOrigin;
  restored?: boolean;
};

export type ModelConceptFamily = {
  title: string;
  rationale: string;
  terms: Array<{ label: string; rationale: string }>;
};

export type ModelBoundaryCard = {
  label: string;
  rationale: string;
};

export type ModelConceptRelationship = {
  sourceTitle: string;
  targetTitle: string;
  label: string;
  rationale: string;
};

export type ConceptRelationship = ModelConceptRelationship & {
  id: string;
  pinned: boolean;
  origin: CardOrigin;
};

export type ModelWorkspace = {
  framing: string;
  foxReply: string;
  nextQuestion: string;
  coverageStatus: "within_planning_scope" | "bridge_suggested" | "coverage_uncertain";
  coverageNote: string;
  bridgeSuggestions: string[];
  conceptFamilies: ModelConceptFamily[];
  relationships: ModelConceptRelationship[];
  scopeChoices: ModelBoundaryCard[];
  exclusions: ModelBoundaryCard[];
};

export type QueryWorkspace = Omit<
  ModelWorkspace,
  "conceptFamilies" | "relationships" | "scopeChoices" | "exclusions"
> & {
  conceptFamilies: ConceptFamily[];
  relationships: ConceptRelationship[];
  scopeChoices: BoundaryCard[];
  exclusions: BoundaryCard[];
};

export type ExplorerResponse = {
  question: string;
  mode: "live";
  model: string;
  responseId: string | null;
  notice: string;
  workspace: QueryWorkspace;
};

function uniqueBy<T>(items: T[], keyFor: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFor(item).trim().toLocaleLowerCase("en");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function hydrateWorkspace(model: ModelWorkspace): QueryWorkspace {
  const conceptFamilies = uniqueBy(model.conceptFamilies, (family) => family.title);
  const activeFamilyTitles = new Set(
    conceptFamilies.map((family) => family.title.trim().toLocaleLowerCase("en")),
  );
  const relationships = uniqueBy(
    model.relationships,
    (relationship) => `${relationship.sourceTitle}\u0000${relationship.targetTitle}\u0000${relationship.label}`,
  ).filter(
    (relationship) =>
      activeFamilyTitles.has(relationship.sourceTitle.trim().toLocaleLowerCase("en")) &&
      activeFamilyTitles.has(relationship.targetTitle.trim().toLocaleLowerCase("en")),
  );

  return {
    ...model,
    conceptFamilies: conceptFamilies.map((family, familyIndex) => {
      const familyId = `family-${slug(family.title)}-${familyIndex + 1}`;
      return {
        ...family,
        id: familyId,
        pinned: false,
        inquiryFocus: false,
        origin: "fox" as const,
        terms: uniqueBy(family.terms, (term) => term.label).map((term, termIndex) => ({
          ...term,
          id: `${familyId}-term-${slug(term.label)}-${termIndex + 1}`,
          pinned: false,
          inquiryFocus: false,
          origin: "fox" as const,
        })),
      };
    }),
    relationships: relationships.map((relationship, index) => ({
      ...relationship,
      id: `relationship-${slug(relationship.sourceTitle)}-${slug(relationship.targetTitle)}-${index + 1}`,
      pinned: false,
      origin: "fox" as const,
    })),
    scopeChoices: uniqueBy(model.scopeChoices, (scope) => scope.label).map((scope, index) => ({
      ...scope,
      id: `scope-${slug(scope.label)}-${index + 1}`,
      pinned: false,
      origin: "fox" as const,
    })),
    exclusions: uniqueBy(model.exclusions, (exclusion) => exclusion.label).map((exclusion, index) => ({
      ...exclusion,
      id: `exclusion-${slug(exclusion.label)}-${index + 1}`,
      pinned: false,
      origin: "fox" as const,
    })),
  };
}

export const documentedQuestion =
  "How do historical writers describe being away from home, and how does distance change what home means to them?";

export function documentedWorkspace(): QueryWorkspace {
  return hydrateWorkspace({
    framing:
      "Find passages where leaving, distance, or return changes how a writer understands home and belonging.",
    foxReply:
      "I hear two questions traveling together: what writers say about being away, and whether distance changes what home means. I can keep exile, pilgrimage, and chosen travel visible without pretending they are the same experience.",
    nextQuestion:
      "Should we include journeys chosen freely as well as forced departures, or would you rather keep those experiences separate?",
    coverageStatus: "coverage_uncertain",
    coverageNote:
      "This is a documented workspace example. A live search must compare the approved map with the manifest of the installed micro-corpus before claiming coverage.",
    bridgeSuggestions: [],
    conceptFamilies: [
      {
        title: "Leaving home",
        rationale: "Different ways a writer becomes physically or socially distant from home.",
        terms: [
          { label: "exile", rationale: "Forced absence, banishment, or displacement." },
          { label: "pilgrimage", rationale: "Travel undertaken for religious purpose or transformation." },
          { label: "chosen journey", rationale: "Departure framed as voluntary travel, study, trade, or exploration." },
        ],
      },
      {
        title: "Home and belonging",
        rationale: "The people, places, attachments, and identities that make somewhere home.",
        terms: [
          { label: "homeland", rationale: "A named place of origin or collective belonging." },
          { label: "household and kin", rationale: "Home understood through family, household, or intimate ties." },
          { label: "community", rationale: "Belonging created by a social, religious, or political group." },
        ],
      },
      {
        title: "Distance changes perspective",
        rationale: "Ways absence makes home more desired, unfamiliar, idealized, or contested.",
        terms: [
          { label: "longing", rationale: "Desire for a home remembered from elsewhere." },
          { label: "estrangement", rationale: "Home becoming unfamiliar or unavailable." },
          { label: "return", rationale: "Recognition, disappointment, or change on coming back." },
        ],
      },
    ],
    relationships: [
      {
        sourceTitle: "Leaving home",
        targetTitle: "Home and belonging",
        label: "changes the meaning of",
        rationale: "Looks for passages in which distance reshapes what counts as home.",
      },
      {
        sourceTitle: "Leaving home",
        targetTitle: "Distance changes perspective",
        label: "develops into",
        rationale: "Tests whether a departure produces a changed understanding rather than merely a change of place.",
      },
    ],
    scopeChoices: [
      {
        label: "Reflective passages",
        rationale: "Retrieve enough surrounding text to see what the writer thinks or feels about absence and belonging.",
      },
    ],
    exclusions: [
      {
        label: "Pure itineraries",
        rationale: "Do not prioritize lists of routes or distances that offer no reflection on home or belonging.",
      },
    ],
  });
}
