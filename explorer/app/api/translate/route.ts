import { NextResponse } from "next/server";
import {
  workingTranslationInput,
  workingTranslationSchema,
  type TranslationAddendum,
} from "../../../lib/owl-adjudication";
import {
  workingTranslationGuidance,
  workingTranslationPromptVersion,
} from "../../../lib/owl-guidance";
import { isRetrievalRun } from "../../../lib/retrieval-run";
import { getArchiveDb } from "../../../lib/server/archive-db";
import {
  TRANSLATION_MAX_OUTPUT_TOKENS,
  extractModelContent,
  protectAiRequest,
} from "../../../lib/server/openai-route";
import { verifyRetrievalRunAgainstShelf } from "../../../lib/server/retrieval-executor";

export const runtime = "edge";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6";

type RequestBody = { run?: unknown; candidateId?: unknown };
type ModelTranslation = {
  candidateId: string;
  workingTranslation: string;
  translationNotes: string[];
};

export async function POST(request: Request) {
  const protection = protectAiRequest(request);
  if (!protection.allowed) {
    return NextResponse.json(
      { error: protection.error, code: protection.code },
      { status: protection.status },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "The translation request was unreadable." }, { status: 400 });
  }
  const candidateId = typeof body.candidateId === "string" ? body.candidateId : "";
  if (!isRetrievalRun(body.run) || body.run.translationPreference === "off") {
    return NextResponse.json(
      { error: "Working translation is disabled or the retrieval receipt is missing." },
      { status: 409 },
    );
  }
  const run = body.run;
  const candidate = run.candidates.find((item) => item.candidateId === candidateId);
  if (!candidate) {
    return NextResponse.json({ error: "Choose one candidate from this retrieval run." }, { status: 400 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Working translation needs a server-side OpenAI API key.", code: "api_key_required" },
      { status: 503 },
    );
  }

  try {
    await verifyRetrievalRunAgainstShelf(await getArchiveDb(), run);
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        store: false,
        instructions: workingTranslationGuidance,
        input: `Translate this candidate exactly as supplied.\n\n${JSON.stringify(workingTranslationInput(candidate))}`,
        max_output_tokens: TRANSLATION_MAX_OUTPUT_TOKENS,
        text: {
          format: {
            type: "json_schema",
            name: "working_translation",
            strict: true,
            schema: workingTranslationSchema,
          },
        },
      }),
    });
    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: `The translation route returned ${apiResponse.status}. No run data changed.` },
        { status: 502 },
      );
    }
    const raw = (await apiResponse.json()) as Record<string, unknown>;
    const content = extractModelContent(raw);
    if (content.refusal) return NextResponse.json({ error: content.refusal }, { status: 422 });
    if (!content.text) throw new Error("The translation route returned no readable text.");
    const model = JSON.parse(content.text) as ModelTranslation;
    if (model.candidateId !== candidateId || !model.workingTranslation?.trim()) {
      throw new Error("The translation response did not preserve its candidate identity.");
    }
    const addendum: TranslationAddendum = {
      contractVersion: "working-translation-addendum-v1",
      addendumId: `translation_${crypto.randomUUID()}`,
      runId: run.runId,
      candidateId,
      createdAt: new Date().toISOString(),
      model: MODEL,
      responseId: typeof raw.id === "string" ? raw.id : null,
      workingTranslation: model.workingTranslation.trim().slice(0, 8000),
      translationNotes: Array.isArray(model.translationNotes)
        ? model.translationNotes.map((note) => note.trim().slice(0, 600)).filter(Boolean).slice(0, 12)
        : [],
    };
    return NextResponse.json({
      addendum,
      promptVersion: workingTranslationPromptVersion,
      notice:
        "A machine-generated working translation was attached as a new addendum. The original owl judgment and retrieval run remain unchanged.",
    });
  } catch (caught) {
    return NextResponse.json(
      {
        error: caught instanceof Error
          ? caught.message
          : "The working translation could not be produced safely.",
      },
      { status: 502 },
    );
  }
}
