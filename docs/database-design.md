# Database design

`users` owns role, immutable random ShebaMed ID, canonical phone, Argon2id password hash, account status and unverified phone ownership. Patient, doctor and pharmacy profiles are separated from this common identity. Doctor and pharmacy approval states are kept on the user record.

`medical_documents` holds patient and author IDs, original GridFS reference, report date, category, processing state, separate extracted/confirmed structures and verification label. `document_chunks` contains page-numbered original text with a MongoDB text index. `medical_observations` holds AI-extracted values and provenance; confirmed corrections remain separately on the document.

`sharing_codes`, separate doctor/pharmacy access-request and grant collections, and `consent_records` implement role-specific explicit consent. Pharmacy grants bind a staff account and pharmacy profile identity to the patient, scope, capabilities and expiry. `medical_documents` also stores pharmacy upload provenance and pharmacy-assistance/dispensing timeline entries; pharmacy-created records retain UNREVIEWED verification. `sessions`, `recovery_codes` and `rate_limits` protect accounts. `processing_jobs` stores durable leases/attempts. `storage_usage` reserves bytes atomically by patient and globally. `audit_events` stores non-clinical actions. `organizations` and `medical_encounters` support outpatient workflow. `ai_messages` stores short-lived answer-cache records. `ai_conversations` and `system_settings` are reserved collections with no conversation-browser or configuration-editor feature yet.

Unique indexes: users.phoneE164, users.shebamedId, session token hashes, recovery-code hashes, sharing-code hashes, storage_usage.key, processing_jobs.documentId. TTL cleanup is not an authorization boundary; expiry is checked explicitly.
`pharmacy_profiles.registrationNumber` is unique. Pharmacy requests and grants have patient, provider/pharmacy and expiry lookup indexes.

Setup is idempotent, and registration ensures schema initialization. Transactions require a replica set. GridFS upload itself is outside the metadata transaction; a crash-reconciliation process remains a production requirement.
