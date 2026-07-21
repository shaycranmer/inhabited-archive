import type {
  BoundaryCard,
  CatalogueConstraint,
  QueryWorkspace,
} from "./query-plan";

export type CatalogueWork = {
  documentId: string;
  workUrn: string;
  author: string;
  workTitle: string;
  compositionStartYear: number;
  compositionEndYear: number;
  dateLabel: string;
  dateCertainty: string;
  genreTags: string[];
  traditionTags: string[];
  scopeNote: string;
};

export type AppliedCatalogueConstraint = {
  cardId: string;
  label: string;
  effect: "scope" | "exclude";
  constraint: CatalogueConstraint;
};

export type CatalogueScopeWorkReceipt = {
  documentId: string;
  author: string;
  workTitle: string;
  dateLabel: string;
  reason: string;
};

export type CatalogueScopeReceipt = {
  policy: "high_recall_include_and_flag";
  totalWorkCount: number;
  eligibleWorkCount: number;
  excludedWorkCount: number;
  flaggedWorkCount: number;
  appliedConstraints: AppliedCatalogueConstraint[];
  excludedWorks: CatalogueScopeWorkReceipt[];
  flaggedWorks: CatalogueScopeWorkReceipt[];
};

type BoundaryMatch = "match" | "outside" | "uncertain";

const tagAliases: Record<string, string> = {
  poems: "poetry",
  poetic: "poetry",
  epistles: "letters",
  letter: "letters",
  histories: "history",
  historical: "history",
  patristics: "patristic",
  patristic_latin: "patristic",
  christian: "early_christian",
  christian_latin: "early_christian",
  classical: "classical_latin",
  medieval_latin: "medieval",
};

function normalizedTag(value: string) {
  const tag = value.trim().toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return tagAliases[tag] ?? tag;
}

function constraintIsExecutable(constraint: CatalogueConstraint) {
  if (constraint.status !== "resolved") return false;
  if (constraint.dimension === "composition_date") {
    return constraint.startYear !== null || constraint.endYear !== null;
  }
  if (constraint.dimension === "genre" || constraint.dimension === "tradition") {
    return constraint.values.some((value) => normalizedTag(value));
  }
  return false;
}

function resolvedBoundaries(workspace: QueryWorkspace) {
  const unresolved = [...workspace.scopeChoices, ...workspace.exclusions].filter(
    (card) => card.catalogueConstraint.status === "needs_clarification",
  );
  if (unresolved.length) {
    throw new Error(
      `The fox still needs to sharpen ${unresolved.map((card) => `“${card.label}”`).join(", ")} into an exact catalogue boundary before retrieval.`,
    );
  }

  const collect = (cards: BoundaryCard[], effect: AppliedCatalogueConstraint["effect"]) =>
    cards.flatMap((card) => {
      if (card.catalogueConstraint.status !== "resolved") return [];
      if (!constraintIsExecutable(card.catalogueConstraint)) {
        throw new Error(`The catalogue rule for “${card.label}” is marked resolved but has no executable boundary.`);
      }
      return [{
        cardId: card.id,
        label: card.label,
        effect,
        constraint: structuredClone(card.catalogueConstraint),
      } satisfies AppliedCatalogueConstraint];
    });

  return [
    ...collect(workspace.scopeChoices, "scope"),
    ...collect(workspace.exclusions, "exclude"),
  ];
}

function matchDate(work: CatalogueWork, constraint: CatalogueConstraint): BoundaryMatch {
  const start = constraint.startYear ?? Number.NEGATIVE_INFINITY;
  const end = constraint.endYear ?? Number.POSITIVE_INFINITY;
  if (work.compositionEndYear < start || work.compositionStartYear > end) return "outside";
  if (work.compositionStartYear >= start && work.compositionEndYear <= end) return "match";
  return "uncertain";
}

function matchTags(work: CatalogueWork, constraint: CatalogueConstraint): BoundaryMatch {
  const supplied = constraint.dimension === "genre" ? work.genreTags : work.traditionTags;
  if (!supplied.length) return "uncertain";
  const workTags = new Set(supplied.map(normalizedTag));
  const requested = constraint.values.map(normalizedTag).filter(Boolean);
  return requested.some((tag) => workTags.has(tag)) ? "match" : "outside";
}

function matchBoundary(work: CatalogueWork, constraint: CatalogueConstraint) {
  return constraint.dimension === "composition_date"
    ? matchDate(work, constraint)
    : matchTags(work, constraint);
}

function workReceipt(work: CatalogueWork, reason: string): CatalogueScopeWorkReceipt {
  return {
    documentId: work.documentId,
    author: work.author,
    workTitle: work.workTitle,
    dateLabel: work.dateLabel,
    reason,
  };
}

export function applyCatalogueScope(works: CatalogueWork[], workspace: QueryWorkspace) {
  const appliedConstraints = resolvedBoundaries(workspace);
  const eligibleWorks: CatalogueWork[] = [];
  const excludedWorks: CatalogueScopeWorkReceipt[] = [];
  const flaggedWorks: CatalogueScopeWorkReceipt[] = [];

  works.forEach((work) => {
    const reasons: string[] = [];
    const warnings: string[] = [];
    appliedConstraints.forEach((boundary) => {
      const match = matchBoundary(work, boundary.constraint);
      if (boundary.effect === "scope" && match === "outside") {
        reasons.push(`Outside scope “${boundary.label}”.`);
      } else if (boundary.effect === "exclude" && match === "match") {
        reasons.push(`Matches keep-out rule “${boundary.label}”.`);
      } else if (match === "uncertain") {
        warnings.push(`Possibly affected by “${boundary.label}”; retained under the high-recall policy.`);
      }
    });

    if (reasons.length) excludedWorks.push(workReceipt(work, reasons.join(" ")));
    else {
      eligibleWorks.push(work);
      if (warnings.length) flaggedWorks.push(workReceipt(work, warnings.join(" ")));
    }
  });

  const receipt: CatalogueScopeReceipt = {
    policy: "high_recall_include_and_flag",
    totalWorkCount: works.length,
    eligibleWorkCount: eligibleWorks.length,
    excludedWorkCount: excludedWorks.length,
    flaggedWorkCount: flaggedWorks.length,
    appliedConstraints,
    excludedWorks,
    flaggedWorks,
  };
  return { eligibleWorks, receipt };
}
