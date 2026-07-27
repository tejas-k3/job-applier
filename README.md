# Job Applier

Workday-first Chrome extension for filling repeated application details from one candidate profile and a PDF resume. It does not submit applications.

## Run locally

```bash
npm install
npm run dev
```

Load the generated Chrome extension, open its side panel, save the candidate-profile JSON, choose a PDF resume, then use **Fill visible page** on a supported job tab.

## Current scope

- Stores one candidate profile locally.
- Saves one PDF resume in extension IndexedDB and attempts to upload it to visible application file inputs.
- Fills common identity/contact/link fields and enabled pre-approved declaration rules.
- Includes Workday, Lever, Greenhouse, and Ashby URL matching; Workday is the initial focus.
- Credentials/environment-variable login is intentionally not implemented. A future native companion will own that boundary.
- LinkedIn automation is intentionally excluded.

The extension stops for authentication, CAPTCHA, MFA, verification links/codes, unknown required fields, and unrecognized legal declarations.
