// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { openCaseDialog, validateDraft } from './case-dialog.js';

const validMemberDraft = {
  flow_type: 'MEMBER_PAID',
  task_or_event: 'Synthetic orientation event',
  purpose: 'Printed synthetic materials',
  budget_reference: 'BUDGET-SYN-001',
  total_vnd: '850000',
  evidence_reference: 'EVIDENCE-SYN-001',
};

function fillDraft(dialog, draft = validMemberDraft) {
  for (const [name, value] of Object.entries(draft)) {
    const field = dialog.querySelector(`[name="${name}"]`);
    if (!field) continue;
    if (field.type === 'radio') {
      const option = dialog.querySelector(`[name="${name}"][value="${value}"]`);
      option.checked = true;
    } else {
      field.value = value;
    }
  }
}

afterEach(() => {
  document.querySelectorAll('.case-dialog').forEach((dialog) => dialog.remove());
  document.body.style.overflow = '';
});

describe('validateDraft', () => {
  it('reports required fields and invalid money without accepting a partial draft', () => {
    const result = validateDraft({
      flow_type: 'MEMBER_PAID',
      task_or_event: '   ',
      purpose: '',
      budget_reference: '',
      total_vnd: '1.5',
      evidence_reference: '   ',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toMatchObject({
      task_or_event: expect.any(String),
      purpose: expect.any(String),
      budget_reference: expect.any(String),
      total_vnd: expect.any(String),
      evidence_reference: expect.any(String),
    });
  });

  it('requires advance reference and a positive safe integer only for advance settlement', () => {
    expect(validateDraft(validMemberDraft).valid).toBe(true);

    const missingAdvance = validateDraft({
      ...validMemberDraft,
      flow_type: 'ADVANCE_SETTLEMENT',
    });
    expect(missingAdvance.valid).toBe(false);
    expect(missingAdvance.errors).toMatchObject({
      advance_reference: expect.any(String),
      advance_amount_vnd: expect.any(String),
    });

    const validAdvance = validateDraft({
      ...validMemberDraft,
      flow_type: 'ADVANCE_SETTLEMENT',
      advance_reference: 'ADV-SYN-001',
      advance_amount_vnd: '1000000',
    });
    expect(validAdvance).toEqual({ valid: true, errors: {} });

    const unsafeAdvance = validateDraft({
      ...validMemberDraft,
      flow_type: 'ADVANCE_SETTLEMENT',
      advance_reference: 'ADV-SYN-001',
      advance_amount_vnd: Number.MAX_SAFE_INTEGER + 1,
    });
    expect(unsafeAdvance.valid).toBe(false);
    expect(unsafeAdvance.errors.advance_amount_vnd).toEqual(expect.any(String));
  });
});

describe('openCaseDialog', () => {
  it('shows inline errors, marks fields, and focuses the first invalid field', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Start synthetic case';
    document.body.append(trigger);
    trigger.focus();

    const dialog = openCaseDialog({ trigger });
    dialog.querySelector('[data-action="preview"]').click();

    const firstInvalid = dialog.querySelector('[name="task_or_event"]');
    expect(firstInvalid.getAttribute('aria-invalid')).toBe('true');
    expect(firstInvalid.getAttribute('aria-describedby')).toContain('task-or-event-error');
    expect(dialog.querySelector('#task-or-event-error').textContent).toMatch(/required|enter/i);
    expect(document.activeElement).toBe(firstInvalid);
    expect(dialog.querySelector('[data-preview]').hidden).toBe(true);
  });

  it('prefills a canonical synthetic fixture and reveals advance fields conditionally', () => {
    const dialog = openCaseDialog({
      fixture: {
        id: 'TC-SYN-01',
        title: 'Synthetic advance fixture',
        input: {
          flow_type: 'ADVANCE_SETTLEMENT',
          purpose: 'Fixture purpose',
          task_or_event: 'Fixture event',
          advance_reference: 'ADV-FIXTURE-001',
          advance_amount_vnd: 1200000,
          budget: { remaining_vnd: 3000000 },
          expense: { total_vnd: 900000 },
          evidence: { reference: 'EVIDENCE-FIXTURE-001' },
        },
      },
    });

    expect(dialog.querySelector('[name="purpose"]').value).toBe('Fixture purpose');
    expect(dialog.querySelector('[name="task_or_event"]').value).toBe('Fixture event');
    expect(dialog.querySelector('[name="advance_reference"]').value).toBe('ADV-FIXTURE-001');
    expect(dialog.querySelector('[name="advance_amount_vnd"]').value).toBe('1200000');
    expect(dialog.querySelector('[name="advance_reference"]').closest('[data-conditional]').hidden).toBe(false);
    expect(dialog.textContent).toContain('Synthetic advance fixture');
    expect(dialog.querySelector('[name="evidence_reference"]').value).toBe('EVIDENCE-FIXTURE-001');
  });

  it('renders an escaped read-only preview and never submits or requests data', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('network should not be called');
    });
    const dialog = openCaseDialog();
    fillDraft(dialog, {
      ...validMemberDraft,
      purpose: '<img src=x onerror="alert(1)"> & synthetic',
    });

    const previewButton = dialog.querySelector('[data-action="preview"]');
    previewButton.click();

    const preview = dialog.querySelector('[data-preview]');
    expect(preview.hidden).toBe(false);
    const previewContent = preview.querySelector('[data-preview-content]');
    expect(previewContent.querySelector('img')).toBeNull();
    expect(JSON.parse(previewContent.textContent).purpose).toBe('<img src=x onerror="alert(1)"> & synthetic');
    expect(preview.getAttribute('aria-readonly')).toBe('true');
    expect(dialog.textContent).toContain('Draft preview only. Not submitted or evaluated.');
    expect(dialog.querySelector('[data-action="submit"]').disabled).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('returns focus to the trigger and restores body scrolling when closed', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    document.body.style.overflow = 'auto';

    const dialog = openCaseDialog({ trigger });
    expect(document.body.style.overflow).toBe('hidden');
    dialog.querySelector('[data-action="close"]').click();

    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe('auto');
    expect(document.body.contains(dialog)).toBe(false);
  });

  it('clears a previously rendered preview as soon as the draft is edited', () => {
    const dialog = openCaseDialog();
    fillDraft(dialog);
    dialog.querySelector('[data-action="preview"]').click();
    expect(dialog.querySelector('[data-preview]').hidden).toBe(false);

    const purpose = dialog.querySelector('[name="purpose"]');
    purpose.value = 'Edited synthetic purpose';
    purpose.dispatchEvent(new Event('input', { bubbles: true }));

    expect(dialog.querySelector('[data-preview]').hidden).toBe(true);
    expect(dialog.querySelector('[data-preview-status]').textContent).toContain('edited');
  });

  it('wraps fallback focus with Shift+Tab, restores inert siblings, and closes from Escape', () => {
    const background = document.createElement('button');
    background.textContent = 'Background';
    document.body.append(background);
    const alreadyInert = document.createElement('div');
    alreadyInert.setAttribute('inert', '');
    document.body.append(alreadyInert);

    const dialog = openCaseDialog();
    const close = dialog.querySelector('[data-action="close"]');
    const last = dialog.querySelector('[data-action="preview"]');
    expect(dialog.dataset.dialogMode).toBe('fallback');
    expect(background.hasAttribute('inert')).toBe(true);
    expect(alreadyInert.hasAttribute('inert')).toBe(true);

    close.focus();
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(last);
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(close);

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.body.contains(dialog)).toBe(false);
    expect(background.hasAttribute('inert')).toBe(false);
    expect(alreadyInert.hasAttribute('inert')).toBe(true);
  });
});
