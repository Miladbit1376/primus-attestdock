export type ExternalTarget = {
  name: string
  recipient: string
  sourceUrl: string
  field: string
  value: string
  maxAgeMs: number
}

export type SyntheticAttestation = {
  recipient: string
  request: { url: string; header: string; method: string; body: string }
  reponseResolve: { keyName: string; parseType: string; parsePath: string }[]
  data: string
  attConditions: string
  timestamp: number
  additionParams: string
  attestors: { attestorAddr: string; url: string }[]
  signatures: string[]
}

export type ExternalContext = {
  target: Readonly<ExternalTarget>
  now: number
  sessionId: string
  nonce: string
  verifySignature: (attestation: SyntheticAttestation) => boolean
}

export type ExternalAdapter = {
  decide: (attestation: SyntheticAttestation) => boolean | Promise<boolean>
}

export type ExternalModule = {
  target: ExternalTarget
  createAdapter: (context: ExternalContext) => ExternalAdapter | Promise<ExternalAdapter>
}

export type ExternalCheck = {
  id: string
  label: string
  expected: 'allow' | 'deny'
  observed: 'allow' | 'deny' | 'error'
  status: 'pass' | 'fail'
}

export type ExternalReport = {
  schemaVersion: 1
  mode: 'synthetic-external-policy'
  target: string
  summary: { passed: number; failed: number }
  checks: ExternalCheck[]
  limits: string[]
}

const NOW = 1_800_000_000_000
const SESSION_ID = 'attestdock-test-session'
const NONCE = 'attestdock-test-nonce'
const TEST_SIGNATURE = 'attestdock-synthetic-signature'

function validTarget(value: unknown): ExternalTarget {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The adapter must export a target object.')
  const target = value as Record<string, unknown>
  if (typeof target.name !== 'string' || !/^[\w .-]{1,80}$/.test(target.name)) throw new Error('target.name must use 1 to 80 plain characters.')
  if (typeof target.recipient !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(target.recipient)) throw new Error('target.recipient must be an EVM address.')
  if (typeof target.sourceUrl !== 'string') throw new Error('target.sourceUrl must be an HTTPS URL.')
  let source: URL
  try { source = new URL(target.sourceUrl) } catch { throw new Error('target.sourceUrl must be an HTTPS URL.') }
  if (source.protocol !== 'https:' || source.username || source.password || source.hash) throw new Error('target.sourceUrl must be an HTTPS URL without credentials or a fragment.')
  if (typeof target.field !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(target.field)) throw new Error('target.field must be a simple JSON field name.')
  if (typeof target.value !== 'string' || !target.value || target.value.length > 128) throw new Error('target.value must be a nonempty string of at most 128 characters.')
  if (typeof target.maxAgeMs !== 'number' || !Number.isInteger(target.maxAgeMs) || target.maxAgeMs < 1_000 || target.maxAgeMs > 86_400_000) throw new Error('target.maxAgeMs must be between 1 second and 24 hours.')
  return target as ExternalTarget
}

function fixture(target: ExternalTarget): { context: ExternalContext; attestation: SyntheticAttestation } {
  const context: ExternalContext = {
    target: Object.freeze({ ...target }), now: NOW, sessionId: SESSION_ID, nonce: NONCE,
    verifySignature: attestation => attestation.signatures.length === 1 && attestation.signatures[0] === TEST_SIGNATURE
  }
  const path = `$.${target.field}`
  const attestation: SyntheticAttestation = {
    recipient: target.recipient,
    request: { url: target.sourceUrl, header: '', method: 'GET', body: '' },
    reponseResolve: [{ keyName: target.field, parseType: 'json', parsePath: path }],
    data: JSON.stringify({ [target.field]: target.value }),
    attConditions: JSON.stringify([{ op: 'REVEAL_STRING', field: path, reveal_id: target.field }]),
    timestamp: NOW,
    additionParams: JSON.stringify({ sessionId: SESSION_ID, nonce: NONCE, algorithmType: 'proxytls' }),
    attestors: [{ attestorAddr: target.recipient, url: 'https://example.test' }],
    signatures: [TEST_SIGNATURE]
  }
  return { context, attestation }
}

