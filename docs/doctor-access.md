# Doctor access

Only an active, admin-reviewed doctor can redeem a sharing code. A patient creates a random 16-character base64url code (96 random bits), valid ten minutes. Only its keyed hash is stored. Redemption atomically consumes the code and creates a PENDING request; no access is granted.

Patient approval chooses 30 or 60 minutes, scope (all, selected documents, lab, prescription or clinical notes), and separate READ_RECORDS, QUERY_MEDICAL_HISTORY, ADD_CLINICAL_DOCUMENT and CREATE_OUTPATIENT_ENCOUNTER capabilities. Approval and consent insertion are transactional. Duration starts at approval.

Each protected request checks the authenticated role, doctor review status, patient ID, active grant, scope, capability, expiration and revocation. Read and query scopes are matched within the same grant, preventing capability borrowing across differently scoped grants. Write permissions authorize adding new records to the patient; document read scope does not automatically reveal newly added records.

Patients revoke grants server-side. New reads, downloads and AI queries fail. Existing page data or already-downloaded documents cannot be remotely erased. An in-progress download authorized before revocation may finish. Expiration is enforced without waiting for background cleanup; the worker separately records expiration events.

## Pharmacy access

Admin-approved pharmacy accounts use the patient-generated, single-use sharing code and patient approval flow, but requests and grants are stored separately from doctor grants. A pharmacy grant binds a staff account and pharmacy profile identity to the patient, scope, capabilities and expiry. It cannot grant doctor encounter or clinical-document capabilities. Scope, duration and revocation are checked server-side on each request. Updating pharmacy registration details returns the account to pending review and revokes its active grants.

Pharmacy uploads and activity records carry pharmacy, staff, source, timestamp and verification provenance. Pharmacy activity is not clinician-verified. A dispensing record documents supply only; it does not establish consumption.
