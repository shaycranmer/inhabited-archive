import {
  reconcileBadgerAdaptationPlan,
  type BadgerAdaptationPlan,
  type ModelBadgerAdaptationPlan,
} from "../adaptation-plan";
import { isCatalogueConstraint, type QueryWorkspace } from "../query-plan";
import { classifyBackgroundResponse } from "./background-response";
import { extractModelContent } from "./openai-route";

export type BadgerBackgroundResult =
  | { kind: "pending"; responseId: string; status: "queued" | "in_progress" }
  | { kind: "terminal"; responseId: string; status: string }
  | { kind: "invalid"; responseId: string; status: string }
  | { kind: "refusal"; responseId: string; message: string }
  | { kind: "empty"; responseId: string }
  | { kind: "ready"; responseId: string; plan: BadgerAdaptationPlan };

export function isBadgerWorkspace(value: unknown): value is QueryWorkspace {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<QueryWorkspace>;
  if (
    typeof candidate.framing !== "string" ||
    !Array.isArray(candidate.conceptFamilies) ||
    !Array.isArray(candidate.relationships) ||
    !Array.isArray(candidate.scopeChoices) ||
    !Array.isArray(candidate.exclusions) ||
    candidate.conceptFamilies.length < 1 ||
    candidate.conceptFamilies.length > 6
  ) {
    return false;
  }

  const familiesAreValid = candidate.conceptFamilies.every((family) =>
    family &&
    typeof family.id === "string" &&
    typeof family.title === "string" &&
    typeof family.rationale === "string" &&
    typeof family.inquiryFocus === "boolean" &&
    Array.isArray(family.terms) &&
    family.terms.length <= 12 &&
    family.terms.every((term) =>
      term &&
      typeof term.id === "string" &&
      typeof term.label === "string" &&
      typeof term.rationale === "string" &&
      typeof term.inquiryFocus === "boolean"
    )
  );
  const relationshipsAreValid = candidate.relationships.length <= 12 &&
    candidate.relationships.every((relationship) =>
      relationship &&
      typeof relationship.sourceTitle === "string" &&
      typeof relationship.targetTitle === "string" &&
      typeof relationship.label === "string" &&
      typeof relationship.rationale === "string"
    );
  const boundaryCardsAreValid = (cards: QueryWorkspace["scopeChoices"]) =>
    cards.length <= 8 && cards.every((card) =>
      card &&
      typeof card.label === "string" &&
      typeof card.rationale === "string" &&
      isCatalogueConstraint(card.catalogueConstraint)
    );
  const sourceIds = candidate.conceptFamilies.flatMap((family) => [
    family.id,
    ...family.terms.map((term) => term.id),
  ]);

  return familiesAreValid &&
    relationshipsAreValid &&
    boundaryCardsAreValid(candidate.scopeChoices) &&
    boundaryCardsAreValid(candidate.exclusions) &&
    new Set(sourceIds).size === sourceIds.length;
}

export function approvedBadgerMap(workspace: QueryWorkspace) {
  return {
    framing: workspace.framing.slice(0, 2000),
    conceptFamilies: workspace.conceptFamilies.map((family) => ({
      id: family.id.slice(0, 200),
      title: family.title.slice(0, 240),
      rationale: family.rationale.slice(0, 1200),
      inquiryFocus: family.inquiryFocus,
      terms: family.terms.slice(0, 12).map((term) => ({
        id: term.id.slice(0, 240),
        label: term.label.slice(0, 240),
        rationale: term.rationale.slice(0, 1200),
        inquiryFocus: term.inquiryFocus,
      })),
    })),
    relationships: workspace.relationships.slice(0, 12).map((relationship) => ({
      sourceTitle: relationship.sourceTitle.slice(0, 240),
      targetTitle: relationship.targetTitle.slice(0, 240),
      label: relationship.label.slice(0, 240),
      rationale: relationship.rationale.slice(0, 1200),
    })),
    scopeChoices: workspace.scopeChoices.slice(0, 8).map((scope) => ({
      label: scope.label.slice(0, 240),
      rationale: scope.rationale.slice(0, 1200),
      catalogueConstraint: scope.catalogueConstraint,
    })),
    exclusions: workspace.exclusions.slice(0, 8).map((exclusion) => ({
      label: exclusion.label.slice(0, 240),
      rationale: exclusion.rationale.slice(0, 1200),
      catalogueConstraint: exclusion.catalogueConstraint,
    })),
  };
}

export function reconcileBadgerBackgroundResponse(
  raw: Record<string, unknown>,
  fallbackResponseId: string,
  workspace: QueryWorkspace,
): BadgerBackgroundResult {
  const state = classifyBackgroundResponse(raw, fallbackResponseId);
  if (state.kind !== "completed") return state;

  const content = extractModelContent(raw);
  if (content.refusal) {
    return { kind: "refusal", responseId: state.responseId, message: content.refusal };
  }
  if (!content.text) return { kind: "empty", responseId: state.responseId };

  const modelPlan = JSON.parse(content.text) as ModelBadgerAdaptationPlan;
  return {
    kind: "ready",
    responseId: state.responseId,
    plan: reconcileBadgerAdaptationPlan(modelPlan, workspace),
  };
}
