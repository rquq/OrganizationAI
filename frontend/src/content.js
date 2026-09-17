import readmeContent from '../../docs/README.md?raw';
import rubricContent from '../../docs/00_challenge_a_rubric.md?raw';
import workflowContent from '../../docs/01_manual_reimbursement_workflow.md?raw';
import mvpContent from '../../docs/02_MVP_Spec.md?raw';
import policyContent from '../../docs/03_reimbursement_policy.md?raw';
import contractContent from '../../docs/04_reimbursement_system_contract.md?raw';
import corpusContent from '../../docs/05_reimbursement_case_corpus.md?raw';
import architectureContent from '../../docs/07_architecture.md?raw';
import publicSurfaceAdrContent from '../../docs/ADRs/006_synthetic-pilot-and-public-private-surfaces.md?raw';
import policyForgeContent from '../../policy-forge-baseline/Policy_Hoan_Ung_CLB.md?raw';
import policyRulesContent from '../../policy-forge-baseline/policy_rules.yaml?raw';
import canonicalTestSuite from '../../policy-forge-baseline/test_cases.json';
import canonicalVerifySuite from '../../policy-forge-baseline/verify_cases.json';

export const SOURCE_REF = '17cedab2d108958627fdf39f20a36450dfb8b6bd';
export const SOURCE_REPO = 'Park-Hip/OrganizationAI';
export const FORK_REPO = 'rquq/OrganizationAI';

const documentDefinitions = [
  {
    id: 'README',
    title: 'Documentation index',
    description: 'The current project status, source-of-truth order, and documentation rules.',
    path: 'docs/README.md',
    content: readmeContent,
  },
  {
    id: '00-rubric',
    title: 'Challenge A rubric',
    description: 'The challenge framing and scoring reference for the Escalation Referee.',
    path: 'docs/00_challenge_a_rubric.md',
    content: rubricContent,
  },
  {
    id: '01-workflow',
    title: 'Manual reimbursement workflow',
    description: 'The project-approved reimbursement workflow baseline and activation gate.',
    path: 'docs/01_manual_reimbursement_workflow.md',
    content: workflowContent,
  },
  {
    id: '02-mvp',
    title: 'MVP specification',
    description: 'The adopted synthetic-pilot scope for deterministic reimbursement packets and escalation.',
    path: 'docs/02_MVP_Spec.md',
    content: mvpContent,
  },
  {
    id: '03-policy',
    title: 'Reimbursement policy',
    description: 'The versioned Policy Forge v1.2 policy baseline and human-approval boundary.',
    path: 'docs/03_reimbursement_policy.md',
    content: policyContent,
  },
  {
    id: '04-contract',
    title: 'Reimbursement system contract',
    description: 'The contract for case input, deterministic processing, escalation, authorization, and audit.',
    path: 'docs/04_reimbursement_system_contract.md',
    content: contractContent,
  },
  {
    id: '05-corpus',
    title: 'Reimbursement case corpus',
    description: 'The frozen synthetic 29-case regression corpus and five-case Verify manifest.',
    path: 'docs/05_reimbursement_case_corpus.md',
    content: corpusContent,
  },
  {
    id: '07-architecture',
    title: 'System architecture',
    description: 'System context, layer boundaries, data flow, and append-only persistence design.',
    path: 'docs/07_architecture.md',
    content: architectureContent,
  },
  {
    id: 'adr-006',
    title: 'ADR 006: synthetic and public surfaces',
    description: 'The decision separating the public synthetic Verify surface from private intake.',
    path: 'docs/ADRs/006_synthetic-pilot-and-public-private-surfaces.md',
    content: publicSurfaceAdrContent,
  },
  {
    id: 'policy-forge',
    title: 'Policy Forge reimbursement policy',
    description: 'The canonical synthetic Policy Forge policy source used by the fixture baseline.',
    path: 'policy-forge-baseline/Policy_Hoan_Ung_CLB.md',
    content: policyForgeContent,
  },
  {
    id: 'policy-rules',
    title: 'Policy Forge organization profile',
    description: 'The canonical synthetic organization profile and rule configuration.',
    path: 'policy-forge-baseline/policy_rules.yaml',
    content: policyRulesContent,
  },
];

