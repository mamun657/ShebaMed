# Proposed solution

Patients register with a mobile number and password, preserve original reports, review AI extraction and explore their report-date timeline. Doctors independently authenticate, undergo manual admin review, request access using a patient-created code and receive only approved permissions for 30 or 60 minutes.

Groq is a server-side extraction/retrieval component. OCR executes locally. MongoDB holds identities, consent, history and durable jobs; GridFS stores private originals. The MVP uses synthetic information and no SMS or email services.
