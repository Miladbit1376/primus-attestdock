import { ProviderRegistry } from './providers.ts'
import { TemplateRegistry } from './templates.ts'
import type { ProofInput, ProofSession, ProofStatus } from './types.ts'

const next: Partial<Record<ProofStatus, ProofStatus[]>> = {
  created: ['awaiting_user', 'cancelled', 'failed'],
  awaiting_user: ['awaiting_extension', 'cancelled', 'failed'],
  awaiting_extension: ['generating', 'cancelled', 'failed'],
  generating: ['submitted', 'cancelled', 'failed'],
  submitted: ['verifying', 'rejected', 'failed'],
  verifying: ['rejected', 'failed']
}
const terminal = new Set<ProofStatus>(['verified', 'rejected', 'expired', 'cancelled', 'failed'])

function nonce(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export class ProofSessionManager {
  private readonly sessions = new Map<string, ProofSession>()
  constructor(
    private readonly providers: ProviderRegistry,
    private readonly templates: TemplateRegistry,
    private readonly clock: () => number = Date.now,
    private readonly liveEnabled = false,
    private readonly ttlMs = 5 * 60_000
  ) {}
  create(input: ProofInput): ProofSession {
    if (!input.consent) throw new Error('User consent is required.')
    if (!this.providers.getClaim(input.providerId, input.claimId)) throw new Error('Unknown provider claim.')
    if (!input.recipient.trim() || input.recipient.length > 200) throw new Error('A valid recipient is required.')
    const template = this.templates.resolveActive(input.providerId, input.claimId)
    if (input.mode === 'live' && (!this.liveEnabled || !template)) throw new Error('Live proofs are unavailable for this claim.')
    if (input.mode === 'simulated' && this.liveEnabled) throw new Error('Simulated sessions are disabled in live mode.')
    const now = this.clock()
    const session: ProofSession = {
      id: crypto.randomUUID(), providerId: input.providerId, claimId: input.claimId, recipient: input.recipient,
      nonce: nonce(), templateId: input.mode === 'live' ? template!.id : null,
      templateVersion: input.mode === 'live' ? template!.version : null,
      mode: input.mode, status: 'created', createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.ttlMs).toISOString(), consumedAt: null
    }
    this.sessions.set(session.id, session)
    return { ...session }
  }
  get(id: string): ProofSession | undefined {
    const session = this.sessions.get(id)
    if (!session) return undefined
    if (!terminal.has(session.status) && this.clock() >= Date.parse(session.expiresAt)) {
      session.status = 'expired'
    }
    return { ...session }
  }
  transition(id: string, status: ProofStatus): ProofSession {
    const current = this.get(id)
    if (!current) throw new Error('Unknown proof session.')
    if (status === 'verified') throw new Error('Only a trusted verifier can verify a proof.')
    if (!next[current.status]?.includes(status)) throw new Error('Invalid proof state transition.')
    const updated = { ...current, status }
    this.sessions.set(id, updated)
    return { ...updated }
  }
  consume(id: string): ProofSession {
    const current = this.get(id)
    if (!current || !['submitted', 'verifying'].includes(current.status) || current.consumedAt) throw new Error('Proof session is expired, replayed, or not ready.')
    const updated = { ...current, consumedAt: new Date(this.clock()).toISOString() }
    this.sessions.set(id, updated)
    return { ...updated }
  }
}
