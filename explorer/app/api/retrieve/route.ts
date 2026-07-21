import { NextResponse } from "next/server";
import type { BadgerAdaptationPlan } from "../../../lib/adaptation-plan";
import {
  cleanTranslationPreference,
  isApprovedBadgerPlan,
} from "../../../lib/retrieval-run";
import { getArchiveDb } from "../../../lib/server/archive-db";
import { isBadgerWorkspace } from "../../../lib/server/badger-request";
import { cleanQuestion, protectSameOriginRequest } from "../../../lib/server/openai-route";
import { executeApprovedRetrieval } from "../../../lib/server/retrieval-executor";

export const runtime = "edge";

type RequestBody = {
  approved?: unknown;
  question?: unknown;
  workspace?: unknown;
  plan?: unknown;
  translationPreference?: unknown;
  parentRunId?: unknown;
};

export async function POST(request: Request) {
  const protection = protectSameOriginRequest(request);
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
    return NextResponse.json({ error: "The retrieval request was unreadable." }, { status: 400 });
  }

  const question = cleanQuestion(body.question);
  if (!question || !isBadgerWorkspace(body.workspace)) {
    return NextResponse.json(
      { error: "Retrieval needs the research question and its approved fox table." },
      { status: 400 },
    );
  }
  if (body.approved !== true || !isApprovedBadgerPlan(body.plan, body.workspace)) {
    return NextResponse.json(
      { error: "Approve every current language folio before searching the shelf." },
      { status: 409 },
    );
  }

  try {
    const run = await executeApprovedRetrieval({
      db: await getArchiveDb(),
      question,
      workspace: body.workspace,
      plan: body.plan as BadgerAdaptationPlan,
      translationPreference: cleanTranslationPreference(body.translationPreference),
      parentRunId: body.parentRunId,
    });
    return NextResponse.json({
      run,
      notice: run.candidates.length
        ? `The approved plan found ${run.stats.rawMatchCount.toLocaleString()} literal passage matches and gathered them into ${run.stats.returnedCandidateCount.toLocaleString()} bounded reading candidates for the owl.`
        : "The approved literal plan returned no candidates on this selective shelf. No owl call was started, and this zero-result run remains preserved.",
    });
  } catch (caught) {
    return NextResponse.json(
      {
        error: caught instanceof Error
          ? caught.message
          : "The archive could not execute the approved plan safely.",
      },
      { status: 502 },
    );
  }
}
