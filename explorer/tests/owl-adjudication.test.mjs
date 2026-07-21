import assert from "node:assert/strict";
import test from "node:test";

import {
  owlInputPacket,
  reconcileOwlAdjudication,
} from "../lib/owl-adjudication.ts";
import { documentedWorkspace } from "../lib/query-plan.ts";

function candidate(id, segmentId, text, rank) {
  return {
    candidateId: id,
    documentId: `doc-${rank}`,
    author: "Test Author",
    workTitle: `Test Work ${rank}`,
    citationLabel: `${rank}.1`,
    languageCode: "lat",
    languageLabel: "Latin",
    basket: "classical",
    sourceUrl: "https://example.test/source.xml",
    sourceSha256: String(rank).repeat(64),
    rightsStatement: "Public domain",
    sourceUnits: [{ segmentId, sequenceNumber: rank, citationLabel: `${rank}.1`, text, matched: true }],
    matchedSegmentIds: [segmentId],
    matchAttributions: [],
    exclusionSignals: [],
    relationshipIds: [],
    deterministicScore: 4,
    retrievalRank: rank,
  };
}

function run(translationPreference = "auto_strong") {
  const inquirySnapshot = documentedWorkspace();
  return {
    contractVersion: "retrieval-run-v1",
    runId: "retrieval_abcdefghijkl_test",
    parentRunId: null,
    createdAt: "2026-07-20T12:00:00.000Z",
    question: "How does distance change home?",
    translationPreference,
    inquirySnapshot,
    languagePlanSnapshot: { contractVersion: "badger-adaptation-v1", approvalStatus: "approved", folios: [] },
    compiledPlan: { contractVersion: "compiled-retrieval-v1", positiveProposals: [], exclusionProposals: [] },
    corpusReceipt: { corpusId: "perseus-latin-demo-v1", sourceCommit: "abc", contentSha256: "f".repeat(64) },
    hashes: { inquirySha256: "a", languagePlanSha256: "b", candidatePacketSha256: "c", executionPacketSha256: "d" },
    stats: { executedProposalCount: 2, rawMatchCount: 2, deduplicatedCandidateCount: 2, returnedCandidateCount: 2 },
    candidates: [
      candidate("candidate-001", "seg-1", "Patriam longe positam desiderat.", 1),
      candidate("candidate-002", "seg-2", "Iter cras perficitur.", 2),
    ],
    limitations: [],
  };
}

function modelJudgment(candidateId, segmentId, excerpt, disposition) {
  return {
    candidateId,
    disposition,
    priority: disposition === "strong" ? 90 : 30,
    confidence: "medium",
    relationshipSummary: "The passage may connect distance and remembered home.",
    reasoning: "The stated evidence supports this bounded classification.",
    evidenceSegmentIds: [segmentId],
    evidenceExcerpt: excerpt,
    contextNeeded: false,
    contextRequest: "",
    englishOrientation: "A writer speaks about distance or travel.",
    workingTranslation: `Machine rendering of ${excerpt}`,
    translationNotes: ["Syntax remains uncertain."],
    warnings: [],
  };
}

function model() {
  return {
    runId: "retrieval_abcdefghijkl_test",
    judgments: [
      modelJudgment("candidate-001", "seg-1", "Patriam longe positam desiderat.", "strong"),
      modelJudgment("candidate-002", "seg-2", "Iter cras perficitur.", "liminal"),
    ],
  };
}

test("owl reconciliation preserves exact evidence and auto-translates only strong results", () => {
  const adjudication = reconcileOwlAdjudication(model(), run(), { model: "gpt-test", responseId: "resp_test" });
  assert.deepEqual(adjudication.judgments.map((item) => item.candidateId), ["candidate-001", "candidate-002"]);
  assert.equal(adjudication.judgments[0].translationStatus, "machine_generated");
  assert.match(adjudication.judgments[0].workingTranslation, /Patriam/);
  assert.equal(adjudication.judgments[1].translationStatus, "available_on_demand");
  assert.equal(adjudication.judgments[1].workingTranslation, "");
  assert.deepEqual(adjudication.judgments[1].translationNotes, []);
});

test("translation-off runs keep every result untranslated", () => {
  const adjudication = reconcileOwlAdjudication(model(), run("off"), { model: "gpt-test", responseId: "resp_test" });
  assert.ok(adjudication.judgments.every((item) => item.translationStatus === "disabled"));
  assert.ok(adjudication.judgments.every((item) => item.workingTranslation === ""));
});

test("owl refuses invented identities, missing candidates, and non-source excerpts", () => {
  const invented = model();
  invented.judgments[0].candidateId = "candidate-invented";
  assert.throws(() => reconcileOwlAdjudication(invented, run(), { model: "x", responseId: "y" }), /invented or duplicated/);

  const missing = model();
  missing.judgments.pop();
  assert.throws(() => reconcileOwlAdjudication(missing, run(), { model: "x", responseId: "y" }), /omitted/);

  const fabricated = model();
  fabricated.judgments[0].evidenceExcerpt = "This sentence was never in the shelf.";
  assert.throws(() => reconcileOwlAdjudication(fabricated, run(), { model: "x", responseId: "y" }), /not exact source text/);
});

test("the complete fox and badger snapshots travel in the owl packet", () => {
  const packet = owlInputPacket(run());
  assert.equal(packet.foxInquiry.conceptFamilies.length, 3);
  assert.equal(packet.approvedLanguageFolios.contractVersion, "badger-adaptation-v1");
  assert.equal(packet.compiledRetrievalPlan.contractVersion, "compiled-retrieval-v1");
  assert.equal(packet.candidates.length, 2);
});
