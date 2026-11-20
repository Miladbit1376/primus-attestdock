import { ethers } from 'ethers'
import { PrimusZKTLS } from '@primuslabs/zktls-js-sdk'
import { PrimusError, PrimusXFlow, X_TEMPLATE_ID } from './primus.ts'

const FIXED_NOW = 1_800_000_000_000
const HANDLE = 'attestdock_test'
const SOURCE = 'https://api.x.com/1.1/account/settings.json?fixture=1'

type TestAttestation = {
  recipient: string
  request: { url: string; header: string; method: string; body: string }
  reponseResolve: { keyName: string; parseType: string; parsePath: string }[]
  data: string
  attConditions: string
  timestamp: string
  additionParams: string
  attestors: { attestorAddr: string; url: string }[]
  signatures: string[]
}

type Fixture = {
  flow: PrimusXFlow
  wallet: string
  sessionId: string
  nonce: string
  attestation: TestAttestation
}

export type AssuranceCheck = {
  id: string
  label: string
  expected: 'accepted' | string
  observed: 'accepted' | string
  status: 'pass' | 'fail'
}

export type AssuranceReport = {
  schemaVersion: 1
  suite: 'AttestDock X proof policy'
  mode: 'synthetic-policy-checks'
  generatedAt: string
  summary: { passed: number; failed: number }
  checks: AssuranceCheck[]
  limits: string[]
}

function fakeSdk(signatureValid: boolean): PrimusZKTLS {
  return {
    init: async () => true,
    sign: async (raw: string) => JSON.stringify({ attRequest: JSON.parse(raw), appSignature: 'synthetic-only' }),
    verifyAttestation: () => signatureValid
  } as unknown as PrimusZKTLS
}

async function fixture(signatureValid = true): Promise<Fixture> {
  const wallet = ethers.Wallet.createRandom()
  const flow = new PrimusXFlow(
    { appId: 'synthetic-app', appSecret: 'synthetic-secret' },
    () => FIXED_NOW,
    () => fakeSdk(signatureValid)
  )
  const challenge = flow.challenge(wallet.address)
  const auth = flow.authenticate(challenge.challengeId, await wallet.signMessage(challenge.message))
  const session = flow.create(auth.wallet, HANDLE)
  const additionParams = JSON.stringify({ sessionId: session.sessionId, nonce: session.nonce, algorithmType: 'proxytls' })
  const request = {
    appId: 'synthetic-app', attTemplateID: X_TEMPLATE_ID, userAddress: auth.wallet, timestamp: FIXED_NOW,
    attMode: { algorithmType: 'proxytls', resultType: 'plain' },
    requestid: '123e4567-e89b-42d3-a456-426614174000',
    backUrl: '', computeMode: 'normal', extendedParams: '', noProxy: true,
    allJsonResponseFlag: 'false', additionParams
  }
  await flow.sign(auth.wallet, session.sessionId, JSON.stringify(request))
  const attestation: TestAttestation = {
    recipient: auth.wallet,
    request: { url: SOURCE, header: '', method: 'GET', body: '' },
    reponseResolve: [{ keyName: 'screen_name', parseType: 'json', parsePath: '$.screen_name' }],
    data: JSON.stringify({ screen_name: HANDLE }),
    attConditions: '[{"op":"REVEAL_STRING","field":"$.screen_name","reveal_id":"screen_name"}]',
    timestamp: String(FIXED_NOW), additionParams,
    attestors: [{ attestorAddr: wallet.address, url: 'https://example.test' }],
    signatures: ['synthetic-signature']
  }
  return { flow, wallet: auth.wallet, sessionId: session.sessionId, nonce: session.nonce, attestation }
}

type Scenario = {
  id: string
  label: string
  expected: 'accepted' | string
  signatureValid?: boolean
  change?: (input: Fixture) => void
  repeat?: boolean
}

const scenarios: Scenario[] = [
  { id: 'valid-x', label: 'Accept a matching synthetic X input', expected: 'accepted' },
  { id: 'wrong-recipient', label: 'Reject a different wallet', expected: 'WALLET_BINDING', change: input => { input.attestation.recipient = ethers.Wallet.createRandom().address } },
  { id: 'wrong-source', label: 'Reject a different data source', expected: 'SOURCE_MISMATCH', change: input => { input.attestation.request.url = 'https://example.test/1.1/account/settings.json' } },
  { id: 'wrong-field', label: 'Reject a different response field', expected: 'TEMPLATE_FIELD_MISMATCH', change: input => { input.attestation.reponseResolve[0].parsePath = '$.email' } },
  { id: 'wrong-handle', label: 'Reject a different X username', expected: 'SCREEN_NAME_MISMATCH', change: input => { input.attestation.data = JSON.stringify({ screen_name: 'other_user' }) } },
  { id: 'stale-proof', label: 'Reject a stale proof', expected: 'TIMESTAMP_OUT_OF_WINDOW', change: input => { input.attestation.timestamp = String(FIXED_NOW - 120_000) } },
  { id: 'wrong-nonce', label: 'Reject a different session nonce', expected: 'NONCE_MISMATCH', change: input => { input.attestation.additionParams = JSON.stringify({ sessionId: input.sessionId, nonce: 'wrong', algorithmType: 'proxytls' }) } },
  { id: 'wrong-condition', label: 'Reject a different disclosure condition', expected: 'CONDITIONS_FIELD_MISMATCH', change: input => { input.attestation.attConditions = '[{"op":"REVEAL_STRING","field":"$.email","reveal_id":"screen_name"}]' } },
  { id: 'invalid-signature', label: 'Reject a failed SDK signature check', expected: 'SDK_SIGNATURE_INVALID', signatureValid: false },
  { id: 'replayed-proof', label: 'Reject a second use of one session', expected: 'REPLAY_DETECTED', repeat: true }
]

async function runScenario(scenario: Scenario): Promise<AssuranceCheck> {
  const input = await fixture(scenario.signatureValid ?? true)
  scenario.change?.(input)
  let observed: string = 'accepted'
  try {
    await input.flow.verify(input.wallet, input.sessionId, input.attestation)
    if (scenario.repeat) await input.flow.verify(input.wallet, input.sessionId, input.attestation)
  } catch (error) {
    observed = error instanceof PrimusError ? error.reasonCode ?? `HTTP_${error.status}` : 'UNEXPECTED_ERROR'
  }
  return {
    id: scenario.id, label: scenario.label, expected: scenario.expected, observed,
    status: observed === scenario.expected ? 'pass' : 'fail'
  }
}

export async function runXAssuranceSuite(): Promise<AssuranceReport> {
  const checks = await Promise.all(scenarios.map(runScenario))
  return {
    schemaVersion: 1, suite: 'AttestDock X proof policy', mode: 'synthetic-policy-checks',
    generatedAt: new Date().toISOString(),
    summary: { passed: checks.filter(check => check.status === 'pass').length, failed: checks.filter(check => check.status === 'fail').length },
    checks,
    limits: [
      'The SDK signature result is stubbed to isolate application policy checks.',
      'Synthetic inputs are not Primus attestations and do not prove live SDK compatibility.',
      'The existing local X proof is separate from this repeatable suite.'
    ]
  }
}
