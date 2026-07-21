import { NextResponse } from "next/server";
import { badgerAdaptationPlanSchema, installedDemoCorpus } from "../../../lib/adaptation-plan";
import {
  latinAdaptationGuidance,
  latinAdaptationPacketVersion,
} from "../../../lib/latin-adaptation-guidance";
import {
  approvedBadgerMap,
  isBadgerWorkspace,
  reconcileBadgerBackgroundResponse,
} from "../../../lib/server/badger-request";
import {
  ADAPT_MAX_OUTPUT_TOKENS,
  cleanQuestion,
  protectAiRequest,
} from "../../../lib/server/openai-route";

export const runtime = "edge";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6";

type RequestBody = {
  approved?: unknown;
  question?: unknown;
  workspace?: unknown;
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
    return NextResponse.json({ error: "The request was unreadable." }, { status: 400 });
  }

  const question = cleanQuestion(body.question);
  if (!question || !isBadgerWorkspace(body.workspace)) {
    return NextResponse.json(
      { error: "The badger needs the research question and its current fox table." },
      { status: 400 },
    );
  }
  if (body.approved !== true) {
    return NextResponse.json(
      { error: "Approve the fox table before asking a language specialist to adapt it." },
      { status: 409 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Live language adaptation needs a server-side OpenAI API key.", code: "api_key_required" },
      { status: 503 },
    );
  }

  const workspace = body.workspace;
  const unresolvedBoundaries = [...workspace.scopeChoices, ...workspace.exclusions].filter(
    (card) => card.catalogueConstraint.status === "needs_clarification",
  );
  if (unresolvedBoundaries.length) {
    return NextResponse.json(
      {
        error: `Ask the fox to sharpen ${unresolvedBoundaries.map((card) => `“${card.label}”`).join(", ")} into an exact catalogue boundary before the language handoff.`,
      },
      { status: 409 },
    );
  }
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
        background: true,
        instructions: latinAdaptationGuidance,
        input: `Adapt this scholar-approved English concept map for the declared installed language and demonstration shelf. Return exactly one folio per concept family and preserve every supplied source ID exactly.\n\nOriginal research question:\n${question}\n\nDeclared language and corpus:\n${JSON.stringify(installedDemoCorpus)}\n\nApproved map:\n${JSON.stringify(approvedBadgerMap(workspace))}`,
        max_output_tokens: ADAPT_MAX_OUTPUT_TOKENS,
        text: {
          format: {
            type: "json_schema",
            name: "language_badger_adaptation_plan",
            strict: true,
            schema: badgerAdaptationPlanSchema,
          },
        },
      }),
    });

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: `The language specialist returned ${apiResponse.status}. The approved fox table is unchanged.` },
        { status: 502 },
      );
    }

    const raw = (await apiResponse.json()) as Record<string, unknown>;
    const result = reconcileBadgerBackgroundResponse(raw, "", workspace);
    if (result.kind === "pending") {
      return NextResponse.json(
        {
          question,
          mode: "live",
          model: MODEL,
          responseId: result.responseId,
          packetVersion: latinAdaptationPacketVersion,
          status: result.status,
          notice:
            "The badger is working in the background. The approved table is fixed while the language desk checks back for the folios.",
        },
        { status: 202 },
      );
    }
    if (result.kind === "invalid") {
      return NextResponse.json(
        { error: "The language specialist started work but returned no usable job receipt." },
        { status: 502 },
      );
    }
    if (result.kind === "terminal") {
      return NextResponse.json(
        { error: `The language specialist stopped with status “${result.status}”. The approved fox table is unchanged.` },
        { status: 502 },
      );
    }
    if (result.kind === "refusal") {
      return NextResponse.json({ error: result.message }, { status: 422 });
    }
    if (result.kind === "empty") {
      return NextResponse.json(
        { error: "The language specialist returned no readable folio. The approved fox table is unchanged." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      question,
      mode: "live",
      model: MODEL,
      responseId: result.responseId,
      packetVersion: latinAdaptationPacketVersion,
      notice:
        `The badger proposed an inspectable ${installedDemoCorpus.languageLabel} adaptation for the installed shelf. Nothing in it is approved, corpus-attested, or independently dictionary-verified yet, and no corpus search has run.`,
      plan: result.plan,
    });
  } catch {
    return NextResponse.json(
      { error: "The language specialist could not produce a trustworthy folio. The approved fox table is unchanged." },
      { status: 502 },
    );
  }
}
