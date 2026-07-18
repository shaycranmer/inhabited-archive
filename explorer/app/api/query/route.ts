import { NextResponse } from "next/server";
import { passages } from "../../../lib/passages";
import { demoPlan, type QueryPlan } from "../../../lib/query-plan";

export const runtime = "edge";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-sol";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["framing", "concepts", "exclusions", "librarians", "judgments"],
  properties: {
    framing: { type: "string" },
    concepts: {
      type: "array",
      minItems: 3,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["term", "rationale"],
        properties: {
          term: { type: "string" },
          rationale: { type: "string" },
        },
      },
    },
    exclusions: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: { type: "string" },
    },
    librarians: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["language", "shelf", "terms", "note"],
        properties: {
          language: { type: "string", enum: ["Ancient Greek", "Latin"] },
          shelf: { type: "string" },
          terms: {
            type: "array",
            minItems: 3,
            maxItems: 7,
            items: { type: "string" },
          },
          note: { type: "string" },
        },
      },
    },
    judgments: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "confidence", "rationale", "evidence"],
        properties: {
          id: { type: "string", enum: passages.map((passage) => passage.id) },
          label: {
            type: "string",
            enum: ["strong_match", "contextual_match", "incidental_quantity"],
          },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          rationale: { type: "string" },
          evidence: { type: "string" },
        },
      },
    },
  },
} as const;

function extractOutputText(response: Record<string, unknown>): string | null {
  const output = response.output;
  if (!Array.isArray(output)) return null;
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        (part as { type?: unknown }).type === "output_text" &&
        typeof (part as { text?: unknown }).text === "string"
      ) {
        return (part as { text: string }).text;
      }
    }
  }
  return null;
}

function fallback(question: string, notice: string) {
  return NextResponse.json({
    question,
    mode: "demo",
    model: MODEL,
    responseId: null,
    notice,
    ...demoPlan(passages),
    passages,
  });
}

export async function POST(request: Request) {
  let question = "Why did ancient writers think six was perfect?";
  try {
    const body = (await request.json()) as { question?: unknown };
    if (typeof body.question === "string" && body.question.trim()) {
      question = body.question.trim().slice(0, 600);
    }
  } catch {
    return fallback(question, "The request was unreadable, so the documented demo plan is shown.");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallback(
      question,
      "Demo mode is active. Add OPENAI_API_KEY to let GPT-5.6 build and judge this query live.",
    );
  }

  const candidatePacket = passages.map(
    ({ id, author, work, locus, languageLabel, original, translation }) => ({
      id,
      author,
      work,
      locus,
      language: languageLabel,
      original,
      translation,
    }),
  );

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        store: false,
        instructions:
          "You are the head librarian for a multilingual historical corpus. Translate the research concept, not merely its English words. Build an inspectable Greek and Latin query plan using morphology, lemmas, number-names, numeral signs, historical idiom, and domain knowledge. Then judge only the supplied candidates. A strong match assigns sustained qualitative meaning to a number. An incidental quantity merely counts. Never invent a source, quotation, or candidate ID. Keep rationales concise and suitable for scholarly review.",
        input: `Research question: ${question}\n\nSupplied candidate packet:\n${JSON.stringify(candidatePacket)}`,
        text: {
          format: {
            type: "json_schema",
            name: "number_rants_query_plan",
            strict: true,
            schema,
          },
        },
      }),
    });

    if (!apiResponse.ok) {
      return fallback(
        question,
        `The live librarian returned ${apiResponse.status}; the documented demo plan is shown instead.`,
      );
    }

    const raw = (await apiResponse.json()) as Record<string, unknown>;
    const outputText = extractOutputText(raw);
    if (!outputText) {
      return fallback(question, "The live librarian returned no readable plan; demo mode is shown.");
    }

    const plan = JSON.parse(outputText) as QueryPlan;
    return NextResponse.json({
      question,
      mode: "live",
      model: MODEL,
      responseId: typeof raw.id === "string" ? raw.id : null,
      notice:
        "GPT-5.6 adapted the query and judged a fixed, provenance-locked candidate set. You still decide what counts.",
      ...plan,
      passages,
    });
  } catch {
    return fallback(
      question,
      "The live librarian could not be reached; the documented demo plan is shown instead.",
    );
  }
}
