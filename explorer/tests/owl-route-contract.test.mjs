import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const retrieveSource = await readFile(new URL("../app/api/retrieve/route.ts", import.meta.url), "utf8");
const owlSource = await readFile(new URL("../app/api/owl/route.ts", import.meta.url), "utf8");
const owlStatusSource = await readFile(new URL("../app/api/owl/status/route.ts", import.meta.url), "utf8");
const translationSource = await readFile(new URL("../app/api/translate/route.ts", import.meta.url), "utf8");

test("deterministic retrieval is same-origin and never needs the model key", () => {
  assert.match(retrieveSource, /protectSameOriginRequest/);
  assert.match(retrieveSource, /executeApprovedRetrieval/);
  assert.match(retrieveSource, /parentRunId/);
  assert.doesNotMatch(retrieveSource, /OPENAI_API_KEY/);
});

test("owl starts one bounded background job and polls through a separate route", () => {
  assert.match(owlSource, /protectAiRequest/);
  assert.match(owlSource, /store: false/);
  assert.match(owlSource, /background: true/);
  assert.match(owlSource, /OWL_MAX_OUTPUT_TOKENS/);
  assert.match(owlSource, /type: "json_schema"/);
  assert.match(owlSource, /strict: true/);
  assert.match(owlStatusSource, /method: "GET"/);
  assert.match(owlStatusSource, /encodeURIComponent\(responseId\)/);
});

test("every paid evidence route verifies the immutable run against D1 first", () => {
  assert.match(owlSource, /verifyRetrievalRunAgainstShelf/);
  assert.match(owlStatusSource, /verifyRetrievalRunAgainstShelf/);
  assert.match(translationSource, /verifyRetrievalRunAgainstShelf/);
});

test("working translation is a separate, non-mutating addendum route", () => {
  assert.match(translationSource, /working-translation-addendum-v1/);
  assert.match(translationSource, /TRANSLATION_MAX_OUTPUT_TOKENS/);
  assert.match(translationSource, /store: false/);
  assert.doesNotMatch(translationSource, /background: true/);
  assert.match(translationSource, /original owl judgment and retrieval run remain unchanged/);
});
