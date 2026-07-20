import assert from "node:assert/strict";
import test from "node:test";

import {
  latinOrthographicVariants,
  literalShelfQuery,
  parseShelfPreviewRequest,
} from "../lib/shelf-preview.ts";

test("accepts only the declared Latin shelf and bounded proposal forms", () => {
  assert.deepEqual(
    parseShelfPreviewRequest({
      proposalId: "proposal-domus",
      corpusId: "perseus-latin-demo-v1",
      queryForms: ["domus", "Domus", "domum"],
      queryMode: "any",
    }),
    {
      proposalId: "proposal-domus",
      corpusId: "perseus-latin-demo-v1",
      queryForms: ["domus", "domum"],
      queryMode: "any",
    },
  );
  assert.equal(
    parseShelfPreviewRequest({
      proposalId: "proposal-domus",
      corpusId: "invented-shelf",
      queryForms: ["domus"],
    }),
    null,
  );
});

test("builds a quoted literal FTS query with mechanical u/v and i/j expansion", () => {
  assert.deepEqual(new Set(latinOrthographicVariants("vita")), new Set([
    "vita",
    "vjta",
    "uita",
    "ujta",
  ]));
  const query = literalShelfQuery(["domus", "vita brevis"], "any");
  assert.match(query, /"domus" OR "domvs"/);
  assert.match(query, /"vita"/);
  assert.match(query, / AND /);
  assert.match(query, / OR /);
});

test("rejects forms that cannot become a small inspectable literal query", () => {
  assert.throws(() => literalShelfQuery(["---"], "any"), /one and eight/);
  assert.throws(() => literalShelfQuery(["iiiiiii"], "any"), /too many/);
});
