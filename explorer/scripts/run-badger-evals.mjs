import { badgerEvalCases } from "../tests/fixtures/badger-eval-cases.mjs";

const baseUrl = process.env.BADGER_EVAL_BASE_URL || "http://localhost:3000";
const selectedCase = process.argv[2] || process.env.BADGER_EVAL_CASE;
const selectedCases = selectedCase
  ? badgerEvalCases.filter((testCase) => testCase.id === selectedCase)
  : badgerEvalCases;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

if (selectedCase && selectedCases.length === 0) {
  throw new Error(`Unknown BADGER_EVAL_CASE: ${selectedCase}`);
}

function summarizePlan(testCase, response) {
  return {
    id: testCase.id,
    question: testCase.question,
    model: response.model,
    packetVersion: response.packetVersion,
    notice: response.notice,
    approvalStatus: response.plan.approvalStatus,
    globalUncertaintyCount: response.plan.globalUncertainties.length,
    folios: response.plan.folios.map((folio) => ({
      family: folio.sourceFamilyTitle,
      summary: folio.summary,
      scopeNote: folio.scopeNote,
      highestRisk: folio.highestRisk,
      confidence: folio.overallConfidence,
      proposals: folio.proposals.map((proposal) => ({
        sourceCard: proposal.sourceConceptLabel,
        category: proposal.category,
        effect: proposal.retrievalEffect,
        latin: proposal.latinExpression,
        sense: proposal.englishSense,
        searchFormCount: proposal.searchForms.length,
        falsePositiveCount: proposal.falsePositiveForecast.length,
        uncertaintyCount: proposal.uncertaintyNotes.length,
        confidence: proposal.confidence,
        verification: proposal.verificationStatus,
      })),
    })),
  };
}

const results = await Promise.all(selectedCases.map(async (testCase) => {
  let responseId = "";
  while (true) {
    const response = await fetch(
      `${baseUrl}${responseId ? "/api/adapt/status" : "/api/adapt"}`,
      {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseUrl },
      body: JSON.stringify({
        approved: true,
        question: testCase.question,
        workspace: testCase.workspace,
        responseId: responseId || undefined,
      }),
    });
    const body = await response.json();
    if (!response.ok && response.status !== 202) {
      return { id: testCase.id, status: response.status, error: body.error };
    }
    if (response.status === 202) {
      responseId = body.responseId;
      await wait(3000);
      continue;
    }
    return summarizePlan(testCase, body);
  }
}));

console.log(JSON.stringify(results, null, 2));

if (results.some((result) => "error" in result)) {
  process.exitCode = 1;
}
