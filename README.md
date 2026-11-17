# AttestDock

AttestDock is an independent tool for Primus zkTLS account proofs and integration checks. Its local X flow verifies a wallet-linked `screen_name` with a server-checked attestation. Its browser scanner checks one JavaScript or TypeScript file for visible integration risks. AttestDock is a community project. It is not affiliated with or officially endorsed by Primus Labs.

The pre-release SafeShip name and `SAFESHIP-*` scanner IDs changed to AttestDock and `ATTESTDOCK-*`. Existing exported JSON reports keep their old IDs. The private SDK package and local environment variable prefix also changed. No public SDK version was released under the old name.

## Features

- Local AST scan for `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, and `.cjs` files.
- Scans in a browser worker so the editor remains responsive.
- Six security and integration rule categories.
- File upload, environment selection, example snippets, line numbers, and JSON export.
- Browser scanner source stays local. The loopback platform API now has a local X account ownership flow with wallet sign-in and server verification. It has no production database or persistent account status.

## Run locally

Use Node.js `^20.19.0` or `>=22.12.0`, as required by the installed Vite version. From a standalone checkout:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite. Run `pnpm test` for unit tests and `pnpm build` for a production build. Run `pnpm preview` to inspect the built site. If you run the project inside a parent pnpm workspace that does not include it, add `--ignore-workspace` to the install command.

On Windows PowerShell, use `pnpm.cmd` when the execution policy blocks `pnpm.ps1`. This does not require changing the system execution policy. Leave `NODE_ENV` unset when you run the production build.

## Local X account ownership flow

AttestDock uses the selected Primus X Account Ownership template `2e3160ae-8b1e-45e3-8c59-426366278b9d` and `@primuslabs/zktls-js-sdk` 0.3.15. The template discloses `screen_name` from X account settings. On 2026-11-17, the project owner completed a real local X proof and repeated it after the AttestDock rename. My Proofs showed the server-verified X username and time after the second run. The server checks the session, wallet, source, disclosed username, time, and Primus SDK signature. These results are local and temporary. They are not production account credentials.

To try the integration, run `pnpm build` first. Put `ATTESTDOCK_DEV_MODE=1`, `PRIMUS_APP_ID`, and `PRIMUS_APP_SECRET` in the ignored `.env.local` file. Use values from the Primus project that owns the selected X template. Keep the App Secret out of Git, browser code, and logs. Run `pnpm server:local`. Use `pnpm.cmd` if PowerShell blocks `pnpm.ps1`. Open the exact loopback URL printed by the server. Connect an EVM wallet and the Primus extension, enter the X username, and consent to the request. The browser gets a signed request from the local server. The local server checks the returned attestation before it shows success. The local result is lost on restart.

No tracked file contains an App ID or App Secret. The ignored `.env.local` file holds local credentials. The integration stays disabled until both values are set. The server refuses normal production startup. It has no production identity service, persistent replay store, or durable verified account record. The other provider claims remain candidates. Simulated API sessions remain separate and never become verified.

The browser scanner remains independent. It does not send editor contents to the platform API or Primus. The Primus SDK may contact Primus service endpoints during the proof flow. See [Primus integration](docs/primus-integration.md), [architecture](docs/architecture.md), [security](docs/security.md), [provider support](docs/provider-support.md), [API reference](docs/api-reference.md), and [deployment gate](docs/deployment.md).

## Detection rules

| Rule | What it reports | Limit and possible false positive |
| --- | --- | --- |
| ATTESTDOCK-001: Exposed app secret | A literal `appSecret` in frontend or unknown code, or a public variable name that suggests a secret. | The selected environment can be wrong. A sample literal can trigger a finding. Indirectly imported secrets can be missed. Backend literals are not reported by this rule. |
| ATTESTDOCK-002: Missing attestation verification | A recognized decision call uses an attestation, with no `verifyAttestation()` call visible in the same function. | Verification in another function or file can cause a false positive. Other verifier names can be missed. |
| ATTESTDOCK-003: Missing business logic validation | A recognized decision follows verification, with no visible check of selected attestation fields or source. | The field checks are heuristic. A check elsewhere can cause a false positive; an irrelevant field check can hide a real issue. |
| ATTESTDOCK-004: Sensitive data logging | A `console` call uses a variable named like a credential or complete attestation. | The variable may contain harmless data. Logs through wrappers or differently named variables can be missed. |
| ATTESTDOCK-005: Missing freshness validation | A recognized decision follows verification, with no visible timestamp comparison. | Your policy may validate freshness elsewhere. A visible but ineffective comparison can hide a real issue. No fixed age limit is assumed. |
| ATTESTDOCK-006: Unsafe verification result handling | A recognized decision can proceed when the visible verification result is not checked or verification occurs later. | The guard check is a local syntax heuristic. Complex control flow can cause a false positive or missed issue. |

Decision rules recognize calls named `grantAccess`, `approve`, `accept`, `authorize`, `fulfill`, `issue`, `unlock`, `award`, `release`, and `markVerified`. Renamed or wrapped calls can be missed. Each finding is a prompt for review, not proof that the full application is unsafe.

## Verified Primus sources

- [Primus organization](https://github.com/primus-labs)
- [JavaScript SDK repository](https://github.com/primus-labs/zktls-js-sdk) — its README points to the Primus documentation.
- [Core SDK repository](https://github.com/primus-labs/zktls-core-sdk) and [Primus Core SDK usage guide](https://github.com/primus-labs/skills/blob/main/primus-zktls-core-sdk/references/usage-guide.md) — document `PrimusCoreTLS`, `init()`, `startAttestation()`, and local `verifyAttestation()`.
- [Extension Core SDK README](https://github.com/primus-labs/zktls-extension-core-sdk#readme) — documents `PrimusExtCoreTLS`, server-side production signing, `verifyAttestation()`, and application checks of attestation content and timestamp.
- [Primus documentation](https://docs.primuslabs.xyz/).

The examples use documented SDK names. Business field and freshness checks are application policy. The scanner does not claim that Primus requires a specific freshness window or source field for every application.

## Supported SDK patterns

The rules recognize the documented `startAttestation()` and `verifyAttestation()` method names used by the Core SDK and Extension Core SDK. The scanner also accepts integration code that uses the JavaScript SDK, but it does not validate every method or version of that SDK. It does not load any Primus SDK at scan time.

## Security limits

The scanner performs static analysis only. It does not execute or upload submitted code. It does not save code automatically. If you export a report, the downloaded JSON contains finding text and short source lines. Secret literals detected by ATTESTDOCK-001 are redacted. Review exports before sharing them because other source lines may contain sensitive data.

This is a heuristic single-file scan. It cannot follow imports, prove control flow across functions, confirm a verifier's implementation, check on-chain behavior, detect every secret, or certify a full application. It is not a complete security audit. A clean report does not prove that an application is secure.

## Screenshots

- [Desktop page preview](screenshots/desktop.png)
- [Mobile page preview](screenshots/mobile.png)
- [Tablet page preview](screenshots/tablet.png)

See [QA_REPORT.md](QA_REPORT.md) for the earlier scanner checks and [PLATFORM_QA_REPORT.md](PLATFORM_QA_REPORT.md) for the new platform development checks.

## License

MIT. The copyright holder notice needs human confirmation before publication. See THIRD_PARTY_NOTICES.md for dependency and asset notices.
