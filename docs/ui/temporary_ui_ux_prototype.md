# Temporary UI/UX prototype

## Open the prototype

The prototype source is in [frontend/](../../frontend/). It is a Vite static
frontend that proxies `/api` requests to the temporary backend at
`http://127.0.0.1:8000`.

Start the temporary backend and database according to
[backend/README.md](../../backend/README.md), then run:

```bash
cd frontend
npm ci
npm run dev -- --port 5173
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). The browser UI does not
work without the temporary backend because every result comes from the backend
API.

## Main journey

1. Start with **Start a synthetic case**, then choose a labelled fixture or
   enter a synthetic case.
2. Try `TMP-001` or `TMP-006` to see the backend return routine
   `AUTO_APPROVED`; it always says that no payment was made.
3. Try `TMP-005` to see `AUTHORITY_EXCEEDED`, its temporary rule, reason, and
   the backend-supplied specific next question. `TMP-002` and `TMP-003` show
   incomplete-input routes; `TMP-004` shows the out-of-policy route.
4. Inspect the returned provenance, original synthetic submission, facts used,
   and ordered append-only audit events. Where the returned control state
   permits it, enter a synthetic reason and try the labelled Control Deck.
5. Select **Run Verify fixtures** to send all six fixtures through the same
   backend endpoint and compare each declared expected outcome/rule to the
   backend response. **Inspect trace** opens its stored result and audit trail.

## States demonstrated

- Initial state with an unmistakable first action and persistent temporary,
  synthetic, unvalidated, no-payment, and no-real-authority boundary.
- A routine backend decision and an escalation backend decision, including
  rule, reason, and specific question where one is required.
- Client-side missing case-ID feedback, plus backend validation/error feedback
  for incomplete or malformed synthetic input.
- A control-aware review view. The buttons labelled **Approve** and **Reject**
  submit `record_demo_review` with `DEMO_ALLOW` or `DEMO_DECLINE`; they do not
  approve or reject a real reimbursement. Pause, resume, and undo are rendered
  only as the returned temporary `control_state` permits.
- An ordered audit trail, immutable source snapshots, and the six-fixture
  Verify table with expected versus actual backend results, PASS/MISMATCH/error
  status, and a trace-inspection path.

The layout collapses to one column on narrow screens; native inputs, visible
focus states, semantic buttons/labels, live status text, and a keyboard
reachable trace region are included for basic responsive and keyboard use.

## Backend dependency / question

The current implementation follows the temporary `TMP-DEV-001` contract only.
The linked `POL-REIMB-CLB v1.1.0` Policy Forge branch is presented as a
provisional, read-only reference because it is not wired to the current backend
and uses different policy vocabulary and outcomes. Before replacing the
temporary profile, the backend team needs to confirm the migration and mapping
for policy version, rule IDs, outcomes, reviewer controls, and Verify fixtures.

Backend confirmation that this demonstration remains aligned with the frozen
temporary contract is still pending.
