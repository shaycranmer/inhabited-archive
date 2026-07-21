import type {
  AdaptationCategory,
  AdaptationConfidence,
  BadgerAdaptationPlan,
  RetrievalEffect,
} from "./adaptation-plan";
import type { QueryWorkspace } from "./query-plan";

export const RETRIEVAL_RUN_CONTRACT_VERSION = "retrieval-run-v1" as const;
export const MAX_COMPILED_PROPOSALS = 48;
export const MAX_CANDIDATE_UNITS = 18;
export const MAX_CANDIDATES_PER_DOCUMENT = 3;
export const MAX_SOURCE_UNITS_PER_CANDIDATE = 7;

export type TranslationPreference = "auto_strong" | "on_demand" | "off";

export type CompiledProposal = {
  id: string;
  folioId: string;
  sourceFamilyId: string;
  sourceFamilyTitle: string;
  sourceConceptId: string;
  sourceConceptLabel: string;
  category: AdaptationCategory;
  retrievalEffect: RetrievalEffect;
  confidence: AdaptationConfidence;
  queryForms: string[];
  falsePositiveForecast: string[];
  uncertaintyNotes: string[];
  weight: number;
};

export type CompiledRetrievalPlan = {
  contractVersion: "compiled-retrieval-v1";
  corpusId: string;
  corpusLabel: string;
  languageCode: string;
  languageLabel: string;
  positiveProposals: CompiledProposal[];
  exclusionProposals: CompiledProposal[];
  limitations: string[];
};

export type RetrievalMatchAttribution = Omit<CompiledProposal, "falsePositiveForecast" | "uncertaintyNotes" | "weight">;

export type RawRetrievalHit = {
  segmentId: string;
  documentId: string;
  sequenceNumber: number;
  segmentType: string;
  citationLabel: string;
  text: string;
  author: string;
  workTitle: string;
  sourceUrl: string;
  sourceSha256: string;
  rightsStatement: string;
  basket: string;
  lexicalRank: number;
  attribution: CompiledProposal;
};

export type CandidateSeed = {
  documentId: string;
  startSequence: number;
  endSequence: number;
  matchedSegmentIds: string[];
  hitTexts: string[];
  author: string;
  workTitle: string;
  sourceUrl: string;
  sourceSha256: string;
  rightsStatement: string;
  basket: string;
  matchAttributions: RetrievalMatchAttribution[];
  exclusionSignals: RetrievalMatchAttribution[];
  relationshipIds: string[];
  deterministicScore: number;
};

export type CandidateSourceUnit = {
  segmentId: string;
  sequenceNumber: number;
  citationLabel: string;
  text: string;
  matched: boolean;
};

export type CandidateReadingUnit = {
  candidateId: string;
  documentId: string;
  author: string;
  workTitle: string;
  citationLabel: string;
  languageCode: string;
  languageLabel: string;
  basket: string;
  sourceUrl: string;
  sourceSha256: string;
  rightsStatement: string;
  sourceUnits: CandidateSourceUnit[];
  matchedSegmentIds: string[];
  matchAttributions: RetrievalMatchAttribution[];
  exclusionSignals: RetrievalMatchAttribution[];
  relationshipIds: string[];
  deterministicScore: number;
  retrievalRank: number;
};

export type RetrievalRun = {
  contractVersion: typeof RETRIEVAL_RUN_CONTRACT_VERSION;
  runId: string;
  parentRunId: string | null;
  createdAt: string;
  question: string;
  translationPreference: TranslationPreference;
  inquirySnapshot: QueryWorkspace;
  languagePlanSnapshot: BadgerAdaptationPlan;
  compiledPlan: CompiledRetrievalPlan;
  corpusReceipt: {
    corpusId: string;
    sourceCommit: string;
    contentSha256: string;
  };
  hashes: {
    inquirySha256: string;
    languagePlanSha256: string;
    candidatePacketSha256: string;
    executionPacketSha256: string;
  };
  stats: {
    executedProposalCount: number;
    rawMatchCount: number;
    deduplicatedCandidateCount: number;
    returnedCandidateCount: number;
  };
  candidates: CandidateReadingUnit[];
  limitations: string[];
};

