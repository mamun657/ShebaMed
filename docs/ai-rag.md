# AI medical memory

Groq is called only from server/worker code. The configured model must support JSON-object output. The runtime never switches to another provider or a paid plan. Account-level Groq billing/spend controls must be configured by the operator; application rate limiting alone does not enforce a monetary cap.

Queries authorize the patient and capability first, retrieve scoped observations and MongoDB text matches, and send at most eight passages of 5,000 characters each. If text search yields no matches, a bounded authorized fallback is used. This is baseline retrieval, not semantic vector search; synonym recall and large-history coverage are limited.

Response citations must identify a supplied document/page and quote an exact substring. Invalid references are rejected. No-source output is replaced with an honest no-supported-answer message. This validates source links, not clinical semantic correctness. User-facing cautions remain necessary.

Cache keys include patient, question, language and supplied evidence. Cached answers are reauthorized and valid for ten minutes; no cross-patient answer sharing occurs. Cache records have expiresAt, but currently no TTL deletion policy; retention must be configured for production.

The prompt disallows diagnoses, prescriptions, stopping treatment and automatically ruling out repeat tests. Documents are untrusted data. English/Bangla answers are supported. Live Groq correctness and availability were not verified during delivery.

Provider references: https://console.groq.com/docs/models and https://console.groq.com/docs/deprecations (consulted 14 November 2026). Model availability is account-dependent.