export const documents = documentDefinitions.map((document) => ({ ...document }));

const caseDescriptions = {
  'TC-R03': 'Routine boundary case just below the 5,000,000 VND threshold.',
  'TC-R04': 'Inclusive routine boundary case exactly at the 5,000,000 VND threshold.',
  'TC-R06': 'Routine case with three eligible lines from different categories.',
  'TC-F01': 'Suspected evidence is unreadable and OCR confidence is low.',
  'TC-A01': 'The eligible amount is just above the routine-processing threshold.',
};

const questionPreviews = {
  'TC-R03': null,
  'TC-R04': null,
  'TC-R06': null,
  'TC-F01':
    'Question for MEMBER (TC-F01): The 900,000 VND printing claim has an unreadable invoice and OCR confidence 0.43. Please reply with a readable, verified invoice confirming the amount; then rerun RULE-FACT-001.',
  'TC-A01':
    'Question for CLUB_CHAIR (TC-A01): The 5,000,001 VND venue claim is above the 5,000,000 VND routine threshold. Please reply with APPROVE or REJECT plus a reason as a separate human decision record; then resume authorized review. No automatic payment occurs.',
};

const reasons = {
  'TC-R03':
    'The 4,999,999 VND eligible amount is below the inclusive routine boundary; the fixture expects RULE-CALC-002 and RULE-ROUTINE-001 while retaining human approval.',
  'TC-R04':
    'The 5,000,000 VND amount is exactly at the inclusive routine boundary and has verified non-cash evidence; the fixture expects RULE-CALC-002 and RULE-ROUTINE-001.',
  'TC-R06':
    'The three eligible lines total 1,400,000 VND and remain within the 2,500,000 VND budget; the fixture expects RULE-CALC-002 and RULE-ROUTINE-001.',
  'TC-F01':
    'The evidence is unreadable and OCR confidence is 0.43, so RULE-FACT-001 escalates the unresolved fact to the MEMBER instead of asserting a result.',
  'TC-A01':
    'The 5,000,001 VND venue amount exceeds the 5,000,000 VND routine threshold, so RULE-AUTH-001 sends the pending decision to the CLUB_CHAIR.',
};

const canonicalCasesById = new Map(
  canonicalTestSuite.cases.map((sourceCase) => [sourceCase.id, sourceCase]),
);

const verifyCasesById = new Map(
  canonicalVerifySuite.cases.map((verifyCase) => [verifyCase.case_id, verifyCase]),
);

export const fixtures = canonicalVerifySuite.cases.map((verifyCase) => {
  const sourceCase = canonicalCasesById.get(verifyCase.case_id);

  if (!sourceCase) {
    throw new Error(`Verify case ${verifyCase.case_id} is missing from test_cases.json`);
  }

  const expected = sourceCase.expected;

  return {
    id: sourceCase.id,
    title: sourceCase.title,
    description: caseDescriptions[sourceCase.id],
    input: sourceCase.input,
    expected: {
      result: expected.processing_result,
      escalationType: expected.escalation_type,
      approvalStatus: expected.approval_status,
      rules: expected.triggered_rule_ids,
    },
    questionPreview: questionPreviews[sourceCase.id],
    reason: reasons[sourceCase.id],
    source: {
      case: sourceCase,
      verify: verifyCasesById.get(sourceCase.id),
    },
  };
});

export function getDocument(id) {
  return documents.find((document) => document.id === id);
}

export function searchDocuments(query = '') {
  const normalizedQuery = String(query).trim().toLowerCase();

  if (!normalizedQuery) {
    return [...documents];
  }

  return documents.filter((document) =>
    [document.id, document.title, document.description, document.path, document.content]
      .join('\n')
      .toLowerCase()
      .includes(normalizedQuery),
  );
}
