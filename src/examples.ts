export const examples = [
  { name: 'Client secret', kind: 'Needs work', environment: 'frontend' as const, code: `import { PrimusExtCoreTLS } from '@primuslabs/zktls-ext-core-sdk';
const appSecret = 'DEMO_ONLY_NOT_A_REAL_SECRET';
const zkTLS = new PrimusExtCoreTLS();
await zkTLS.init('DEMO_APP_ID', appSecret);` },
  { name: 'Unchecked proof', kind: 'Needs work', environment: 'backend' as const, code: `async function acceptProof(attestation: unknown) {
  grantAccess(attestation);
}` },
  { name: 'Ignored result', kind: 'Needs work', environment: 'backend' as const, code: `async function acceptProof(attestation: Attestation) {
  zkTLS.verifyAttestation(attestation);
  console.log(attestation);
  grantAccess(attestation);
}` },
  { name: 'Server secret', kind: 'Improved', environment: 'backend' as const, code: `import { PrimusCoreTLS } from '@primuslabs/zktls-core-sdk';
const appSecret = process.env.ZKTLS_APP_SECRET;
if (!appSecret) throw new Error('Missing server secret');
const zkTLS = new PrimusCoreTLS();
await zkTLS.init(process.env.ZKTLS_APP_ID!, appSecret);` },
  { name: 'Checked decision', kind: 'Improved', environment: 'backend' as const, code: `function acceptProof(attestation: Attestation) {
  const verified = zkTLS.verifyAttestation(attestation);
  if (!verified) return;
  if (attestation.request.url !== expectedUrl) return;
  if (Date.now() - attestation.timestamp > maxAgeMs) return;
  grantAccess(attestation);
}` },
  { name: 'Private logging', kind: 'Improved', environment: 'backend' as const, code: `function recordResult(attestation: Attestation) {
  const verified = zkTLS.verifyAttestation(attestation);
  if (!verified) return;
  if (attestation.request.url !== expectedUrl) return;
  if (Date.now() - attestation.timestamp > maxAgeMs) return;
  console.info('Attestation checked');
  grantAccess(attestation);
}` }
]
