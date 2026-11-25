# Test an external app decision

AttestDock can call an app's own decision function with ten synthetic inputs. The runner is a local command. It does not upload source code or proofs. Use it only with an adapter module that you trust. The module and all of its imports run with your local Node.js permissions.

## Try the sample

```sh
pnpm install --frozen-lockfile
pnpm check:external:example
node dist-cli/scripts/external-check.js --adapter examples/external-app/unsafe-adapter.mjs --format json
```

The safe sample passes all ten cases. The unsafe sample exits with code 1. It accepts eight invalid cases. This is a sample application. It is not a third-party Primus integration.

## Connect your app

Create an ESM file named `adapter.mjs`. Export `target` and `createAdapter(context)`. Import your existing decision function. The adapter must return an object with `decide(attestation)`. That method must return a boolean: `true` to allow, `false` to deny. A thrown error or a non-boolean result fails the case.

```js
import { createAccessDecision } from './your-app-policy.mjs'

export const target = {
  name: 'My account gate',
  recipient: '0x1111111111111111111111111111111111111111',
  sourceUrl: 'https://api.example.test/account',
  field: 'account_id',
  value: 'test_user',
  maxAgeMs: 60000
}

export function createAdapter(context) {
  return { decide: createAccessDecision(context) }
}
```

`context` contains `target`, a fixed `now`, `sessionId`, `nonce`, and `verifySignature(attestation)`. Pass these values to your app's decision function. Create fresh decision state in each `createAdapter` call. The replay case calls the same adapter twice. The first call must allow; the second must deny.

The attestation uses the fields in Primus's published [attestation structure](https://docs.primuslabs.xyz/enterprise/attestation-structure/): `recipient`, `request`, `reponseResolve`, `data`, `attConditions`, `timestamp`, `additionParams`, `attestors`, and `signatures`. The published field name is `reponseResolve`. The sample uses a single top-level JSON field and one HTTPS source URL. Set `sourceUrl` to the exact URL your policy expects.

Run the adapter from the AttestDock repository:

```sh
pnpm exec tsc -p tsconfig.cli.json
node dist-cli/scripts/external-check.js --adapter /absolute/path/to/adapter.mjs --format json
```

The command exits with code 0 when every case passes, 1 when a case fails, and 2 when the adapter or options are invalid. Add it to your own CI after you inspect the test contract. The JSON report contains only the target name, case IDs, expected and observed decisions, status, and limits. It does not contain the synthetic attestation, a wallet address, a claim value, a signature, source code, or an exception message.

## What the result means

The ten cases cover matching input, recipient, source, response field, claim value, age, nonce, disclosure condition, signature failure, and replay. Each case gets a new adapter instance. The replay case uses one instance for both decisions. The runner has a five-second timeout per adapter call. Set `--timeout-ms` from 100 to 30000 if your local app needs a different limit. The timeout does not stop synchronous code or sandbox the adapter.

The signature callback accepts only a test marker. It is **not** Primus SDK verification. The runner does not generate or alter a genuine signed attestation. It cannot prove that your app is compatible with the live SDK, that it is secure outside these cases, or that Primus approves it. Pair a passing policy report with a separate live proof test. Do not put real App Secrets, private proofs, or personal data in the adapter or sample inputs.
