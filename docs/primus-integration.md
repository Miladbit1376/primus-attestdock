# Primus X account ownership integration

Updated: 2026-11-17. The selected Primus Developer Hub template is `2e3160ae-8b1e-45e3-8c59-426366278b9d`. It discloses `screen_name`. A real local extension proof passed on 2026-11-17. The server returned `verified: true`. My Proofs then showed the verified X username and time for the same wallet. No tracked file contains App ID or App Secret values.

## Selected template

- Data source page: `https://x.com/home`.
- Request source: `https://api.x.com/1.1/account/settings.json?*`.
- Disclosed field: `screen_name` at `$.screen_name`.
- Claim: the signed X settings result matches the username entered by the wallet user. This does not prove a legal identity or ownership of the wallet by the X account.

## Local flow

1. Build the application with `NODE_ENV` unset. Put `ATTESTDOCK_DEV_MODE=1`, `PRIMUS_APP_ID`, and `PRIMUS_APP_SECRET` in the ignored `.env.local` file. Keep the secret out of Vite variables, Git, logs, and browser code. Run `pnpm server:local` and open its printed URL. On Windows PowerShell, use `pnpm.cmd` if the execution policy blocks `pnpm.ps1`.
2. The user enters an X username and gives consent. An EVM wallet signs a short-lived AttestDock login message. The server verifies the signature and sets a short-lived HttpOnly, SameSite cookie.
3. The server creates a five-minute proof session with a random nonce. The browser initializes `PrimusZKTLS` with the public App ID. It creates request parameters for the fixed Template ID and authenticated wallet address. It places the session ID, nonce, and `algorithmType: "proxytls"` in `additionParams` before signing.
4. The browser sends the serialized request with POST. The server checks the App ID, Template ID, wallet, timestamp, session binding, and approved request options. It calls `PrimusZKTLS.sign()` with the server-only App Secret. The response contains a signed request, not the secret.
5. The browser calls `startAttestation()` with the signed request. The Primus extension runs the X flow. Browser `verifyAttestation()` gives early feedback only.
6. The browser sends the returned attestation to the local server. The server consumes the session once. It checks the wallet recipient, nonce, session ID, timestamp, X API source, `screen_name` extraction, and username match. It then calls its own SDK `verifyAttestation()`. Only the server response can show local success.
7. My Proofs reads server-verified X results for the signed-in wallet. It shows no raw attestation and loses its history when the local server stops.

The official [Production guide](https://docs.primuslabs.xyz/enterprise/zk-tls-sdk/production/) shows browser initialization, request generation, server signing, extension attestation, and verification. AttestDock uses POST and validates the request before signing. The [SDK API reference](https://docs.primuslabs.xyz/enterprise/zk-tls-sdk/zktls-js-sdk-api/) defines the SDK methods. The [attestation structure](https://docs.primuslabs.xyz/enterprise/attestation-structure/) defines the signed fields.

## Security and limits

The SDK's `verifyAttestation()` recovers the attestor signature and compares the signer to its configured Primus address. AttestDock checks the business fields and session separately. This result is held in memory only. Restarting the server removes wallet and proof sessions. The server is loopback-only and refuses normal production startup. It has no persistent account status, production identity service, shared replay store, or deployment controls. Do not use this local result to grant production access.

The Primus SDK may contact official Primus service endpoints for quota checks and event reports. The browser scanner remains separate: its pasted source is not sent to the Primus API. The local server never receives scanner editor contents.

## Live test result

The project owner used a wallet, the Primus extension, and an authenticated X session. The wallet challenge, server signing, extension proof, server verification, and My Proofs view all completed. The browser showed a verified X account only after the server returned success. The SDK also logged a recovered attestor address during server verification. No raw attestation or credential value is in this repository.

Earlier live proofs found two policy mismatches. First, the extension returned `algorithmType: "proxytls"` when the signed request did not include it. Second, the extension returned equivalent `additionParams` values with different JSON encoding. The current request signs `algorithmType` before proof creation. The server checks the parsed session ID, nonce, algorithm value, allowed keys, and duplicate keys. It then checks the trusted SDK signature. The final live proof passed all checks.

The installed SDK hashes the full `additionParams` string when it verifies the attestor signature. The public [extension request handler](https://github.com/primus-labs/primus-extension/blob/main/src/pages/Background/padoZKAttestationJSSDK/index.js) handles `attMode.algorithmType` separately. The [extension algorithm parameters](https://github.com/primus-labs/primus-extension/blob/main/src/pages/Background/exData.js) forward the signed request's `additionParams` without a visible change. The [offscreen algorithm layer](https://github.com/primus-labs/primus-extension/blob/main/src/services/algorithms/offscreen.js) calls the algorithm module, and the [result handler](https://github.com/primus-labs/primus-extension/blob/main/src/pages/Background/algorithm.js) returns its attestation. Public [SDK test data](https://github.com/primus-labs/zktls-js-sdk/blob/main/test/index.test.ts) includes `algorithmType` in `additionParams`. AttestDock sends this value in the signed request. It accepts equivalent JSON encoding from the extension only when the parsed fields match the session and the trusted SDK signature passes.

If the extension changes a required value or the trusted SDK signature fails, AttestDock rejects the proof. The successful local result is not a durable credential. It does not prove legal identity or continuing control of the X account.

The other provider claims and the Network SDK remain disabled. No template was substituted for the selected X template.
