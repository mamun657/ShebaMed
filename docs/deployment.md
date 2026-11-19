# Deployment

Use Node.js 22.13+ or 24 LTS, npm ci, MongoDB Atlas or another replica set, private server-side environment variables and a separate worker. Run db:check and db:setup before use. Native OCR dependencies need a compatible Linux/macOS/Windows environment.

Development: `npm run dev:all` starts the server and the worker together, or `npm run dev` and `npm run worker` in separate terminals. Production: `npm run build`, `npm start` and a supervised `npm run worker`. Use HTTPS and set NEXT_PUBLIC_APP_URL to the exact origin; mismatches are rejected as CSRF attempts. Never put database or AI keys in NEXT_PUBLIC variables.

## DNS resolution for Atlas SRV URIs

A `mongodb+srv://` URI is resolved through DNS SRV and TXT lookups. On networks where the local resolver refuses or filters those queries, the connection fails with `querySrv ECONNREFUSED` even though the credentials and cluster are correct.

`lib/db.ts` handles this in two ways:

1. It applies `MONGODB_DNS_SERVERS` (comma-separated) to the Node resolver when the variable is set.
2. If a lookup fails with a resolver error and no explicit resolver was configured, it retries once with a public resolver (`1.1.1.1`, `8.8.8.8`).

If both paths fail, the error names the cause and states the fix instead of printing a generic failure:

```
MongoDB host could not be resolved
The local DNS resolver cannot answer SRV queries for this Atlas cluster.
Set MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8 in .env.local, or point MONGODB_URI at a local MongoDB replica set.
```

Verify resolution before starting the application:

```powershell
npm run db:check
```

An alternative is to use a standard (non-SRV) Atlas URI with an explicit `replicaSet` parameter, which avoids SRV lookups entirely.

## Worker requirement

OCR rasterization, Groq extraction, retry recovery and expiration-event logging run in `scripts/worker.ts` as a separate long-lived process. `processing_jobs` rows persist in MongoDB with leases and bounded attempts, so a worker restart resumes work rather than losing it, but a host that never runs the worker will leave uploads stuck in `UPLOADED`.

The worker needs native canvas support for PDF rasterization. `@napi-rs/canvas` 1.x and `pdfjs-dist` v6 must stay on the pinned versions together: `pdfjs-dist` v6 calls `standardFontDataUrl` and `cleanup()` and rasterizes images through the native canvas bindings, and an older `@napi-rs/canvas` segfaults inside that path.

Do not deploy the worker on a serverless platform that cannot keep a long-running Node process alive.

## Hosting

No hosted application was deployed. Cloudflare Workers/static hosting is not appropriate for this official MongoDB driver and native local OCR stack. Free local development is supported; hosting availability and pricing are not guaranteed.

Default English OCR data is installed through npm. Custom OCR languages require local traineddata or an explicitly configured Tesseract language source. Keep uploaded data on MongoDB/GridFS rather than an ephemeral web-server disk. Set Groq account usage/spend limits independently.
