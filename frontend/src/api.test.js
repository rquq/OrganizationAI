import { afterEach, expect, it, vi } from "vitest";
import { createTrace } from "./api.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

it("sends a submission unchanged to the backend trace endpoint", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ trace_id: "trace-1" }), { status: 201 }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const submission = {
    case_id: "SYN-1",
    submitted_at: "2026-01-15T09:00:00Z",
    requester_role: "TEST_REQUESTER",
    purpose: "Synthetic",
    expense: null,
  };

  await createTrace(submission);

  expect(fetchMock).toHaveBeenCalledWith(
    "/api/temporary/decision-traces",
    expect.objectContaining({ method: "POST", body: JSON.stringify(submission) }),
  );
});
