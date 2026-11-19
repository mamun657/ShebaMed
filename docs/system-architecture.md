# System architecture

Browser → Next.js Node.js routes → session and capability authorization → MongoDB/GridFS.

Upload → signature/size checks → transactional storage reservation → GridFS original → medical document → persistent processing job.

Separate worker → atomic lease claim → PDF text or page rendering/Tesseract OCR → stored page chunks → Groq JSON extraction → Zod validation → patient review.

Question → authenticated patient scope → authorized records → MongoDB observations/text search → bounded passages → Groq answer → exact source quotation validation → access recheck → response.

No secrets are present in client code. The application is local-first. Deployment requires Node.js native modules and a long-running worker; static-only hosting is insufficient.
