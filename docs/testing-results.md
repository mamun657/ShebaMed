# Verification report

Delivery date: 14 November 2026 (Asia/Dhaka).

Every result below was produced by executing the command in this workspace against the configured MongoDB Atlas cluster and the configured Groq account.

## Executed successfully

| Check | Command | Result | What it demonstrates |
|---|---|---|---|
| Production build | `npm run build` | PASS | Compiles in 7.4s, strict TypeScript passes, routes generate |
| Lint | `npm run lint` | PASS | 0 errors, 0 warnings |
| Type check | `npm run typecheck` | PASS | No TypeScript diagnostics |
| Dependency audit | `npm audit` | PASS | 0 vulnerabilities |
| Unit + integration suite | `npm test` | 41 passed | 3 files, no failures, no skipped tests |
| Security suite | `npm test` | 30 passed | Phone normalization, role/input boundaries, scope/capability matching, expiry and revocation rules, CSRF and ID handling |
| Document suite | `npm test` | 8 passed | Signature and size validation, extraction schema checks, selectable-PDF extraction, real PNG OCR, real scanned-PDF render and OCR |
| Live MongoDB suite | `npm test` | 3 passed | Duplicate phone under concurrency, recovery-code consumption and session invalidation, grant scope/expiry/revocation — against a real Atlas replica set |
| Browser e2e (desktop + mobile) | `npm run test:e2e` | 6 passed | Landing, registration, recovery, no-horizontal-overflow, full synthetic patient–doctor authorization workflow |
| Atlas connection | `npm run db:check` | PASS | `MongoDB ping succeeded` |
| Schema setup | `npm run db:setup` | PASS | 21 collections and all unique/TTL/compound indexes created, idempotent |
| Demo seed | `npm run seed:demo` | PASS | 2 synthetic patients, 1 approved doctor, 1 pending doctor, 5 documents, 2 grants, 1 request, 1 encounter |
| Admin provisioning | `npm run admin:create` | PASS | Admin created through the secure script; no public admin registration |
| Live Groq retrieval | manual API run | PASS | 6/6 questions answered with validated citations; unknown tests correctly refused |
| Browser load check | browser inspection | PASS | Landing, registration and patient dashboard render; registration issues recovery codes and issues a ShebaMed ID |

## Verified end-to-end scenario

The full 21-step scenario was executed against live MongoDB and live Groq:

| Step | Result |
|---|---|
| Register with mobile + password | 201, ShebaMed ID `SM-P-6664675000F14E0CE3B5` |
| Duplicate phone, international form `+880…` | 409 |
| Same phone, different role | 409 |
| Phone ownership state | `UNVERIFIED` |
| Upload original (GridFS) | 201, document stored privately |
| Doctor registers | 201, professional status `PENDING` |
| Pending doctor requests access | 403 `Admin review is required before requesting access` |
| Admin approves doctor | 200 |
| Sharing code → doctor request | 200, single-use code consumed |
| Patient approves 30-minute scoped grant | 200 |
| Doctor opens authorized original | 200, 1739 bytes streamed |
| Patient revokes | 200 |
| Doctor file read after revocation | 403 |
| Doctor AI query after revocation | 403 `No active permission` |

## Live AI answer behaviour

| Question | Behaviour |
|---|---|
| "Have I done an HbA1c test before?" | Answered 6.8 %, dated 2026-01-12, cited `synthetic-hba1c.pdf` p1 |
| "What was my previous CBC result?" | Answered 14.0 g/dL, dated 2024-08-20, cited `synthetic-cbc.png` p1 |
| "Which tests were performed in 2024?" | Answered from the 2024 record with its source |
| "Show my previous creatinine reports." | Correctly reported no supporting record |
| "Was hypertension mentioned…" | Reported not mentioned, cited all four searched sources |
| "Have I ever had a Lipase test?" | Correctly reported no supporting record |

Citations are validated server-side against the retrieved passage text and exact page number before an answer is returned.

## Not executed or out of scope

