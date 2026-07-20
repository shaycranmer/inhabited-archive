import { slug } from "./identifiers.ts";

export const adaptationCategories = [
  "lexical_translation",
  "morphological_expansion",
  "historical_semantic_expansion",
  "conceptual_association",
  "exclusion_rule",
  "uncertainty",
] as const;

export type AdaptationCategory = (typeof adaptationCategories)[number];
export type AdaptationConfidence = "secure" | "probable" | "speculative";
export type RetrievalEffect = "include" | "demote" | "exclude" | "disclose_only";
export type VerificationStatus =
  | "packet_guided_model_proposal"
  | "corpus_attested"
  | "externally_verified";
export type FolioStatus = "untouched" | "scholar_edited" | "approved";

export type ModelAdaptationProposal = {
  sourceConceptId: string;
  sourceConceptLabel: string;
  category: AdaptationCategory;
  retrievalEffect: RetrievalEffect;
  latinExpression: string;
  englishSense: string;
  rationale: string;
  searchForms: string[];
  orthographicVariants: string[];
  phrases: string[];
  syntacticFrame: string;
  periodTags: string[];
  genreTags: string[];
  falsePositiveForecast: string[];
  uncertaintyNotes: string[];
  confidence: AdaptationConfidence;
  verificationStatus: VerificationStatus;
  verificationNote: string;
};

export type AdaptationProposal = ModelAdaptationProposal & {
  id: string;
  active: boolean;
  pinned: boolean;
  scholarEdited: boolean;
  shelfPreview?: ShelfPreview;
};

export type ModelBadgerFolio = {
  sourceFamilyId: string;
  sourceFamilyTitle: string;
  summary: string;
  scopeNote: string;
  highestRisk: string;
  overallConfidence: AdaptationConfidence;
  proposals: ModelAdaptationProposal[];
};

export type BadgerFolio = Omit<ModelBadgerFolio, "proposals"> & {
  id: string;
  status: FolioStatus;
  proposals: AdaptationProposal[];
};

export type ModelBadgerAdaptationPlan = {
  languageCode: string;
  languageLabel: string;
  corpusId: string;
  corpusLabel: string;
  holdingsNote: string;
  globalUncertainties: string[];
  folios: ModelBadgerFolio[];
};

export type BadgerAdaptationPlan = Omit<ModelBadgerAdaptationPlan, "folios"> & {
  contractVersion: "badger-adaptation-v1";
  approvalStatus: "draft" | "approved";
  folios: BadgerFolio[];
};

export type BadgerResponse = {
  question: string;
  mode: "live";
  model: string;
  responseId: string | null;
  packetVersion: string;
  notice: string;
  plan: BadgerAdaptationPlan;
};

export type BadgerPendingResponse = Omit<BadgerResponse, "plan"> & {
  responseId: string;
  status: "queued" | "in_progress";
};

export type ShelfPreviewSample = {
  segmentId: string;
  documentId: string;
  author: string;
  workTitle: string;
  citationLabel: string;
  snippet: string;
  sourceUrl: string;
  sourceSha256: string;
  rightsStatement: string;
};

export type ShelfPreview = {
  kind: "diagnostic_shelf_preview";
  proposalId: string;
  status: "matches_found" | "no_matches" | "unavailable";
  corpusId: string;
  corpusLabel: string;
  queryForms: string[];
  queryMode: "any" | "all";
  totalSegmentMatches: number;
  totalDocumentMatches: number;
  basketMatches?: Array<{
    basket: string;
    segmentMatches: number;
    documentMatches: number;
  }>;
  samples: ShelfPreviewSample[];
  notice: string;
  orthographicMatching?: string;
  shelfReceipt?: {
    sourceCommit: string;
    contentSha256: string;
  };
};

export type FolioSummary = {
  directProposalCount: number;
  exploratoryProposalCount: number;
  warningCount: number;
  previewedProposalCount: number;
  status: FolioStatus;
};

export const latinDemoCorpus = {
  languageCode: "lat",
  languageLabel: "Latin",
  corpusId: "perseus-latin-demo-v1",
  corpusLabel: "Thirty-work Perseus Latin shelf",
  holdingsNote:
    "This is a selective thirty-work demonstration shelf. Absence here is not evidence of historical absence.",
} as const;

