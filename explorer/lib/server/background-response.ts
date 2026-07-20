export type BackgroundResponseState =
  | { kind: "pending"; responseId: string; status: "queued" | "in_progress" }
  | { kind: "completed"; responseId: string }
  | { kind: "terminal"; responseId: string; status: string }
  | { kind: "invalid"; responseId: string; status: string };

export function cleanResponseId(value: unknown) {
  if (typeof value !== "string" || !/^resp_[A-Za-z0-9_-]+$/.test(value)) return "";
  return value;
}

export function classifyBackgroundResponse(
  raw: Record<string, unknown>,
  fallbackResponseId = "",
): BackgroundResponseState {
  const responseId = cleanResponseId(raw.id) || cleanResponseId(fallbackResponseId);
  const status = typeof raw.status === "string" ? raw.status : "";
  if (!responseId) return { kind: "invalid", responseId: "", status };
  if (status === "queued" || status === "in_progress") {
    return { kind: "pending", responseId, status };
  }
  if (!status || status === "completed") return { kind: "completed", responseId };
  return { kind: "terminal", responseId, status };
}
