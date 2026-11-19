# ShebaMed

Patient-controlled outpatient medical memory. Next.js App Router, strict TypeScript, MongoDB/GridFS, Groq and local OCR, with the requested charcoal–orange visual system.

**Status:** implemented controlled MVP, not a clinically validated production service. Production build, lint, type check, 41 automated tests and 6 Playwright browser tests passed during delivery, executed against the configured MongoDB Atlas cluster and the configured Groq account. Read `docs/testing-results.md` before use.

## Start on Windows

Install Node.js 22.13+ or 24 LTS. Extract the ZIP and open a terminal inside `shebamed`.

```powershell
npm ci
Copy-Item .env.example .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Open `.env.local` in your editor. Set:

- `MONGODB_URI`: your **rotated** Atlas connection string, using a database user limited to this database.
- `MONGODB_DB_NAME=shebamed`
- `MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8`: optional. Set this if `db:check` reports `querySrv ECONNREFUSED`, which means the local resolver cannot answer Atlas SRV queries.
- `AUTH_SECRET`: the random value generated above, at least 32 characters.
- `GROQ_API_KEY`: your **rotated** Groq key.
- `GROQ_TEXT_MODEL`: a currently supported JSON-capable model available to your account. The example uses `openai/gpt-oss-20b`; verify availability and account limits in Groq Console.
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

Do not reuse credentials posted in chat. No user-supplied credentials are included in this package.

For Atlas, authorize only your current development IP through its Network Access settings. Use the Atlas-provided URI and keep TLS enabled. The application uses transactions, so a replica set is required; Atlas provides that architecture. A standalone local `mongod` is insufficient.

```powershell
npm run db:check
npm run db:setup
npm run dev:all
```

`dev:all` starts the Next.js server and the OCR/AI processing worker together. Use `npm run dev` and a separate `npm run worker` terminal if you prefer to run them apart.

The worker must stay running for OCR, extraction, retry recovery and expiration-event logging. Request authorization enforces expiry even if the worker is stopped. The development server is not a substitute for the worker.

Linux/macOS: use `cp .env.example .env.local` instead of `Copy-Item`.

## Create an administrator

Set `ADMIN_NAME`, `ADMIN_PHONE` and a 12+ character `ADMIN_PASSWORD` in your private `.env.local`, then run:

```powershell
npm run admin:create
```

Remove these provisioning fields from your environment after securely saving the credentials. Existing accounts are never overwritten. Admin registration is not public. Admins cannot browse patient records. Admins should retain their original administrator credentials; account recovery codes are issued by public patient/doctor registration, not the administrator provisioning script.

## Synthetic demonstration accounts

Set `DEMO_PASSWORD` to a strong password you choose, then run `npm run seed:demo`. The script refuses production mode, does not overwrite non-demo accounts and checks existing fixtures before adding them.

| Mobile      | Synthetic role                      |
| ----------- | ----------------------------------- |
| 01700000001 | Patient: Demo Rahim Ahmed           |
| 01700000002 | Patient: Demo Nusrat Jahan          |
| 01700000003 | Admin-reviewed demonstration doctor |
| 01700000004 | Pending demonstration doctor        |

These are fictional development identifiers, **not verified phone owners**. Use only a controlled database. All four accounts use the configured `DEMO_PASSWORD`. Provision your admin separately. The script adds real PDF/image files to private GridFS, queues OCR, creates a clinical encounter, a pending request and explicit synthetic 30/60-minute grants. These demonstration grants intentionally exist only in seeded test data; ordinary accounts require patient approval. Re-running the seed does not renew expired grants. Use the normal sharing workflow for fresh permissions.

## Included behavior

- Patient, doctor and pharmacy mobile/password registration; E.164 normalization; unique phone and permanent ID indexes; Argon2id hashing.
- HTTP-only server sessions, logout, password changes, one-time hashed recovery codes and session invalidation.
- Patient, doctor, pharmacy and admin workspaces; pharmacy registration requires administrator verification; no public admin signup.
- PDF/JPG/PNG/WEBP signature validation, configurable byte/storage/page limits, private GridFS streaming.
- Selectable PDF text extraction; actual local image and scanned-PDF OCR. English OCR data installs with npm, so it requires no runtime model download. Bangla OCR can be configured using `OCR_LANGUAGES=eng+ben` and a suitable local `OCR_LANG_PATH`; Bengali OCR assets are not included.
- Durable MongoDB jobs, leases, heartbeat, bounded restart attempts and manual retry.
- Groq structured extraction with Zod validation; original text, AI extraction, patient confirmation and clinician-authored notes remain distinct.
- Report-date timeline, record search and category/year filters.
- Authorized MongoDB text/structured retrieval, minimal context, bounded Groq requests, exact-quote/source-page validation, short-lived answer caching and authorization recheck before returning.
- Single-use 10-minute sharing codes; patient approvals for 30/60 minutes; all/selected/category scope; role-specific read, history-query, upload and encounter/dispensing permissions; revocation and server-side expiry.
- Doctor and basic pharmacy encounters, pharmacy dispensing records, pharmacy-upload provenance, admin professional/pharmacy review, account suspension, organizations, operational jobs and non-clinical audit metadata.
- English/Bangla application UI with a server-readable locale preference that persists across routes and refreshes. The AI answer language follows the global locale unless explicitly overridden. User names, filenames, uploaded documents and clinical source content remain unchanged.

No SMS, OTP, email verification, paid authentication, vector database or paid queue is required. No FHIR certification, clinical diagnosis engine or official DGHS integration is claimed.

## Verify

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Database integration tests use a **separate** `TEST_MONGODB_URI`. They create and drop a randomly named `shebamed_test_*` database; the credential must have suitable test-database permissions. The test script loads `.env.local` automatically.

```powershell
$env:TEST_MONGODB_URI="YOUR_TEST_REPLICA_SET_URI"
npm test
```

Playwright is included for your own machine. Start the app and worker, then:

```powershell
npx playwright install chromium
npm run test:e2e
```

For the API workflow scenarios (patient-doctor and patient-pharmacy), set `E2E_ADMIN_PHONE` and `E2E_ADMIN_PASSWORD` for an admin in a disposable application database. Set `E2E_LIVE_AI=1` only when Groq is configured and the worker is running; this adds the real extraction/answer assertions. It creates synthetic accounts and retains them for inspection. Desktop and mobile public-layout tests are also supplied. The suite runs serially so parallel workers cannot collide on rate limits.

## Production build

```powershell
npm run build
npm start
```

Use a Node.js host, HTTPS and a separately supervised worker. Configure `NEXT_PUBLIC_APP_URL` to the exact public origin. Production cookies are Secure. A static export or Cloudflare Workers deployment cannot directly host this official MongoDB-driver/local-OCR architecture. No hosted backend is included or claimed.

## Limits and deployment readiness

Default limits: 5 MB/file, 10 PDF pages, 25 MB/patient, 200 MB total reserved original-file bytes. These are application limits, not a guarantee about available Atlas capacity; database metadata and indexes also consume storage. Failed worker attempts retain the original file. Abrupt process termination during an upload can leave reservations/orphan files; operational reconciliation is required before real use.

Before real patient deployment: independent authorization/security review, verified patient identity, clinical evaluation, malware scanning, privacy/legal review, provider data processing/retention review, backups, deletion and retention workflows, monitoring, resource isolation and worker crash reconciliation. Phone ownership is deliberately unverified. Previously downloaded copies cannot be recalled after revocation. Do not use this MVP with real patient data.

## Project map

`app/` routes and API dispatcher · `components/` UI · `lib/` authentication, authorization, database, processing and retrieval · `scripts/` setup/worker · `tests/` unit, MongoDB integration and Playwright · `demo/` fictional fixtures · `docs/` design, operation and verification.

Dependency versions are pinned by `package-lock.json`. Fonts are bundled from npm packages. The landing illustration is original HTML/CSS and Lucide artwork; the supplied overview collage is not used as the webpage. `pdfjs-dist` v6 requires `@napi-rs/canvas` 1.x for server-side rasterization; the two are pinned together deliberately.
