import { ApiError, createTrace, sendControl } from "./api.js";
import { controlAvailability } from "./control.js";
import { TEMPORARY_FIXTURES, buildRunSubmission } from "./fixtures.js";
import "./styles.css";

const TEMPORARY_BOUNDARY =
  "Temporary development · Synthetic only · Unvalidated workflow · No payment · No real authority";

function escapeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function jsonForDisplay(value) {
  return escapeText(JSON.stringify(value ?? {}, null, 2));
}

function outcomeClass(outcome) {
  return `outcome-${String(outcome ?? "unknown").toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;
}

function runKey(prefix = "demo") {
  return `${prefix}-${Date.now().toString(36)}`;
}

export async function runVerify(fixtures = TEMPORARY_FIXTURES, submit = createTrace) {
  const results = [];
  const verificationRunKey = runKey("verify");
  for (const fixture of fixtures) {
    try {
      const trace = await submit(buildRunSubmission(fixture, `${verificationRunKey}-${fixture.id.toLowerCase()}`));
      const actual = {
        outcome: trace.decision?.outcome ?? null,
        ruleId: trace.decision?.applied_rule_id ?? null,
      };
      const status =
        actual.outcome === fixture.expected.outcome && actual.ruleId === fixture.expected.ruleId
          ? "PASS"
          : "MISMATCH";
      results.push({
        fixtureId: fixture.id,
        label: fixture.label,
        expected: fixture.expected,
        actual,
        traceId: trace.trace_id ?? null,
        trace,
        status,
      });
    } catch (error) {
      results.push({
        fixtureId: fixture.id,
        label: fixture.label,
        expected: fixture.expected,
        actual: null,
        traceId: null,
        error: error instanceof ApiError ? error.message : "The browser could not reach the synthetic backend.",
        status: "ERROR",
      });
    }
  }
  return results;
}

function renderVerifyResults(results) {
  const passed = results.filter((result) => result.status === "PASS").length;
  const rows = results
    .map(
      (result, index) => `
        <tr>
          <th scope="row">${escapeText(result.fixtureId)}</th>
          <td>${escapeText(result.expected.outcome)}<br /><small>${escapeText(result.expected.ruleId)}</small></td>
          <td>${result.actual ? `${escapeText(result.actual.outcome)}<br /><small>${escapeText(result.actual.ruleId)}</small>` : escapeText(result.error)}</td>
          <td><span class="verify-status verify-${result.status.toLowerCase()}">${escapeText(result.status)}</span></td>
          <td>${result.trace ? `<button class="text-button" type="button" data-verify-inspect="${index}">Inspect trace</button>` : "—"}</td>
        </tr>
      `,
    )
    .join("");
  return `
    <p class="verify-summary">${passed} of ${results.length} fixture checks matched the backend response.</p>
    <div class="table-scroll"><table class="verify-table"><thead><tr><th>Fixture</th><th>Expected fixture</th><th>Actual backend result</th><th>Check</th><th>Audit</th></tr></thead><tbody>${rows}</tbody></table></div>
  `;
}

function bindVerify(root) {
  const button = root.querySelector("#run-verify");
  const feedback = root.querySelector("#verify-feedback");
  const resultsRoot = root.querySelector("#verify-results");
  const resultRoot = root.querySelector("#result");
  button.addEventListener("click", async () => {
    button.disabled = true;
    feedback.textContent = "Checking all six synthetic fixtures against backend results…";
    const results = await runVerify();
    resultsRoot.innerHTML = renderVerifyResults(results);
    feedback.textContent = "Fixture check complete. Inspect any stored trace below.";
    button.disabled = false;
    root.querySelectorAll("[data-verify-inspect]").forEach((inspectButton) => {
      inspectButton.addEventListener("click", () => {
        const result = results[Number(inspectButton.dataset.verifyInspect)];
        renderTrace(resultRoot, result.trace);
        resultRoot.focus();
      });
    });
  });
}

function reviewButton(label, action, enabled) {
  return `<button class="control-button" type="button" data-control-action="${action}" ${enabled ? "" : "disabled"}>${label}</button>`;
}

function renderControlPanel(trace) {
  const available = controlAvailability(trace.control_state);
  const canControl = Boolean(trace.trace_id);
  return `
    <section class="control-deck" aria-labelledby="control-deck-title">
      <div>
        <p class="eyebrow">Synthetic Control Deck</p>
        <h3 id="control-deck-title">Inspect a labelled demo action</h3>
        <p>Records are append-only. These controls do not approve, reject, or pay a real claim.</p>
      </div>
      <label for="synthetic-review-reason">Synthetic reason required for a control action</label>
      <input id="synthetic-review-reason" name="synthetic-review-reason" type="text" autocomplete="off" placeholder="Example: Demonstrate the temporary audit trail" />
      <p id="control-feedback" class="form-feedback" aria-live="assertive"></p>
      <div class="control-grid">
        ${reviewButton("Approve (synthetic demo record)", "allow", canControl && available.allow)}
        ${reviewButton("Reject (synthetic demo record)", "decline", canControl && available.decline)}
        ${reviewButton("Pause synthetic case", "pause", canControl && available.pause)}
        ${reviewButton("Resume synthetic case", "resume", canControl && available.resume)}
        ${reviewButton("Undo last demo action", "undo", canControl && available.undo)}
      </div>
      <p class="control-disclosure">Records a synthetic demo label only. No payment or real authority.</p>
      <p class="control-state">Returned control state: <strong>${escapeText(trace.control_state)}</strong></p>
    </section>
  `;
}

function renderAuditEvents(events = []) {
  return [...events]
    .sort((left, right) => left.sequence_number - right.sequence_number)
    .map(
      (event) => `
        <li data-audit-event>
          <p><strong>${escapeText(event.sequence_number)}. ${escapeText(event.action)}</strong></p>
          <p>${escapeText(event.actor_type)} · ${escapeText(event.recorded_at)}</p>
          <pre>${jsonForDisplay(event.payload)}</pre>
        </li>
      `,
    )
    .join("");
}

function bindControlActions(root, trace) {
  root.querySelectorAll("[data-control-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const feedback = root.querySelector("#control-feedback");
      const reason = root.querySelector("#synthetic-review-reason").value.trim();
      if (!reason) {
        feedback.textContent = "Enter a synthetic reason before recording a control action.";
        return;
      }

      const action = button.dataset.controlAction;
      const command = {
        reason,
        idempotency_key: `${trace.trace_id}-${action}-${runKey("control")}`,
      };
      if (action === "allow" || action === "decline") {
        command.command = "record_demo_review";
        command.disposition = action === "allow" ? "DEMO_ALLOW" : "DEMO_DECLINE";
      } else {
        command.command = action;
      }

      feedback.textContent = "Recording synthetic control event…";
      try {
        const result = await sendControl(trace.trace_id, command);
        renderTrace(root, result);
      } catch (error) {
        feedback.textContent =
          error instanceof ApiError
            ? error.message
            : "The synthetic control request could not be completed.";
      }
    });
  });
}

export function renderTrace(root, trace) {
  const decision = trace.decision ?? {};
  const provenance = trace.provenance ?? {};
  root.innerHTML = `
    <section class="trace-card" aria-labelledby="decision-title">
      <div class="trace-card-header">
        <div>
          <p class="eyebrow">Backend decision · stored trace</p>
          <h2 id="decision-title">${escapeText(decision.outcome)}</h2>
        </div>
        <span class="outcome-badge ${outcomeClass(decision.outcome)}">${escapeText(decision.applied_rule_id)}</span>
      </div>
      <p class="result-reason">${escapeText(decision.reason)}</p>
      <p class="no-payment-note">No payment was made. This result does not create payment, reimbursement, or real Treasurer authority.</p>
      ${decision.question ? `<aside class="question-card"><strong>Specific next question</strong><p>${escapeText(decision.question)}</p></aside>` : ""}
      <p class="temporary-notice">${escapeText(trace.temporary_notice)}</p>
      <dl class="provenance-grid">
        <div><dt>Profile</dt><dd>${escapeText(provenance.profile_id)}</dd></div>
        <div><dt>Source</dt><dd>${escapeText(provenance.profile_source)}</dd></div>
        <div><dt>Data</dt><dd>${escapeText(provenance.data_class)}</dd></div>
        <div><dt>Validation</dt><dd>${escapeText(provenance.workflow_validation_status)}</dd></div>
      </dl>
      ${renderControlPanel(trace)}
      <details class="audit-details" open>
        <summary>Audit trail · ${trace.events?.length ?? 0} stored events</summary>
        <ol class="audit-list">${renderAuditEvents(trace.events)}</ol>
      </details>
      <details class="snapshot-details">
        <summary>Stored input and facts used</summary>
        <div class="snapshot-grid">
          <div><h3>Original submission</h3><pre>${jsonForDisplay(trace.submission)}</pre></div>
          <div><h3>Facts used</h3><pre>${jsonForDisplay(trace.facts_used)}</pre></div>
        </div>
      </details>
    </section>
  `;
  bindControlActions(root, trace);
}

function formSubmission(form) {
  const fields = new FormData(form);
  const caseId = fields.get("case_id").trim();
  if (!caseId) {
    throw new Error("A synthetic case ID is required before submission.");
  }
  const amount = fields.get("amount_vnd").trim();
  return {
    case_id: caseId,
    submitted_at: fields.get("submitted_at"),
    requester_role: fields.get("requester_role").trim() || null,
    purpose: fields.get("purpose").trim() || null,
    expense: {
      category: fields.get("category") || null,
      description: fields.get("description").trim() || null,
      amount_vnd: amount ? Number(amount) : null,
      expense_date: fields.get("expense_date") || null,
      evidence_status: fields.get("evidence_status") || null,
    },
  };
}

function loadFixture(form, fixture) {
  const submission = buildRunSubmission(fixture, runKey("select"));
  form.elements.case_id.value = submission.case_id;
  form.elements.submitted_at.value = submission.submitted_at.slice(0, 16);
  form.elements.requester_role.value = submission.requester_role ?? "";
  form.elements.purpose.value = submission.purpose ?? "";
  form.elements.category.value = submission.expense?.category ?? "";
  form.elements.description.value = submission.expense?.description ?? "";
  form.elements.amount_vnd.value = submission.expense?.amount_vnd ?? "";
  form.elements.expense_date.value = submission.expense?.expense_date ?? "";
  form.elements.evidence_status.value = submission.expense?.evidence_status ?? "";
}

async function submitForm(root, form) {
  const feedback = root.querySelector("#form-feedback");
  const resultRoot = root.querySelector("#result");
  let submission;
  try {
    submission = formSubmission(form);
  } catch (error) {
    feedback.textContent = error.message;
    return;
  }

  feedback.textContent = "Submitting the synthetic case to the backend…";
  try {
    const trace = await createTrace(submission);
    feedback.textContent = "Stored backend result received.";
    renderTrace(resultRoot, trace);
    resultRoot.focus();
  } catch (error) {
    if (error instanceof ApiError) {
      const code = error.payload?.error?.code ? `${error.payload.error.code}: ` : "";
      feedback.textContent = `${code}${error.message}`;
      if (error.payload?.temporary_notice) {
        resultRoot.innerHTML = `<p class="error-card" role="alert">${escapeText(error.payload.temporary_notice)}</p>`;
      }
      return;
    }
    feedback.textContent = "The browser could not reach the synthetic backend.";
  }
}

export function renderShell(root) {
  const fixtureButtons = TEMPORARY_FIXTURES.map(
    (fixture) => `<button class="fixture-button" type="button" data-fixture-id="${fixture.id}"><strong>${fixture.id}</strong><span>${escapeText(fixture.label)}</span></button>`,
  ).join("");
  const now = new Date().toISOString().slice(0, 16);
  root.innerHTML = `
    <div id="boundary-notice" class="boundary-notice" role="status">${TEMPORARY_BOUNDARY.split(" · ").map((item) => `<span>${item}</span>`).join("")}</div>
    <header class="hero">
      <p class="eyebrow">OrganizationalAI · decision walkthrough</p>
      <h1>Synthetic Decision Desk</h1>
      <p>Try a synthetic case. The backend—not this page—returns each result, reason, rule, question, and audit trail.</p>
      <button id="start-case" class="primary-button" type="button">Start a synthetic case</button>
    </header>
    <div class="workspace">
      <section class="entry-card" aria-labelledby="entry-title">
        <div class="section-heading"><p class="eyebrow">Step 1</p><h2 id="entry-title">Choose a synthetic starting point</h2></div>
        <div class="fixture-grid">${fixtureButtons}</div>
        <p class="helper-text">Or enter a new synthetic case below. Blank business fields are deliberately sent to the backend so it can return a safe missing-fact result.</p>
        <form id="case-form" novalidate>
          <div class="form-grid">
            <label>Synthetic case ID<input name="case_id" id="case-id" autocomplete="off" placeholder="SYN-DEMO-001" /></label>
            <label>Submitted at<input name="submitted_at" type="datetime-local" value="${now}" required /></label>
            <label>Synthetic requester role<input name="requester_role" autocomplete="off" value="TEST_REQUESTER" /></label>
            <label>Synthetic purpose<input name="purpose" autocomplete="off" placeholder="What is this synthetic expense for?" /></label>
            <label>Temporary category<select name="category"><option value="">Choose a temporary category</option><option value="TEST_ALLOWED">TEST_ALLOWED</option><option value="TEST_BLOCKED">TEST_BLOCKED</option></select></label>
            <label>Declared evidence<select name="evidence_status"><option value="">Choose a declaration</option><option value="PRESENT">PRESENT</option><option value="NOT_PROVIDED">NOT_PROVIDED</option></select></label>
            <label class="span-two">Synthetic expense description<input name="description" autocomplete="off" placeholder="One synthetic line only" /></label>
            <label>Synthetic amount (VND)<input name="amount_vnd" type="number" min="1" step="1" inputmode="numeric" /></label>
            <label>Synthetic expense date<input name="expense_date" type="date" /></label>
          </div>
          <div class="form-actions"><button class="primary-button" type="submit">Ask the synthetic backend</button><p id="form-feedback" class="form-feedback" aria-live="assertive"></p></div>
        </form>
        <section class="verify-card" aria-labelledby="verify-title">
          <div>
            <p class="eyebrow">Step 2 · repeatable check</p>
            <h3 id="verify-title">Verify the six synthetic fixtures</h3>
            <p>Expected fixture values are compared with the response returned by the backend. This page never determines the policy outcome.</p>
          </div>
          <button id="run-verify" class="secondary-button" type="button">Run Verify fixtures</button>
          <p id="verify-feedback" class="form-feedback" aria-live="assertive"></p>
          <div id="verify-results" aria-live="polite"></div>
        </section>
        <aside class="policy-reference" aria-labelledby="policy-reference-title">
          <p class="eyebrow">Provisional policy reference</p>
          <h3 id="policy-reference-title">Policy Forge baseline is not live</h3>
          <p><a id="policy-forge-link" href="https://github.com/Park-Hip/OrganizationAI/tree/docs/policy-forge-provisional-baseline" target="_blank" rel="noreferrer">Read POL-REIMB-CLB v1.1.0</a>. It is a provisional reference only and is not wired to this temporary backend.</p>
        </aside>
      </section>
      <section id="result" class="result-region" tabindex="-1" aria-live="polite"><p class="empty-result">Choose a fixture or submit a synthetic case to see the backend result here.</p></section>
    </div>
  `;

  const form = root.querySelector("#case-form");
  root.querySelector("#start-case").addEventListener("click", () => form.elements.case_id.focus());
  root.querySelectorAll("[data-fixture-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const fixture = TEMPORARY_FIXTURES.find((item) => item.id === button.dataset.fixtureId);
      loadFixture(form, fixture);
      form.elements.case_id.focus();
    });
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(root, form);
  });
  bindVerify(root);
}

const app = document.querySelector("#app");
if (app) {
  renderShell(app);
}
