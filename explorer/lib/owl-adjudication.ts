import {
  MAX_CANDIDATE_UNITS,
  candidateSourceText,
  type CandidateReadingUnit,
  type RetrievalRun,
} from "./retrieval-run.ts";

export const owlDispositions = [
  "strong",
  "possible",
  "liminal",
  "incidental",
  "unresolved",
] as const;

export type OwlDisposition = (typeof owlDispositions)[number];
export type OwlConfidence = "high" | "medium" | "low";

export type ModelOwlJudgment = {
  candidateId: string;
  disposition: OwlDisposition;
  priority: number;
  confidence: OwlConfidence;
  relationshipSummary: string;
  reasoning: string;
  evidenceSegmentIds: string[];
  evidenceExcerpt: string;
  contextNeeded: boolean;
  contextRequest: string;
  englishOrientation: string;
  workingTranslation: string;
  translationNotes: string[];
  warnings: string[];
};

export type ModelOwlAdjudication = {
  runId: string;
  judgments: ModelOwlJudgment[];
};

export type OwlJudgment = ModelOwlJudgment & {
  translationStatus: "machine_generated" | "available_on_demand" | "disabled";
};

export type OwlAdjudication = {
  contractVersion: "owl-adjudication-v1";
  runId: string;
  createdAt: string;
  model: string;
  responseId: string;
  judgments: OwlJudgment[];
};

export type TranslationAddendum = {
  contractVersion: "working-translation-addendum-v1";
  addendumId: string;
  runId: string;
  candidateId: string;
  createdAt: string;
  model: string;
  responseId: string | null;
  workingTranslation: string;
  translationNotes: string[];
};

export type OwlRunRecord = {
  retrieval: RetrievalRun;
  adjudication: OwlAdjudication | null;
  translationAddenda: TranslationAddendum[];
};

export type OwlPendingResponse = {
  runId: string;
  mode: "live";
  model: string;
  responseId: string;
  status: "queued" | "in_progress";
  notice: string;
};

export type OwlResponse = {
  runId: string;
  mode: "live";
  model: string;
  responseId: string;
  notice: string;
  adjudication: OwlAdjudication;
};

const dispositionOrder: Record<OwlDisposition, number> = {
  strong: 0,
  possible: 1,
  liminal: 2,
  unresolved: 3,
  incidental: 4,
};

function cleanText(value: string, limit: number) {
  return value.trim().slice(0, limit);
}

function uniqueStrings(values: string[], limit: number, itemLimit: number) {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    const cleaned = cleanText(value, itemLimit);
    const key = cleaned.toLocaleLowerCase("en");
    if (!cleaned || seen.has(key) || seen.size >= limit) return [];
    seen.add(key);
    return [cleaned];
  });
}

function shouldTranslateAutomatically(run: RetrievalRun, disposition: OwlDisposition) {
  return run.translationPreference === "auto_strong" &&
    (disposition === "strong" || disposition === "possible");
}

export function reconcileOwlAdjudication(
  model: ModelOwlAdjudication,
  run: RetrievalRun,
  receipt: { model: string; responseId: string },
): OwlAdjudication {
  if (model.runId !== run.runId) {
    throw new Error("The owl returned a judgment for a different retrieval run.");
  }
  const candidates = new Map(run.candidates.map((candidate) => [candidate.candidateId, candidate]));
  const seen = new Set<string>();
  const judgments = model.judgments.map((judgment) => {
    const candidate = candidates.get(judgment.candidateId);
    if (!candidate || seen.has(judgment.candidateId)) {
      throw new Error("The owl invented or duplicated a candidate identity.");
    }
    seen.add(judgment.candidateId);
    const sourceIds = new Set(candidate.sourceUnits.map((unit) => unit.segmentId));
    const evidenceSegmentIds = uniqueStrings(judgment.evidenceSegmentIds, 7, 300);
    if (!evidenceSegmentIds.length || evidenceSegmentIds.some((id) => !sourceIds.has(id))) {
      throw new Error(`The owl cited evidence outside ${judgment.candidateId}.`);
    }
    const evidenceExcerpt = cleanText(judgment.evidenceExcerpt, 1800);
    if (!evidenceExcerpt || !candidateSourceText(candidate).includes(evidenceExcerpt)) {
      throw new Error(`The owl's evidence excerpt for ${judgment.candidateId} is not exact source text.`);
    }
    const automaticTranslation = shouldTranslateAutomatically(run, judgment.disposition);
    const workingTranslation = automaticTranslation
      ? cleanText(judgment.workingTranslation, 8000)
      : "";
    if (automaticTranslation && !workingTranslation) {
      throw new Error(`The owl omitted the required working translation for ${judgment.candidateId}.`);
    }
    return {
      ...judgment,
      priority: Math.max(1, Math.min(100, Math.round(judgment.priority))),
      relationshipSummary: cleanText(judgment.relationshipSummary, 1200),
      reasoning: cleanText(judgment.reasoning, 2400),
      evidenceSegmentIds,
      evidenceExcerpt,
      contextRequest: cleanText(judgment.contextRequest, 800),
      englishOrientation: cleanText(judgment.englishOrientation, 1200),
      workingTranslation,
      translationNotes: automaticTranslation
        ? uniqueStrings(judgment.translationNotes, 12, 600)
        : [],
      warnings: uniqueStrings(judgment.warnings, 12, 600),
      translationStatus: automaticTranslation
        ? "machine_generated" as const
        : run.translationPreference === "off"
          ? "disabled" as const
          : "available_on_demand" as const,
    };
  });
  if (seen.size !== candidates.size) {
    throw new Error("The owl omitted one or more supplied candidates.");
  }
  const retrievalRanks = new Map(run.candidates.map((candidate) => [candidate.candidateId, candidate.retrievalRank]));
  judgments.sort((left, right) =>
    dispositionOrder[left.disposition] - dispositionOrder[right.disposition] ||
    right.priority - left.priority ||
    (retrievalRanks.get(left.candidateId) ?? 999) - (retrievalRanks.get(right.candidateId) ?? 999)
  );
  return {
    contractVersion: "owl-adjudication-v1",
    runId: run.runId,
    createdAt: new Date().toISOString(),
    model: receipt.model,
    responseId: receipt.responseId,
    judgments,
  };
}

