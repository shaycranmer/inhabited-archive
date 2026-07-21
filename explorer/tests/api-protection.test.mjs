import assert from "node:assert/strict";
import test from "node:test";

import {
  ADAPT_MAX_OUTPUT_TOKENS,
  OWL_MAX_OUTPUT_TOKENS,
  protectAiRequest,
  QUERY_MAX_OUTPUT_TOKENS,
  TRANSLATION_MAX_OUTPUT_TOKENS,
} from "../lib/server/openai-route.ts";

function request(origin) {
  return new Request("https://archive.example/api/query", {
    method: "POST",
    headers: origin ? { Origin: origin } : {},
  });
}

test("accepts a legitimate same-origin local request", () => {
  assert.deepEqual(
    protectAiRequest(request("https://archive.example"), { production: false }),
    { allowed: true },
  );
});

test("rejects missing and cross-origin requests before an OpenAI call", () => {
  assert.equal(
    protectAiRequest(request(), { production: false }).allowed,
    false,
  );
  assert.equal(
    protectAiRequest(request("https://attacker.example"), { production: false }).allowed,
    false,
  );
});

test("public AI fails closed until external rate limiting is acknowledged", () => {
  const blocked = protectAiRequest(request("https://archive.example"), {
    production: true,
    rateLimitConfigured: false,
  });
  assert.equal(blocked.allowed, false);
  if (!blocked.allowed) {
    assert.equal(blocked.status, 503);
    assert.equal(blocked.code, "public_ai_protection_required");
  }

  assert.deepEqual(
    protectAiRequest(request("https://archive.example"), {
      production: true,
      rateLimitConfigured: true,
    }),
    { allowed: true },
  );
});

test("every model route has an explicit output ceiling", () => {
  assert.equal(QUERY_MAX_OUTPUT_TOKENS, 8000);
  assert.equal(ADAPT_MAX_OUTPUT_TOKENS, 16000);
  assert.equal(OWL_MAX_OUTPUT_TOKENS, 16000);
  assert.equal(TRANSLATION_MAX_OUTPUT_TOKENS, 4000);
});
