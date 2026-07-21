import assert from "node:assert/strict";
import test from "node:test";

import { reconcileBadgerAdaptationPlan } from "../lib/adaptation-plan.ts";
import { documentedWorkspace } from "../lib/query-plan.ts";
import {
  canonicalJson,
  compileRetrievalPlan,
  deduplicateAndRankHits,
  executionPacketForHash,
  isApprovedBadgerPlan,
  sha256Hex,
} from "../lib/retrieval-run.ts";

function approvedPlan(workspace) {
  const folios = workspace.conceptFamilies.map((family, familyIndex) => ({
    sourceFamilyId: family.id,
    sourceFamilyTitle: family.title,
    summary: `Adapts ${family.title}.`,
    scopeNote: "Selective demonstration shelf.",
    highestRisk: "Literal forms can be polysemous.",
    overallConfidence: "probable",
    proposals: [{
      sourceConceptId: family.terms[0].id,
      sourceConceptLabel: family.terms[0].label,
      category: familyIndex === 1 ? "morphological_expansion" : "lexical_translation",
      retrievalEffect: "include",
      sourceLanguageExpression: ["exilium", "domus", "desiderium"][familyIndex],
      englishSense: family.terms[0].label,
      rationale: "A bounded test proposal.",
      searchForms: [["exilium", "exilio"], ["domus", "domum"], ["desiderium"]][familyIndex],
      orthographicVariants: familyIndex === 0 ? ["exsilium"] : [],
      phrases: familyIndex === 2 ? ["desiderium patriae"] : [],
      syntacticFrame: "",
      periodTags: [],
      genreTags: [],
      falsePositiveForecast: ["A literal match may not express the inquiry."],
      uncertaintyNotes: [],
      confidence: "probable",
      verificationStatus: "packet_guided_model_proposal",
      verificationNote: "Packet-guided test proposal.",
    }],
  }));
  folios[0].proposals.push({
    ...folios[0].proposals[0],
    sourceConceptId: folios[0].sourceFamilyId,
    sourceConceptLabel: folios[0].sourceFamilyTitle,
    category: "exclusion_rule",
    retrievalEffect: "exclude",
    sourceLanguageExpression: "sine cogitatione",
    englishSense: "without reflection",
    searchForms: ["sine cogitatione"],
    orthographicVariants: [],
    phrases: [],
  });
  const plan = reconcileBadgerAdaptationPlan({
    languageCode: "lat",
    languageLabel: "Latin",
    corpusId: "perseus-latin-demo-v1",
    corpusLabel: "Thirty-work Perseus Latin shelf",
    holdingsNote: "Selective test shelf.",
    globalUncertainties: [],
    folios,
  }, workspace);
  return {
    ...plan,
    approvalStatus: "approved",
    folios: plan.folios.map((folio) => ({ ...folio, status: "approved" })),
  };
}

function hit(overrides) {
  return {
    segmentId: "seg-1",
    documentId: "doc-1",
    sequenceNumber: 5,
    segmentType: "textpart",
    citationLabel: "1.1",
    text: "Exilium et domus sine cogitatione.",
    author: "Test Author",
    workTitle: "Test Work",
    sourceUrl: "https://example.test/source.xml",
    sourceSha256: "a".repeat(64),
    rightsStatement: "Public domain",
    basket: "classical",
    lexicalRank: -2,
    ...overrides,
  };
}

test("compiles only active executable forms and keeps exclusions as disclosed signals", () => {
  const workspace = documentedWorkspace();
  const plan = approvedPlan(workspace);
  plan.folios[2].proposals[0].active = false;
  const compiled = compileRetrievalPlan(workspace, plan);

  assert.equal(compiled.positiveProposals.length, 2);
  assert.equal(compiled.exclusionProposals.length, 1);
  assert.deepEqual(compiled.positiveProposals[0].queryForms, ["exilium", "exilio", "exsilium"]);
  assert.equal(compiled.exclusionProposals[0].retrievalEffect, "exclude");
  assert.match(compiled.limitations[0], /bounded literal/);
});

test("approved plans must contain each fox family exactly once", () => {
  const workspace = documentedWorkspace();
  const plan = approvedPlan(workspace);
  assert.equal(isApprovedBadgerPlan(plan, workspace), true);

  const duplicated = structuredClone(plan);
  duplicated.folios[1] = structuredClone(duplicated.folios[0]);
  assert.equal(isApprovedBadgerPlan(duplicated, workspace), false);
});

test("overlapping hits become one reading unit with cross-family and exclusion receipts", () => {
  const workspace = documentedWorkspace();
  workspace.conceptFamilies[0].inquiryFocus = true;
  const compiled = compileRetrievalPlan(workspace, approvedPlan(workspace));
  const first = compiled.positiveProposals[0];
  const second = compiled.positiveProposals[1];
  const hits = [
    hit({ attribution: first }),
    hit({ segmentId: "seg-2", sequenceNumber: 6, attribution: second }),
    hit({ segmentId: "seg-2", sequenceNumber: 6, attribution: first }),
    hit({ documentId: "doc-2", segmentId: "seg-20", sequenceNumber: 2, text: "Domus.", attribution: second }),
  ];

  const ranked = deduplicateAndRankHits(hits, compiled, workspace);
  const joined = ranked.seeds.find((seed) => seed.documentId === "doc-1");
  assert.equal(ranked.seeds.length, 2);
  assert.deepEqual(joined.matchedSegmentIds, ["seg-1", "seg-2"]);
  assert.equal(joined.matchAttributions.length, 2);
  assert.equal(joined.relationshipIds.length, 1);
  assert.equal(joined.exclusionSignals.length, 1);
  assert.equal(ranked.selected[0].documentId, "doc-1");
});

test("canonical receipts are stable across object key order", async () => {
  assert.equal(canonicalJson({ b: 2, a: { d: 4, c: 3 } }), '{"a":{"c":3,"d":4},"b":2}');
  assert.equal(await sha256Hex({ b: 2, a: 1 }), await sha256Hex({ a: 1, b: 2 }));

  const receipt = {
    runId: "retrieval_abcdefghijkl_one",
    createdAt: "2026-07-20T12:00:00.000Z",
    question: "A question",
    translationPreference: "off",
    parentRunId: null,
    inquirySnapshot: { conceptFamilies: [] },
    languagePlanSnapshot: { folios: [] },
    compiledPlan: { positiveProposals: [] },
    corpusReceipt: { contentSha256: "a" },
    candidates: [],
    stats: { returnedCandidateCount: 0 },
    limitations: ["Literal floor."],
  };
  const original = await sha256Hex(executionPacketForHash(receipt));
  const relabeled = await sha256Hex(executionPacketForHash({ ...receipt, runId: "retrieval_abcdefghijkl_two" }));
  const recounted = await sha256Hex(executionPacketForHash({ ...receipt, stats: { returnedCandidateCount: 1 } }));
  assert.notEqual(original, relabeled);
  assert.notEqual(original, recounted);
});
