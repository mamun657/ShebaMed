# Pharmacy Implementation Progress

## Scope

This repository now includes a complete Pharmacy role and workspace within the existing
ShebaMed patient/doctor application. No video calling, delivery, booking, prescription
approval, or diagnostic prescribing system was added.

## Implemented

- `PHARMACY` public registration role and role-specific registration fields.
- Pharmacy profile with name, license/registration number, address and review details.
- Pending/approved/rejected professional verification controlled by administrators.
- Pharmacy sidebar and dashboard matching the existing ShebaMed workspace.
- Patient sharing-code access requests, separate from doctor requests.
- Patient approval with scope, duration and pharmacy-only capabilities.
- Revocation and expiry enforcement on every server-side authorization check.
- Pharmacy role cannot access doctor-only encounter or clinical-document capabilities.
- Authorized medical-history, record and AI retrieval.
- Pharmacy document upload provenance with organization, staff, source and timestamp.
- Pharmacy uploads remain `UNREVIEWED`; they are not marked clinician-verified.
- Pharmacy encounter timeline entries.
- Medicine dispensing timeline entries.
- Distinction in the UI and data model between prescriptions, dispensing and
  patient-reported medicine limitations.
- AI pharmacy guardrail to avoid recommendations, dosing and prescribing.
- Admin pharmacy review endpoint and pharmacy registration management UI.
- Verification rejection revokes active pharmacy grants immediately.

## Security Changes

- Pharmacy identity is bound to `pharmacy_profiles` and the staff account.
- Pharmacy access is checked against `pharmacy_access_grants` in the server.
- `allowedRecords` filters records using the approved grant scope and capabilities.
- Document review and report retry remain patient-only.
- Admin review rejection revokes all active grants for the pharmacy staff account.

## Tests

- TypeScript typecheck passed.
- ESLint passed.
- Full Vitest suite passed: 7 files, 89 tests.
- Pharmacy registration, role boundaries and verification unit coverage passed:
  32 security tests.
- A Playwright pharmacy workflow test exists and covers registration, approval,
  rejection, upload provenance, encounter/dispensing records, revocation and
  doctor-capability denial. It is allowed a 120-second timeout because first-run
  Next compilation and Argon2 registration can be slow in cold disposable
  environments.
- Live Playwright pharmacy workflow passed in desktop and mobile projects against
  a disposable synthetic MongoDB database: 2/2 passed.
- Production build passed with Next.js 16 webpack.
- Final ESLint and TypeScript typecheck passed.

## Test Environment Limitations

The Playwright pharmacy and doctor workflows skip unless `E2E_ADMIN_PHONE`,
`E2E_ADMIN_PASSWORD`, a running application and a disposable test database are
provided. This prevents tests from modifying the normal application database.

The OCR upload path requires the worker and a valid Groq/OCR environment for
extraction assertions. A test upload is still valid even if extraction remains
queued or is processed asynchronously.

## Run

1. Configure MongoDB, authentication secret and Groq/OCR variables in `.env.local`.
2. Initialize the database: `npm run db:setup`.
3. Create an administrator: set `ADMIN_NAME`, `ADMIN_PHONE` and `ADMIN_PASSWORD`,
   then run `npm run admin:create`.
4. Run `npm run dev`.
5. Register a pharmacy account, then approve it under `/admin/pharmacies`.
6. Create a patient sharing code and have the pharmacy staff submit it under
   `/pharmacy/requests`.
7. Approve or reject the request from the patient's access page.

## Remaining Work

- Add staff-member level management within one pharmacy organization.
- Add formal pharmacy record-review/reconciliation tools if required operationally.
- Add retention policy automation and external regulatory verification integration.
- Uploaded prescription documents do not currently have trusted issuer-role metadata,
  so the UI labels them neutrally as prescription records rather than claiming they
  were issued by a doctor.

## Pharmacy Encounter Display Follow-up

### Root Cause

Pharmacy encounters were persisted as completed digital records without a file or
processing job, but the shared `DocumentDetail` rendered every record through its
generic OCR workflow. Its no-file placeholder also described all notes as
clinician-authored. Pharmacy record summaries exposed generic category and extraction
statuses, while the pharmacy record dialog converted stored field names into
unfriendly labels. AI citations always linked to the file-download endpoint, which
does not exist for digital encounter or dispensing records.

### Changes

- Added dedicated structured layouts for pharmacy assistance encounters and medicine
  dispensing records, with provenance, timestamps, recorded status and a separate
  unverified status.
- Digital pharmacy records no longer render OCR stages, OCR text, worker messages or
  an empty file preview.
- Pharmacy record tables and the patient timeline now identify record authorship,
  pharmacy and staff, and distinguish recorded status from clinical verification.
- Replaced raw-key pharmacy record dialogs with the structured digital record view.
- Added pharmacy encounter-screen shortcuts to authorized history, the pharmacy-safe
  AI assistant, document upload and medicine dispensing. Each destination retains the
  selected patient and continues to enforce its own server-side permission.
- AI citations for records without files now open the authorized digital record
  viewer. File-backed records continue to open the original file.
- Pharmacy E2E coverage now checks saved record details, no-OCR behavior, timeline
  display, source-linked medicine history and encounter-screen navigation.

### Follow-up Validation

- TypeScript typecheck passed.
- ESLint passed.
- Production build passed.
- Full Vitest suite passed: 7 files, 89 tests.
- Pharmacy Playwright workflow passed in both desktop and mobile projects. It covers
  pharmacy encounter create/reopen, every displayed field, recorded and verification
  states, no-OCR/no-file behavior, patient timeline, non-duplicate records, source-linked
  dispensing history, selected-patient navigation, independent authorization checks,
  revocation, and preservation of a doctor-authored encounter.
- The test used a disposable synthetic MongoDB database, which was dropped afterward.
- The existing separate patient-doctor Playwright workflow was also attempted. It
  currently fails while downloading an authorized uploaded file because the API
  encounters `Readable.toWeb` as undefined in the test runtime. This is outside the
  pharmacy display changes; the new synthetic doctor-authored encounter regression
  passes within the pharmacy workflow.
