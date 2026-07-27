# Job Applier — High-Functionality MVP Execution Plan

## The success definition

No browser product can truthfully promise a 100% hands-off result across every employer configuration: login, MFA, CAPTCHA, email OTPs, SSO, account creation, and changed legal wording are deliberately outside the extension’s authority. The MVP should instead guarantee this:

> For a supported application page where the candidate is already authenticated and no challenge is present, the extension either completes every known field correctly or stops with the exact unresolved field and reason. It never silently guesses, skips a required field, or submits.

That is the path to a practical 100% success rate: deterministic completion or deterministic, actionable handoff.

## Release scope

| Included in MVP | Deferred |
|---|---|
| Workday external candidate flow | Automatic LinkedIn Easy Apply |
| Lever, Greenhouse, Ashby hosted forms | CAPTCHA/MFA/OTP/SSO bypass |
| Background tab queue, form fill, safe Next navigation | Automatic Submit |
| Single source-of-truth profile + PDF resume | iCIMS, SuccessFactors, SmartRecruiters |
| Grounded drafts for subjective questions | Cloud account/sync/payment layer |
| Explicit static attestation rules | Environment-variable login implementation |

## Step 1 — Make the candidate profile complete and durable

Replace the raw JSON-first onboarding experience with a simple form that generates the same versioned `candidate-profile.json` underneath.

1. Collect identity, contact, location, URLs, work authorization, sponsorship, notice period, salary preferences, skills, work history, education, and projects.
2. Collect a mandatory default PDF resume once, display its name/hash/updated time, and allow a per-job resume override.
3. Add editable reusable answers: notice period, salary, work authorization, sponsorship, relocation, and availability.
4. Add explicit attestation rules with `true`/`false`, scope, enabled flag, approval date, and a normalized wording fingerprint.
5. Add import/export and a clear-all-local-data action.

**Done when:** a candidate can finish onboarding once, restart Chrome, and fill a new form without re-entering stable facts.

## Step 2 — Build the deterministic form engine

Create a provider-independent form model. The engine should separate three jobs: inspect the page, resolve truthful candidate data, and drive browser controls.

1. Normalize every field into: `id`, `label`, `kind`, `required`, `choices`, `intent`, `sensitivity`, `confidence`, and `pageStep`.
2. Implement drivers for text/textarea, native select, ARIA combobox, radio group, checkbox, date picker, attachment, and repeaters.
3. After every write, verify the browser-visible value and application state; record `filled`, `already_present`, `unresolved`, `blocked`, or `failed`.
4. Never use a CSS class as a field identity. Resolve in this order: autocomplete → accessible name → label/legend → name/placeholder → provider data attribute → user-confirmed mapping.
5. Create a fill plan before changing the page. Show its actions and unresolved fields in the side panel.

**Done when:** no field write is considered successful until it is read back from the visible control.

## Step 3 — Turn Workday into the flagship adapter

Workday must be implemented as a state machine, not a set of selectors.

1. Detect Workday external tenants from URL and document markers.
2. Identify the active stage from headings/roles: job page, sign-in/account, My Experience, application questions, voluntary self-ID, review, confirmation.
3. Persist per-tab run state after every stage: URL, stage fingerprint, completed field IDs, unresolved fields, selected resume, and last action.
4. Support standard My Experience controls: contact data, city/location, links, résumé, work-experience repeaters, education repeaters, skills, and basic dates.
5. Support screening controls: text, textarea, select, radio, checkbox, combobox, and country-specific work-authorization questions.
6. Advance with Next/Continue only after required visible fields are either verified or explicitly marked unresolved. Never click Submit.
7. On a route change or a dynamic stage change, re-inspect and continue the same queued run in the inactive tab.
8. Stop with a clear side-panel status for auth, OTP, MFA, SSO, CAPTCHA, unknown required field, changed attestation wording, or technical control failure.

**Done when:** a normal logged-in Workday external application with known profile data reaches Review from a background tab, including ordinary experience and education pages.

