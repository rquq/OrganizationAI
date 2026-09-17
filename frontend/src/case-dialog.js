const FLOW_TYPES = ['MEMBER_PAID', 'ADVANCE_SETTLEMENT'];

const FIELD_META = {
  flow_type: { errorId: 'flow-type-error' },
  task_or_event: { errorId: 'task-or-event-error' },
  purpose: { errorId: 'purpose-error' },
  budget_reference: { errorId: 'budget-reference-error' },
  total_vnd: { errorId: 'total-vnd-error' },
  evidence_reference: { errorId: 'evidence-reference-error' },
  advance_reference: { errorId: 'advance-reference-error' },
  advance_amount_vnd: { errorId: 'advance-amount-vnd-error' },
};

const FIELD_ORDER = [
  'flow_type',
  'task_or_event',
  'purpose',
  'budget_reference',
  'total_vnd',
  'evidence_reference',
  'advance_reference',
  'advance_amount_vnd',
];

const REQUIRED_TEXT_FIELDS = [
  ['task_or_event', 'Enter the synthetic task or event.'],
  ['purpose', 'Enter the synthetic purpose.'],
  ['budget_reference', 'Enter a synthetic budget reference.'],
  ['evidence_reference', 'Enter an evidence reference (metadata only).'],
];

function isNonBlank(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveSafeInteger(value) {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0;
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
    return false;
  }

  const number = Number(value.trim());
  return Number.isSafeInteger(number) && number > 0;
}

/**
 * Validate only the local draft fields. This function has no DOM, network, or
 * persistence dependency and deliberately does not validate server-owned data.
 */