function uniqueStrings(values: string[], limit = 16) {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    const cleaned = value.trim().slice(0, 180);
    const key = cleaned.toLocaleLowerCase("en");
    if (!cleaned || seen.has(key) || seen.size >= limit) return [];
    seen.add(key);
    return [cleaned];
  });
}

function proposalWeight(category: AdaptationCategory, effect: RetrievalEffect) {
  const categoryWeight: Record<AdaptationCategory, number> = {
    lexical_translation: 4,
    morphological_expansion: 3.4,
    historical_semantic_expansion: 3,
    conceptual_association: 1.7,
    exclusion_rule: 0,
    uncertainty: 0,
  };
  return categoryWeight[category] * (effect === "demote" ? 0.55 : 1);
}

export function isApprovedBadgerPlan(
  plan: unknown,
  workspace: QueryWorkspace,
): plan is BadgerAdaptationPlan {
  if (!plan || typeof plan !== "object") return false;
  const candidate = plan as Partial<BadgerAdaptationPlan>;
  if (
    candidate.contractVersion !== "badger-adaptation-v1" ||
    candidate.approvalStatus !== "approved" ||
    !Array.isArray(candidate.folios) ||
    candidate.folios.length !== workspace.conceptFamilies.length
  ) {
    return false;
  }
  const expectedFamilies = new Set(workspace.conceptFamilies.map((family) => family.id));
  const suppliedFamilies = new Set<string>();
  return candidate.folios.every((folio) => {
    if (!folio || suppliedFamilies.has(folio.sourceFamilyId)) return false;
    suppliedFamilies.add(folio.sourceFamilyId);
    return expectedFamilies.has(folio.sourceFamilyId) &&
      folio.status === "approved" &&
      Array.isArray(folio.proposals) &&
      folio.proposals.length <= 12;
  });
}

export function executionPacketForHash(run: Pick<
  RetrievalRun,
  | "runId"
  | "createdAt"
  | "question"
  | "translationPreference"
  | "parentRunId"
  | "inquirySnapshot"
  | "languagePlanSnapshot"
  | "compiledPlan"
  | "corpusReceipt"
  | "candidates"
  | "stats"
  | "limitations"
>) {
  return {
    runId: run.runId,
    createdAt: run.createdAt,
    question: run.question,
    translationPreference: run.translationPreference,
    parentRunId: run.parentRunId,
    inquirySnapshot: run.inquirySnapshot,
    languagePlanSnapshot: run.languagePlanSnapshot,
    compiledPlan: run.compiledPlan,
    corpusReceipt: run.corpusReceipt,
    candidates: run.candidates,
    stats: run.stats,
    limitations: run.limitations,
  };
}

export function compileRetrievalPlan(
  workspace: QueryWorkspace,
  plan: BadgerAdaptationPlan,
): CompiledRetrievalPlan {
  if (!isApprovedBadgerPlan(plan, workspace)) {
    throw new Error("Every current language folio must be approved before retrieval.");
  }

  const proposals = plan.folios.flatMap((folio) =>
    folio.proposals.flatMap((proposal) => {
      if (!proposal.active || proposal.retrievalEffect === "disclose_only") return [];
      const queryForms = uniqueStrings([
        ...proposal.searchForms,
        ...proposal.orthographicVariants,
        ...proposal.phrases,
      ]);
      if (!queryForms.length) return [];
      return [{
        id: proposal.id,
        folioId: folio.id,
        sourceFamilyId: folio.sourceFamilyId,
        sourceFamilyTitle: folio.sourceFamilyTitle,
        sourceConceptId: proposal.sourceConceptId,
        sourceConceptLabel: proposal.sourceConceptLabel,
        category: proposal.category,
        retrievalEffect: proposal.retrievalEffect,
        confidence: proposal.confidence,
        queryForms,
        falsePositiveForecast: proposal.falsePositiveForecast.slice(0, 12),
        uncertaintyNotes: proposal.uncertaintyNotes.slice(0, 12),
        weight: proposalWeight(proposal.category, proposal.retrievalEffect),
      } satisfies CompiledProposal];
    })
  ).slice(0, MAX_COMPILED_PROPOSALS);

  const exclusionProposals = proposals.filter((proposal) =>
    proposal.category === "exclusion_rule" || proposal.retrievalEffect === "exclude"
  );
  const positiveProposals = proposals.filter((proposal) =>
    proposal.category !== "exclusion_rule" && proposal.retrievalEffect !== "exclude"
  );
  if (!positiveProposals.length) {
    throw new Error("The approved folios contain no active literal forms that this shelf can execute.");
  }

  return {
    contractVersion: "compiled-retrieval-v1",
    corpusId: plan.corpusId,
    corpusLabel: plan.corpusLabel,
    languageCode: plan.languageCode,
    languageLabel: plan.languageLabel,
    positiveProposals,
    exclusionProposals,
    limitations: [
      "This v1 executor runs bounded literal surface-form and short phrase queries. It does not yet execute abstract syntactic frames or lemmatize the shelf.",
      "Semantic exclusions remain visible demotion signals for the owl unless they are precise enough for a later deterministic filter.",
      "Candidate scores organize a high-recall packet for adjudication; they are not historical relevance judgments.",
    ],
  };
}

