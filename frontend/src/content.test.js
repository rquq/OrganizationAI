import { describe, expect, it } from 'vitest';

import canonicalTestSuite from '../../policy-forge-baseline/test_cases.json';
import canonicalVerifySuite from '../../policy-forge-baseline/verify_cases.json';
import {
  FORK_REPO,
  SOURCE_REF,
  SOURCE_REPO,
  documents,
  fixtures,
  getDocument,
  searchDocuments,
} from './content.js';

describe('content catalog', () => {
  it('exposes the versioned source references and current documentation', () => {
    expect(SOURCE_REF).toBe('17cedab2d108958627fdf39f20a36450dfb8b6bd');
    expect(SOURCE_REPO).toBe('Park-Hip/OrganizationAI');
    expect(FORK_REPO).toBe('rquq/OrganizationAI');

    const requiredDocumentIds = [
      'README',
      '00-rubric',
      '01-workflow',
      '02-mvp',
      '03-policy',
      '04-contract',
      '05-corpus',
      '07-architecture',
    ];

    expect(documents.map((document) => document.id)).toEqual(
      expect.arrayContaining(requiredDocumentIds),
    );
    expect(getDocument('README')).toEqual(
      expect.objectContaining({
        path: 'docs/README.md',
        content: expect.stringContaining('Documentation Index'),
      }),
    );
    expect(getDocument('03-policy')).toEqual(
      expect.objectContaining({
        path: 'docs/03_reimbursement_policy.md',
        content: expect.stringContaining('# Reimbursement Processing Policy v1.2'),
      }),
    );
    expect(
      documents.every(
        (document) =>
          Object.keys(document).sort().join(',') ===
          'content,description,id,path,title',
      ),
    ).toBe(true);
  });

  it('gets a document by id without changing the catalog', () => {
    const before = documents.slice();
    const policy = getDocument('03-policy');

    expect(policy).toBeDefined();
    expect(policy.path).toBe('docs/03_reimbursement_policy.md');
    expect(getDocument('does-not-exist')).toBeUndefined();
    expect(documents).toEqual(before);
  });

  it('searches document metadata and raw content case-insensitively', () => {
    expect(searchDocuments('architecture').map((document) => document.id)).toContain(
      '07-architecture',
    );
    expect(searchDocuments('PENDING_HUMAN_APPROVAL').map((document) => document.id)).toContain(
      '04-contract',
    );
    expect(searchDocuments('  05-CORPUS  ').map((document) => document.id)).toEqual([
      '05-corpus',
    ]);
    expect(searchDocuments('')).toEqual(documents);
  });
});

describe('Verify fixture catalog', () => {
  it('contains only the canonical five Verify cases in source order', () => {
    expect(fixtures.map((fixture) => fixture.id)).toEqual(
      canonicalVerifySuite.cases.map((verifyCase) => verifyCase.case_id),
    );
    expect(fixtures).toHaveLength(5);
  });

  it('maps canonical inputs and expected fields without calculating a result', () => {
    for (const fixture of fixtures) {
      const sourceCase = canonicalTestSuite.cases.find((item) => item.id === fixture.id);
      const verifyCase = canonicalVerifySuite.cases.find(
        (item) => item.case_id === fixture.id,
      );

      expect(sourceCase).toBeDefined();
      expect(verifyCase).toBeDefined();
      expect(fixture.input).toEqual(sourceCase.input);
      expect(fixture.expected).toEqual({
        result: sourceCase.expected.processing_result,
        escalationType: sourceCase.expected.escalation_type,
        approvalStatus: sourceCase.expected.approval_status,
        rules: sourceCase.expected.triggered_rule_ids,
      });
      expect(fixture.source.case).toEqual(sourceCase);
      expect(fixture.source.verify).toEqual(verifyCase);
      expect(fixture.questionPreview).toEqual(
        fixture.expected.escalationType === null
          ? null
          : expect.any(String),
      );
      expect(fixture.reason).toEqual(expect.any(String));
    }
  });

  it('keeps authored escalation previews tied to their case facts and human action', () => {
    const evidenceQuestion = fixtures.find((fixture) => fixture.id === 'TC-F01');
    const authorityQuestion = fixtures.find((fixture) => fixture.id === 'TC-A01');

    expect(evidenceQuestion.questionPreview).toContain('TC-F01');
    expect(evidenceQuestion.questionPreview).toContain('900,000 VND printing claim');
    expect(evidenceQuestion.questionPreview).toContain('OCR confidence 0.43');
    expect(evidenceQuestion.questionPreview).toContain('readable, verified invoice');
    expect(evidenceQuestion.questionPreview).toContain('rerun RULE-FACT-001');

    expect(authorityQuestion.questionPreview).toContain('TC-A01');
    expect(authorityQuestion.questionPreview).toContain('5,000,001 VND');
    expect(authorityQuestion.questionPreview).toContain('5,000,000 VND routine threshold');
    expect(authorityQuestion.questionPreview).toContain('APPROVE or REJECT');
    expect(authorityQuestion.questionPreview).toContain('separate human decision record');
    expect(authorityQuestion.questionPreview).toContain('No automatic payment');
  });
});
