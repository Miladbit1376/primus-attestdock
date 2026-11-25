# AttestDock assurance checks

AttestDock tests whether its X proof server accepts the expected case and rejects common policy violations. The suite calls the same `PrimusXFlow` method used by the local API. It is a repeatable development gate for this integration. It is not a Primus certification or a complete security audit.

## Run the checks

```sh
pnpm test
pnpm check:integration
pnpm assurance
pnpm build
```

`pnpm assurance` compiles the local server and runs ten cases. `pnpm build` runs the same suite and writes a sanitized `public/assurance-report.json` before Vite builds the site. The Assurance section reads that build report. CI runs tests, the source gate and the build.

`pnpm check:integration` compiles the local CLI and scans `src/platform` and `server`. It fails on high-severity findings or parse errors. Scan a different path with:

```sh
node dist-cli/scripts/check.js path/to/source --environment unknown --fail-on medium
node dist-cli/scripts/check.js path/to/source --format json
```

The CLI reports file names, line numbers, rule IDs and fixes. It omits source lines from machine-readable output. It scans each file independently. It does not resolve imports or prove behavior across files. The selected environment controls secret checks; review that value for mixed code.

## What the X suite checks

The positive case accepts the selected X username. Negative cases change the recipient, source, response field, username, timestamp, nonce or disclosure condition. Other cases make SDK signature verification return false and submit the same session twice. Every negative case must return the expected reason code. A mismatch fails the suite and CI.

The fixture uses a real wallet challenge signature and the real `PrimusXFlow` request and decision methods. The Primus SDK's `init`, `sign` and `verifyAttestation` methods are stubbed. This isolates application policy. The fixture is **not** a genuine signed Primus attestation. A changed signed payload would normally fail signature verification first, so it would not show whether the application policy rejected that change. The local extension proof and the installed SDK tests remain separate evidence.

The public report contains case IDs, labels, expected and observed decisions, status and limits. It contains no wallet, username, raw attestation, secret or source code. The browser scanner does not upload code. CI needs no Primus App ID, App Secret, extension, wallet or external service.

The browser error helper maps a short list of published Primus codes to documented meanings. It prepares a text summary locally. Code `00104` alone cannot identify which verification requirement failed. The user must review the summary before sharing it. The helper does not upload inputs or inspect private proofs.

## External app checks

The [external adapter runner](external-adapter.md) lets a developer connect a trusted local module to an app's decision function. It runs ten controlled cases and reports only decisions. This X suite still covers AttestDock's own server path. Both suites keep synthetic policy tests separate from genuine signed-reference checks. Neither suite claims official Primus approval.