## Step 4 — Add the remaining provider adapters

Reuse the same normalized form engine; adapters only identify platform/stages and provider-specific controls.

1. **Lever:** hosted job form, contact fields, CV upload, custom questions, optional EEO section.
2. **Greenhouse:** hosted and embedded form, job-specific custom fields, attachments, location questions, voluntary demographics.
3. **Ashby:** hydration-aware hosted and iframe forms, core application vs additional survey form, custom questions, attachments.
4. Use a classifier score so an explicit provider adapter wins over the generic fallback.
5. Keep a generic semantic adapter in read-only/dry-run mode until it has a user-confirmed mapping for the employer domain.

**Done when:** all four adapters create the same fill report and review state for equivalent profile fields.

## Step 5 — Make background runs observable and controllable

The user should be able to work in another tab without losing certainty about the application run.

1. Turn the current single-tab state into a queue with statuses: `queued`, `filling`, `waiting_for_user`, `ready_for_review`, `completed`, `stopped`, and `failed`.
2. Keep the run state in extension storage, keyed by tab ID plus a job URL fingerprint.
3. Show a compact in-page chip only while a run is active: current stage, fields filled, and exact reason if paused.
4. Offer Start, Pause, Resume, Stop, and Open tab actions in the side panel.
5. Do not steal focus; do not use arbitrary timers to click buttons; resume only after known document/stage events.

**Done when:** a tab can be queued, left in the background, navigate through known stages, and later be opened directly at its review state.

## Step 6 — Make subjective answers useful without making claims up

1. Extract the job description and role metadata from each supported page.
2. Retrieve only relevant profile facts: matching roles, accomplishments, projects, skills, and candidate-approved answer snippets.
3. Ask the answer provider for a concise answer plus the IDs of profile facts used.
4. Reject drafts that lack factual support or contain assertions not present in the profile.
5. Require approval before insertion; let the candidate save the approved answer as a reusable rule with role/company tags.
6. Do not use the LLM for work authorization, salary, legal declarations, demographic questions, or dates/credentials.

**Done when:** every generated answer visibly shows its supporting profile facts and can be accepted, edited, or rejected.

## Step 7 — Implement the local companion only after the extension flow is solid

The companion is an optional boundary, never a prerequisite for the main MVP.

1. Define `ResumeSource` and `CredentialProvider` interfaces now; keep their current no-op stubs.
2. Add a native-messaging companion that can read one candidate-approved static PDF path and return its bytes only to the extension.
3. Add credentials only for an explicit domain allowlist, only to a standard username/password form, and only after the user enables that provider.
4. Prefer the operating system keychain in the companion; environment variables remain a development-only fallback.
5. Never put passwords, session tokens, résumé content, or job descriptions in logs or LLM prompts.

**Done when:** no companion functionality expands the extension’s access beyond the exact PDF path and employer domains the candidate approved.

## Step 8 — Ship in incremental slices

Implement and release in this exact order:

1. Candidate onboarding, profile storage, PDF store, export/delete.
2. Form engine and field drivers with clear fill reports.
3. Workday contact + résumé pages and background run persistence.
4. Workday experience, education, screening questions, review handoff.
5. Lever, then Greenhouse, then Ashby.
6. Subjective-answer provider and approval UI.
7. Queue controls and user-confirmed generic mappings.
8. Optional native companion for static PDF path / login stubs.

Each slice must leave the extension installable, buildable, and usable. Do not wait for every ATS before using Workday on real applications.

## Operational quality gates

Before enabling an adapter by default, require these conditions:

- It recognizes the intended provider/page instead of a lookalike.
- Every normal field is verified after write.
- Required unknown fields halt progress visibly.
- Legal/declaration mapping checks polarity and wording fingerprint.
- No run can reach Submit through extension code.
- The extension can explain the current state in one sentence: what it filled, what it needs, or why it stopped.

This plan deliberately treats a safe pause as success, not failure. That is how the MVP earns user trust and converges on complete coverage of the forms it supports.
