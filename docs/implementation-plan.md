# AttestDock implementation plan

Updated: 2026-11-17. This plan follows the Vite/React/TypeScript repository. It does not treat a mock result as a real proof. Sections dated 2026-11-09 record the earlier development state.

## Phase 0: audit

At the start of this work, the app had no backend, database, authentication, or live Primus integration. The repository audit preserved the six-rule scanner and recorded architecture and security limits. Later sections describe the current local X proof flow.

## Increment 1: shared domain and development fixture

Define provider, claim, template, session, verification, disclosure, and adapter contracts in shared TypeScript. Register Google, Discord, X, GitHub, and TikTok as candidates. Use planned or template_pending status until an approved template is configured. Use fixture IDs only in clearly marked development data; do not present them as Primus IDs. Add pure validation, lifecycle, expiry, and replay tests.

## Increment 2: API and storage

Add one server to the repository. It must validate input, enforce ownership, apply rate limits, and return safe errors. Add migrations for the target data model and a repository layer. Keep any in-memory fixture restricted to local development and tests. Production startup must fail when authentication, persistence, or verification is not configured. Add API authentication, authorization, and key security tests.

## Increment 3: user app and developer portal

Keep the scanner route and behavior. Add user and developer navigation with shared components. A provider with no verified template displays template_pending and cannot start a real proof. Show consent and exact fields before proof creation. Mark fixture sessions simulated. Do not show success or verified for fixture data. Add responsive, accessible loading and error states.

## Increment 4: enterprise adapter

After receiving a real appId, server-side appSecret, approved template ID, and a documented trusted server verification method, add the enterprise SDK. Use production signing through a POST endpoint. Reject arbitrary URLs. Bind each signed request to the stored session. Verify the returned attestation on the server and test source, claim, recipient, time, conditions, and replay behavior. Never rely on the browser verification flag alone.

## Increment 5: network adapter

Keep the Network SDK adapter separate and disabled until wallet, chain, contract, and template configuration is verified. Use Base Sepolia for development and Base mainnet only after a release review. Validate chain ID and confirm the on-chain task result before changing proof status.

## Increment 6: developer toolkit and webhooks

Publish a typed internal SDK package after the API contract is stable. Add React integration after the core browser flow is tested. Add scoped developer keys, origin checks, signed webhooks, retries, delivery logs, usage, and request logs. Keep payloads minimal.

## Acceptance gates

Run tests, type checking, lint when configured, and the production build after each increment. Test browser flows and privacy again before any production release. The local X flow has valid development credentials, a selected template, and server verification. Production still needs persistent storage, stronger identity and project authorization, security review, and explicit deployment approval. Review third-party assets, notices, and the product name before a release claim.


## Development status on 2026-11-09

Phase 0 documents are complete. Increment 1 has shared contracts, candidate registries, session expiry and replay checks, disclosure gating, and tests. Increment 2 has a loopback-only simulated API and a proposed SQL schema; persistent storage, authentication, authorization, and live writes remain open. Increment 3 has user and developer previews with disabled controls for unavailable flows. Increment 4 has a disabled Enterprise adapter and error mapping; no live SDK or server verifier is connected. Increment 5 has a disabled Network adapter and chain checks. Increment 6 has a private typed SDK, in-memory project and scoped-key services, webhook signature and retry primitives, and an audit logger. Persistent project and delivery services remain open. See PLATFORM_QA_REPORT.md for executed checks.

## Development status on 2026-11-17

- The local X proof passed a real extension test. The server returned `verified: true` after wallet, session, source, field, time, and SDK signature checks.
- My Proofs showed the verified X username and time for the signed-in wallet. Results remain in memory and are lost on restart.
- The browser scanner remains separate and keeps source code on the device.
- The server still rejects production startup. Durable storage, production identity, project-scoped consent, external Verification API, and release review remain open.
- Milad is the stated copyright holder. The repository uses the AttestDock name. Review third-party assets and release notices before a release claim.
