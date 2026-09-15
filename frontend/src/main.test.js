import { describe, expect, it, vi } from "vitest";
import { TEMPORARY_FIXTURES } from "./fixtures.js";
import { renderShell, renderTrace, runVerify } from "./main.js";

describe("renderShell", () => {
  it("keeps the temporary boundary visible and exposes the start action", () => {
    document.body.innerHTML = '<main id="app"></main>';
    renderShell(document.querySelector("#app"));

    expect(document.querySelector("#boundary-notice").textContent).toContain("No payment");
    expect(document.querySelector("#start-case").textContent).toContain("Start a synthetic case");
    expect(document.querySelector("#start-case").getAttribute("type")).toBe("button");
    expect(document.querySelector("#run-verify").textContent).toContain("Run Verify fixtures");
    expect(document.querySelector("#policy-forge-link").href).toContain("policy-forge-provisional-baseline");
  });
});

describe("renderTrace", () => {
  it("renders backend provenance, a no-payment outcome, and ordered audit events", () => {
    document.body.innerHTML = '<section id="result"></section>';
    renderTrace(document.querySelector("#result"), {
      temporary_notice: "Temporary synthetic development record; workflow is unvalidated.",
      provenance: {
        profile_id: "TMP-DEV-001",
        profile_source: "TEMPORARY_DEVELOPMENT",
        data_class: "SYNTHETIC",
        workflow_validation_status: "UNVALIDATED",
      },
      decision: {
        outcome: "AUTO_APPROVED",
        applied_rule_id: "TMP-AUT-01",
        reason: "Approved under temporary development profile; no payment was made.",
        question: null,
      },
      control_state: "AUTO_APPROVED",
      events: [
        {
          sequence_number: 1,
          action: "CASE_RECEIVED",
          actor_type: "SYSTEM",
          recorded_at: "2026-01-15T09:00:00Z",
          payload: {},
        },
      ],
    });

    expect(document.body.textContent).toContain("No payment was made");
    expect(document.body.textContent).toContain("TMP-DEV-001");
    expect(document.querySelectorAll("[data-audit-event]")).toHaveLength(1);
  });
});

describe("runVerify", () => {
  it("compares the declared fixture expectation with the backend response", async () => {
    const submit = vi.fn().mockResolvedValue({
      trace_id: "trace-001",
      decision: { outcome: "AUTO_APPROVED", applied_rule_id: "TMP-AUT-01" },
    });

    const [result] = await runVerify([TEMPORARY_FIXTURES[0]], submit);

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ case_id: expect.stringMatching(/^TMP-001-verify-/) }),
    );
    expect(result).toMatchObject({
      fixtureId: "TMP-001",
      expected: { outcome: "AUTO_APPROVED", ruleId: "TMP-AUT-01" },
      actual: { outcome: "AUTO_APPROVED", ruleId: "TMP-AUT-01" },
      traceId: "trace-001",
      status: "PASS",
    });
  });
});
