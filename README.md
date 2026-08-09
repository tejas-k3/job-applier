# Job Applier

Chrome extension for filling repeated application details from one candidate profile and PDF resume. It never clicks Submit.

Playful & experimental project being completely done by AI for real world pain.

## Use it locally

```bash
git clone git@github.com:tejas-k3/job-applier.git
cd job-applier
npm install
npm run dev
```

1. Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `.output/chrome-mv3`.
2. Open the Job Applier side panel from Chrome’s toolbar.
3. Paste/edit the source-of-truth profile JSON. Start from [`docs/candidate-profile.example.json`](docs/candidate-profile.example.json).
4. Click **Save profile**, select your PDF resume, and open a supported job application.
5. Turn on **Watch new supported job tabs and fill in background**, then open as many supported application tabs as you want. Each is queued after loading without focusing it. **Fill all supported tabs now** scans tabs already open; **Fill current tab** remains available for a supported custom portal.
6. The queue displays whether the run is filling, waiting for a required answer, ready for review, or failed with the exact reason.
7. Review the completed application and submit it yourself.

## What it supports now

- Workday hosted external applications, plus hosted Lever, Greenhouse (including N26's embedded form), Ashby, and SAP SuccessFactors pages.
- Workday's initial **Apply Manually** screen advances automatically; account creation/sign-in remains a user handoff, after which the queued run resumes.
- Background run persistence across ordinary navigation and Workday SPA stage changes.
- Bulk scan/queue for all open supported application tabs; it deliberately ignores careers homepages and unrelated tabs.
- Optional background watcher that begins a run when a newly opened supported application tab finishes loading; it never steals focus.
- Per-tab queue controls: open, stop, and resume without needing to rediscover the application.
- Verified identity/contact/link/city/country fields, work/education dates, native select controls, and PDF resume upload.
- Candidate-approved stable declaration rules.
- “How did you hear about us?” is answered only with an available **career website** option; otherwise it is left for review.
- A hard stop for authentication, CAPTCHA, MFA, email verification, unknown required data, and unrecognized declarations.
- User-initiated generic custom-portal mode for the currently selected tab.
- LinkedIn Easy Apply copy-assist only; it never reads, fills, clicks, or submits on LinkedIn.

## Commands

```bash
npm run typecheck
npm test
npm run build
npm run zip
```

The extension stores the profile and resume only in Chrome’s local extension storage. Environment-variable login and a static-path PDF companion remain intentionally unimplemented stubs. LinkedIn automation is intentionally excluded.
