import {
  reconcileOwlAdjudication,
  type ModelOwlAdjudication,
  type OwlAdjudication,
} from "../owl-adjudication";
import type { RetrievalRun } from "../retrieval-run";
import { classifyBackgroundResponse } from "./background-response";
import { extractModelContent } from "./openai-route";

export type OwlBackgroundResult =
  | { kind: "pending"; responseId: string; status: "queued" | "in_progress" }
  | { kind: "terminal"; responseId: string; status: string }
  | { kind: "invalid"; responseId: string; status: string }
  | { kind: "refusal"; responseId: string; message: string }
  | { kind: "empty"; responseId: string }
  | { kind: "ready"; responseId: string; adjudication: OwlAdjudication };

export function reconcileOwlBackgroundResponse(
  raw: Record<string, unknown>,
  fallbackResponseId: string,
  run: RetrievalRun,
  model: string,
): OwlBackgroundResult {
  const state = classifyBackgroundResponse(raw, fallbackResponseId);
  if (state.kind !== "completed") return state;
  const content = extractModelContent(raw);
  if (content.refusal) {
    return { kind: "refusal", responseId: state.responseId, message: content.refusal };
  }
  if (!content.text) return { kind: "empty", responseId: state.responseId };
  const modelOutput = JSON.parse(content.text) as ModelOwlAdjudication;
  return {
    kind: "ready",
    responseId: state.responseId,
    adjudication: reconcileOwlAdjudication(modelOutput, run, {
      model,
      responseId: state.responseId,
    }),
  };
}