export function candidateForJudgment(run: RetrievalRun, judgment: OwlJudgment) {
  return run.candidates.find((candidate) => candidate.candidateId === judgment.candidateId) ?? null;
}

export function translationForCandidate(record: OwlRunRecord, judgment: OwlJudgment) {
  if (judgment.workingTranslation) {
    return {
      workingTranslation: judgment.workingTranslation,
      translationNotes: judgment.translationNotes,
      source: "owl" as const,
    };
  }
  const addendum = [...record.translationAddenda]
    .reverse()
    .find((item) => item.candidateId === judgment.candidateId);
  return addendum
    ? {
        workingTranslation: addendum.workingTranslation,
        translationNotes: addendum.translationNotes,
        source: "addendum" as const,
      }
    : null;
}

const stringArray = {
  type: "array",
  minItems: 0,
  maxItems: 12,
  items: { type: "string" },
} as const;

export const owlAdjudicationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["runId", "judgments"],
  properties: {
    runId: { type: "string" },
    judgments: {
      type: "array",
      minItems: 1,
      maxItems: MAX_CANDIDATE_UNITS,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "candidateId",
          "disposition",
          "priority",
          "confidence",
          "relationshipSummary",
          "reasoning",
          "evidenceSegmentIds",
          "evidenceExcerpt",
          "contextNeeded",
          "contextRequest",
          "englishOrientation",
          "workingTranslation",
          "translationNotes",
          "warnings",
        ],
        properties: {
          candidateId: { type: "string" },
          disposition: { type: "string", enum: owlDispositions },
          priority: { type: "integer", minimum: 1, maximum: 100 },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          relationshipSummary: { type: "string" },
          reasoning: { type: "string" },
          evidenceSegmentIds: {
            type: "array",
            minItems: 1,
            maxItems: 7,
            items: { type: "string" },
          },
          evidenceExcerpt: { type: "string" },
          contextNeeded: { type: "boolean" },
          contextRequest: { type: "string" },
          englishOrientation: { type: "string" },
          workingTranslation: { type: "string" },
          translationNotes: stringArray,
          warnings: stringArray,
        },
      },
    },
  },
} as const;

export const workingTranslationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["candidateId", "workingTranslation", "translationNotes"],
  properties: {
    candidateId: { type: "string" },
    workingTranslation: { type: "string" },
    translationNotes: stringArray,
  },
} as const;

export function owlInputPacket(run: RetrievalRun) {
  return {
    runId: run.runId,
    question: run.question,
    translationPreference: run.translationPreference,
    foxInquiry: run.inquirySnapshot,
    approvedLanguageFolios: run.languagePlanSnapshot,
    compiledRetrievalPlan: run.compiledPlan,
    corpusReceipt: run.corpusReceipt,
    candidates: run.candidates.map((candidate) => ({
      candidateId: candidate.candidateId,
      author: candidate.author,
      workTitle: candidate.workTitle,
      citationLabel: candidate.citationLabel,
      languageCode: candidate.languageCode,
      languageLabel: candidate.languageLabel,
      sourceUnits: candidate.sourceUnits,
      matchAttributions: candidate.matchAttributions,
      exclusionSignals: candidate.exclusionSignals,
      relationshipIds: candidate.relationshipIds,
      retrievalRank: candidate.retrievalRank,
    })),
  };
}

export function workingTranslationInput(candidate: CandidateReadingUnit) {
  return {
    candidateId: candidate.candidateId,
    languageCode: candidate.languageCode,
    languageLabel: candidate.languageLabel,
    author: candidate.author,
    workTitle: candidate.workTitle,
    citationLabel: candidate.citationLabel,
    sourceUnits: candidate.sourceUnits,
  };
}
