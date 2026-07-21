import { NextResponse } from "next/server";
import {
  owlAdjudicationSchema,
  owlInputPacket,
} from "../../../lib/owl-adjudication";
import {
  owlAdjudicationGuidance,
  owlAdjudicationPromptVersion,
} from "../../../lib/owl-guidance";
import { isRetrievalRun, type RetrievalRun } from "../../../lib/retrieval-run";
import { getArchiveDb } from "../../../lib/server/archive-db";
import { OWL_MAX_OUTPUT_TOKENS, protectAiRequest } from "../../../lib/server/openai-route";
import { reconcileOwlBackgroundResponse } from "../../../lib/server/owl-request";
import { verifyRetrievalRunAgainstShelf } from "../../../lib/server/retrieval-executor";

export const runtime = "edge";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6";

type RequestBody = { run?: unknown };

function readyResponse(run: RetrievalRun, result: ReturnType<typeof reconcileOwlBackgroundResponse>) {
  if (result.kind !== "ready") return null;
  return {
    runId: run.runId,
    mode: "live" as const,
    model: MODEL,
    responseId: result.responseId,
    promptVersion: owlAdjudicationPromptVersion,
    notice:
      "The owl returned a source-grounded reading order. Machine working translations appear only where this run's translation preference permits them.",
    adjudication: result.adjudication,
  };
}

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
    return NextResponse.json({ error: "The owl request was unreadable." }, { status: 400 });
  }
  if (!isRetrievalRun(body.run) || !body.run.candidates.length) {
    return NextResponse.json(
      { error: "The owl needs one complete, nonempty retrieval run." },
      { status: 400 },
    );
  }
  const run = body.run;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Live owl adjudication needs a server-side OpenAI API key.", code: "api_key_required" },
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
        background: true,
        instructions: owlAdjudicationGuidance,
        input: `Adjudicate this complete, versioned retrieval packet. Preserve its run and candidate identities exactly.\n\n${JSON.stringify(owlInputPacket(run))}`,
        max_output_tokens: OWL_MAX_OUTPUT_TOKENS,
        text: {
          format: {
            type: "json_schema",
            name: "owl_adjudication",
            strict: true,
            schema: owlAdjudicationSchema,
          },
        },
      }),
    });
    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: `The owl returned ${apiResponse.status}. The retrieval run remains unchanged.` },
        { status: 502 },
      );
    }
    const raw = (await apiResponse.json()) as Record<string, unknown>;
    const result = reconcileOwlBackgroundResponse(raw, "", run, MODEL);
    if (result.kind === "pending") {
      return NextResponse.json({
        runId: run.runId,
        mode: "live",
        model: MODEL,
        responseId: result.responseId,
        promptVersion: owlAdjudicationPromptVersion,
        status: result.status,
        notice:
          "The owl is comparing the retrieved passages to the complete approved inquiry. The source packet and its hashes remain fixed while the reading desk checks back.",
      }, { status: 202 });
    }
    const ready = readyResponse(run, result);
    if (ready) return NextResponse.json(ready);
    if (result.kind === "refusal") return NextResponse.json({ error: result.message }, { status: 422 });
    const status = result.kind === "terminal" ? result.status : result.kind;
    return NextResponse.json(
      { error: `The owl stopped with status “${status}”. The retrieval run remains unchanged.` },
      { status: 502 },
    );
  } catch (caught) {
    return NextResponse.json(
      {
        error: caught instanceof Error
          ? caught.message
          : "The owl could not begin a trustworthy adjudication.",
      },
      { status: 502 },
    );
  }
}
