# Temporary UI/UX prototype design

## Status and purpose

Create a judge-friendly, localhost-first prototype for the current synthetic
decision-history workflow. It lets a reviewer submit a synthetic case, inspect
the backend decision and immutable audit trace, run the fixture check, and
explore the narrowly labelled synthetic review controls.

This is a prototype only. It does not implement the later production UI task,
real reimbursement processing, payment, authentication, uploads, OCR, or a
real reviewer authority.

## Sources and compatibility boundary

The functional source of truth is the checked-out backend's temporary contract:
`TMP-DEV-001`, its six `TMP-001`–`TMP-006` fixtures, and the endpoints below.

| Current backend capability | Prototype behavior |
| --- | --- |
| `POST /api/temporary/decision-traces` | Submit a synthetic case and render the stored backend response. |
| `GET /api/temporary/decision-traces/{trace_id}` | Retrieve the immutable trace, decision snapshot, provenance, and events. |
| `POST /api/temporary/decision-traces/{trace_id}/controls` | Send an allowed synthetic Control Deck command and rerender the returned trace. |
| `TMP-DEV-001` outcomes and rules | Display verbatim values returned by the backend; never calculate an outcome in the browser. |

The policy pack on `docs/policy-forge-provisional-baseline` is displayed only
as a **provisional policy reference**. It describes `POL-REIMB-CLB` v1.1.0,
five different Verify cases, human-only approval, and append-only control
events. It is not wired to the `TMP-DEV-001` backend and must not be represented
as an active policy, production API, or verified club authority.

## Chosen experience

Use a lightweight Vite static frontend with a development proxy from `/api` to
`http://127.0.0.1:8000`. This keeps browser code free of a policy engine and
allows every decision shown in the interactive flow to originate at the local
backend.

The visual direction is a calm operations desk: warm paper surfaces, deep ink
text, one vivid teal action color, and high-contrast status badges. A persistent
top boundary strip and a near-result disclosure prevent a user from mistaking
the demo for a payment product.

## Main journey and states

1. **Start** — The landing panel explains the temporary boundaries and presents
   one primary action, **Start a synthetic case**. Fixture shortcuts make
   `TMP-001` (routine), `TMP-005` (authority escalation), and `TMP-002`
   (incomplete) immediately understandable.
2. **Select or enter** — A fixture picker loads a declared synthetic input, or
   a compact case form accepts a new synthetic case. The form never exposes a
   profile, provenance, payment, user-account, file-upload, or real-policy
   field. A client-side input warning is distinct from a backend `INPUT_INVALID`
   response and a valid backend `MISSING_FACT` decision.
3. **Result** — The result screen presents outcome, rule ID, reason, precise
   question where returned, control state, server time, and a nontechnical
   summary. `AUTO_APPROVED` is phrased as a temporary processing result with
   **no payment made**. Escalations make the next question and its limited
   purpose prominent.
4. **Trace** — An expandable audit timeline renders the stored events in order,
   with facts used, profile snapshot, original submission, and provenance.
   It never reevaluates a trace in the browser.
5. **Verify** — One action submits the six current synthetic fixtures with
   run-unique case IDs through the same API. It compares the returned outcome
   and rule against declared fixture expectations, then shows timestamped
   PASS/FAIL rows and trace links. The comparison is a test assertion, not
   policy evaluation.
6. **Review controls** — On a trace where the backend reports an allowed state,
   a labelled Synthetic Control Deck presents the controls below. Each command
   requires a reason and displays the returned event and derived state.

   | Visible control | Backend command | Required disclosure |
   | --- | --- | --- |
   | Approve (synthetic demo record) | `record_demo_review` with `DEMO_ALLOW` | Records a demo label only; it is not a human approval, payment, or policy decision. |
   | Reject (synthetic demo record) | `record_demo_review` with `DEMO_DECLINE` | Records a demo label only; it does not reject a real claim. |
   | Pause | `pause` | Pauses only the current synthetic trace if the backend transition permits it. |
   | Resume | `resume` | Restores the recorded synthetic prior state when permitted. |
   | Undo last demo action | `undo` | Appends compensation; it never deletes history. |

   Controls unavailable for the returned `control_state` remain disabled with
   the backend rule explained. The prototype does not invent reviewer identity,
   queue assignment, authentication, or any approval/rejection endpoint.

## Policy-reference panel

A read-only panel links to the user-specified Policy Forge branch and explains
its relevance without claiming adoption:

- `POL-REIMB-CLB` v1.1.0 is provisional and awaits parent-organization approval.
- Its reviewer model is human-only and its result remains
  `PENDING_HUMAN_APPROVAL`; no agent may approve, reject, or transfer money.
- Its pause, override, and undo audit expectations inform labels only. The
  current backend implements a narrower synthetic Control Deck, not those
  policy-pack case shapes or real approval records.

## Safety, accessibility, and responsive behavior

- The global disclosure remains visible at every width: **Temporary development
  · Synthetic only · Unvalidated workflow · No payment · No real authority**.
- Semantic landmarks, labels, visible focus indicators, keyboard-operable
  controls, `aria-live` result/error summaries, and status text in addition to
  color are required.
- At narrow widths, the result and trace stack below the form without hiding
  provenance or primary actions.
- No real names, vendors, accounts, receipts, file uploads, or payment claims
  appear in the UI. Fixtures and the one local smoke submission stay synthetic.

## Verification plan

1. Run the backend quality gate and the local API smoke case before the UI.
2. Start Vite with the API proxy and exercise keyboard-only fixture selection,
   submission, result expansion, Verify, invalid input, and each permitted
   synthetic Control Deck transition.
3. Confirm the UI displays the backend's returned result fields and does not
   contain a client-side category, amount, evidence, or policy decision rule.
4. Verify responsive layout at phone and desktop widths and inspect the static
   handoff note and its localhost instructions.

## Backend questions to record in the handoff

1. Can the backend team confirm that the prototype's `DEMO_ALLOW` /
   `DEMO_DECLINE` labels must remain distinct from real human approval/rejection
   even when the UI exposes familiar reviewer-action labels?
2. Is `docs/policy-forge-provisional-baseline` intended to supersede
   `TMP-DEV-001` in a future migration? Its case shapes, policy identifiers,
   outcome vocabulary, and Verify suite currently do not match the live API.
3. If that migration is approved, which API contract will support the policy
   pack's human-only `PENDING_HUMAN_APPROVAL`, reviewer identity, and audited
   override semantics?
