# AttestDock privacy

Updated: 2026-11-09. The browser scanner and the platform preview have different data paths.

## Browser scanner

Pasted and uploaded source is parsed in a browser worker. The scanner has no code-upload API. The editor content is not sent to the local platform API. JSON export happens in the browser and can include short source lines. Secret literals found by ATTESTDOCK-001 are redacted, but other source lines can still be sensitive. Review exports before sharing them.

## Platform preview

The provider catalog is static shared domain data. No provider account is connected. No real template or live proof is configured. The Create Proof view cannot start a real proof and says that exact disclosures are unknown. The read-only API playground requests only provider metadata from the local server. The optional local development API can create a simulated session with a caller-supplied recipient. It does not contact Primus or a provider. It stores this session in process memory until the server stops.

## Future real proof flow

Before a user consents, show the active template, recipient, exact disclosed fields, conditions, purpose, and retention period. Ask for explicit consent. Prefer a condition result over an exact value when an approved template supports that condition. Do not claim all attestations are private. The attestation structure can include request details, data, recipient, timestamp, attestors, and signatures. See the [official structure](https://docs.primuslabs.xyz/enterprise/attestation-structure/).

Do not store provider passwords or cookies. Do not persist raw attestations by default. If retention is required, obtain consent, encrypt the payload, enforce a deletion deadline, and allow deletion. Audit logs should contain event metadata only. A real implementation must test network payloads, retention jobs, and exports before release.
