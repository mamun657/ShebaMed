# Authentication

Public roles are PATIENT, DOCTOR and PHARMACY. Bangladesh mobile numbers are parsed and normalized to E.164. A database unique index applies across all roles. Duplicate failures use a generic account-details error. IDs use 80 random bits with role prefixes and a unique database index; they never authorize access.

Passwords require 12–128 characters and are hashed with Argon2id. Session tokens contain 256 random bits; only HMAC-SHA256 digests are stored. Cookies are HTTP-only, SameSite=Lax, eight-hour lifetime and Secure in production. Mutating routes require the configured exact Origin. Rate limits persist in MongoDB.

Six random recovery codes are shown once after public registration. Only keyed hashes are stored. A recovery transaction consumes one unused code, replaces the password hash and deletes all sessions. Password changes require the existing password and revoke sessions. Keep AUTH_SECRET stable; rotating it invalidates all hashed tokens and recovery codes.

Doctor and pharmacy accounts remain pending until an administrator reviews their professional or pharmacy-registration profile. Pharmacy record access is unavailable until approval. Phone ownership remains UNVERIFIED. No OTP, email, number-only recovery or public admin registration exists. Admins are provisioned through an environment-driven script. Future verified identities should be added using separate verifiedAt/provider/credential records rather than interpreting current mobile values as verified.

## Session storage

Sessions live in a MongoDB `sessions` collection rather than in memory, so they survive an application restart and can be revoked centrally. `users.phoneE164` and `users.shebamedId` carry unique indexes, so the one-number-one-account rule and the permanent ID rule are enforced by the database rather than by application checks. Concurrent registration attempts collide on the unique index and exactly one succeeds; the losing request receives the same generic message as any other duplicate, which does not disclose that an account exists.

## Rate limiting

`rate_limits` stores a counter per key and fixed window. Keys are scoped separately for global auth traffic, per normalized phone number, per API session, per upload, per AI query, per retry and per sharing-code generation. The document key is a SHA-256 digest used directly as `_id`, so the collection never stores a raw phone number as an identifier.

## Environment

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Key for token, recovery-code and sharing-code digests. At least 32 characters. Rotating it invalidates every stored digest. |
| `NEXT_PUBLIC_APP_URL` | Expected request origin. Mutating requests whose Origin differs are rejected. |
| `MONGODB_URI` | Database connection string. See `docs/deployment.md` for Atlas SRV DNS resolution. |
| `MONGODB_DNS_SERVERS` | Optional resolver list used when the local resolver cannot answer Atlas SRV queries. |
