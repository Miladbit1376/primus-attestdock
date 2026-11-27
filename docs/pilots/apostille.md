# Apostille contract policy pilot

Updated: 2026-11-27.

This pilot runs the public [Apostille contract](https://github.com/moltaphet/apostille/blob/03c98c48290fb8b82be43bd43de7af11ede6d5b3/contracts/contracts/Apostille.sol) at commit `03c98c48290fb8b82be43bd43de7af11ede6d5b3`. AttestDock does not change that project. The [GitHub workflow](../../.github/workflows/apostille-pilot.yml) checks out the pinned source, installs its locked dependencies, copies the [pilot test](../../pilots/apostille/AttestDockPilot.hardhat.js) into the Hardhat test directory, and runs the real `seal` function on a local EVM. The [successful test run](https://github.com/Miladbit1376/primus-attestdock/actions/runs/45994610384) produced the [sanitized report](../../public/apostille-policy-report.json).

## Observed decisions

| Case | Assumed decision | Contract decision |
| --- | --- | --- |
| Matching GET proof | Allow | Allow |
| Different recipient | Deny | Deny |
| Different endpoint | Deny | Deny |
| Verifier rejects | Deny | Deny |
| Stale proof | Deny | Deny |
| Replayed proof | Deny | Deny |
| POST to the registered endpoint | Deny | Allow |
| Nonempty request body | Deny | Allow |

The upstream [README](https://github.com/moltaphet/apostille/blob/03c98c48290fb8b82be43bd43de7af11ede6d5b3/README.md) describes the Binance source as a GET request. The `seal` function checks the registered URL and response paths, but does not explicitly require `att.request.method == "GET"` or an empty `att.request.body`. The last two rows therefore need a policy decision from the Apostille owner. If GET with an empty body is required, the contract should check those signed request fields before it issues a seal. We did not change the upstream contract or contact its owner.

## Evidence boundary

The pilot uses Apostille's `MockPrimusZKTLS` verifier. The mock accepts a synthetic attestation unless configured to reject. This isolates the contract's decision logic. The test does **not** show that Primus can issue a genuine signed attestation for a POST request or for a nonempty body. It does not show that the Binance endpoint would return usable data in those cases. The two review rows are policy observations, not confirmed exploits or a security certification.

The other six rows are behavior observed in this pinned contract and fixture. They do not cover every source, template, disclosure mode, chain, or time boundary. Apostille's own tests cover additional behavior. See its [upstream tests](https://github.com/moltaphet/apostille/tree/03c98c48290fb8b82be43bd43de7af11ede6d5b3/contracts/test) and [CI](https://github.com/moltaphet/apostille/actions).

## Reproduce

Open the [Apostille policy pilot workflow](https://github.com/Miladbit1376/primus-attestdock/actions/workflows/apostille-pilot.yml) and run it manually. The workflow uses Node.js 20 and the upstream lockfile. It writes `attestdock-apostille-report.json` as a GitHub artifact. No Primus App ID, App Secret, wallet, extension, Binance account, or public chain transaction is needed.