export const modelProposalVerificationNote =
  "Proposed by the model under the Latin adaptation packet; not yet corpus-attested or independently dictionary-verified.";

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.trim().toLocaleLowerCase("en");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function proposalIdentity(proposal: ModelAdaptationProposal) {
  return [
    proposal.sourceConceptId,
    proposal.category,
    proposal.latinExpression,
    proposal.englishSense,
  ]
    .join("\u0000")
    .trim()
    .toLocaleLowerCase("en");
}

export function hydrateBadgerAdaptationPlan(
  model: ModelBadgerAdaptationPlan,
): BadgerAdaptationPlan {
  const seenFolios = new Set<string>();
  const folios = model.folios.flatMap((folio, folioIndex) => {
    const folioKey = folio.sourceFamilyId.trim().toLocaleLowerCase("en");
    if (!folioKey || seenFolios.has(folioKey)) return [];
    seenFolios.add(folioKey);
    const folioId = `folio-${slug(folio.sourceFamilyTitle)}-${folioIndex + 1}`;
    const seenProposals = new Set<string>();
    const proposals = folio.proposals.flatMap((proposal, proposalIndex) => {
      const identity = proposalIdentity(proposal);
      if (!identity || seenProposals.has(identity)) return [];
      seenProposals.add(identity);
      return [{
        ...proposal,
        id: `${folioId}-proposal-${slug(proposal.latinExpression || proposal.englishSense)}-${proposalIndex + 1}`,
        searchForms: uniqueStrings(proposal.searchForms),
        orthographicVariants: uniqueStrings(proposal.orthographicVariants),
        phrases: uniqueStrings(proposal.phrases),
        periodTags: uniqueStrings(proposal.periodTags),
        genreTags: uniqueStrings(proposal.genreTags),
        falsePositiveForecast: uniqueStrings(proposal.falsePositiveForecast),
        uncertaintyNotes: uniqueStrings(proposal.uncertaintyNotes),
        active: proposal.retrievalEffect !== "disclose_only",
        pinned: false,
        scholarEdited: false,
      }];
    });
    return [{ ...folio, id: folioId, status: "untouched" as const, proposals }];
  });

  return {
    ...model,
    contractVersion: "badger-adaptation-v1",
    approvalStatus: "draft",
    globalUncertainties: uniqueStrings(model.globalUncertainties),
    folios,
  };
}

type WorkspaceConcept = {
  id: string;
  label: string;
};

type WorkspaceFamily = {
  id: string;
  title: string;
  terms: WorkspaceConcept[];
};

type AdaptationWorkspace = {
  conceptFamilies: WorkspaceFamily[];
};

/**
 * Reconnects model output to the scholar-approved table and refuses invented
 * or missing source cards. Corpus identity and verification status are set by
 * application code rather than entrusted to the model.
 */
export function reconcileBadgerAdaptationPlan(
  model: ModelBadgerAdaptationPlan,
  workspace: AdaptationWorkspace,
): BadgerAdaptationPlan {
  const workspaceFamilies = workspace.conceptFamilies;
  const modelByFamilyId = new Map<string, ModelBadgerFolio>();

  for (const folio of model.folios) {
    if (modelByFamilyId.has(folio.sourceFamilyId)) {
      throw new Error("The badger returned the same fox family more than once.");
    }
    modelByFamilyId.set(folio.sourceFamilyId, folio);
  }

  if (modelByFamilyId.size !== workspaceFamilies.length) {
    throw new Error("The badger did not return exactly one folio for every fox family.");
  }

  const folios = workspaceFamilies.map((family) => {
    const folio = modelByFamilyId.get(family.id);
    if (!folio) {
      throw new Error(`The badger omitted the fox family ${family.id}.`);
    }

    const sourceConcepts = new Map<string, string>([
      [family.id, family.title],
      ...family.terms.map((term) => [term.id, term.label] as const),
    ]);

    return {
      ...folio,
      sourceFamilyId: family.id,
      sourceFamilyTitle: family.title,
      proposals: folio.proposals.map((proposal) => {
        const sourceConceptLabel = sourceConcepts.get(proposal.sourceConceptId);
        if (!sourceConceptLabel) {
          throw new Error(
            `The badger connected a proposal to an unknown fox card ${proposal.sourceConceptId}.`,
          );
        }

        return {
          ...proposal,
          sourceConceptLabel,
          retrievalEffect:
            proposal.category === "uncertainty"
              ? "disclose_only" as const
              : proposal.category === "exclusion_rule" &&
                  !["demote", "exclude"].includes(proposal.retrievalEffect)
                ? "exclude" as const
              : proposal.retrievalEffect,
          verificationStatus: "packet_guided_model_proposal" as const,
          verificationNote: modelProposalVerificationNote,
        };
      }),
    };
  });

  return hydrateBadgerAdaptationPlan({
    ...model,
    ...latinDemoCorpus,
    globalUncertainties: [
      ...model.globalUncertainties,
      "The demonstration shelf is selective; a zero-result preview cannot establish historical absence.",
      "The first retrieval floor is literal. Search forms still require scholar inspection before approval.",
    ],
    folios,
  });
}

