import { NextResponse } from "next/server";
import { latinAdaptationPacketVersion } from "../../../../lib/latin-adaptation-guidance";
import {
  isBadgerWorkspace,
  reconcileBadgerBackgroundResponse,
} from "../../../../lib/server/badger-request";
import { cleanResponseId } from "../../../../lib/server/background-response";
import {
  cleanQuestion,
  protectAiRequest,
} from "../../../../lib/server/openai-route";

export const runtime = "edge";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6";

type RequestBody = {
  approved?: unknown;
  question?: unknown;
  responseId?: unknown;
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
  const responseId = cleanResponseId(body.responseId);
  if (!question || !responseId || !isBadgerWorkspace(body.workspace)) {
    return NextResponse.json(
      { error: "The badger job receipt or its approved fox table is missing." },
      { status: 400 },
    );
  }
  if (body.approved !== true) {
    return NextResponse.json(
      { error: "The fox table must remain approved while the badger finishes its folios." },
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
  try {
    const apiResponse = await fetch(
      `https://api.openai.com/v1/responses/${encodeURIComponent(responseId)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );
    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: `The language specialist status check returned ${apiResponse.status}. The approved fox table is unchanged.` },
        { status: 502 },
      );
    }

    const raw = (await apiResponse.json()) as Record<string, unknown>;
    const result = reconcileBadgerBackgroundResponse(raw, responseId, workspace);
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
            "The badger is still working. The language desk is checking its receipt without changing the approved table.",
        },
        { status: 202 },
      );
    }
    if (result.kind === "invalid") {
      return NextResponse.json({ error: "The badger job receipt became unreadable." }, { status: 502 });
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
        "The badger proposed an inspectable adaptation for the installed language and shelf. Nothing in it is approved, corpus-attested, or independently dictionary-verified yet, and no corpus search has run.",
      plan: result.plan,
    });
  } catch {
    return NextResponse.json(
      { error: "The language specialist could not finish a trustworthy folio. The approved fox table is unchanged." },
      { status: 502 },
    );
  }
}
