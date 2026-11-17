# Local API reference

Updated: 2026-11-17. This API binds to loopback and refuses normal production startup. The X proof path needs server-only `PRIMUS_APP_ID` and `PRIMUS_APP_SECRET` settings. It has no persistent account status.

| Route | Local behavior |
| --- | --- |
| GET /health | Returns server status. |
| GET /api/v1/providers | Returns the candidate provider catalog. |
| GET /api/v1/providers/:providerId/claims | Returns candidate claims or 404. |
| GET /api/v1/templates | Returns the general template registry, which remains empty. The selected X template is fixed in the local proof service. |
| POST /api/v1/proof-sessions | Creates a simulated session only. Requires consent, `mode: "simulated"`, and an Idempotency-Key. |
| GET /api/v1/proof-sessions/:id | Returns a simulated session. |
| GET /api/v1/primus/config | Returns the public App ID, selected X Template ID, and local enabled flag. It never returns the App Secret. |
| POST /api/v1/primus/challenge | Takes a wallet address and returns a short-lived message to sign. |
| POST /api/v1/primus/authenticate | Checks the wallet message signature and sets an HttpOnly, SameSite cookie. |
| POST /api/v1/primus/sessions | Requires a wallet session, consent, and an X username. Returns a five-minute session ID and nonce. |
| POST /api/v1/primus/sign | Requires the wallet session. Checks the fixed template and serialized SDK request, then signs it once with the server-only App Secret. |
| POST /api/v1/primus/verify | Requires the wallet session. Checks the returned attestation on the server and consumes the session once. |
| GET /api/v1/primus/proofs | Requires the wallet session. Lists up to 20 server-verified X proofs for that wallet in the current local server process. Returns no nonce or raw attestation. |
| Other proof, developer, webhook, and usage routes | Return 503 until their controls exist. |

All Primus POST routes require a same-origin `Origin` header. The server checks Host, rate limits local requests, caps JSON bodies at 64 KiB, and returns safe errors. Wallet and proof sessions exist only in process memory. The X verification result and My Proofs list are local and temporary. The server does not accept a client `verified` flag. The browser scanner does not call these routes.

The live X flow uses its own fixed template and session store. The general provider and template catalogs still describe production readiness; they do not claim that X is deployed.
