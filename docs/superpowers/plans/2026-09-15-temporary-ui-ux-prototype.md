# Temporary UI/UX Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and run a judge-friendly localhost frontend that submits synthetic cases to the current backend, renders returned decisions and audit traces, checks the six temporary fixtures, and exposes only labelled synthetic review controls.

**Architecture:** A vanilla Vite frontend in `frontend/` talks to the already-running FastAPI service only through Vite's `/api` development proxy. A small API module owns HTTP calls, a fixture module owns declared test expectations and run-unique inputs, and a renderer owns DOM updates. Browser code never evaluates policy conditions or alters a returned decision.

**Tech Stack:** Node 20.19+, Vite, vanilla JavaScript, CSS, Vitest, jsdom, existing FastAPI backend at `http://127.0.0.1:8000`.

**Spec:** `docs/superpowers/specs/2026-09-15-temporary-ui-ux-prototype-design.md`

## Global Constraints

- Display `Temporary development · Synthetic only · Unvalidated workflow · No payment · No real authority` in every prototype state.
- Use `TMP-DEV-001` and the six current `TMP-001`–`TMP-006` fixtures for all functional backend interactions.
- Render decisions, explanations, provenance, audit events, and `control_state` returned by the backend; do not implement category, evidence, amount, or rule evaluation in JavaScript.
- Preserve `DEMO_ALLOW` and `DEMO_DECLINE` wording next to familiar review labels; they are synthetic record types, not real approval or rejection.
- Do not create payment, authentication, upload, OCR, real user, real reviewer, or production-policy functionality.
- Keep `POL-REIMB-CLB` v1.1.0 a linked provisional reference only; do not submit its different case shape to the current API.
- Use semantic HTML, keyboard-operable controls, visible focus, `aria-live` result/error regions, and text labels in addition to color.
- Commit only source, tests, lockfile, and documentation; do not commit `node_modules`, `.env`, generated database files, or synthetic API records.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `frontend/package.json` | Reproducible scripts and development dependencies. |
| `frontend/vite.config.js` | Local server and `/api` proxy to FastAPI. |
| `frontend/index.html` | Semantic application shell and font-free document metadata. |
| `frontend/src/fixtures.js` | Static synthetic fixture submissions and declared expected backend outputs. |
| `frontend/src/api.js` | Typed-by-convention HTTP wrapper for trace and control API calls. |
| `frontend/src/control.js` | UI-only availability mapping from returned `control_state` to visible controls. |
| `frontend/src/main.js` | State orchestration, form serialization, backend calls, Verify runner, and keyboard-safe event handling. |
| `frontend/src/styles.css` | Responsive, high-contrast visual system and layout. |
| `frontend/src/api.test.js` | HTTP request/response behavior tests with mocked `fetch`. |
| `frontend/src/fixtures.test.js` | Run-unique fixture generation tests that prove expected values are declared data. |
| `frontend/src/control.test.js` | Returned-state control availability tests. |
| `frontend/src/main.test.js` | DOM tests for result, error, disclosure, and disabled-control states. |
| `docs/ui/temporary_ui_ux_prototype.md` | Judge/team handoff: local URL, journey, demonstrated states, and backend questions. |

## Task 1: Create the frontend shell and local proxy

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.js`
- Create: `frontend/src/styles.css`
- Create: `frontend/src/main.test.js`

**Interfaces:**
- Produces `npm run dev`, `npm test`, and `npm run build` from `frontend/`.
- Produces a `#app` application landmark and a persistent `#boundary-notice` disclosure for later renderer functions.

- [ ] **Step 1: Write the failing shell test**

