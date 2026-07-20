import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyBackgroundResponse,
  cleanResponseId,
} from "../lib/server/background-response.ts";

test("accepts only Responses API job identifiers", () => {
  assert.equal(cleanResponseId("resp_background-123"), "resp_background-123");
  assert.equal(cleanResponseId("https://attacker.example"), "");
  assert.equal(cleanResponseId("../responses/resp_other"), "");
});

test("classifies queued, working, completed, and failed jobs", () => {
  assert.deepEqual(
    classifyBackgroundResponse({ id: "resp_1", status: "queued" }),
    { kind: "pending", responseId: "resp_1", status: "queued" },
  );
  assert.deepEqual(
    classifyBackgroundResponse({ id: "resp_2", status: "in_progress" }),
    { kind: "pending", responseId: "resp_2", status: "in_progress" },
  );
  assert.deepEqual(
    classifyBackgroundResponse({ status: "completed" }, "resp_3"),
    { kind: "completed", responseId: "resp_3" },
  );
  assert.deepEqual(
    classifyBackgroundResponse({ id: "resp_4", status: "failed" }),
    { kind: "terminal", responseId: "resp_4", status: "failed" },
  );
});
