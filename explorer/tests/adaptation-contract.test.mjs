import assert from "node:assert/strict";
import test from "node:test";

import {
  attachShelfPreview,
  hydrateBadgerAdaptationPlan,
  modelProposalVerificationNote,
  reconcileBadgerAdaptationPlan,
  summarizeFolio,
} from "../lib/adaptation-plan.ts";
import { documentedWorkspace } from "../lib/query-plan.ts";

function modelPlan() {
  return {
    languageCode: "lat",
    languageLabel: "Latin",
    corpusId: "perseus-latin-demo-v1",
    corpusLabel: "Thirty-work Perseus Latin shelf",
    holdingsNote: "Absence from this shelf is not historical absence.",
    globalUncertainties: ["The shelf is selective.", "The shelf is selective."],
    folios: [{
      sourceFamilyId: "family-home-1",
      sourceFamilyTitle: "Home and belonging",
      summary: "Searches dwelling, homeland, and household senses separately.",
      scopeNote: "Latin demonstration shelf only.",
      highestRisk: "Aedes can name a temple rather than a house.",
      overallConfidence: "probable",
      proposals: [
        {
          sourceConceptId: "family-home-1-term-home-1",
          sourceConceptLabel: "home",
          category: "lexical_translation",
          retrievalEffect: "include",
          sourceLanguageExpression: "domus",
          englishSense: "dwelling or household",
          rationale: "A direct lexical candidate for several home senses.",
          searchForms: ["domus", "domum", "domus"],
          orthographicVariants: [],
          phrases: [],
          syntacticFrame: "",
          periodTags: ["classical", "late antique"],
          genreTags: [],
          falsePositiveForecast: ["May describe a dynasty."],
          uncertaintyNotes: [],
          confidence: "secure",
          verificationStatus: "packet_guided_model_proposal",
          verificationNote: "Not independently dictionary-verified in the application.",
        },
        {
          sourceConceptId: "family-home-1-term-home-1",
          sourceConceptLabel: "home",
          category: "conceptual_association",
          retrievalEffect: "demote",
          sourceLanguageExpression: "penates",
          englishSense: "household gods as an image of home",
          rationale: "An exploratory association, not a translation of home.",
          searchForms: ["penates"],
          orthographicVariants: [],
          phrases: [],
          syntacticFrame: "",
          periodTags: [],
          genreTags: [],
          falsePositiveForecast: [],
          uncertaintyNotes: ["A hit may concern cult rather than belonging."],
          confidence: "speculative",
          verificationStatus: "packet_guided_model_proposal",
          verificationNote: "Model proposal guided by the Latin packet.",
        },
      ],
    }],
  };
}

function modelPlanForWorkspace(workspace) {
  return {
    ...modelPlan(),
    languageCode: "invented-language",
    languageLabel: "Invented Latin",
    corpusId: "invented-corpus",
    corpusLabel: "Invented corpus",
    holdingsNote: "Invented holdings claim.",
    folios: workspace.conceptFamilies.map((family) => ({
      sourceFamilyId: family.id,
      sourceFamilyTitle: `Untrusted title for ${family.title}`,
      summary: `Adapts ${family.title}.`,
      scopeNote: "Selective Latin demonstration shelf.",
      highestRisk: "A proposed form may have several senses.",
      overallConfidence: "probable",
      proposals: [{
        ...modelPlan().folios[0].proposals[0],
        sourceConceptId: family.terms[0].id,
        sourceConceptLabel: "Untrusted source label",
        verificationStatus: "externally_verified",
        verificationNote: "Untrusted verification claim.",
      }],
    })),
  };
}

test("hydrates a contained folio without duplicating search forms", () => {
  const plan = hydrateBadgerAdaptationPlan(modelPlan());
  assert.equal(plan.contractVersion, "badger-adaptation-v1");
  assert.equal(plan.approvalStatus, "draft");
  assert.equal(plan.globalUncertainties.length, 1);
  assert.equal(plan.folios.length, 1);
  assert.equal(plan.folios[0].proposals[0].searchForms.length, 2);
  assert.equal(plan.folios[0].proposals[0].pinned, false);
  assert.equal(plan.folios[0].proposals[1].active, true);

  assert.deepEqual(summarizeFolio(plan.folios[0]), {
    directProposalCount: 1,
    exploratoryProposalCount: 1,
    warningCount: 2,
    previewedProposalCount: 0,
    status: "untouched",
  });
});

