import assert from "node:assert/strict";
import test from "node:test";

import { applyCatalogueScope } from "../lib/catalogue-scope.ts";
import { documentedWorkspace, unresolvedCatalogueConstraint } from "../lib/query-plan.ts";

function work(overrides) {
  return {
    documentId: "doc",
    workUrn: "urn:work",
    author: "Author",
    workTitle: "Work",
    compositionStartYear: 100,
    compositionEndYear: 110,
    dateLabel: "c. 100–110 CE",
    dateCertainty: "probable",
    genreTags: ["history"],
    traditionTags: ["classical_latin"],
    scopeNote: "Test metadata.",
    ...overrides,
  };
}

function card(label, catalogueConstraint) {
  return {
    id: `card-${label}`,
    label,
    rationale: "Test boundary.",
    catalogueConstraint,
    pinned: true,
    origin: "scholar",
  };
}

test("a resolved pre-306 exclusion keeps earlier works out before retrieval", () => {
  const workspace = documentedWorkspace();
  workspace.exclusions.push(card("Pre-Constantinian writings", {
    status: "resolved",
    dimension: "composition_date",
    startYear: null,
    endYear: 305,
    values: [],
    interpretation: "Works composed no later than 305 CE.",
    clarificationQuestion: "",
  }));
  const works = [
    work({ documentId: "caesar", author: "Caesar", compositionStartYear: -52, compositionEndYear: -50, dateLabel: "52–50 BCE" }),
    work({ documentId: "tertullian", author: "Tertullian", compositionStartYear: 197, compositionEndYear: 197, dateLabel: "197 CE", traditionTags: ["patristic"] }),
    work({ documentId: "prudentius", author: "Prudentius", compositionStartYear: 395, compositionEndYear: 405, dateLabel: "395–405 CE", genreTags: ["poetry"], traditionTags: ["patristic", "late_antique"] }),
  ];

  const result = applyCatalogueScope(works, workspace);
  assert.deepEqual(result.eligibleWorks.map((item) => item.documentId), ["prudentius"]);
  assert.deepEqual(result.receipt.excludedWorks.map((item) => item.documentId), ["caesar", "tertullian"]);
  assert.equal(result.receipt.eligibleWorkCount, 1);
});

test("genre scope is enforced while uncertain date overlaps are retained and flagged", () => {
  const workspace = documentedWorkspace();
  workspace.scopeChoices.push(card("Poetry only", {
    status: "resolved",
    dimension: "genre",
    startYear: null,
    endYear: null,
    values: ["poetry"],
    interpretation: "Works catalogued as poetry.",
    clarificationQuestion: "",
  }));
  workspace.exclusions.push(card("Before 100 CE", {
    status: "resolved",
    dimension: "composition_date",
    startYear: null,
    endYear: 99,
    values: [],
    interpretation: "Works composed before 100 CE.",
    clarificationQuestion: "",
  }));
  const works = [
    work({ documentId: "prose", genreTags: ["history"] }),
    work({ documentId: "later-poem", genreTags: ["poetry"], compositionStartYear: 120, compositionEndYear: 130 }),
    work({ documentId: "border-poem", genreTags: ["poetry"], compositionStartYear: 90, compositionEndYear: 110 }),
  ];

  const result = applyCatalogueScope(works, workspace);
  assert.deepEqual(result.eligibleWorks.map((item) => item.documentId), ["later-poem", "border-poem"]);
  assert.equal(result.receipt.flaggedWorks[0].documentId, "border-poem");
});

test("unresolved catalogue wording blocks retrieval rather than pretending it was enforced", () => {
  const workspace = documentedWorkspace();
  workspace.exclusions.push(card(
    "Pre-Constantinian writings",
    unresolvedCatalogueConstraint("Which Constantinian boundary do you mean?"),
  ));
  assert.throws(
    () => applyCatalogueScope([work({})], workspace),
    /fox still needs to sharpen/,
  );
});
