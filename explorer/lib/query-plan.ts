import type { CandidateLabel, Passage } from "./passages";

export type Concept = { term: string; rationale: string };
export type LibrarianPlan = {
  language: string;
  shelf: string;
  terms: string[];
  note: string;
};
export type PassageJudgment = {
  id: string;
  label: CandidateLabel;
  confidence: number;
  rationale: string;
  evidence: string;
};
export type QueryPlan = {
  framing: string;
  concepts: Concept[];
  exclusions: string[];
  librarians: LibrarianPlan[];
  judgments: PassageJudgment[];
};

export type ExplorerResponse = QueryPlan & {
  question: string;
  mode: "live" | "demo";
  model: string;
  responseId: string | null;
  notice: string;
  passages: Passage[];
};

export function demoPlan(passages: Passage[]): QueryPlan {
  return {
    framing:
      "Find passages where six is interpreted as perfection, balance, or sacred order—not passages where six only counts objects.",
    concepts: [
      { term: "perfection", rationale: "The central qualitative claim" },
      { term: "equality", rationale: "Six equals the sum of its proper parts" },
      { term: "parts", rationale: "Half, third, and sixth form the arithmetic test" },
      { term: "creation", rationale: "Christian writers connect six to the created order" },
    ],
    exclusions: [
      "incidental quantities",
      "dates and chapter numbers",
      "lists with six members but no interpretation",
    ],
    librarians: [
      {
        language: "Ancient Greek",
        shelf: "Greek arithmetic",
        terms: ["τέλειος", "ἰσότης", "μέρος", "ἑξάς / Ϛ"],
        note: "Search inflected forms and numeral signs, not only the modern digit 6.",
      },
      {
        language: "Latin",
        shelf: "Latin Christianity",
        terms: ["senarius", "perfectus", "partes", "sex diebus"],
        note: "Track both the number-name senarius and the cardinal sex near interpretive language.",
      },
    ],
    judgments: passages.map((passage) => ({
      id: passage.id,
      label: passage.expectedLabel,
      confidence: passage.expectedLabel === "incidental_quantity" ? 0.99 : 0.96,
      rationale:
        passage.expectedLabel === "incidental_quantity"
          ? "Six only reports how many donkeys Marcus has; the sentence gives the number no qualitative meaning."
          : passage.id.startsWith("nicomachus")
            ? "Nicomachus defines a perfect number through equality with its parts and names six as the first example."
            : "Augustine connects the six days of creation to the arithmetic perfection of six.",
      evidence:
        passage.expectedLabel === "incidental_quantity"
          ? "sex asinos"
          : passage.id.startsWith("nicomachus")
            ? "τέλειος ἐν ἰσότητι … ὁ Ϛ"
            : "senarii numeri perfectionem … sex diebus",
    })),
  };
}