test("attaching a shelf preview does not approve or otherwise mutate a proposal", () => {
  const plan = hydrateBadgerAdaptationPlan(modelPlan());
  const proposal = plan.folios[0].proposals[0];
  const next = attachShelfPreview(plan, {
    kind: "diagnostic_shelf_preview",
    proposalId: proposal.id,
    status: "matches_found",
    corpusId: plan.corpusId,
    corpusLabel: plan.corpusLabel,
    queryForms: ["domus", "domum"],
    queryMode: "any",
    totalSegmentMatches: 12,
    totalDocumentMatches: 4,
    samples: [],
    notice: "Examples are diagnostic, not relevance judgments.",
  });

  const updated = next.folios[0].proposals[0];
  assert.equal(updated.shelfPreview?.totalSegmentMatches, 12);
  assert.equal(updated.active, proposal.active);
  assert.equal(updated.pinned, proposal.pinned);
  assert.equal(updated.scholarEdited, proposal.scholarEdited);
  assert.equal(next.approvalStatus, "draft");
  assert.equal(summarizeFolio(next.folios[0]).previewedProposalCount, 1);
});

test("reconciles every proposal to the approved fox table and application-owned evidence boundary", () => {
  const workspace = documentedWorkspace();
  const plan = reconcileBadgerAdaptationPlan(modelPlanForWorkspace(workspace), workspace);

  assert.equal(plan.languageCode, "lat");
  assert.equal(plan.corpusId, "perseus-latin-demo-v1");
  assert.equal(plan.approvalStatus, "draft");
  assert.deepEqual(
    plan.folios.map((folio) => folio.sourceFamilyId),
    workspace.conceptFamilies.map((family) => family.id),
  );
  assert.deepEqual(
    plan.folios.map((folio) => folio.sourceFamilyTitle),
    workspace.conceptFamilies.map((family) => family.title),
  );

  const proposal = plan.folios[0].proposals[0];
  assert.equal(proposal.sourceConceptLabel, workspace.conceptFamilies[0].terms[0].label);
  assert.equal(proposal.verificationStatus, "packet_guided_model_proposal");
  assert.equal(proposal.verificationNote, modelProposalVerificationNote);
});

test("refuses a badger folio connected to an unknown fox card", () => {
  const workspace = documentedWorkspace();
  const candidate = modelPlanForWorkspace(workspace);
  candidate.folios[0].proposals[0].sourceConceptId = "family-invented-term";

  assert.throws(
    () => reconcileBadgerAdaptationPlan(candidate, workspace),
    /unknown fox card/,
  );
});

test("refuses a partial handoff that silently omits a fox family", () => {
  const workspace = documentedWorkspace();
  const candidate = modelPlanForWorkspace(workspace);
  candidate.folios.pop();

  assert.throws(
    () => reconcileBadgerAdaptationPlan(candidate, workspace),
    /exactly one folio for every fox family/,
  );
});

test("normalizes exclusion and uncertainty categories to safe retrieval effects", () => {
  const workspace = documentedWorkspace();
  const candidate = modelPlanForWorkspace(workspace);
  candidate.folios[0].proposals.push({
    ...candidate.folios[0].proposals[0],
    sourceConceptId: workspace.conceptFamilies[0].id,
    sourceConceptLabel: workspace.conceptFamilies[0].title,
    category: "exclusion_rule",
    retrievalEffect: "include",
    sourceLanguageExpression: "iter sine cogitatione",
    englishSense: "An itinerary without reflection.",
  });
  candidate.folios[1].proposals[0].category = "uncertainty";
  candidate.folios[1].proposals[0].retrievalEffect = "include";

  const plan = reconcileBadgerAdaptationPlan(candidate, workspace);
  const exclusion = plan.folios[0].proposals.find(
    (proposal) => proposal.category === "exclusion_rule",
  );
  assert.equal(exclusion?.retrievalEffect, "exclude");
  assert.equal(plan.folios[1].proposals[0].retrievalEffect, "disclose_only");
  assert.equal(plan.folios[1].proposals[0].active, false);
});