export function summarizeFolio(folio: BadgerFolio): FolioSummary {
  return {
    directProposalCount: folio.proposals.filter((proposal) =>
      ["lexical_translation", "morphological_expansion", "historical_semantic_expansion"].includes(
        proposal.category,
      )
    ).length,
    exploratoryProposalCount: folio.proposals.filter(
      (proposal) => proposal.category === "conceptual_association",
    ).length,
    warningCount: folio.proposals.reduce(
      (total, proposal) =>
        total + proposal.falsePositiveForecast.length + proposal.uncertaintyNotes.length,
      0,
    ),
    previewedProposalCount: folio.proposals.filter((proposal) => proposal.shelfPreview).length,
    status: folio.status,
  };
}

export function attachShelfPreview(
  plan: BadgerAdaptationPlan,
  preview: ShelfPreview,
): BadgerAdaptationPlan {
  return {
    ...plan,
    folios: plan.folios.map((folio) => ({
      ...folio,
      proposals: folio.proposals.map((proposal) =>
        proposal.id === preview.proposalId ? { ...proposal, shelfPreview: preview } : proposal,
      ),
    })),
  };
}

const stringArray = {
  type: "array",
  minItems: 0,
  maxItems: 16,
  items: { type: "string" },
} as const;

export const badgerAdaptationPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "languageCode",
    "languageLabel",
    "corpusId",
    "corpusLabel",
    "holdingsNote",
    "globalUncertainties",
    "folios",
  ],
  properties: {
    languageCode: { type: "string" },
    languageLabel: { type: "string" },
    corpusId: { type: "string" },
    corpusLabel: { type: "string" },
    holdingsNote: { type: "string" },
    globalUncertainties: stringArray,
    folios: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "sourceFamilyId",
          "sourceFamilyTitle",
          "summary",
          "scopeNote",
          "highestRisk",
          "overallConfidence",
          "proposals",
        ],
        properties: {
          sourceFamilyId: { type: "string" },
          sourceFamilyTitle: { type: "string" },
          summary: { type: "string" },
          scopeNote: { type: "string" },
          highestRisk: { type: "string" },
          overallConfidence: { type: "string", enum: ["secure", "probable", "speculative"] },
          proposals: {
            type: "array",
            minItems: 1,
            maxItems: 12,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "sourceConceptId",
                "sourceConceptLabel",
                "category",
                "retrievalEffect",
                "latinExpression",
                "englishSense",
                "rationale",
                "searchForms",
                "orthographicVariants",
                "phrases",
                "syntacticFrame",
                "periodTags",
                "genreTags",
                "falsePositiveForecast",
                "uncertaintyNotes",
                "confidence",
                "verificationStatus",
                "verificationNote",
              ],
              properties: {
                sourceConceptId: { type: "string" },
                sourceConceptLabel: { type: "string" },
                category: { type: "string", enum: adaptationCategories },
                retrievalEffect: {
                  type: "string",
                  enum: ["include", "demote", "exclude", "disclose_only"],
                },
                latinExpression: { type: "string" },
                englishSense: { type: "string" },
                rationale: { type: "string" },
                searchForms: stringArray,
                orthographicVariants: stringArray,
                phrases: stringArray,
                syntacticFrame: { type: "string" },
                periodTags: stringArray,
                genreTags: stringArray,
                falsePositiveForecast: stringArray,
                uncertaintyNotes: stringArray,
                confidence: {
                  type: "string",
                  enum: ["secure", "probable", "speculative"],
                },
                verificationStatus: {
                  type: "string",
                  enum: ["packet_guided_model_proposal"],
                },
                verificationNote: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
} as const;