```js
import { describe, expect, it } from "vitest";
import { renderShell } from "./main.js";

describe("renderShell", () => {
  it("keeps the temporary boundary visible and focuses the start action", () => {
    document.body.innerHTML = '<main id="app"></main>';
    renderShell(document.querySelector("#app"));

    expect(document.querySelector("#boundary-notice").textContent).toContain("No payment");
    expect(document.querySelector("#start-case").textContent).toContain("Start a synthetic case");
    expect(document.querySelector("#start-case").getAttribute("type")).toBe("button");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails because the frontend does not exist**

Run: `npm test -- --run src/main.test.js`

Expected: the test runner reports that `frontend/src/main.js` cannot be resolved.

- [ ] **Step 3: Add the minimal Vite configuration and application shell**

Create `frontend/package.json` with the scripts and dependencies below.

```json
{
  "name": "organizationalai-temporary-ui-prototype",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "vite build",
    "test": "vitest"
  },
  "devDependencies": {
    "jsdom": "^26.0.0",
    "vite": "^7.0.0",
    "vitest": "^3.0.0"
  }
}
```

Create `frontend/vite.config.js`.

```js
import { defineConfig } from "vite";

export default defineConfig({
  test: { environment: "jsdom" },
  server: {
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true }
    }
  }
});
```

Implement `renderShell(root)` in `frontend/src/main.js` so it creates the
banner, title, no-payment text, and primary start button shown in the test.
Import `./styles.css` from this module. Call `renderShell(document.querySelector("#app"))`
only when `#app` exists so the test controls initial rendering.

- [ ] **Step 4: Run the focused test and production build**

Run: `npm install && npm test -- --run src/main.test.js && npm run build`

Expected: the shell test passes and `frontend/dist/` is produced without errors.

- [ ] **Step 5: Commit the shell**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/index.html frontend/src/main.js frontend/src/styles.css frontend/src/main.test.js
git commit -m "feat(ui): add temporary prototype shell"
```

## Task 2: Add fixtures and a backend-only API client

**Files:**
- Create: `frontend/src/fixtures.js`
- Create: `frontend/src/fixtures.test.js`
- Create: `frontend/src/api.js`
- Create: `frontend/src/api.test.js`

**Interfaces:**
- Consumes the API route constants in the design spec.
- Produces `TEMPORARY_FIXTURES`, `buildRunSubmission(fixture, runId)`, `createTrace(submission)`, `readTrace(traceId)`, and `sendControl(traceId, command)`.
- `createTrace`, `readTrace`, and `sendControl` return parsed backend JSON and never derive a policy outcome.

- [ ] **Step 1: Write failing fixture and API tests**

```js
import { describe, expect, it, vi } from "vitest";
import { createTrace } from "./api.js";
import { TEMPORARY_FIXTURES, buildRunSubmission } from "./fixtures.js";

it("gives each Verify submission a unique case id while retaining declared expectations", () => {
  const fixture = TEMPORARY_FIXTURES.find((item) => item.id === "TMP-001");
  const submission = buildRunSubmission(fixture, "run-42");

  expect(submission.case_id).toBe("TMP-001-run-42");
  expect(fixture.expected).toEqual({ outcome: "AUTO_APPROVED", ruleId: "TMP-AUT-01" });
});

it("sends a submission unchanged to the backend trace endpoint", async () => {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ trace_id: "trace-1" }), { status: 201 }));
  const submission = { case_id: "SYN-1", submitted_at: "2026-01-15T09:00:00Z", requester_role: "TEST_REQUESTER", purpose: "Synthetic", expense: null };

  await createTrace(submission);

  expect(globalThis.fetch).toHaveBeenCalledWith("/api/temporary/decision-traces", expect.objectContaining({ method: "POST", body: JSON.stringify(submission) }));
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm test -- --run src/fixtures.test.js src/api.test.js`

Expected: Vitest reports unresolved `fixtures.js` and `api.js` modules.

- [ ] **Step 3: Implement declared fixtures and a thin API wrapper**

Populate `TEMPORARY_FIXTURES` from `docs/05_temporary_case_corpus.csv` with all
six synthetic submissions and only the declared `expected.outcome` and
`expected.ruleId` values. Preserve null `purpose` for `TMP-002` and
`NOT_PROVIDED` evidence for `TMP-003`. `buildRunSubmission` must clone the
submission, change only `case_id` to `${fixture.id}-${runId}`, and return it.

Implement `api.js` with this error and wrapper pattern.

```js
export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.error?.message ?? "The synthetic backend request failed.");
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) }
  });
  const payload = await response.json();
  if (!response.ok) throw new ApiError(response.status, payload);
  return payload;
}

