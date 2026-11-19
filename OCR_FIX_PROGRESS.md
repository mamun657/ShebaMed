# OCR fix progress

## Phase 1 — stuck uploads (done, verified on the live database)

**Root cause.** No processing worker was running. `npm run dev` started only the
Next.js server; the worker needed `npm run dev:all`. The upload, GridFS file,
`medical_documents` row and `processing_jobs` row for `what.jpg` were all
created correctly, but the job stayed `QUEUED` with 0 attempts and the newest
worker heartbeat was five days old. Nothing in the UI said so.

**Files changed.** `scripts/dev.mjs`, `scripts/worker.ts`, `package.json`,
`lib/processing.ts`, `app/api/[...path]/route.ts`, `components/workspace.tsx`,
`components/document-detail.tsx`.

**Work completed.**
- `npm run dev` (and `dev:all`) now start web + worker; the worker is restarted
  up to 5 times if it crashes. `npm run dev:web` is web only.
- Worker heartbeat every 15 s on a timer (was only while idle), periodic
  orphan reconciliation, and jobs abandoned by a killed worker are released
  after 3 minutes without a job heartbeat (was 10-minute lease only).
- Document becomes `QUEUED` as soon as its job exists; `processingStartedAt`,
  `attempts`, `failedAt` are persisted; exhausted stale jobs set
  `extractionState: FAILED`.
- `GET /api/records` reports whether a worker is online when something is
  pending; the record page shows "processing is not running" instead of an
  endless Pending, and polls only `/api/records` with backoff (3 s → 15 s)
  instead of `auth/me` + `access` + `records` every 4 s.

**Evidence.** After starting the worker, `what.jpg`
(`6afe880403db259fa17813cc`) went QUEUED → PROCESSING → NEEDS_REVIEW in 22 s:
1 page, `IMAGE_OCR`, Tesseract confidence 32, job `COMPLETED`, attempts 1.

**Remaining.** Tesseract cannot read the handwriting (confidence 32, no
medicines). See phase 2.

## Phase 2 — OCR quality and medicine extraction (done; handwriting is best effort)

**Root cause.** Tesseract is a printed-text engine. On `what.jpg` it returns
confidence 32 and no usable medicine names, and the text-only Groq model can
only work from that OCR text.

**Files changed.** `lib/processing.ts`, `lib/prescription.ts` (new),
`lib/rag.ts`, `app/api/[...path]/route.ts`.

**Work completed.**
- Image preprocessing: shadow flattening, percentile contrast stretch,
  automatic 90/180/270 rotation retry. The original upload is never modified.
- Structured medicines in `extracted.prescription` (name, strength, dose,
  frequency, duration, source line, page, review state, prescriber).
- Verbatim grounding: a medicine name or detail that is not literally in the
  document text is dropped, and one medicine cannot borrow another's details.
  Pages below 60 % OCR confidence, and any handwriting read by AI, are
  `NEEDS_REVIEW`. Unreadable medicine lines are counted, never replaced.
- Optional handwriting transcription with a Groq vision model. It is **off**
  unless `GROQ_VISION_MODEL` is set in `.env.local`, because it sends the
  image itself to Groq (billed per token on the existing key).
- A `STRUCTURED_MEDICINES` chunk is stored for the assistant. It says the
  medicines are prescribed according to the document and not confirmed as
  dispensed or taken; low-confidence passages are labelled for the assistant.

**Result on `what.jpg`.** Re-read under version `2026-11-19.1`: status
`NEEDS_REVIEW`, extraction `EXTRACTED`, OCR confidence 32, 0 medicines,
0 guessed. The handwriting is still not read.

## Phase 3 — report detail UI (done)

**Files changed.** `components/document-detail.tsx`, `components/workspace.tsx`,
`app/globals.css`, `lib/i18n.tsx`.

**Work completed.**
- Status updates on their own (Queued, Processing, Needs review, Completed,
  Failed) with a "processing is not running" message when no worker is alive.
- Failed state shows the sanitized reason and a Retry processing button.
- Low-confidence notice with the real OCR confidence and "Read this document
  again".
- Prescribed medicines section (one card per medicine with its review state)
  beside the original preview, and a medicine editor in the patient review
  form. Patient-typed medicines are stored as "Entered by patient".
- Bangla strings for all new text. Also fixed in Bangla: the category box in
  the review form showed "Lab report" for every document (options had no
  `value`), and the stage labels were not translated.

## Phase 4 — verification (19 Nov, on the user's machine)

| Check | Result |
|---|---|
| `npm run lint` | passed |
| `npm run typecheck` | passed |
| `npm test` | 87 of 87 passed |
| `npm run build` | passed |
| `npm run test:e2e` | 9 passed, 3 skipped, 2 failed (see below) |

Browser checks with synthetic uploads on the demo patient account
(scripts and screenshots in `C:\shebamed-ui-screens`, folder `ocr`):
- Upload returned 201 and created one document and one job.
- With no worker: the page showed "processing is not running". After the
  worker was started the page went Processing, then Needs review, without a
  reload.
- Printed prescription: 91 % confidence, all three medicines with strength,
  dose and duration, marked "Read from document", prescriber shown. A second
  printed one (two medicines) read at 93 %.
- Handwriting-style image: 37 % confidence, low-confidence notice, the
  misread names shown as read and marked "Needs review", nothing corrected
  or invented.
- Patient review: added one medicine by hand; it was saved as "Entered by
  patient" and the record became Completed / Patient confirmed.
- Simulated dead worker with attempts used up: record went to Failed with
  "Worker retry limit reached. Retry manually." Retry returned 200; two
  duplicate retry requests returned 409. Still one job, two chunks, one
  medicine chunk after the re-read.
- Assistant, as the owning patient: listed the four medicines with the
  document as source. As a different demo patient: no record found.
- The demo patient cannot open `what.jpg`, which belongs to another account:
  it is not in their list and its file returns 403.
- `mymed.jpg`, uploaded by the owner at 12:05 while the worker was running,
  was processed and has since been confirmed by the patient.
- Queue at the end: 48 jobs, all completed; no document left at Uploaded.
- No horizontal overflow at 390, 820 and 1440 px.

## Remaining issues

- `what.jpg` handwriting is not read. Either enable `GROQ_VISION_MODEL`
  (not tested, needs the owner's consent to send images to Groq) or type the
  medicines into the review form.
- The existing `unsafePattern` in `lib/medical.ts` classifies any question
  containing "prescribe", "prescribed" or "prescribing" as an unsafe advice
  request, so "what was I prescribed" is not answered from the records. The
  assistant check used "medicines listed on my prescription". Not changed.
- E2E `public.spec.ts` "landing, registration and recovery are connected"
  fails on desktop and mobile: it expects the heading "Your medical history,
  always within reach." but `components/landing.tsx` (edited 17 Nov) now says
  "Your Medical Records. Your Doctor. One Connected Story." A temporary copy
  of the test with the new heading passed on desktop and mobile, so the
  heading line is the only stale part. `public.spec.ts` was not changed.
- Printed Bangla OCR was not tested.
- On the synthetic printed prescription the existing "Hospital" field picked
  up the header line plus the doctor and date. Not changed.
- Three synthetic test records remain on the demo patient account
  (two `synthetic-test-prescription-*.png`, one
  `synthetic-test-handwriting-*.jpg`). Nothing was deleted.
- The worker now running was started from the Devin session (12:21). The
  `npm run dev` started at 10:29 predates the launcher change and is web
  only.

**Exact next step.** Decide on `GROQ_VISION_MODEL`; restart `npm run dev` so
the web app and worker run from one terminal.
