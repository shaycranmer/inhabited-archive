import type { ShelfPreview } from "./adaptation-plan";

export const shelfPreviewCorpus = {
  corpusId: "perseus-latin-demo-v1",
  corpusLabel: "Thirty-work Perseus Latin shelf",
} as const;

const MAX_QUERY_FORMS = 16;
const MAX_WORDS_PER_FORM = 8;
const MAX_ORTHOGRAPHIC_VARIANTS = 64;
const MAX_FTS_QUERY_LENGTH = 8000;
const WORD_PATTERN = /[\p{L}\p{N}_]+/gu;

export type ShelfPreviewRequest = {
  proposalId: string;
  corpusId: typeof shelfPreviewCorpus.corpusId;
  queryForms: string[];
  queryMode: "any" | "all";
};

export type ShelfPreviewResponse = ShelfPreview & {
  basketMatches: Array<{
    basket: string;
    segmentMatches: number;
    documentMatches: number;
  }>;
  orthographicMatching: string;
  shelfReceipt: {
    sourceCommit: string;
    contentSha256: string;
  };
};

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function parseShelfPreviewRequest(value: unknown): ShelfPreviewRequest | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const proposalId = cleanString(candidate.proposalId, 300);
  const corpusId = cleanString(candidate.corpusId, 100);
  const queryMode = candidate.queryMode === "all" ? "all" : "any";
  if (
    !proposalId ||
    corpusId !== shelfPreviewCorpus.corpusId ||
    !Array.isArray(candidate.queryForms) ||
    candidate.queryForms.length < 1 ||
    candidate.queryForms.length > MAX_QUERY_FORMS
  ) {
    return null;
  }

  const seen = new Set<string>();
  const queryForms = candidate.queryForms.flatMap((value) => {
    const form = cleanString(value, 160);
    const key = form.toLocaleLowerCase("en");
    if (!form || seen.has(key)) return [];
    seen.add(key);
    return [form];
  });
  if (!queryForms.length) return null;
  return { proposalId, corpusId: shelfPreviewCorpus.corpusId, queryForms, queryMode };
}

export function latinOrthographicVariants(word: string) {
  let variants = new Set([""]);
  for (const character of word.toLocaleLowerCase("la")) {
    const choices = character === "u" || character === "v"
      ? ["u", "v"]
      : character === "i" || character === "j"
        ? ["i", "j"]
        : [character];
    if (variants.size * choices.length > MAX_ORTHOGRAPHIC_VARIANTS) {
      throw new Error("A proposed form expands into too many u/v or i/j variants.");
    }
    variants = new Set(
      [...variants].flatMap((prefix) => choices.map((choice) => `${prefix}${choice}`)),
    );
  }
  const ordinary = word.toLocaleLowerCase("la");
  return [...variants].sort((left, right) =>
    Number(left !== ordinary) - Number(right !== ordinary) || left.localeCompare(right)
  );
}

function quotedVariant(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function queryGroup(form: string) {
  const words = form.match(WORD_PATTERN) ?? [];
  if (!words.length || words.length > MAX_WORDS_PER_FORM) {
    throw new Error("A proposed form must contain between one and eight searchable words.");
  }
  const wordGroups = words.map((word) => {
    const variants = latinOrthographicVariants(word).map(quotedVariant);
    return variants.length === 1 ? variants[0] : `(${variants.join(" OR ")})`;
  });
  return wordGroups.length === 1 ? wordGroups[0] : `(${wordGroups.join(" AND ")})`;
}

export function literalShelfQuery(queryForms: string[], queryMode: "any" | "all") {
  const operator = queryMode === "all" ? " AND " : " OR ";
  const query = queryForms.map(queryGroup).join(operator);
  if (query.length > MAX_FTS_QUERY_LENGTH) {
    throw new Error("The proposed forms make a catalogue query that is too large to inspect safely.");
  }
  return query;
}