type Scenario = {
  id: string
  label: string
  change?: (attestation: SyntheticAttestation, target: ExternalTarget) => void
  replay?: boolean
}

const scenarios: Scenario[] = [
  { id: 'matching-proof', label: 'Allow a matching synthetic input' },
  { id: 'wrong-recipient', label: 'Deny a different recipient', change: (att, target) => { att.recipient = target.recipient.toLowerCase() === '0x2222222222222222222222222222222222222222' ? '0x3333333333333333333333333333333333333333' : '0x2222222222222222222222222222222222222222' } },
  { id: 'wrong-source', label: 'Deny a different source', change: (att, target) => { att.request.url = target.sourceUrl === 'https://other.example.test/account' ? 'https://alternate.example.test/account' : 'https://other.example.test/account' } },
  { id: 'wrong-field', label: 'Deny a different response field', change: (att, target) => { att.reponseResolve[0].parsePath = `$.${target.field}_other` } },
  { id: 'wrong-value', label: 'Deny a different claim value', change: (att, target) => { att.data = JSON.stringify({ [target.field]: `${target.value}_other` }) } },
  { id: 'stale-proof', label: 'Deny a stale timestamp', change: (att, target) => { att.timestamp = NOW - target.maxAgeMs - 1 } },
  { id: 'wrong-nonce', label: 'Deny a different session nonce', change: att => { att.additionParams = JSON.stringify({ sessionId: SESSION_ID, nonce: 'other', algorithmType: 'proxytls' }) } },
  { id: 'wrong-condition', label: 'Deny a different disclosure condition', change: (att, target) => { att.attConditions = JSON.stringify([{ op: 'REVEAL_STRING', field: `$.${target.field}_other`, reveal_id: `${target.field}_other` }]) } },
  { id: 'invalid-signature', label: 'Deny a failed signature check', change: att => { att.signatures = ['invalid-synthetic-signature'] } },
  { id: 'replayed-proof', label: 'Deny a second use of one session', replay: true }
]

async function withTimeout<T>(operation: () => T | Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Adapter timed out.')), timeoutMs) })
    ])
  } finally { if (timer) clearTimeout(timer) }
}

async function decision(adapter: ExternalAdapter, attestation: SyntheticAttestation, timeoutMs: number): Promise<'allow' | 'deny' | 'error'> {
  try {
    const result = await withTimeout(() => adapter.decide(attestation), timeoutMs)
    if (typeof result !== 'boolean') return 'error'
    return result ? 'allow' : 'deny'
  } catch { return 'error' }
}

export async function runExternalSuite(module: ExternalModule, timeoutMs = 5_000): Promise<ExternalReport> {
  const target = validTarget(module?.target)
  if (typeof module.createAdapter !== 'function') throw new Error('The adapter must export createAdapter(context).')
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30_000) throw new Error('timeoutMs must be between 100 and 30000.')
  const checks: ExternalCheck[] = []
  for (const scenario of scenarios) {
    const { context, attestation } = fixture(target)
    scenario.change?.(attestation, target)
    const expected = scenario.id === 'matching-proof' ? 'allow' : 'deny'
    let observed: ExternalCheck['observed'] = 'error'
    try {
      const adapter = await withTimeout(() => module.createAdapter(context), timeoutMs)
      if (adapter && typeof adapter.decide === 'function') {
        observed = await decision(adapter, attestation, timeoutMs)
        if (scenario.replay) observed = observed === 'allow' ? await decision(adapter, attestation, timeoutMs) : 'error'
      }
    } catch { observed = 'error' }
    checks.push({ id: scenario.id, label: scenario.label, expected, observed, status: observed === expected ? 'pass' : 'fail' })
  }
  return {
    schemaVersion: 1, mode: 'synthetic-external-policy', target: target.name,
    summary: { passed: checks.filter(check => check.status === 'pass').length, failed: checks.filter(check => check.status === 'fail').length },
    checks,
    limits: [
      'This suite runs a trusted local adapter module and its imported application code.',
      'The signature callback uses a synthetic marker. No case is a genuine Primus attestation.',
      'A passing result covers only the configured decision and these ten cases.'
    ]
  }
}
