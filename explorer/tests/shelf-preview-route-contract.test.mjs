import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeSource = await readFile(
  new URL("../app/api/shelf-preview/route.ts", import.meta.url),
  "utf8",
);

test("shelf preview is same-origin, parameterized, and tied to a corpus receipt", () => {
  assert.match(routeSource, /protectSameOriginRequest/);
  assert.match(routeSource, /receipt\.get\("corpus_id"\)/);
  assert.match(routeSource, /source_commit/);
  assert.match(routeSource, /content_sha256/);
  assert.match(routeSource, /\.bind\(ftsQuery\)/);
  assert.doesNotMatch(routeSource, /OPENAI_API_KEY/);
});

test("shelf preview returns counts, basket distribution, and source receipts without relevance claims", () => {
  assert.match(routeSource, /COUNT\(DISTINCT s\.document_id\)/);
  assert.match(routeSource, /GROUP BY p\.basket/);
  assert.match(routeSource, /snippet\(segment_search/);
  assert.match(routeSource, /d\.source_sha256/);
  assert.match(routeSource, /not relevance judgments/);
});
