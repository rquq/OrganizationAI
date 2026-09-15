import { expect, it } from "vitest";
import { TEMPORARY_FIXTURES, buildRunSubmission } from "./fixtures.js";

it("gives each Verify submission a unique case id while retaining declared expectations", () => {
  const fixture = TEMPORARY_FIXTURES.find((item) => item.id === "TMP-001");
  const submission = buildRunSubmission(fixture, "run-42");

  expect(submission.case_id).toBe("TMP-001-run-42");
  expect(fixture.expected).toEqual({ outcome: "AUTO_APPROVED", ruleId: "TMP-AUT-01" });
  expect(fixture.submission.case_id).toBe("TMP-001");
});
