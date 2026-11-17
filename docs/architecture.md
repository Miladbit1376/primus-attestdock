# AttestDock architecture

Updated: 2026-11-09. Status: target design after the Phase 0 repository audit.

## Phase 0 baseline

At the start of this work, AttestDock was one Vite 8 application with React 19 and TypeScript. A browser worker calls the six-rule static scanner. The UI accepts one JavaScript or TypeScript file, reports line numbers, and exports JSON. The scanner does not send source code to a server. Vitest covers rule behavior and the worker message path. The repository uses pnpm. At that baseline, it had no server, API, database, authentication, wallet connection, Primus SDK runtime, deployment configuration, or environment variables. The existing examples contain SDK names and harmless fixture values; they are scanner input, not live proof generation.

Keep the scanner as an independent local tool. Do not connect its source editor to platform APIs.

## Target modular monolith

One repository holds the user app, developer portal, shared domain code, and server. The modules use one set of domain types and validation rules. The browser cannot set proof status or verify signatures for the trusted server.

| Module | Responsibility | Trust boundary |
| --- | --- | --- |
| ProviderRegistry | Candidate providers, claims, and availability | Server controls production readiness. |
| TemplateRegistry | Approved template IDs, version, claim mapping, disclosure | Server controls mapping and activation. |
| ProofEngine and ProofSessionManager | Session lifecycle, nonce, expiration, replay control | Server owns state transitions. |
| PrimusEnterpriseAdapter | Browser extension flow and production signing | Backend holds appSecret. Browser receives only signed request data. |
| PrimusNetworkAdapter | Wallet, chain, task, and confirmation flow | Disabled until configured and reviewed. |
| AttestationVerifier | Signature, attestor, source, claim, recipient, timestamp, and conditions | Runs on trusted server. No client flag is authoritative. |
| PrivacyManager | Consent, disclosure preview, retention, export, deletion | Stores minimum necessary data. |
| DeveloperProjectManager and APIKeyManager | Project ownership, hashed keys, origins, scopes | Secret keys appear once and stay server-side. |
| WebhookManager | Signed events, retry, delivery state | Avoids unnecessary personal data. |
| AuditLogger | Security and lifecycle events without raw secrets | Separate from user-visible proof data. |

The user app uses the shared core through server APIs. The developer portal and typed SDK use the same APIs. The scanner remains local. No second backend is planned.

## Data and API boundary

The target persistent store needs Users, DeveloperProjects, DeveloperApiKeys, ProviderDefinitions, ProofTemplates, ProofSessions, AttestationRecords, WebhookEndpoints, WebhookDeliveries, and AuditEvents. Use foreign keys, unique keys, ownership checks, indexed status and expiration fields, and retention jobs. No database exists today. A production database choice and deployment are not yet configured.

A REST API under /api/v1 will expose only validated provider metadata, sessions, proof verification results, developer project operations, and webhook setup. Authentication and project authorization precede writes. Browser requests use a session-bound user identity. Developer requests use scoped keys. Public keys do not authorize sensitive operations. The server must not accept an arbitrary source URL or client-supplied verified state.

## Proof flow

1. The user chooses an available provider and claim.
2. The UI shows the precise disclosure and asks for consent.
3. The server resolves an active approved template and creates a short-lived session with a nonce.
4. The browser executes the selected adapter with user control. Enterprise signing uses POST to the backend; appSecret stays there.
5. The server verifies the attestation independently, checks expected source and fields, recipient, timestamp, conditions, and session binding.
6. One atomic transition consumes the session. Replay and late results fail.
7. The UI shows verified only after a trusted server result. Development fixtures remain marked simulated and never verified.

Session states are created, awaiting_user, awaiting_extension, generating, submitted, verifying, verified, rejected, expired, cancelled, and failed. State transitions are explicit and monotonic except documented retries.

## Present constraints

The X account ownership Template ID is selected. The local browser and server SDK flow passed a real extension proof on 2026-11-17. The server returned `verified: true` after its field checks and SDK signature check. No tracked file has an App ID or App Secret value. Local wallet sign-in and proof results use in-memory sessions. There is no production identity service, database, or durable verification record. See primus-integration.md and security.md.

## Sources

- [Primus Enterprise SDK integration guide](https://github.com/primus-labs/skills/blob/main/primus-zktls-js-sdk-dapp/SKILL.md)
- [Primus attestation structure](https://docs.primuslabs.xyz/enterprise/attestation-structure/)
- [Primus SDK error codes](https://docs.primuslabs.xyz/enterprise/error-code/)
- [Primus Network SDK guide](https://github.com/primus-labs/skills/blob/main/primus-network-js-sdk-dapp/SKILL.md)


## Implemented development slice

The current branch adds shared provider and template registries, simulated proof sessions, disabled Enterprise and Network adapters, a loopback API, a private typed SDK, and user and developer previews. It adds a proposed PostgreSQL schema and key and webhook cryptographic primitives. The X browser flow, local wallet sign-in, POST signer, and server verifier are connected to the loopback API. One real local extension proof passed verification on 2026-11-17. No production database or identity service is connected. The platform server rejects production startup.
