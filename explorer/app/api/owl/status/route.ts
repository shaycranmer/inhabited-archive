import { NextResponse } from "next/server";
import { owlAdjudicationPromptVersion } from "../../../../lib/owl-guidance";
import { isRetrievalRun } from "../../../../lib/retrieval-run";
import { getArchiveDb } from "../../../../lib/server/archive-db";
import { cleanResponseId } from "../../../../lib/server/background-response";
import { protectAiRequest } from "../../../../lib/server/openai-route";
import { reconcileOwlBackgroundResponse } from "../../../../lib/server/owl-request";
import { verifyRetrievalRunAgainstShelf } from "../../../../lib/server/retrieval-executor";

export const runtime = "edge";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6";

type RequestBody = { run?: unknown; responseId?: unknown };

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
    return NextResponse.json({ error: "The owl status request was unreadable." }, { status: 400 });
  }
  const responseId = cleanResponseId(body.responseId);
  if (!responseId || !isRetrievalRun(body.run) || !body.run.candidates.length) {
    return NextResponse.json(
      { error: "The owl job receipt or its retrieval run is missing." },
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
    const apiResponse = await fetch(
      `https://api.openai.com/v1/responses/${encodeURIComponent(responseId)}`,
      { method: "GET", headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: `The owl status check returned ${apiResponse.status}. The retrieval run remains unchanged.` },
        { status: 502 },
      );
    }
    const raw = (await apiResponse.json()) as Record<string, unknown>;
    const result = reconcileOwlBackgroundResponse(raw, responseId, run, MODEL);
    if (result.kind === "pending") {
      return NextResponse.json({
        runId: run.runId,
        mode: "live",
        model: MODEL,
        responseId: result.responseId,
        promptVersion: owlAdjudicationPromptVersion,
        status: result.status,
        notice:
          "The owl is still comparing the passages to the approved inquiry. The reading desk is checking its receipt without changing the retrieval run.",
      }, { status: 202 });
    }
    if (result.kind === "ready") {
      return NextResponse.json({
        runId: run.runId,
        mode: "live",
        model: MODEL,
        responseId: result.responseId,
        promptVersion: owlAdjudicationPromptVersion,
        notice:
          "The owl returned a source-grounded reading order. Machine working translations appear only where this run's translation preference permits them.",
        adjudication: result.adjudication,
      });
    }
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
          : "The owl could not finish a trustworthy adjudication.",
      },
      { status: 502 },
    );
  }
}