export function validateDraft(data = {}) {
  const errors = {};

  if (!FLOW_TYPES.includes(data.flow_type)) {
    errors.flow_type = 'Choose how this synthetic case was paid.';
  }

  for (const [field, message] of REQUIRED_TEXT_FIELDS) {
    if (!isNonBlank(data[field])) errors[field] = message;
  }

  if (!isPositiveSafeInteger(data.total_vnd)) {
    errors.total_vnd = 'Enter a positive safe integer amount in VND.';
  }

  if (data.flow_type === 'ADVANCE_SETTLEMENT') {
    if (!isNonBlank(data.advance_reference)) {
      errors.advance_reference = 'Enter the synthetic advance reference.';
    }
    if (!isPositiveSafeInteger(data.advance_amount_vnd)) {
      errors.advance_amount_vnd = 'Enter a positive safe integer advance amount in VND.';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function inputValue(data, ...keys) {
  for (const key of keys) {
    if (data && data[key] !== undefined && data[key] !== null) return data[key];
  }
  return '';
}

function fixtureDefaults(fixture = {}) {
  const input = fixture && typeof fixture.input === 'object' && fixture.input ? fixture.input : {};
  const expense = input.expense && typeof input.expense === 'object' ? input.expense : {};
  const evidence = input.evidence && typeof input.evidence === 'object' ? input.evidence : {};
  const budget = input.budget && typeof input.budget === 'object' ? input.budget : {};
  const items = Array.isArray(expense.items) ? expense.items : [];
  const itemTotal = items.reduce((sum, item) => {
    const amount = Number(item && item.amount_vnd);
    return Number.isSafeInteger(amount) && amount > 0 ? sum + amount : sum;
  }, 0);

  return {
    flow_type: inputValue(input, 'flow_type') || 'MEMBER_PAID',
    task_or_event: inputValue(input, 'task_or_event') || inputValue(fixture, 'title'),
    purpose: inputValue(input, 'purpose'),
    budget_reference: inputValue(input, 'budget_reference', 'budget_code') || inputValue(budget, 'reference', 'code'),
    total_vnd: inputValue(input, 'total_vnd') || inputValue(expense, 'total_vnd') || (itemTotal || ''),
    evidence_reference: inputValue(input, 'evidence_reference') || inputValue(evidence, 'reference', 'evidence_reference', 'evidence_id'),
    advance_reference: inputValue(input, 'advance_reference') || inputValue(evidence, 'advance_reference'),
    advance_amount_vnd: inputValue(input, 'advance_amount_vnd'),
  };
}

function createMarkup(document) {
  const dialog = document.createElement('dialog');
  dialog.className = 'case-dialog dialog-backdrop';
  dialog.tabIndex = -1;
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'case-dialog-title');
  dialog.setAttribute('aria-describedby', 'case-dialog-description');
  dialog.innerHTML = `
    <div class="dialog-shell">
      <header class="dialog-header">
        <div>
          <p class="dialog-eyebrow">Synthetic intake</p>
          <h2 id="case-dialog-title">Start synthetic case</h2>
          <p id="case-dialog-description" class="dialog-description">Prepare a local draft for the reimbursement v1 pilot.</p>
          <p class="dialog-fixture-context" data-fixture-context hidden></p>
        </div>
        <button class="dialog-close" type="button" data-action="close" aria-label="Close case dialog">×</button>
      </header>

      <div class="dialog-body">
        <div class="dialog-notice" role="status">Synthetic only. No payments, uploads, or real financial information.</div>

        <form class="case-form" novalidate>
          <fieldset class="flow-choice">
            <legend>Payment flow</legend>
            <div class="flow-options">
              <label class="flow-option"><input type="radio" name="flow_type" value="MEMBER_PAID" checked aria-describedby="flow-type-error"> <span>Member paid</span></label>
              <label class="flow-option"><input type="radio" name="flow_type" value="ADVANCE_SETTLEMENT" aria-describedby="flow-type-error"> <span>Advance settlement</span></label>
            </div>
            <p class="field-error" id="flow-type-error" data-error-for="flow_type" role="alert"></p>
          </fieldset>

          <div class="form-field">
            <label for="task-or-event">Synthetic task or event</label>
            <input id="task-or-event" name="task_or_event" type="text" autocomplete="off" required aria-describedby="task-or-event-error">
            <p class="field-help">Use a non-sensitive event label.</p>
            <p class="field-error" id="task-or-event-error" data-error-for="task_or_event" role="alert"></p>
          </div>

          <div class="form-field">
            <label for="purpose">Synthetic purpose</label>
            <textarea id="purpose" name="purpose" rows="3" required aria-describedby="purpose-error"></textarea>
            <p class="field-error" id="purpose-error" data-error-for="purpose" role="alert"></p>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label for="budget-reference">Budget reference</label>
              <input id="budget-reference" name="budget_reference" type="text" autocomplete="off" required aria-describedby="budget-reference-error">
              <p class="field-error" id="budget-reference-error" data-error-for="budget_reference" role="alert"></p>
            </div>
            <div class="form-field">
              <label for="total-vnd">Total (VND)</label>
              <input id="total-vnd" name="total_vnd" type="number" inputmode="numeric" min="1" step="1" autocomplete="off" required aria-describedby="total-vnd-error">
              <p class="field-error" id="total-vnd-error" data-error-for="total_vnd" role="alert"></p>
            </div>
          </div>

          <div class="form-field">
            <label for="evidence-reference">Evidence reference</label>
            <input id="evidence-reference" name="evidence_reference" type="text" autocomplete="off" required aria-describedby="evidence-reference-error">
            <p class="field-help">Metadata/reference only; do not attach or upload evidence here.</p>
            <p class="field-error" id="evidence-reference-error" data-error-for="evidence_reference" role="alert"></p>
          </div>

          <div class="advance-fields" data-conditional="advance" hidden>
            <p class="conditional-heading">Advance details</p>
            <div class="form-grid">
              <div class="form-field">
                <label for="advance-reference">Advance reference</label>
                <input id="advance-reference" name="advance_reference" type="text" autocomplete="off" aria-describedby="advance-reference-error">
                <p class="field-error" id="advance-reference-error" data-error-for="advance_reference" role="alert"></p>
              </div>
              <div class="form-field">
                <label for="advance-amount-vnd">Advance amount (VND)</label>
                <input id="advance-amount-vnd" name="advance_amount_vnd" type="number" inputmode="numeric" min="1" step="1" autocomplete="off" aria-describedby="advance-amount-vnd-error">
                <p class="field-error" id="advance-amount-vnd-error" data-error-for="advance_amount_vnd" role="alert"></p>
              </div>
            </div>
          </div>

          <div class="draft-preview" data-preview hidden aria-live="polite" aria-readonly="true">
            <h3>Draft preview</h3>
            <p data-preview-status>Preview generated locally.</p>
            <pre class="draft-preview-content" data-preview-content></pre>
            <p class="draft-preview-note">Draft preview only. Not submitted or evaluated.</p>
          </div>
          <p class="preview-status" data-preview-status role="status">Complete the fields to preview this draft.</p>

          <footer class="dialog-footer">
            <button class="button-secondary" type="button" data-action="cancel">Cancel</button>
            <button class="button-primary" type="submit" data-action="preview">Preview draft</button>
            <button class="button-disabled" type="button" data-action="submit" disabled aria-disabled="true">Submit case (v1 API pending)</button>
          </footer>
        </form>
      </div>
    </div>
  `;
  return dialog;
}

function formDataFromDialog(dialog) {
  const form = dialog.querySelector('form');
  const flow = form.querySelector('[name="flow_type"]:checked')?.value || '';
  const values = {
    flow_type: flow,
    task_or_event: form.elements.task_or_event.value,
    purpose: form.elements.purpose.value,
    budget_reference: form.elements.budget_reference.value,
    total_vnd: form.elements.total_vnd.value,
    evidence_reference: form.elements.evidence_reference.value,
  };

  if (flow === 'ADVANCE_SETTLEMENT') {
    values.advance_reference = form.elements.advance_reference.value;
    values.advance_amount_vnd = form.elements.advance_amount_vnd.value;
  }

  return values;
}

function draftFromFormData(data) {
  const draft = {
    flow_type: data.flow_type,
    task_or_event: data.task_or_event.trim(),
    purpose: data.purpose.trim(),
    budget_reference: data.budget_reference.trim(),
    total_vnd: Number(data.total_vnd),
    evidence_reference: data.evidence_reference.trim(),
  };

  if (data.flow_type === 'ADVANCE_SETTLEMENT') {
    draft.advance_reference = data.advance_reference.trim();
    draft.advance_amount_vnd = Number(data.advance_amount_vnd);
  }
  return draft;
}

function applyFixture(dialog, fixture) {
  const defaults = fixtureDefaults(fixture);
  const form = dialog.querySelector('form');
  const flow = form.querySelector(`[name="flow_type"][value="${defaults.flow_type}"]`);
  if (flow) flow.checked = true;

  for (const field of ['task_or_event', 'purpose', 'budget_reference', 'total_vnd', 'evidence_reference', 'advance_reference', 'advance_amount_vnd']) {
    if (defaults[field] !== '') form.elements[field].value = String(defaults[field]);
  }

  if (fixture && isNonBlank(fixture.title)) {
    const context = dialog.querySelector('[data-fixture-context]');
    context.textContent = `Using synthetic fixture: ${fixture.title}`;
    context.hidden = false;
  }
}

function setAdvanceVisibility(dialog, visible) {
  const container = dialog.querySelector('[data-conditional="advance"]');
  container.hidden = !visible;
  for (const field of container.querySelectorAll('input')) field.required = visible;
}

function renderErrors(dialog, errors) {
  for (const [field, meta] of Object.entries(FIELD_META)) {
    const error = dialog.querySelector(`#${meta.errorId}`);
    const controls = [...dialog.querySelectorAll(`[name="${field}"]`)];
    const message = errors[field] || '';
    error.textContent = message;
    for (const control of controls) {
      if (message) {
        control.setAttribute('aria-invalid', 'true');
      } else {
        control.setAttribute('aria-invalid', 'false');
      }
    }
  }
}

function focusFirstInvalid(dialog, errors) {
  const field = FIELD_ORDER.find((name) => errors[name]);
  if (!field) return;
  const control = dialog.querySelector(`[name="${field}"]`);
  if (control) control.focus();
}

function clearPreview(dialog, message = 'Draft edited. Preview cleared; preview again when ready.') {
  const preview = dialog.querySelector('[data-preview]');
  preview.hidden = true;
  dialog.querySelector('[data-preview-content]').textContent = '';
  dialog.querySelectorAll('[data-preview-status]').forEach((status) => {
    status.textContent = message;
  });
}

function renderPreview(dialog, draft) {
  const preview = dialog.querySelector('[data-preview]');
  preview.querySelector('[data-preview-content]').textContent = JSON.stringify(draft, null, 2);
  dialog.querySelectorAll('[data-preview-status]').forEach((status) => {
    status.textContent = 'Preview generated locally. No request was sent.';
  });
  preview.hidden = false;
  dialog.querySelector('.preview-status').textContent = 'Draft is ready for local review.';
}

function focusableElements(dialog) {
  return [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.closest('[hidden]'));
}

function openDialogElement(dialog, fallback) {
  if (!fallback && typeof dialog.showModal === 'function') {
    try {
      dialog.showModal();
      return false;
    } catch {
      // A detached or already-open dialog can fail in a browser; fallback is safe.
    }
  }
  dialog.setAttribute('open', '');
  return true;
}

function inertBodySiblings(dialog) {
  const states = [...document.body.children]
    .filter((element) => element !== dialog)
    .map((element) => ({
      element,
      hadAttribute: element.hasAttribute('inert'),
      propertyValue: 'inert' in element ? element.inert : undefined,
    }));

  for (const { element } of states) {
    element.setAttribute('inert', '');
    if ('inert' in element) element.inert = true;
  }
  return () => {
    for (const { element, hadAttribute, propertyValue } of states) {
      if (hadAttribute) element.setAttribute('inert', '');
      else element.removeAttribute('inert');
      if ('inert' in element) element.inert = propertyValue;
    }
  };
}

/**
 * Append and open a local synthetic-case dialog. The returned element exposes
 * the native HTMLDialogElement API and is removed from the document on close.
 */
export function openCaseDialog({ trigger, fixture } = {}) {
  if (typeof document === 'undefined') throw new Error('openCaseDialog requires a document');

  const dialog = createMarkup(document);
  const returnFocus = trigger && typeof trigger.focus === 'function'
    ? trigger
    : (document.activeElement && typeof document.activeElement.focus === 'function' ? document.activeElement : null);
  const priorOverflow = document.body.style.overflow;
  const nativeModal = typeof dialog.showModal === 'function';
  let fallback = !nativeModal;
  let closed = false;
  let restoreBodySiblings = () => {};

  dialog.dataset.dialogMode = fallback ? 'fallback' : 'native';
  document.body.append(dialog);
  if (fixture) applyFixture(dialog, fixture);

  const closeDialog = () => {
    if (closed) return;
    if (!fallback && dialog.open && typeof dialog.close === 'function') {
      dialog.close();
      return;
    }
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
  };

  const onClose = () => {
    if (closed) return;
    closed = true;
    document.body.style.overflow = priorOverflow;
    restoreBodySiblings();
    dialog.remove();
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
  };

  dialog.addEventListener('close', onClose);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener('focusin', (event) => {
    if (fallback || !dialog.contains(event.target)) {
      const focusable = focusableElements(dialog);
      if (focusable.length && !dialog.contains(event.target)) focusable[0].focus();
    }
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = focusableElements(dialog);
    if (!focusable.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const form = dialog.querySelector('form');
  const onEdit = () => clearPreview(dialog);
  form.addEventListener('input', onEdit);
  form.addEventListener('change', (event) => {
    if (event.target.name === 'flow_type') {
      setAdvanceVisibility(dialog, event.target.value === 'ADVANCE_SETTLEMENT');
    }
    onEdit();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = formDataFromDialog(dialog);
    const validation = validateDraft(values);
    renderErrors(dialog, validation.errors);
    if (!validation.valid) {
      clearPreview(dialog, 'Complete the highlighted fields to preview this draft.');
      focusFirstInvalid(dialog, validation.errors);
      return;
    }
    renderPreview(dialog, draftFromFormData(values));
  });
  dialog.querySelector('[data-action="close"]').addEventListener('click', closeDialog);
  dialog.querySelector('[data-action="cancel"]').addEventListener('click', closeDialog);

  setAdvanceVisibility(dialog, form.querySelector('[name="flow_type"]:checked')?.value === 'ADVANCE_SETTLEMENT');
  document.body.style.overflow = 'hidden';
  fallback = openDialogElement(dialog, fallback);
  dialog.dataset.dialogMode = fallback ? 'fallback' : 'native';
  if (fallback) restoreBodySiblings = inertBodySiblings(dialog);
  dialog.querySelector('[data-action="close"]').focus();
  return dialog;
}
