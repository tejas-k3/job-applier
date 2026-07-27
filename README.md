# Job Applier

Workday-first Chrome extension for filling repeated application details from one candidate profile and PDF resume. It never clicks Submit.

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
5. With that application tab active, click **Start background fill**. You may now work in another tab.
6. The queue displays whether the run is filling, waiting for a required answer, ready for review, or failed with the exact reason.
7. Review the completed application and submit it yourself.

## What it supports now

- Workday hosted external applications, plus hosted Lever, Greenhouse, and Ashby pages.
- Background run persistence across ordinary navigation and Workday SPA stage changes.
- Verified identity/contact/link/city/country fields, native select controls, and PDF resume upload.
- Candidate-approved stable declaration rules.
- A hard stop for authentication, CAPTCHA, MFA, email verification, unknown required data, and unrecognized declarations.

## Commands

```bash
npm run typecheck
npm test
npm run build
npm run zip
```

The extension stores the profile and resume only in Chrome’s local extension storage. Environment-variable login and a static-path PDF companion remain intentionally unimplemented stubs. LinkedIn automation is intentionally excluded.
