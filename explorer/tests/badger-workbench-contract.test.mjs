import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../app/research-workbench.tsx", import.meta.url),
  "utf8",
);

test("approved fox map enters the installed language handoff without claiming retrieval", () => {
  assert.match(source, /fetch\(responseId \? "\/api\/adapt\/status" : "\/api\/adapt"/);
  assert.match(source, /"\/api\/adapt\/status" : "\/api\/adapt"/);
  assert.match(source, /approved: true/);
  assert.match(source, /question,/);
  assert.match(source, /workspace,/);
  assert.match(source, /responseId: responseId \|\| undefined/);
  assert.match(source, /no corpus search has run/);
});

test("badger folios expose scholar editing, pinning, set-aside, restoration, and approval", () => {
  assert.match(source, /Edit proposal/);
  assert.match(source, /Save and pin my version/);
  assert.match(source, /toggleProposalPin/);
  assert.match(source, /Set aside/);
  assert.match(source, /Restore proposal/);
  assert.match(source, /Approve this folio/);
  assert.match(source, /Reopen folio/);
  assert.match(source, /current\.filter\(\(id\) => id !== folioId\)/);
});

test("badger waiting language is honest about timing and table stability", () => {
  assert.match(source, /This can take several minutes/);
  assert.match(source, /background receipt instead of depending on one/);
  assert.match(source, /Your approved table stays fixed/i);
  assert.match(source, /stretch your spine/i);
  assert.match(source, /Folio.*from table card/i);
});

test("a proposal can run an inspectable diagnostic shelf check without changing approval", () => {
  assert.match(source, /fetch\("\/api\/shelf-preview"/);
  assert.match(source, /Check literal coverage on this shelf/);
  assert.match(source, /attachShelfPreview/);
  assert.match(source, /not your inquiry results/i);
  assert.match(source, /most useful if you read/);
  assert.match(source, /approved concepts, relationships, scope, and exclusions/);
  assert.match(source, /preview\.notice/);
});
