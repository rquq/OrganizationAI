const rawFixtures = [
  {
    id: "TMP-001",
    label: "Routine · below synthetic boundary",
    expected: { outcome: "AUTO_APPROVED", ruleId: "TMP-AUT-01" },
    submission: {
      case_id: "TMP-001",
      submitted_at: "2026-01-15T09:00:00Z",
      requester_role: "TEST_REQUESTER",
      purpose: "Synthetic allowed expense",
      expense: {
        category: "TEST_ALLOWED",
        description: "Synthetic materials line",
        amount_vnd: 999,
        expense_date: "2026-01-14",
        evidence_status: "PRESENT",
      },
    },
  },
  {
    id: "TMP-002",
    label: "Incomplete · purpose missing",
    expected: { outcome: "MISSING_FACT", ruleId: "TMP-REQ-01" },
    submission: {
      case_id: "TMP-002",
      submitted_at: "2026-01-15T09:01:00Z",
      requester_role: "TEST_REQUESTER",
      purpose: null,
      expense: {
        category: "TEST_ALLOWED",
        description: "Synthetic materials line",
        amount_vnd: 999,
        expense_date: "2026-01-14",
        evidence_status: "PRESENT",
      },
    },
  },
  {
    id: "TMP-003",
    label: "Incomplete · evidence not provided",
    expected: { outcome: "MISSING_FACT", ruleId: "TMP-EVD-01" },
    submission: {
      case_id: "TMP-003",
      submitted_at: "2026-01-15T09:02:00Z",
      requester_role: "TEST_REQUESTER",
      purpose: "Synthetic allowed expense",
      expense: {
        category: "TEST_ALLOWED",
        description: "Synthetic materials line",
        amount_vnd: 999,
        expense_date: "2026-01-14",
        evidence_status: "NOT_PROVIDED",
      },
    },
  },
  {
    id: "TMP-004",
    label: "Escalation · category outside temporary profile",
    expected: { outcome: "OUT_OF_POLICY", ruleId: "TMP-CAT-01" },
    submission: {
      case_id: "TMP-004",
      submitted_at: "2026-01-15T09:03:00Z",
      requester_role: "TEST_REQUESTER",
      purpose: "Synthetic blocked expense",
      expense: {
        category: "TEST_BLOCKED",
        description: "Synthetic blocked line",
        amount_vnd: 999,
        expense_date: "2026-01-14",
        evidence_status: "PRESENT",
      },
    },
  },
  {
    id: "TMP-005",
    label: "Escalation · beyond synthetic boundary",
    expected: { outcome: "AUTHORITY_EXCEEDED", ruleId: "TMP-AUT-02" },
    submission: {
      case_id: "TMP-005",
      submitted_at: "2026-01-15T09:04:00Z",
      requester_role: "TEST_REQUESTER",
      purpose: "Synthetic allowed expense",
      expense: {
        category: "TEST_ALLOWED",
        description: "Synthetic authority boundary line",
        amount_vnd: 1001,
        expense_date: "2026-01-14",
        evidence_status: "PRESENT",
      },
    },
  },
  {
    id: "TMP-006",
    label: "Routine · exact synthetic boundary",
    expected: { outcome: "AUTO_APPROVED", ruleId: "TMP-AUT-01" },
    submission: {
      case_id: "TMP-006",
      submitted_at: "2026-01-15T09:05:00Z",
      requester_role: "TEST_REQUESTER",
      purpose: "Synthetic allowed expense",
      expense: {
        category: "TEST_ALLOWED",
        description: "Synthetic exact boundary line",
        amount_vnd: 1000,
        expense_date: "2026-01-14",
        evidence_status: "PRESENT",
      },
    },
  },
];

export const TEMPORARY_FIXTURES = Object.freeze(rawFixtures);

export function buildRunSubmission(fixture, runId) {
  const submission = structuredClone(fixture.submission);
  submission.case_id = `${fixture.id}-${runId}`;
  return submission;
}