function attribution(proposal: CompiledProposal): RetrievalMatchAttribution {
  return {
    id: proposal.id,
    folioId: proposal.folioId,
    sourceFamilyId: proposal.sourceFamilyId,
    sourceFamilyTitle: proposal.sourceFamilyTitle,
    sourceConceptId: proposal.sourceConceptId,
    sourceConceptLabel: proposal.sourceConceptLabel,
    category: proposal.category,
    retrievalEffect: proposal.retrievalEffect,
    confidence: proposal.confidence,
    queryForms: proposal.queryForms,
  };
}

function foldForSignal(value: string) {
  return value
    .normalize("NFC")
    .toLocaleLowerCase("la")
    .replaceAll("j", "i")
    .replaceAll("u", "v")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function proposalAppearsInText(proposal: CompiledProposal, text: string) {
  const foldedText = ` ${foldForSignal(text)} `;
  return proposal.queryForms.some((form) => {
    const foldedForm = foldForSignal(form);
    return foldedForm && foldedText.includes(` ${foldedForm} `);
  });
}

function focusedSourceIds(workspace: QueryWorkspace) {
  return new Set(workspace.conceptFamilies.flatMap((family) => [
    ...(family.inquiryFocus ? [family.id] : []),
    ...family.terms.filter((term) => term.inquiryFocus).map((term) => term.id),
  ]));
}

export function deduplicateAndRankHits(
  hits: RawRetrievalHit[],
  compiledPlan: CompiledRetrievalPlan,
  workspace: QueryWorkspace,
) {
  const byDocument = new Map<string, RawRetrievalHit[]>();
  hits.forEach((hit) => {
    const current = byDocument.get(hit.documentId) ?? [];
    current.push(hit);
    byDocument.set(hit.documentId, current);
  });
  const focusIds = focusedSourceIds(workspace);
  const seeds: CandidateSeed[] = [];

  byDocument.forEach((documentHits) => {
    const ordered = [...documentHits].sort((left, right) =>
      left.sequenceNumber - right.sequenceNumber || left.attribution.id.localeCompare(right.attribution.id)
    );
    const groups: RawRetrievalHit[][] = [];
    ordered.forEach((hit) => {
      const group = groups.at(-1);
      const groupEnd = group ? Math.max(...group.map((item) => item.sequenceNumber)) : -Infinity;
      const groupSequences = group ? new Set(group.map((item) => item.sequenceNumber)) : new Set();
      if (!group || hit.sequenceNumber > groupEnd + 2 || groupSequences.size >= 5) groups.push([hit]);
      else group.push(hit);
    });

    groups.forEach((group) => {
      const first = group[0];
      const uniqueProposals = new Map(group.map((hit) => [hit.attribution.id, hit.attribution]));
      const attributions = [...uniqueProposals.values()];
      const familyTitles = new Set(attributions.map((item) => item.sourceFamilyTitle));
      const relationshipIds = workspace.relationships.flatMap((relationship) =>
        familyTitles.has(relationship.sourceTitle) && familyTitles.has(relationship.targetTitle)
          ? [relationship.id]
          : []
      );
      const hitText = [...new Set(group.map((hit) => hit.text))].join("\n");
      const exclusionSignals = compiledPlan.exclusionProposals.filter((proposal) =>
        proposalAppearsInText(proposal, hitText)
      );
      const score = attributions.reduce((total, item) => total + item.weight, 0) +
        Math.max(0, familyTitles.size - 1) * 4 +
        relationshipIds.length * 3 +
        attributions.filter((item) =>
          focusIds.has(item.sourceFamilyId) || focusIds.has(item.sourceConceptId)
        ).length * 2.5 -
        exclusionSignals.length * 3;

      seeds.push({
        documentId: first.documentId,
        startSequence: Math.min(...group.map((hit) => hit.sequenceNumber)),
        endSequence: Math.max(...group.map((hit) => hit.sequenceNumber)),
        matchedSegmentIds: [...new Set(group.map((hit) => hit.segmentId))],
        hitTexts: [...new Set(group.map((hit) => hit.text))],
        author: first.author,
        workTitle: first.workTitle,
        sourceUrl: first.sourceUrl,
        sourceSha256: first.sourceSha256,
        rightsStatement: first.rightsStatement,
        basket: first.basket,
        matchAttributions: attributions.map(attribution),
        exclusionSignals: exclusionSignals.map(attribution),
        relationshipIds,
        deterministicScore: Number(score.toFixed(3)),
      });
    });
  });

  const selected: CandidateSeed[] = [];
  const perDocument = new Map<string, number>();
  [...seeds]
    .sort((left, right) =>
      right.deterministicScore - left.deterministicScore ||
      left.documentId.localeCompare(right.documentId) ||
      left.startSequence - right.startSequence
    )
    .forEach((seed) => {
      if (selected.length >= MAX_CANDIDATE_UNITS) return;
      const count = perDocument.get(seed.documentId) ?? 0;
      if (count >= MAX_CANDIDATES_PER_DOCUMENT) return;
      selected.push(seed);
      perDocument.set(seed.documentId, count + 1);
    });
  return { seeds, selected };
}

export function candidateSourceText(candidate: CandidateReadingUnit) {
  return candidate.sourceUnits
    .map((unit) => `[${unit.segmentId}] ${unit.text}`)
    .join("\n\n");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

export function canonicalJson(value: unknown) {
  return JSON.stringify(canonicalize(value));
}

export async function sha256Hex(value: unknown) {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function cleanTranslationPreference(value: unknown): TranslationPreference {
  return value === "on_demand" || value === "off" ? value : "auto_strong";
}

export function cleanParentRunId(value: unknown) {
  return typeof value === "string" && /^retrieval_[A-Za-z0-9_-]{8,120}$/.test(value)
    ? value
    : null;
}

export function isRetrievalRun(value: unknown): value is RetrievalRun {
  if (!value || typeof value !== "object") return false;
  const run = value as Partial<RetrievalRun>;
  return run.contractVersion === RETRIEVAL_RUN_CONTRACT_VERSION &&
    typeof run.runId === "string" &&
    /^retrieval_[A-Za-z0-9_-]{8,120}$/.test(run.runId) &&
    typeof run.question === "string" &&
    run.question.length <= 1200 &&
    ["auto_strong", "on_demand", "off"].includes(run.translationPreference ?? "") &&
    Boolean(run.inquirySnapshot) &&
    Boolean(run.languagePlanSnapshot) &&
    Boolean(run.compiledPlan) &&
    Array.isArray(run.candidates) &&
    run.candidates.length <= MAX_CANDIDATE_UNITS &&
    run.candidates.every((candidate) =>
      typeof candidate.candidateId === "string" &&
      typeof candidate.documentId === "string" &&
      Array.isArray(candidate.sourceUnits) &&
      candidate.sourceUnits.length >= 1 &&
      candidate.sourceUnits.length <= MAX_SOURCE_UNITS_PER_CANDIDATE &&
      candidate.sourceUnits.every((unit) =>
        typeof unit.segmentId === "string" &&
        typeof unit.text === "string" &&
        unit.text.length <= 8000
      )
    );
}
