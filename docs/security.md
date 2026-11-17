# AttestDock security and privacy model

Updated: 2026-11-17. This document defines required controls. It does not claim that controls listed as future work are already implemented.

## Trust boundaries

The browser, browser extension, pasted scanner source, third-party provider pages, and developer clients are untrusted. The trusted server owns template mappings, signing secrets, session state, authorization, and final verification. A frontend-provided verified flag, claim value, URL, timestamp, or template ID is never authoritative. All external input has size and schema limits.

The current scanner runs in a browser worker. The browser QA observed no source upload in the tested session. New platform APIs must never receive scanner editor contents. JSON exports can contain short source lines; users must review them before sharing.

## Proof invariants

- No real proof starts without an active approved template, user consent, and a server session.
- A session has a random ID, nonce, recipient binding, expiry, and one approved claim.
- Only a trusted verifier can move a session to verified.
- Signature, expected attestor, source, claim fields, conditions, timestamp, recipient, and nonce binding must pass before that transition.
- A session can be consumed once. Expired, cancelled, failed, or consumed sessions cannot be replayed.
- Mock and development fixtures have a separate mode. They never become verified.
- The Enterprise and Network SDKs have separate request and result contracts.

## Secrets and API keys

The Primus appSecret belongs only in backend configuration. Do not put it in VITE-prefixed variables, frontend source, URLs, logs, or browser storage. Use POST for signing. Bind signing to an approved stored template and session; do not sign arbitrary client input. Hash developer secret keys with a keyed or slow hash as appropriate, store only a prefix for lookup, scope keys to one project, and show raw keys once. Rotate and revoke keys. Enforce project ownership and allowed origins. Public keys are identifiers, not authorization.

## Data protection

Do not collect provider passwords or browser cookies. Show a disclosure preview with exact fields and recipient before consent. Prefer conditional proofs when a verified template supports them. Store minimal metadata. Do not persist raw attestations by default. If retention is necessary, obtain consent, encrypt at rest, set an expiry, and provide deletion. Audit events exclude credentials, raw attestation payloads, and pasted scanner code. Define backup and retention policies before production.

## API and webhook controls

Validate input, authenticate users, authorize ownership, limit request size, rate limit, and use safe errors. Use idempotency for session creation and webhook delivery. Sign webhooks with HMAC over a timestamp and event ID. Reject stale timestamps and duplicate event IDs. Retry transient delivery failures with a cap and preserve a minimal delivery log. Do not send unnecessary personal information.

## Current blockers

The selected X account ownership template has a working local proof flow. A real extension proof returned `verified: true` on 2026-11-17 after server checks and Primus SDK signature verification. No tracked file contains Primus credential values. The system has no persistent database or production identity service. The local server uses wallet challenge signatures, an HttpOnly cookie, short-lived nonces, one-use sessions, and server-side claim checks. These in-memory controls are not a production proof system. Review third-party assets, release notices, and the public name before a release claim.

## Official references

- [Enterprise SDK production guidance](https://github.com/primus-labs/skills/blob/main/primus-zktls-js-sdk-dapp/SKILL.md)
- [Attestation structure](https://docs.primuslabs.xyz/enterprise/attestation-structure/)
- [SDK error codes](https://docs.primuslabs.xyz/enterprise/error-code/)


## Implemented local controls

The development server binds to 127.0.0.1, checks Host and write Origin, caps JSON bodies, and limits local request rate. It serves separate simulated sessions and a gated local X proof flow. The local verifier rejects a proof unless the server checks pass. The separate security module hashes developer secret keys with a salt and server pepper and verifies timestamped webhook HMAC signatures once per event ID in memory. Internal project and key services check ownership and scopes. An internal webhook queue encrypts its signing secret in memory and tracks capped retries. Audit metadata accepts only narrow ID, route, and status values. These services are not connected to authenticated persistent API routes. In-memory replay tracking is not sufficient for a production multi-instance deployment.

External webhook delivery is not implemented. Before enabling it, reject private and loopback destinations after DNS resolution, defend against DNS rebinding and redirects, and apply outbound timeouts and retry limits.

The Primus browser SDK may contact official Primus service endpoints for quota and event reporting during a proof. The scanner editor and worker do not call that SDK. The local proof API accepts wallet and attestation data, not scanner source. The App Secret is read from the server environment only.
