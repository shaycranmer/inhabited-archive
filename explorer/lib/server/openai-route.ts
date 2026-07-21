export const QUERY_MAX_OUTPUT_TOKENS = 8000;
export const ADAPT_MAX_OUTPUT_TOKENS = 16000;
export const OWL_MAX_OUTPUT_TOKENS = 16000;
export const TRANSLATION_MAX_OUTPUT_TOKENS = 4000;

type ProtectionOptions = {
  production?: boolean;
  rateLimitConfigured?: boolean;
};

export type AiRequestProtection =
  | { allowed: true }
  | { allowed: false; status: 403 | 503; code: string; error: string };

export type SameOriginProtection =
  | { allowed: true }
  | { allowed: false; status: 403; code: string; error: string };

export function protectSameOriginRequest(request: Request): SameOriginProtection {
  const origin = request.headers.get("origin");
  let requestOrigin = "";
  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    return {
      allowed: false,
      status: 403,
      code: "origin_rejected",
      error: "This request did not come from the Explorer.",
    };
  }

  if (!origin || origin !== requestOrigin) {
    return {
      allowed: false,
      status: 403,
      code: "origin_rejected",
      error: "This request did not come from the Explorer.",
    };
  }

  return { allowed: true };
}

/**
 * Browser AI calls must be same-origin. Production also fails closed until an
 * account-side Cloudflare rate limit or equivalent protection is installed
 * and explicitly acknowledged in the runtime environment.
 */
export function protectAiRequest(
  request: Request,
  options: ProtectionOptions = {},
): AiRequestProtection {
  const sameOrigin = protectSameOriginRequest(request);
  if (!sameOrigin.allowed) return sameOrigin;

  const production = options.production ?? process.env.NODE_ENV === "production";
  const rateLimitConfigured = options.rateLimitConfigured ??
    process.env.AI_RATE_LIMIT_CONFIGURED === "true";

  if (production && !rateLimitConfigured) {
    return {
      allowed: false,
      status: 503,
      code: "public_ai_protection_required",
      error:
        "Live AI is disabled on this public deployment until its Cloudflare request limit is configured.",
    };
  }

  return { allowed: true };
}

export function extractModelContent(response: Record<string, unknown>) {
  const output = response.output;
  if (!Array.isArray(output)) return { text: null, refusal: null };

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      if (
        (part as { type?: unknown }).type === "output_text" &&
        typeof (part as { text?: unknown }).text === "string"
      ) {
        return { text: (part as { text: string }).text, refusal: null };
      }
      if (
        (part as { type?: unknown }).type === "refusal" &&
        typeof (part as { refusal?: unknown }).refusal === "string"
      ) {
        return { text: null, refusal: (part as { refusal: string }).refusal };
      }
    }
  }

  return { text: null, refusal: null };
}

export function cleanQuestion(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 1200) : "";
}
