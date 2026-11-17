# SafeShip platform QA

Date: 2026-11-09. Scope: local ip-remediation branch. This report covers the new platform development preview. QA_REPORT.md remains the earlier scanner release record.

## Automated checks

The final run of pnpm test passed 56 tests in 9 files. The final run of pnpm build passed frontend type checking, server type checking, server compilation, and the Vite production build. No lint script is configured, so lint was not run. The TypeScript browser worker remains about 3.53 MB raw. The new platform UI did not change the scanner worker.

## Local HTTP checks

The compiled development server printed http://127.0.0.1:4174/ and bound to loopback. GET /api/v1/providers returned five candidates and zero ready providers. GET /api/v1/templates returned an empty list. POST /api/v1/proof-sessions with explicit simulated mode, consent, and an idempotency key returned a created simulated session. POST /api/v1/attestations/verify returned HTTP 503. GET / returned the built SafeShip page with HTTP 200.

A production-mode startup attempt exited with code 1 as designed. The server rejects normal production startup. It has no production authentication, persistent database, or trusted attestation verifier. These HTTP checks do not establish production API security.

## Browser checks

Headless Microsoft Edge opened the exact local server URL above. At desktop 1440×900, mobile 390×844, and tablet 768×1024, the page loaded, the scanner worker returned SAFESHIP-002 for a harmless TypeScript sample, both platform sections appeared, and no page-level horizontal overflow or page exception was observed.

The User App provider view showed five candidate cards. The Developer Portal read-only API playground returned provider metadata. Screenshots were captured from the built application:

- screenshots/desktop.png
- screenshots/mobile.png
- screenshots/tablet.png

## Privacy observation

A harmless source canary, SAFESHIP_PLATFORM_CANARY_4F9C, was pasted into the scanner editor. The observed browser session made 17 requests. All observed requests used the local origin. The canary appeared in no observed request URL or request body. No external request or page exception was observed. The scanner worker code has no network call. This result covers the tested paths and does not prove behavior for every future change.

## Remaining limits

No live Primus proof was run. No provider account, wallet, appSecret, real Template ID, or production database was used. The development session is simulated and cannot be verified. The proposed SQL migration was not executed against a database. Key hashing, owner-scoped project and API key services, webhook HMAC and retry queue, and restricted audit logging passed unit tests. They are internal development services and are not wired to authenticated, persistent API routes or external webhook delivery. Browser tests did not repeat every scanner case recorded in QA_REPORT.md. Copyright and brand decisions remain open.
