# OrganizationalAI UI prototype

A standalone dark-theme prototype for the reimbursement v1 synthetic pilot. Its documents and five Verify expectations come from the repository. It makes no calls to legacy or v1 business APIs and needs no database, model key or backend service.

## Run locally

Use Node.js 22.19 or later:

```sh
cd frontend
npm ci
npm run dev
```

Open <http://127.0.0.1:5173>. The development server binds to localhost and fails rather than silently selecting a different port if 5173 is in use.

```sh
npm test          # document, fixture, Markdown and form tests
npm run build    # production bundle in dist/
npm run preview  # serve the production bundle locally
```

## Browser checks

With a Playwright Chromium browser already installed, start the app and run `npm run test:e2e`. Alternatively, reuse a separately launched Chromium/Edge test profile through `PW_CDP_ENDPOINT=http://127.0.0.1:9223 npm run test:e2e`. Do not attach to a personal browser session. The suite covers desktop/mobile routes, overflow, local draft validation, modal keyboard focus, reduced motion and inactive backend controls. Screenshots go to the ignored repository `.local/ui-checks/` directory.

## Source and integration boundaries

- `src/content.js` imports Markdown and canonical fixtures directly from `docs/` and `policy-forge-baseline/`. `SOURCE_REF` identifies the upstream snapshot used; update it alongside an adopted documentation refresh. There is no runtime GitHub sync or GitHub write.
- `src/main.js` renders fixture **expectations**, never calculated outcomes. `Actual: Not run` and `Not checked` remain until the v1 Verify endpoint exists.
- `src/case-dialog.js` validates a minimal, local intake draft. It is not the full reimbursement API envelope, does not persist, and does not submit a case. Closing discards the draft.
- Approve, Reject, Pause, Resume, Undo, Record override, model configuration and policy publishing are visibly disabled previews. The backend must supply authorization, legal actions and audit support before enabling them.
- Markdown is rendered with Marked and sanitized with DOMPurify; raw images, active content and unsafe URL schemes are removed. Fonts and icons are bundled locally.

See the [UI handoff](../docs/ui/temporary_ui_ux_prototype.md) for the user journey and backend questions. The legacy filename is retained for continuity with issue #5, but its content and this prototype target reimbursement v1.
