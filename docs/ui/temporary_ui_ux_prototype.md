# Reimbursement v1 UI/UX prototype

This replaces the retired `TMP-DEV-001` prototype scope. It follows the [owner's update on issue #5](https://github.com/Park-Hip/OrganizationAI/issues/5#issuecomment-5691709381), the current workflow, MVP, reimbursement contract and architecture. The filename is retained to keep the existing handoff location stable.

## Open the prototype

- [Local interactive preview](http://127.0.0.1:5173/) after starting the frontend.
- [Frontend in the implementation fork](https://github.com/rquq/OrganizationAI/tree/codex/v1-frontend-shell/frontend).
- [Current documentation baseline](https://github.com/Park-Hip/OrganizationAI/tree/17cedab2d108958627fdf39f20a36450dfb8b6bd/docs).

From the repository, use Node 22.19+ and run `cd frontend`, `npm ci`, then `npm run dev`. A teammate needs no account, model credentials or backend to explore this prototype. It is a local UI demonstration, not a deployed reimbursement service.

## Main journey

1. Open Workspace. The first action is **Start synthetic case**.
2. The animated dialog accepts a member-paid or advance-settlement draft, with synthetic purpose, budget and evidence references. Preview performs local field validation and displays the draft. Submission remains disabled while the v1 API is pending.
3. Select one of five canonical fixtures. Inspect its documented expectation, reason and applicable rules. Escalation fixtures show an illustrative, specific handoff question. The display distinguishes an expected fixture result from an actual backend result.
4. Open Input to inspect canonical data, Audit to understand the planned event sequence, and Review to see the future human controls. No audit record, human decision or payment is fabricated.
5. Open Verify fixtures to compare the five expectations with **Actual: Not run** and **Not checked**. Run Verify is disabled pending the actual shared evaluator endpoint.
6. Browse and search the repository documentation, inspect the target architecture, or open Settings for model connection, policy, challenge and GitHub source information.

## Important states

- Routine packet and `FACT_UNKNOWN` / `AUTHORITY_REQUIRED` expectations from the canonical JSON corpus; every expected agent outcome is pending human approval.
- Specific handoff copy includes the fixture, known facts, recipient, requested response and resume instruction; it is explicitly illustrative copy, not a generated escalation.
- Empty/incomplete form fields and malformed whole-VND values receive inline feedback and focus on the first invalid field. Advance fields appear only for advance settlement.
- Local preview clears when a field changes. Closing discards the draft. There is no persistence, model call, case submission, evidence upload or GitHub write.
- Approve, Reject, Pause, Resume, Undo and Record override are disabled until authenticated backend actions exist. No real Treasurer authority or payment is represented.
- Persistent synthetic, unvalidated-for-real-use and no-payment notice; target architecture, expected fixture data and unavailable backend capabilities have explicit labels.
- Keyboard navigation, native modal focus containment, Escape/Cancel, focus restoration, fallback inert background, mobile stacking, contained table scrolling and reduced-motion support.

## Repository documentation and configuration

The library bundles current Markdown and canonical policy files directly from this checkout. GitHub source links are pinned to `17cedab2d108958627fdf39f20a36450dfb8b6bd`. The UI says **Updated when this build is refreshed**. Bring reviewed documentation changes into the fork, update the source reference, then rebuild to refresh the displayed snapshot. Live sync and editing require a later server integration.

Model API settings are a non-editable preview for optional assistance. Deterministic policy processing has no LLM dependency. Credentials must be held by the server; the browser currently has no API-key input. Organization settings and policy publishing similarly wait for versioning, access control and audit support.

## Backend questions and integration dependencies

1. Which versioned intake and response endpoints should the UI use, and how does this minimal draft expand into the required case packet? Server-generated IDs, actors, hashes, timestamps and immutable policy/profile snapshots must remain server-owned.
2. What is the authenticated capability shape for review, pause/resume, override and undo? The UI should render only returned legal actions and collect required reasons and references.
3. What retrieval API returns ordered audit events, evidence references and immutable historical snapshots without re-evaluating a case?
4. Which Verify endpoint invokes the same v1 processing path as submitted cases and returns expected-versus-actual data, repeatability evidence and run timestamps?
5. Are model assistance and website configuration APIs in scope? If so, define secure credential storage, administrative access, supported models, configuration versioning and connection-test behavior.
6. Should repository documentation refresh on deployment, or through an explicit backend GitHub integration? Confirm repository, branch/ref, access scope and refresh/error behavior before enabling Sync.

At this baseline, `backend/app/main.py` mounts legacy routes and `backend/app/policy/reimbursement/evaluator.py` raises `NotImplementedError`. This prototype deliberately waits for the v1 implementation.

## Review and acceptance status

Verified locally on 2026-09-17: 15 unit/DOM tests passed, the Vite production build passed, and six browser checks passed in an installed Edge test profile at 1440px desktop and 390px mobile widths. Browser checks covered route rendering, horizontal overflow, fixture filter selection, disabled actions, documentation search, form validation, escaped preview content, focus trapping/restoration and reduced motion. The dependency audit at install reported zero known vulnerabilities.

An independent code review checked the current contract boundary and found no critical security or policy mismatch. Its filter-selection finding was fixed. This is an automated source review, **not confirmation by a backend teammate**; backend-team confirmation remains outstanding.

Implemented: dark responsive UI, first action, both draft flows, inline errors, fixture expectations and questions, audit/review preview, Verify table, repository reader, architecture and configuration previews. Operational submission, actual verification, authenticated human actions and live configuration remain backend dependencies as agreed for this frontend-first prototype.