export function createTrace(submission) {
  return request("/api/temporary/decision-traces", { method: "POST", body: JSON.stringify(submission) });
}
```

Use the same `request` helper for `readTrace(traceId)` and
`sendControl(traceId, command)`, with the control endpoint
`/api/temporary/decision-traces/${traceId}/controls`.

- [ ] **Step 4: Run fixture and API tests**

Run: `npm test -- --run src/fixtures.test.js src/api.test.js`

Expected: both tests pass; no code references `TEST_ALLOWED`, `1000`, or a
policy condition outside declared fixture input data.

- [ ] **Step 5: Commit the backend boundary**

```bash
git add frontend/src/fixtures.js frontend/src/fixtures.test.js frontend/src/api.js frontend/src/api.test.js
git commit -m "feat(ui): submit synthetic traces through backend api"
```

## Task 3: Render submission, result, trace, and safe review controls

**Files:**
- Create: `frontend/src/control.js`
- Create: `frontend/src/control.test.js`
- Modify: `frontend/src/main.js`
- Modify: `frontend/src/main.test.js`
- Modify: `frontend/src/styles.css`

**Interfaces:**
- Consumes `createTrace`, `readTrace`, `sendControl`, and the backend response
  shape (`decision`, `provenance`, `events`, `control_state`).
- Produces `controlAvailability(controlState)` and user-visible form/result/trace
  views.
- A review command object has the exact shape
  `{ command, reason, disposition?, idempotency_key }`.

- [ ] **Step 1: Write failing control and DOM tests**

```js
import { describe, expect, it } from "vitest";
import { controlAvailability } from "./control.js";
import { renderTrace } from "./main.js";

it("offers only synthetic review actions in AWAITING_REVIEW", () => {
  expect(controlAvailability("AWAITING_REVIEW")).toEqual({ pause: true, resume: false, allow: true, decline: true, undo: false });
});

