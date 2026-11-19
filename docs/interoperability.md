# Interoperability readiness

This release has no FHIR endpoint, validator-certified export or DGHS connection. Internal fields preserve identifiers, report dates, authorship and source provenance to support later mappings.

| Internal data                   | Candidate FHIR R4 resource |
| ------------------------------- | -------------------------- |
| Patient profile and ID          | Patient                    |
| Doctor profile                  | Practitioner               |
| Organization                    | Organization               |
| Outpatient encounter            | Encounter                  |
| Extracted result with unit/page | Observation                |
| Laboratory report metadata      | DiagnosticReport           |
| Private original reference      | DocumentReference          |
| Explicit recorded diagnosis     | Condition                  |
| Scoped grant                    | Consent                    |
| Access event                    | AuditEvent                 |

These are design mappings, not conformance evidence. Terminology normalization, coded units, encounter linking, export security, profile selection and validation require further work.
