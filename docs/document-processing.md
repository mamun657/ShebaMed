# Document processing

Supported signatures: PDF, PNG, JPEG and WEBP. Original names are sanitized for storage; downloads use server-generated names and attachment disposition. Download authorization runs on every request. Browser MIME labels are not trusted.

Default limits are configurable through .env.example. File byte reservations use MongoDB transactions and unique counters. PDF page count is enforced during processing; oversize-page files remain preserved with FAILED status. Rasterized PDF pages above 16 million pixels are rejected. Storage counters cover originals rather than full Atlas database overhead.

Selectable PDFs use pdfjs-dist text extraction. Scanned pages render through @napi-rs/canvas and Tesseract. Images use Tesseract directly. English trained data installs as a dependency. Bengali OCR can be configured separately, but Bengali OCR accuracy was not evaluated.

## pdfjs-dist v6 requirements

Server-side rasterization depends on three v6 API changes that are easy to miss:

- `PDFDocumentProxy.destroy()` was replaced by `cleanup()`. The `finally` block in `lib/processing.ts` calls `cleanup()`.
- `standardFontDataUrl` is mandatory for rasterization. Without it v6 throws `Ensure that the standardFontDataUrl API parameter is provided`, and the render aborts. `standardFontPath()` resolves the bundled `standard_fonts` directory from `pdfjs-dist/package.json` and appends the required trailing slash. A `file://` URL is rejected by the Node fetcher, so a plain filesystem path is used.
- `page.render()` derives the canvas from `canvasContext.canvas` when `canvas` is omitted, so a 2D context must be supplied.

`@napi-rs/canvas` must stay on 1.x. Version 0.1.x segfaults (`0xC0000005`) inside v6 image painting, which surfaces as an unexplained `Worker exited unexpectedly` in Vitest and a silent crash in the worker process. `pdfjs-dist` and `@napi-rs/canvas` are pinned together in `package.json` for this reason.

The application renders through the same CommonJS module instance that pdfjs loads internally, so the native bindings are shared rather than duplicated.

States: UPLOADED → PROCESSING → NEEDS_REVIEW → COMPLETED, or FAILED. Jobs are atomically leased for ten minutes with a one-minute heartbeat. Stale attempts can be reclaimed up to four attempts; exhausted jobs are marked failed. Manual retry resets the attempt count. Run one worker for the default demonstration deployment.

Original page text, AI extraction and patient corrections are distinct. Zod rejects malformed structures/dates/pages. Patient confirmation is not clinician verification. The UI allows correction of returned findings; adding/deleting individual extraction rows is not implemented. Malware scanning, comprehensive decompression defenses and per-job OS resource isolation remain production work.