| Check | State | Reason |
|---|---|---|
| Independent security audit | NOT PERFORMED | Controlled synthetic-data MVP only |
| Clinical validation or certification | NOT PERFORMED | No clinical validation is claimed |
| Bengali OCR | NOT INCLUDED | English OCR data ships with npm. Bengali assets require a local traineddata source via `OCR_LANG_PATH` |
| Full application localization | PARTIAL | Bangla landing hero and Bangla/English AI answers implemented; the rest of the UI is English |
| FHIR export and validation | NOT IMPLEMENTED | The internal model is FHIR-shaped; no exporter is claimed |
| Malware scanning of uploads | NOT IMPLEMENTED | Signature and size validation are implemented |
| Full account deletion workflow | NOT IMPLEMENTED | Documented as an operational gap |
| Original-report inline preview | NOT IMPLEMENTED | Originals download; inline preview is not implemented |
| Real patient deployment readiness | NOT CLAIMED | Phone ownership is deliberately unverified |

## Defects found and fixed during this verification pass

| Defect | Root cause | Fix |
|---|---|---|
| `db:check` and `db:setup` failed with `querySrv ECONNREFUSED` | The local DNS resolver could not answer Atlas SRV queries | `lib/db.ts` now configures a resolver and retries; `MONGODB_DNS_SERVERS` makes it explicit |
| Database errors hid the real cause | The script printed one generic message | `scripts/database.ts` now prints the actual error and a specific hint |
| `[vitest-pool]: Worker forks emitted error` / `Worker exited unexpectedly` | `@napi-rs/canvas` 0.1.x segfaulted inside `pdfjs-dist` v6 image rendering | Upgraded to `@napi-rs/canvas` 1.x; scanned-PDF OCR now completes |
| `Property 'destroy' does not exist on type 'PDFDocumentProxy'` | `pdfjs-dist` v6 replaced `destroy()` with `cleanup()` | Updated `lib/processing.ts` |
| `Invalid factory url: … must include trailing slash` | `pdfjs-dist` v6 requires `standardFontDataUrl` for rasterization | Added a resolver-based `standardFontPath()` |
| `npm run lint` did not exist | ESLint was never installed | Added ESLint 9 with the flat config Next 16 ships, plus a `lint` script |
| 4 npm audit vulnerabilities (1 moderate, 1 high, 2 critical) | `pdfjs-dist` and `vitest` were below the patched versions | Upgraded both; added a scoped `minimatch` override. Audit now reports 0 |
| Playwright browsers missing | `npx playwright install chromium` had not been run | Documented and executed; 6/6 e2e tests now pass |
| e2e failures under parallel workers | Parallel workers collided on rate limits and the shared phone pool | `playwright.config.ts` now runs serially with `workers: 1` |
| Hydration mismatch warnings | A **browser extension** injected `bis_skin_checked`, `bis_register`, `__processed_` and `style="color-scheme: light"` before hydration. The server HTML contains none of these markers | Added `suppressHydrationWarning` on the root elements; the remaining warnings originate outside the app |
| Timezone-dependent date rendering | `toLocaleDateString`/`toLocaleString` without a fixed time zone can differ between server and client | Dates now render with an explicit UTC time zone |

## Reproduce

```powershell
npm ci
Copy-Item .env.example .env.local
npm run db:check
npm run db:setup
npm run admin:create
npm run seed:demo
npm run dev:all
```

In a second terminal:

```powershell
$env:E2E_ADMIN_PHONE="YOUR_ADMIN_PHONE"
$env:E2E_ADMIN_PASSWORD="YOUR_ADMIN_PASSWORD"
npx playwright install chromium
npm run test:e2e
```

`npm test` runs the live MongoDB suite when `TEST_MONGODB_URI` is set. It creates and drops only a randomly named `shebamed_test_*` database.

## Honest limits

This report reflects executed commands and observed responses in this workspace against the configured Atlas cluster and Groq account. It is not an independent audit, not a clinical validation, and not evidence of readiness for real patient deployment. Phone ownership is deliberately unverified; previously downloaded copies cannot be recalled after revocation.
