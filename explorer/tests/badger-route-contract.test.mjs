import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeSource = await readFile(new URL("../app/api/adapt/route.ts", import.meta.url), "utf8");
const statusRouteSource = await readFile(
  new URL("../app/api/adapt/status/route.ts", import.meta.url),
  "utf8",
);
const guidanceSource = await readFile(
  new URL("../lib/latin-adaptation-guidance.ts", import.meta.url),
  "utf8",
);

test("live badger route requires explicit table approval", () => {
  assert.match(routeSource, /body\.approved !== true/);
  assert.match(routeSource, /Approve the fox table before/);
});

test("live badger route keeps the key server-side and uses bounded background polling", () => {
  assert.match(routeSource, /process\.env\.OPENAI_API_KEY/);
  assert.match(routeSource, /Authorization: `Bearer \$\{apiKey\}`/);
  assert.match(routeSource, /store: false/);
  assert.match(routeSource, /background: true/);
  assert.match(statusRouteSource, /responses\/\$\{encodeURIComponent\(responseId\)\}/);
  assert.match(routeSource, /status: 202/);
  assert.match(statusRouteSource, /status: 202/);
  assert.doesNotMatch(routeSource, /NEXT_PUBLIC_OPENAI/);
  assert.doesNotMatch(statusRouteSource, /NEXT_PUBLIC_OPENAI/);
});

test("paid badger starts and non-generating status checks use separate public routes", () => {
  assert.match(routeSource, /https:\/\/api\.openai\.com\/v1\/responses"/);
  assert.doesNotMatch(routeSource, /encodeURIComponent\(responseId\)/);
  assert.match(statusRouteSource, /method: "GET"/);
});

test("live badger route uses strict structured output and the packet evidence boundary", () => {
  assert.match(routeSource, /type: "json_schema"/);
  assert.match(routeSource, /strict: true/);
  assert.match(routeSource, /badgerAdaptationPlanSchema/);
  assert.match(guidanceSource, /Translate senses, not isolated English words/);
  assert.match(guidanceSource, /You have not consulted a dictionary in this call/);
  assert.match(guidanceSource, /Zero results will mean only/);
});