it("renders backend provenance, a no-payment outcome, and ordered audit events", () => {
  document.body.innerHTML = '<section id="result"></section>';
  renderTrace(document.querySelector("#result"), {
    temporary_notice: "Temporary synthetic development record; workflow is unvalidated.",
    provenance: { profile_id: "TMP-DEV-001", profile_source: "TEMPORARY_DEVELOPMENT", data_class: "SYNTHETIC", workflow_validation_status: "UNVALIDATED" },
    decision: { outcome: "AUTO_APPROVED", applied_rule_id: "TMP-AUT-01", reason: "Approved under temporary development profile; no payment was made.", question: null },
    control_state: "AUTO_APPROVED",
    events: [{ sequence_number: 1, action: "CASE_RECEIVED", actor_type: "SYSTEM", recorded_at: "2026-01-15T09:00:00Z", payload: {} }]
  });

  expect(document.body.textContent).toContain("No payment was made");
  expect(document.body.textContent).toContain("TMP-DEV-001");
  expect(document.querySelectorAll("[data-audit-event]")).toHaveLength(1);
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm test -- --run src/control.test.js src/main.test.js`

Expected: Vitest reports missing `control.js` and `renderTrace` exports.

- [ ] **Step 3: Implement form serialization, result rendering, and controls**

Implement `controlAvailability` as this returned-state map only:

```js
const ACTIONS_BY_STATE = {
  AUTO_APPROVED: { pause: false, resume: false, allow: false, decline: false, undo: false },
  AWAITING_INPUT: { pause: true, resume: false, allow: false, decline: false, undo: false },
  AWAITING_REVIEW: { pause: true, resume: false, allow: true, decline: true, undo: false },
  PAUSED: { pause: false, resume: true, allow: false, decline: false, undo: true },
  DEMO_REVIEWED: { pause: false, resume: false, allow: false, decline: false, undo: true }
};

export function controlAvailability(controlState) {
  return ACTIONS_BY_STATE[controlState] ?? ACTIONS_BY_STATE.AUTO_APPROVED;
}
```

In `main.js`, build a labelled synthetic case form. Blank purpose must serialize
as `null` so the backend can return its canonical repair question. A blank case
ID must show a local form error in an `aria-live="assertive"` region and must
not call the backend. On successful `createTrace`, call `renderTrace` with the
response. On `ApiError`, render `error.code`, `error.message`, and its backend
temporary notice if returned.

`renderTrace` must render outcome, rule, reason, optional question, returned
control state, temporary notice, provenance, original submission, facts used,
and every returned event in `sequence_number` order. Use a `<details>` trace
section for snapshots. Do not calculate or replace the backend decision.

Implement buttons with exact accessible text: `Approve (synthetic demo record)`,
`Reject (synthetic demo record)`, `Pause synthetic case`, `Resume synthetic
case`, and `Undo last demo action`. Before calling `sendControl`, require a
nonblank synthetic reason. Map the first two labels to
`record_demo_review` with `DEMO_ALLOW` and `DEMO_DECLINE`; put the exact
disclosure “Records a synthetic demo label only. No payment or real authority.”
beside them. On any control response, replace the displayed trace with the
returned trace.

- [ ] **Step 4: Run focused tests, all frontend tests, and the build**

Run: `npm test -- --run src/control.test.js src/main.test.js && npm test -- --run && npm run build`

Expected: all test files pass and the Vite build succeeds.

- [ ] **Step 5: Commit trace and review UI**

```bash
git add frontend/src/control.js frontend/src/control.test.js frontend/src/main.js frontend/src/main.test.js frontend/src/styles.css
git commit -m "feat(ui): render synthetic decisions and review controls"
```

## Task 4: Add Verify, responsive visual polish, and the policy reference

**Files:**
- Modify: `frontend/src/main.js`
- Modify: `frontend/src/main.test.js`
- Modify: `frontend/src/styles.css`
- Modify: `frontend/index.html`

**Interfaces:**
- Consumes `TEMPORARY_FIXTURES`, `buildRunSubmission`, `createTrace`, and
  `readTrace`.
- Produces a `Run Verify fixtures` action with timestamped status rows and a
  read-only Policy Forge reference link.

- [ ] **Step 1: Write failing Verify and reference-panel tests**

```js
import { expect, it, vi } from "vitest";
import { runVerify } from "./main.js";

it("reports a PASS only when backend outcome and rule match declared fixture expectations", async () => {
  const createTrace = vi.fn().mockResolvedValue({ trace_id: "trace-1", decision: { outcome: "AUTO_APPROVED", applied_rule_id: "TMP-AUT-01" } });
  const rows = await runVerify([{ id: "TMP-001", submission: { case_id: "TMP-001" }, expected: { outcome: "AUTO_APPROVED", ruleId: "TMP-AUT-01" } }], createTrace, "run-1");

  expect(rows).toEqual([expect.objectContaining({ fixtureId: "TMP-001", status: "PASS", traceId: "trace-1" })]);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- --run src/main.test.js`

Expected: the test reports that `runVerify` is not exported.

- [ ] **Step 3: Implement the Verify runner and visual system**

Implement `runVerify(fixtures, submit, runId)` to call `submit` once per
fixture, compare only `result.decision.outcome` and `result.decision.applied_rule_id`
to the fixture's declared `expected` fields, and return row objects with
`fixtureId`, `expected`, `actual`, `traceId`, `status`, and `error`.

Render a timestamped table with one row per fixture, textual PASS/FAIL status,
expected and actual values, and a trace-selection button. Continue after a
single failed request so all six fixtures are visible. The button must read
`Run Verify fixtures` and disable while the six sequential calls are running.

Add a read-only Policy Forge panel whose link is exactly
`https://github.com/Park-Hip/OrganizationAI/tree/docs/policy-forge-provisional-baseline`.
Its copy must say that `POL-REIMB-CLB` v1.1.0 is provisional, is not wired to
the current backend, and does not enable a payment or real reviewer authority.

Extend `styles.css` with CSS custom properties, focus-visible outlines, a
mobile first one-column layout, a two-column layout at `min-width: 900px`,
high-contrast outcome/status badges, and a `prefers-reduced-motion` rule that
turns off nonessential transitions.

- [ ] **Step 4: Run automated checks and manual keyboard checks**

Run: `npm test -- --run && npm run build`

Then run: `npm run dev`

Expected: the app opens at the Vite URL, `Tab` reaches Start, form fields,
result disclosure, Verify, and each enabled synthetic control in order; the
same content remains visible at 375px and 1440px widths.

- [ ] **Step 5: Commit the Verify and policy-reference experience**

```bash
git add frontend/index.html frontend/src/main.js frontend/src/main.test.js frontend/src/styles.css
git commit -m "feat(ui): add fixture verification and policy reference"
```

## Task 5: Record the handoff and verify the complete localhost demo

**Files:**
- Create: `docs/ui/temporary_ui_ux_prototype.md`
- Modify: `README.md`

**Interfaces:**
- Consumes the runnable Vite command and the backend API endpoint.
- Produces a self-contained entry point for a teammate and the required backend questions.

- [ ] **Step 1: Write the handoff acceptance assertions**

```markdown
- The handoff names `npm run dev` from `frontend/` and the resulting local URL.
- It names Start, routine, escalation, invalid input, trace, Verify, and synthetic Control Deck states.
- It states that all displayed decisions originate from the backend.
- It asks the backend team to confirm the `DEMO_ALLOW` and `DEMO_DECLINE` mapping and the Policy Forge migration boundary.
```

- [ ] **Step 2: Verify the assertions fail because the handoff does not exist**

Run: `test -f docs/ui/temporary_ui_ux_prototype.md`

Expected: exit status 1.

- [ ] **Step 3: Write the handoff and link it from the repository README**

Create the handoff with exact startup prerequisites:

```bash
# terminal 1, from backend/
DATABASE_URL='postgresql+psycopg2://organizationai@127.0.0.1:55432/organizationai_temp' uv run --no-sync uvicorn app.main:app --host 127.0.0.1 --port 8000

# terminal 2, from frontend/
npm install
npm run dev
```

State that the UI opens at the Vite URL printed by the command, usually
`http://127.0.0.1:5173`. Include the journey, the states, the disclosure, and
the three backend questions from the spec. Add a concise link to this handoff
under a `Temporary UI prototype` heading in `README.md`.

- [ ] **Step 4: Run the complete verification sequence**

Run:

```bash
cd frontend
npm test -- --run
npm run build
curl --fail http://127.0.0.1:8000/health
test -f ../docs/ui/temporary_ui_ux_prototype.md
```

Expected: frontend tests and build pass, backend health returns
`{"status":"ok","database":"reachable"}`, and the handoff file exists.

- [ ] **Step 5: Commit the handoff**

```bash
git add README.md docs/ui/temporary_ui_ux_prototype.md
git commit -m "docs(ui): add temporary prototype handoff"
```

## Plan self-review

- Spec coverage: Tasks 1–4 cover start/select, routine and escalation results,
  invalid input, audit visibility, Verify, responsive/keyboard access,
  disclosures, provisional policy reference, and guarded synthetic reviewer
  controls. Task 5 covers the required handoff and local opening instructions.
- No client policy: Task 2 stores expectations; Task 3 maps only a returned
  control state; Task 4 compares backend results. No task derives a result from
  input category, amount, evidence, or policy text.
- Source compatibility: every real API call targets the current `TMP-DEV-001`
  contract. The differing Policy Forge branch stays a linked reference.
- Placeholder scan: this plan contains concrete files, signatures, tests,
  commands, expected outcomes, and commit messages for every task.
- Type consistency: `createTrace` and `sendControl` are defined in Task 2,
  consumed by Tasks 3 and 4; `controlAvailability` is defined in Task 3;
  `runVerify` is defined in Task 4; no later task changes their names.
