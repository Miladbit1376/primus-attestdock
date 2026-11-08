# Primus SafeShip

Primus SafeShip is an independent community scanner for JavaScript and TypeScript Primus zkTLS integrations. It is not affiliated with or officially endorsed by Primus Labs. It parses one source file in the browser and reports visible patterns that may need review.

## Features

- Local AST scan for `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, and `.cjs` files.
- Scans in a browser worker so the editor remains responsive.
- Six security and integration rule categories.
- File upload, environment selection, example snippets, line numbers, and JSON export.
- No backend, database, wallet, API key, or code upload.

## Run locally

Use Node.js `^20.19.0` or `>=22.12.0`, as required by the installed Vite version. From a standalone checkout:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite. Run `pnpm test` for unit tests and `pnpm build` for a production build. Run `pnpm preview` to inspect the built site. If you run the project inside a parent pnpm workspace that does not include it, add `--ignore-workspace` to the install command.

## Detection rules

| Rule | What it reports | Limit and possible false positive |
| --- | --- | --- |
| PRIMUS-001: Exposed app secret | A literal `appSecret` in frontend or unknown code, or a public variable name that suggests a secret. | The selected environment can be wrong. A sample literal can trigger a finding. Indirectly imported secrets can be missed. Backend literals are not reported by this rule. |
| PRIMUS-002: Missing attestation verification | A recognized decision call uses an attestation, with no `verifyAttestation()` call visible in the same function. | Verification in another function or file can cause a false positive. Other verifier names can be missed. |
| PRIMUS-003: Missing business logic validation | A recognized decision follows verification, with no visible check of selected attestation fields or source. | The field checks are heuristic. A check elsewhere can cause a false positive; an irrelevant field check can hide a real issue. |
| PRIMUS-004: Sensitive data logging | A `console` call uses a variable named like a credential or complete attestation. | The variable may contain harmless data. Logs through wrappers or differently named variables can be missed. |
| PRIMUS-005: Missing freshness validation | A recognized decision follows verification, with no visible timestamp comparison. | Your policy may validate freshness elsewhere. A visible but ineffective comparison can hide a real issue. No fixed age limit is assumed. |
| PRIMUS-006: Unsafe verification result handling | A recognized decision can proceed when the visible verification result is not checked or verification occurs later. | The guard check is a local syntax heuristic. Complex control flow can cause a false positive or missed issue. |

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

The scanner performs static analysis only. It does not execute or upload submitted code. It does not save code automatically. If you export a report, the downloaded JSON contains finding text and short source lines. Secret literals detected by PRIMUS-001 are redacted. Review exports before sharing them because other source lines may contain sensitive data.

This is a heuristic single-file scan. It cannot follow imports, prove control flow across functions, confirm a verifier's implementation, check on-chain behavior, detect every secret, or certify a full application. It is not a complete security audit. A clean report does not prove that an application is secure.

## Screenshots

- [Desktop browser QA](screenshots/desktop.png)
- [Mobile browser QA](screenshots/mobile.png)
- [Tablet browser QA](screenshots/tablet.png)

See [QA_REPORT.md](QA_REPORT.md) for the recorded browser and automated checks.

## License

MIT
